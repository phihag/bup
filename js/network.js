var network = (function() {
'use strict';

var networks = {};

function get_real_netw() {
	return networks.bldemo || networks.vdemo || networks.edemo || networks.btde || networks.courtspot || networks.liveaw;
}

function get_netw() {
	return networks.staticnet || get_real_netw();
}

function is_enabled() {
	return !!get_netw() || !!networks.p2p;
}

function league_key(s) {
	var event = s.event;
	if (!event) {
		return null;
	}

	if (event.league_key) {
		return event.league_key;
	}

	// Support for old CourtSpot versions
	var eventsheets = event.eventsheets;
	if (eventsheets && (eventsheets.length > 0)) {
		return eventsheets[0].key;
	}

	return null;
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
			if (!c.label) {
				c.label = c.id + ' (' + c.description + ')';
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

	var netw = get_netw();
	if (netw) {
		netw.send_press(s, press);
	}
}

var _network_list_timeout = null;
function _stop_list_matches() {
	if (_network_list_timeout !== null) {
		window.clearTimeout(_network_list_timeout);
		_network_list_timeout = null;
	}
}

function _start_list_matches(s) {
	if (_network_list_timeout !== null) {
		window.clearTimeout(_network_list_timeout);
		_network_list_timeout = null;
	}

	if (erroneous.list_matches) {
		// Let the normal resync procedure handle it
		return;
	}

	_network_list_timeout = setTimeout(function() {
		ui_list_matches(s, true);
	}, s.settings.network_update_interval);
}

function _matchlist_install_reload_button(s) {
	var event_container = $('.setup_network_heading');
	if (event_container.find('.setup_network_matches_reload').length > 0) {
		return;
	}
	var reload_button = $('<button class="setup_network_matches_reload image-button"><span></span></button>');
	reload_button.on('click', function() {
		ui_list_matches(s);
	});
	event_container.append(reload_button);
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

	var netscore = match.network_score;
	if (netscore) {
		var mwinner = calc.match_winner(match.setup.counting, netscore);

		var on_cancel = function() {
			control.stop_match(state);
			settings.show();
		};

		if ((mwinner == 'inprogress') && calc.match_started(netscore)) {
			bupui.make_pick(state, state._('network:in progress').replace('{match}', pronounciation.match_str(match.setup)), [{
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
			bupui.make_pick(state, state._('network:match finished').replace('{score}', _score_text(netscore)).replace('{match}', pronounciation.match_str(match.setup)), [{
				label: state._('network:restart match'),
			}], function() {
				control.start_match(state, match.setup);
			}, on_cancel);
			return;
		}
	}
	control.start_match(state, match.setup);
}

function ui_render_matchlist(s, event) {
	var container = $('#setup_network_matches');
	container.empty(); // TODO better transition if we're updating?
	$('.setup_network_event').text(event.event_name ? event.event_name : s._('network:Matches'));

	event.matches.forEach(function(match) {
		var btn = $('<button class="setup_network_match">');
		if (match.setup.incomplete) {
			btn.attr('disabled', 'disabled');
		}

		var match_name = $('<span class="setup_network_match_match_name">');
		match_name.text(match.setup.match_name);
		btn.append(match_name);

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

		var home_players = $('<span class="setup_network_match_home_players">');
		home_players.text(_players_str(match.setup.teams[0]));
		btn.append(home_players);

		var away_players = $('<span class="setup_network_match_away_players">');
		away_players.text(_players_str(match.setup.teams[1]));
		btn.append(away_players);

		var score = $('<span class="setup_network_match_score">');
		var score_text = _score_text(match.network_score);
		score.text(score_text ? score_text : '\xA0');
		btn.append(score);

		btn.on('click', function() {
			enter_match(match);
		});

		container.append(btn);
	});
}

function list_matches(s, callback) {
	var netw = get_netw();
	if (!netw) {
		return callback({
			msg: state._('network:error:unconfigured'),
		});
	}
	netw.list_matches(s, callback);
}

// Returns a callback to be called when the list is no longer required
function ui_list_matches(s, silent, no_timer) {
	_matchlist_install_reload_button(s);
	if (! no_timer) {
		_start_list_matches(s);
	}

	var status_container = $('.setup_network_status');
	if (!silent && status_container.find('.setup_network_matches_loading').length === 0) {
		var loading = $('<div class="setup_network_matches_loading"><div class="loading-icon"></div><span>Lade Spiele ...</span></div>');
		status_container.append(loading);
	}

	var netw = get_netw();
	if (!netw) {
		return;
	}
	// TODO use subscribe here
	netw.list_matches(s, function(err, event) {
		status_container.empty();
		_matchlist_install_reload_button(s);
		errstate('list_matches', err);
		if (err) {
			var err_msg = $('<div class="network_error">');
			err_msg.text(err.msg);
			status_container.append(err_msg);
			return;
		}

		s.event = event;
		eventsheet.render_links(s);
		uiu.visible_qs('.editevent_link', netw.editable(s));
		ui_render_matchlist(s, event);
	});

	return _stop_list_matches;
}

// Returns a callback to be called when the updates are no longer required.
// cb gets called with (err, s, event); s is NOT updated implicitly
// calc_timeout is called with s and must return immediately the timeout
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
		netw.list_matches(s, function(err, event) {
			cb(err, s, event);
		});
		timeout = setTimeout(query, calc_timeout(s));
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

function errstate(component, err) {
	if (err) {
		erroneous[component] = true;

		$('.network_desync_container').show();
		if (resync_timeout === null) {
			schedule_resync();
		}

		if ((err.type == 'login-required') && !login_rendered) {
			login_rendered = true;
			var netw = get_netw();
			netw.ui_render_login($('.settings_network_login_container'));
			netw.ui_render_login($('.network_desync_login_container'));
		}

		$('.network_desync_errmsg').text(err.msg);
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
	s.settings.court_id = c.id;
	s.settings.court_description = c.description;
	settings.store(s);
	settings.update(s);
}

function _court_by_id(all_courts, court_id) {
	for (var i = 0;i < all_courts.length;i++) {
		var c = all_courts[i];
		if (c.id == court_id) {
			return c;
		}
	}
	return null;
}

function _court_pick_dialog(s, all_courts, on_cancel) {
	bupui.make_pick(s, s._('Select Court'), all_courts, function(c) {
		_set_court(s, c);
	}, on_cancel, $('body'));
}

function ui_init_court(s, hash_query) {
	// Determine avialable courts
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
		return s.settings.court_id == c.id && s.settings.court_description == c.description;
	});
	if (! configured) {
		// Prevent updates while we select a court
		s.settings.court_id = undefined;
		s.settings.court_description = '';
		_court_pick_dialog(s, all_courts, false);
	}

	// Configure court select
	var select = $('.settings select[name="court_select"]');
	all_courts.forEach(function(c) {
		var option = $('<option>');
		option.text(c.label);
		option.attr('value', c.id);
		select.append(option);
	});
	select.val(s.settings.court_id);
	select.on('change', function() {
		var c = _court_by_id(all_courts, $(select).val());
		if (c) {
			_set_court(s, c);
			resync();
		}
	});
	var manual = $('.settings_court_manual');
	manual.hide();
	var automatic = $('.settings_court_automatic');
	automatic.show();

	var court_str_field = render.main_court_ui().court_str;
	uiu.on_click(court_str_field, function() {
		_court_pick_dialog(s, all_courts, function() {
			// On abort change nothing
		});
	});
}

function ui_init(s, hash_query) {
	uiu.on_click_qs('.network_desync_image', resync);
	netstats.ui_init();

	// Load networking module(s)
	if (hash_query.p2p !== undefined) {
		networks.p2p = p2p();
	}
	if (hash_query.courtspot !== undefined) {
		networks.courtspot = courtspot();
	} else if (hash_query.btde !== undefined) {
		networks.btde = btde();
	} else if (hash_query.liveaw_event_id) {
		networks.liveaw = liveaw(hash_query.liveaw_event_id);
	} else if (hash_query.edemo !== undefined) {
		networks.edemo = staticnet(null, 'div/edemo_' + s.lang + '.json');
	} else if (hash_query.bldemo !== undefined) {
		networks.bldemo = staticnet(null, 'div/bldemo.json');
	} else if (hash_query.vdemo !== undefined) {
		networks.vdemo = staticnet(null, 'div/vdemo_' + s.lang + '.json');
	}

	// Initialize court info
	ui_init_court(s, hash_query);

	// Initialize networking module
	var netw = get_netw();
	if (netw) {
		netw.ui_init(s);
		uiu.visible_qs('.setup_network_container', true);
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
function request(component, options) {
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

function on_edit_event(s) {
	var netw = get_netw();
	if (!netw) {
		return;
	}
	if (!netw.editable(s)) {
		return;
	}
	netw.on_edit_event(s);
}

return {
	calc_team0_left: calc_team0_left,
	courts: courts,
	enter_match: enter_match,
	errstate: errstate,
	get_presses: get_presses,
	get_real_netw: get_real_netw,
	is_enabled: is_enabled,
	league_key: league_key,
	list_matches: list_matches,
	match_by_id: match_by_id,
	request: request,
	resync: resync,
	send_press: send_press,
	subscribe: subscribe,
	on_edit_event: on_edit_event,
	ui_init: ui_init,
	ui_install_staticnet: ui_install_staticnet,
	ui_list_matches: ui_list_matches,
	ui_uninstall_staticnet: ui_uninstall_staticnet,
};


})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var btde = require('./btde');
	var bupui = require('./bupui');
	var calc = require('./calc');
	var control = require('./control');
	var courtspot = require('./courtspot');
	var eventsheet = require('./eventsheet');
	var liveaw = require('./liveaw');
	var netstats = require('./netstats');
	var p2p = require('./p2p');
	var pronounciation = require('./pronounciation');
	var render = require('./render');
	var report_problem = require('./report_problem');
	var settings = require('./settings');
	var staticnet = require('./staticnet');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = network;
}
/*/@DEV*/