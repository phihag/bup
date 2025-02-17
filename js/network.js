'use strict';
var network = (function() {

var networks = {};

function get_real_netw() {
	return (
		networks.mo ||
		networks.demo ||
		networks.rlmdemo || networks.nrwdemo ||
		networks.bldemo || networks.bldemo_inprogress || networks.bldemo_incomplete ||
		networks.vdemo || networks.edemo ||
		networks.nlademo ||
		networks.tdemo ||
		networks.btsh ||
		networks.btde ||
		networks.bbt ||
		networks.courtspot ||
		networks.liveaw ||
		networks.jticker ||
		networks.csde ||
		networks.imported
	);
}

function get_netw() {
	return networks.staticnet || networks.refmode_push || get_real_netw();
}

function is_enabled() {
	return !!get_netw() || !!networks.p2p;
}

function get_presses(match) {
	if (match.presses) {
		return match.presses;
	}

	var res = null;
	if (match.presses_json) {
		try {
			res = JSON.parse(match.presses_json);
		} catch (e) {
			report_problem.silent_error('Failed to decode presses_json: ' + e.toString());
		}
	}
	return res;
}

// Returns a list of {id, description} or null (if no restrictions).
// State s is for i18n
function courts(s) {
	var netw = get_netw();
	if (! netw) {
		return null;
	}

	var res = netw.courts(s);
	if (res) {
		res.forEach(function(c) {
			if (!c.label && c.description) {
				c.label = (c.court_id || c.id) + ' (' + c.description + ')';
			}
		});
	}
	return res;
}

function send_press(s, press) {
	if (s.event && s.event.matches) {
		s.event.matches.forEach(function(match) {
			if (!s.metadata || !match.setup || (s.metadata.id !== match.setup.match_id)) {
				return;
			}

			match.presses = s.presses.slice();
		});
	}

	if (networks.refmode_client) {
		networks.refmode_client.net_send_press(s, press);
	}

	var netw = get_netw();
	if (netw) {
		netw.send_press(s, press);
	}
}

function _score_text(network_score) {
	if (!network_score) {
		return '';
	}

	if ((network_score.length == 1) && (network_score[0][0] === 0) && (network_score[0][1] === 0)) {
		return '';
	}

	return network_score.map(function(network_game) {
		return network_game[0] + '-' + network_game[1];
	}).join(' ');
}

function calc_team0_left(match) {
	if (match.network_team0_left !== undefined) {
		return match.network_team0_left;
	}

	var presses = get_presses(match);
	if (presses) {
		var s = {};
		calc.init_state(s, match.setup, presses);
		calc.state(s);
		return s.game.team1_left;
	}
	return null;
}

function calc_resume_presses(s, match) {
	var netscore = match.network_score;
	var current_game = netscore[netscore.length - 1];

	var presses = [];
	if (netscore.length > 1) {
		presses.push({
			type: 'editmode_set-finished_games',
			scores: netscore.slice(0, netscore.length - 1),
			by_side: false,
		});
	}
	presses.push({
		type: 'editmode_set-score',
		score: current_game,
		by_side: false,
		resumed: true,
	});

	if (typeof match.network_team0_left == 'boolean') {
		presses.push({
			type: 'pick_side',
			team1_left: match.network_team0_left,
		});
	}
	if ((typeof match.network_team1_serving == 'boolean') && match.network_teams_player1_even) {
		var serving_team = match.network_team1_serving ? 0 : 1;
		var serving_even = (current_game[serving_team] % 2) === 0;

		var serving_player = 0;
		var receiving_player = 0;
		if (match.setup.is_doubles) {
			serving_player = (match.network_teams_player1_even[serving_team] == serving_even) ? 0 : 1;
			receiving_player = (match.network_teams_player1_even[1 - serving_team] == serving_even) ? 0 : 1;
		}

		presses.push({
			type: 'pick_server',
			team_id: serving_team,
			player_id: serving_player,
		});
		presses.push({
			type: 'pick_receiver',
			team_id: 1 - serving_team,
			player_id: receiving_player,
		});
	}
	return presses;
}

// Start or resume (depends on user interaction) the match
function enter_match(match) {
	var netw = get_netw();
	if (netw.prepare_match) {
		netw.prepare_match(state.settings, match);
	}

	settings.hide(true);
	control.start_match_dialog(state, match.setup);

	var presses = get_presses(match);
	if (presses) {
		control.start_match(state, match.setup, presses);
		return;
	}

	var stored = match_storage.load_match(match.setup.match_id);
	if (stored && stored.presses) {
		control.start_match(state, match.setup, stored.presses);
		return;
	}

	var netscore = match.network_score;
	if (netscore) {
		var mwinner = calc.match_winner(match.setup.counting, netscore);

		var on_cancel = function() {
			control.stop_match(state);
			settings.show();
		};

		if ((mwinner == 'inprogress') && calc.match_started(netscore)) {
			bupui.make_pick(
				state,
				state._('network:in progress').replace('{match}', pronunciation.match_str(match.setup)), [{
				label: state._('network:resume match').replace('{score}', _score_text(netscore)),
				key: 'resume',
			}, {
				label: state._('network:restart match'),
				key: 'restart',
			}], function(pick) {
				var presses = null;
				if (pick.key == 'resume') {
					presses = calc_resume_presses(state, match);
				}
				control.start_match(state, match.setup, presses);
			}, on_cancel);
			return;
		}

		if (mwinner == 'left' || mwinner == 'right') {
			uiu.show_qs('#game');
			bupui.make_pick(
				state,
				state._('network:match finished').replace('{score}', _score_text(netscore)).replace('{match}',
				pronunciation.match_str(match.setup)), [{
				label: state._('network:restart match'),
			}], function() {
				control.start_match(state, match.setup);
			}, on_cancel);
			return;
		}
	}
	control.start_match(state, match.setup);
}

function _short_court_id(court_id) {
	var m = /_([0-9]+)$/.exec(court_id);
	if (m) {
		return m[1];
	} else {
		return court_id;
	}
}

function ui_render_matchlist(s, event) {
	var container = uiu.qs('#setup_network_matches');
	uiu.empty(container); // TODO better transition if we're updating?

	var top_label = event.event_name;
	if (!top_label) {
		if (s.settings && s.settings.court_id && s.settings.court_id !== 'referee') {
			top_label = s._(
				'network:Matches on court',
				{court: _short_court_id(s.settings.court_id)});
		} else {
			top_label = s._('network:Matches');
		}
	}
	uiu.text_qs('.setup_network_event', top_label);

	event.matches.forEach(function(match) {
		var btn = uiu.el(container, 'button', {
			'class': 'setup_network_match',
		});
		if (match.setup.incomplete) {
			btn.setAttribute('disabled', 'disabled');
		}

		uiu.el(btn, 'span', {
			'class': 'setup_network_match_match_name',
		}, match.setup.match_name);

		var _players_str = function(team) {
			if (match.setup.is_doubles) {
				if (team.players.length === 0) {
					return 'N.N. / N.N.';
				} else if (team.players.length == 1) {
					return team.players[0].name + ' / N.N.';
				} else {
					return team.players[0].name + ' / ' + team.players[1].name;
				}
			} else {
				if (team.players.length === 0) {
					return 'N.N.';
				} else {
					return team.players[0].name;
				}
			}
		};

		uiu.el(btn, 'span', {
			'class': 'setup_network_match_home_players',
		}, _players_str(match.setup.teams[0]));
		uiu.el(btn, 'span', {
			'class': 'setup_network_match_away_players',
		}, _players_str(match.setup.teams[1]));

		var umpire_name = match.setup.umpire_name;
		if (umpire_name) {
			if (match.setup.service_judge_name) {
				umpire_name += ' + ' + match.setup.service_judge_name;
			}

			uiu.el(btn, 'span', {
				'class': 'setup_network_umpire_name',
			}, umpire_name);
		}
		var score_text = _score_text(match.network_score);
		uiu.el(btn, 'span', {
			'class': 'setup_network_match_score',
		}, (score_text ? score_text : '\xA0'));

		click.on(btn, function() {
			enter_match(match);
		});
	});
}

function list_matches(s, callback) {
	var netw = get_netw();
	if (!netw) {
		return callback({
			msg: state._('network:error:unconfigured'),
		});
	}
	netw.list_matches(s, function(err, ev) {
		callback(err, ev);
		if (!err) {
			refmode_client_ui.on_event_update();
		}
	});
}

// Returns a callback to be called when the list is no longer required
function ui_list_matches(s, silent, no_timer) {
	var status_container = uiu.qs('.setup_network_status');
	if (!silent && !status_container.querySelector('.setup_network_matches_loading')) {
		var loading = uiu.el(status_container, 'div', 'setup_network_matches_loading');
		uiu.el(loading, 'div', 'loading-icon');
	}

	var netw = get_netw();
	if (!netw) {
		return;
	}

	return subscribe(s, function(err, s, event) {
		uiu.empty(status_container);
		errstate('list_matches', err);
		if (err) {
			uiu.el(status_container, 'div', 'network_error', err.msg);
			return;
		}

		update_event(s, event);

		eventsheet.render_links(s, uiu.qs('.setup_eventsheets'));
		urlexport.render_links(s, uiu.qs('.urlexport_links'));
		var editable = netw.editable(s);
		var use_setupsheet = event.team_competition;
		uiu.visible_qs('.setupsheet_link', editable && use_setupsheet);
		uiu.visible_qs('.editevent_link', editable && !use_setupsheet);
		ui_render_matchlist(s, event);
	}, function(s) {
		return no_timer ? 'abort' : s.settings.network_update_interval;
	});
}

// Returns a callback to be called when the updates are no longer required.
// cb gets called with (err, s, event); s is NOT updated implicitly
// calc_timeout is called with s and must return immediately the timeout or the string 'abort'
function subscribe(s, cb, calc_timeout) {
	var cancelled = false;
	var timeout = null;

	function query() {
		if (cancelled) {
			return;
		}
		var netw = get_netw();
		if (!netw) {
			cb({
				msg: s._('network:error:unconfigured'),
			}, s);
			return;
		}
		list_matches(s, function(err, event) {
			cb(err, s, event);
		});
		var new_timeout = calc_timeout(s);
		if (new_timeout === 'abort') {
			cancelled = true;
			return;
		}
		timeout = setTimeout(query, new_timeout);
	}
	query();

	return function() {
		cancelled = true;
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
	};

}

// Map of component => error status (true: currently faulty)
var erroneous = {};

var login_rendered = false;
var resync_timeout = null;

function schedule_resync() {
	if (resync_timeout !== null) {
		window.clearTimeout(resync_timeout);
		resync_timeout = null;
	}
	resync_timeout = window.setTimeout(resync, Math.max(state.settings.network_update_interval, 100));
}

function resync() {
	var netw = get_netw();
	if (! netw) {
		return;
	}

	if (state.initialized) {
		netw.sync(state);
	}
	ui_list_matches(state, true, true);

	if (resync_timeout !== null) {
		window.clearTimeout(resync_timeout);
		resync_timeout = null;
	}
	if (utils.any(utils.values(erroneous))) {
		schedule_resync();
	}
}

function score_transmitted() {
	for (var key in erroneous) {
		if (key.indexOf('.score') > 0) {
			if (erroneous[key]) {
				return false;
			}
		}
	}
	return true;
}

function errstate(component, err) {
	if (err) {
		erroneous[component] = true;

		uiu.$show_qs('.network_desync_container');
		if (resync_timeout === null) {
			schedule_resync();
		}

		if (err.type == 'login-required') {
			login.required();
		}

		uiu.text_qs('.network_desync_errmsg', err.msg);
	} else {
		var was_erroneous;
		if (component == 'all') {
			was_erroneous = true;
			erroneous = {};
		} else {
			was_erroneous = erroneous[component];
			erroneous[component] = false;
		}

		if (login_rendered && (component.indexOf('login') >= 0) || (component == 'all')) {
			$('.settings_network_login_container').empty();
			$('.network_desync_login_container').empty();
			login_rendered = false;
		}
		if (! utils.any(utils.values(erroneous))) {
			$('.network_desync_container').hide();
		}
		if (was_erroneous) {
			resync();
		}
	}
}

function _set_court(s, c) {
	s.settings.court_id = (c.court_id || c.id);
	s.settings.court_description = c.description;
	if (c.id !== 'referee') {
		s.settings.displaymode_court_id = c.court_id || c.id;
	}
	settings.store(s);
	settings.update(s);
}

function _court_by_id(all_courts, court_id) {
	for (var i = 0;i < all_courts.length;i++) {
		var c = all_courts[i];
		if (c.court_id == court_id || c.id == court_id) {
			return c;
		}
	}
	return null;
}

function _court_pick_dialog(s, all_courts, on_cancel) {
	bupui.make_pick(s, s._('Select Court'), all_courts, function(c) {
		_set_court(s, c);
	}, on_cancel, uiu.qs('body'), 5);
}

function ui_init_court(s, hash_query) {
	// Determine available courts
	var all_courts = courts(s);
	if (!all_courts) {
		return;
	}

	if (hash_query.court) {
		var c = _court_by_id(all_courts, hash_query.court);
		if (c) {
			_set_court(s, c);
		}
	}
	var configured = (hash_query.select_court === undefined) && all_courts.some(function(c) {
		var desc = s.settings.court_description;
		return (
			((s.settings.court_id == c.court_id) || (s.settings.court_id == c.id))
			&& ((!desc && !c.description) || (desc == c.description))
		);
	});
	if (! configured) {
		// Prevent updates while we select a court
		s.settings.court_id = undefined;
		s.settings.court_description = '';
		_court_pick_dialog(s, all_courts, false);
	}

	// Configure court select
	var $select = $('.settings select[name="court_select"]');
	all_courts.forEach(function(c) {
		var $option = $('<option>');
		$option.text(c.label);
		$option.attr('value', c.court_id || c.id);
		$select.append($option);
	});
	$select.attr('data-auto-available', 'true');
	$select.val(s.settings.court_id);
	$select.on('change', function() {
		var c = _court_by_id(all_courts, $select.val());
		if (c) {
			_set_court(s, c);
			resync();
		}
	});
	settings.update_court_settings(s);

	var court_str_field = render.main_court_ui().court_str;
	click.on(court_str_field, function() {
		_court_pick_dialog(s, all_courts, function() {
			// On abort change nothing
		});
	});
}

function fetch_courts(s, success_callback) {
	var netw = get_netw();
	if (!netw.fetch_courts) {
		return success_callback(netw.courts(s));
	}

	var court_status_container = uiu.el(uiu.qs('body'), 'div', 'modal-wrapper');
	uiu.el(court_status_container, 'div', 'network_court_fetch_status', s._('network:fetching courts'));

	var retry_btn = uiu.el(court_status_container, 'button', 'image-button network_court_fetch_retry');
	uiu.el(retry_btn, 'span');

	var done = false;
	var on_success = function(err, courts) {
		if (err) {
			var court_status_error = uiu.el(court_status_container, 'div', 'network_court_fetch_error');
			uiu.el(court_status_error, 'span', {}, err.msg);
			return;
		}
		if (done) return;
		done = true;

		uiu.remove(court_status_container);
		success_callback(courts);
		render.ui_court_str(state);
	};

	click.on(retry_btn, function() {
		uiu.qsEach('.network_court_fetch_error', uiu.remove);
		netw.fetch_courts(s, on_success);
	});
	netw.fetch_courts(s, on_success);
}

function ui_init(s, hash_query) {
	click.qs('.network_desync_image', resync);
	click.qs('.setup_network_matches_reload', function() {
		ui_list_matches(s, false, true);
	});

	netstats.ui_init();

	// Load networking module(s)
	if (hash_query.p2p !== undefined) {
		networks.p2p = p2p();
	}
	if (hash_query.courtspot !== undefined) {
		networks.courtspot = courtspot();
	} else if (hash_query.csde !== undefined) {
		networks.csde = csde(hash_query.csde);
	} else if (hash_query.btde !== undefined) {
		networks.btde = btde();
	} else if (hash_query.bbt_poll !== undefined) {
		networks.bbt = bbt_poll(hash_query.bbt_poll);
	} else if (hash_query.liveaw_event_id) {
		networks.liveaw = liveaw(hash_query.liveaw_event_id);
	} else if (hash_query.jt_id !== undefined) {
		networks.jticker = jticker(hash_query.jt_id);
	} else if (hash_query.edemo !== undefined) {
		networks.edemo = staticnet(null, 'div/edemo.json');
	} else if (hash_query.bldemo !== undefined) {
		networks.bldemo = staticnet(null, 'div/bldemo.json');
	} else if (hash_query.bldemo_inprogress !== undefined) {
		networks.bldemo_inprogress = staticnet(null, 'div/bldemo_inprogress.json');
	} else if (hash_query.bldemo_incomplete !== undefined) {
		networks.bldemo_incomplete = staticnet(null, 'div/bldemo_incomplete.json');
	} else if (hash_query.nrwdemo !== undefined) {
		networks.nrwdemo = staticnet(null, 'div/nrwdemo.json');
	} else if (hash_query.rlmdemo !== undefined) {
		networks.rlmdemo = staticnet(null, 'div/rlmdemo.json');
	} else if (hash_query.vdemo !== undefined) {
		networks.vdemo = staticnet(null, 'div/vdemo.json');
	} else if (hash_query.nlademo !== undefined) {
		networks.nlademo = staticnet(null, 'div/nlademo.json');
	} else if (hash_query.tdemo !== undefined) {
		networks.tdemo = staticnet(null, 'div/tdemo.json');
	} else if (hash_query.wdmudemo !== undefined) {
		networks.demo = staticnet(null, 'div/demos/wdmu.json');
	} else if (hash_query.obldemo !== undefined) {
		networks.demo = staticnet(null, 'div/demos/obl.json');
	} else if (hash_query.txdemo !== undefined) {
		networks.demo = staticnet(null, 'div/demos/tx.json');
	} else if (hash_query.rlwdemo !== undefined) {
		networks.demo = staticnet(null, 'div/demos/rlw.json');
	} else if (hash_query.rlndemo !== undefined) {
		networks.demo = staticnet(null, 'div/demos/rln.json');
	} else if (hash_query.rlsodemo !== undefined) {
		networks.demo = staticnet(null, 'div/demos/rlso.json');
	} else if (hash_query.intdemo !== undefined) {
		networks.demo = staticnet(null, 'div/demos/int.json');
	} else if (hash_query.e_bldemo !== undefined) {
		networks.demo = staticnet(null, 'div/demos/e_bl.json');
	} else if (hash_query.baydemo !== undefined) {
		networks.demo = staticnet(null, 'div/demos/bay.json');
	} else if (hash_query.scoresheetdemo !== undefined) {
		networks.demo = staticnet(null, 'div/demos/scoresheet.json');
	} else if (hash_query.btsh_e !== undefined) {
		networks.btsh = btsh(null, hash_query.btsh_e);
	} else if (hash_query.mo !== undefined) {
		networks.mo = staticnet({
			staticnet_message: 'none',
			matches: [],
			counting: '3x21',
		});
	} else if (hash_query.import_url) {
		networks.imported = staticnet(null, hash_query.import_url, function(s, url, cb) {
			urlimport.import_url(s, url, function(errmsg, event) {
				var err = errmsg ? {msg: errmsg} : err;
				cb(err, event);
			});
		});
	}


	// Initialize networking module
	var netw = get_netw();
	if (netw) {
		netw.ui_init(s, hash_query);
		uiu.show_qs('.setup_network_container');
		uiu.hide_qs('.nonet_links');
		login.render_links(s, uiu.qs('.login_links'));
		login.render_links(s, uiu.qs('.d_login_links'));
		settings.on_mode_change(s);

		fetch_courts(s, function() {
			ui_init_court(s, hash_query);
		});
	}
}

function match_by_id(id) {
	if (! state.event) {
		return;
	}

	for (var i = 0;i < state.event.matches.length;i++) {
		var m = state.event.matches[i];
		if (m.setup.match_id == id) {
			return m;
		}
	}
}

// Follows the jQuery AJAX promise
function $request(component, options) {
	var cb = netstats.pre_request(component);
	var res = $.ajax(options);
	res.always(cb);
	return res;
}

function ui_install_staticnet(s, stnet) {
	networks.staticnet = stnet;
	erroneous = {}; // Delete all current errors
	ui_list_matches(s, false, true);
	stnet.ui_init(s);
}

function ui_uninstall_staticnet(s) {
	delete networks.staticnet;
	var msg_container = uiu.qs('.setup_network_message');
	uiu.empty(msg_container);
	ui_list_matches(s, false, true);
}

function on_edit_event(s, cb) {
	var netw = get_netw();
	if (!netw) {
		return;
	}
	if (!netw.editable(s)) {
		return;
	}
	s.event.last_update = Date.now();
	netw.on_edit_event(s, function(err) {
		if (err) {
			report_problem.silent_error('on_edit_event failed: ' + err.msg);
			cb(err);
			return;
		}
		refmode_client_ui.on_event_update();
		cb();
	});
}

function supports_order() {
	var netw = get_netw();
	return netw && !!netw.save_order;
}

// Client communicates to server
function ui_install_refmode_client(rc) {
	networks.refmode_client = rc;
}

function ui_uninstall_refmode_client() {
	delete networks.refmode_client;
}

// With push, we're getting updates from the server
function install_refmode_push(netw) {
	networks.refmode_push = netw;
}

function uninstall_refmode_push() {
	delete networks.refmode_push;
}

// Update event after fetching it somehow
function update_event(s, ev) {
	if (! ev.last_update) {
		ev.last_update = Date.now();
	}
	s.event = ev;
}

function list_all_players(s, callback) {
	var netw = get_netw();
	netw.list_all_players(s, callback);
}

// all_players + all_matches
function list_full_event(s, callback) {
	list_all_players(s, function(err, all_players) {
		if (err) return callback(err);

		if (!s.event || !s.event.matches) {
			list_matches(s, function(err, ev) {
				if (err) return callback(err);

				ev.all_players = all_players;
				update_event(s, ev);
				return callback();
			});
		} else {
			s.event.all_players = all_players;
			return callback();
		}
	});
}

function court_label(s, court_id) {
	var all_courts = courts(s);
	if (!all_courts) {
		return court_id;
	}
	var cur_court = utils.find(all_courts, function(c) {
		return (c.court_id == court_id) || (c.id == court_id);
	});
	if (cur_court && (cur_court.label !== undefined)) {
		return cur_court.label;
	}
	return court_id;
}

return {
	calc_team0_left: calc_team0_left,
	court_label: court_label,
	courts: courts,
	enter_match: enter_match,
	errstate: errstate,
	get_presses: get_presses,
	get_real_netw: get_real_netw,
	get_netw: get_netw,
	install_refmode_push: install_refmode_push,
	is_enabled: is_enabled,
	list_all_players: list_all_players,
	list_full_event: list_full_event,
	list_matches: list_matches,
	match_by_id: match_by_id,
	on_edit_event: on_edit_event,
	$request: $request,
	resync: resync,
	score_transmitted: score_transmitted,
	send_press: send_press,
	subscribe: subscribe,
	supports_order: supports_order,
	ui_init: ui_init,
	ui_install_refmode_client: ui_install_refmode_client,
	ui_install_staticnet: ui_install_staticnet,
	ui_list_matches: ui_list_matches,
	ui_uninstall_refmode_client: ui_uninstall_refmode_client,
	ui_uninstall_staticnet: ui_uninstall_staticnet,
	uninstall_refmode_push: uninstall_refmode_push,
	update_event: update_event,
};


})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var bbt_poll = require('./bbt_poll');
	var btde = require('./btde');
	var btsh = require('./btsh');
	var bupui = require('./bupui');
	var calc = require('./calc');
	var csde = require('./csde');
	var click = require('./click');
	var control = require('./control');
	var courtspot = require('./courtspot');
	var eventsheet = require('./eventsheet');
	var jticker = require('./jticker');
	var liveaw = require('./liveaw');
	var login = require('./login');
	var match_storage = require('./match_storage');
	var netstats = require('./netstats');
	var p2p = require('./p2p');
	var pronunciation = require('./pronunciation');
	var refmode_client_ui = require('./refmode_client_ui');
	var render = require('./render');
	var report_problem = require('./report_problem');
	var settings = require('./settings');
	var staticnet = require('./staticnet');
	var uiu = require('./uiu');
	var urlexport = require('./urlexport');
	var urlimport = require('./urlimport');
	var utils = require('./utils');

	module.exports = network;
}
/*/@DEV*/