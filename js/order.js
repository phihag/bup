'use strict';
var order = (function() {

var current_from = null;
var current_matches;
var current_ignore_start;
var current_locked;
var current_enable_edit;

function calc_players(match) {
	var teams = match.setup.teams;

	var res = [];
	for (var team_id = 0;team_id < 2;team_id++) {
		var players = teams[team_id].players;
		for (var i = 0;i < players.length;i++) {
			res.push(players[i].name);
		}
	}
	return res;
}

function _pref_idx(prefs, match) {
	var res = prefs.indexOf(match.md_eid);
	if (res < 0) {
		res = prefs.indexOf(match.setup.match_name);
	}
	if (res < 0) {
		throw new Error('Could not find match ' + match.md_eid);
	}
	return res;
}

// Need to call eventutils.set_metadata before calling this
function init_order_matches(matches, prefs) {
	if (! prefs) {
		prefs = matches.map(function(m) {
			return m.md_eid;
		});
	}

	var res = matches.slice();
	res.sort(function(m1, m2) {
		if (m1.md_start) {
			if (m2.md_start) {
				if (m1.md_start < m2.md_start) {
					return -1;
				} else if (m1.md_start > m2.md_start) {
					return 1;
				}
			} else {
				return -1;
			}
		} else if (m2.md_start) {
			return 1;
		}

		var idx1 = _pref_idx(prefs, m1);
		var idx2 = _pref_idx(prefs, m2);
		if (idx1 < idx2) {
			return -1;
		} else if (idx1 > idx2) {
			return 1;
		} else {
			return 0;
		}
	});
	return res;
}

function sort_by_order(matches, match_order) {
	return match_order.map(function(mo) {
		return matches[mo];
	});
}

function calc_conflicting_players(omatches, ignore_start) {
	var o_players = omatches.map(calc_players);
	var conflicts = {};
	for (var i = 0;i < ignore_start;i++) {
		var my_players = o_players[i];
		for (var dist = 1;dist <= 3;dist++) {
			if (i + dist >= ignore_start) {
				break;
			}
			var other_players = o_players[i + dist];
			for (var j = 0;j < my_players.length;j++) {
				var p = my_players[j];
				if (other_players.indexOf(p) >= 0) {
					conflicts[p] = dist;
				}
			}
		}
	}
	return conflicts;
}

function calc_conflict_map(matches) {
	return matches.map(function(m1) {
		var m1_players = calc_players(m1);
		var m1_conflicts = matches.map(function(m2) {
			if (m1 === m2) {
				return undefined;
			}
			var m2_players = calc_players(m2);
			var conflicting = m1_players.filter(function(n) {
				return m2_players.indexOf(n) >= 0;
			});	
			return (conflicting.length > 0) ? 1 : 0;
		});
		return m1_conflicts;
	});
}

function calc_cost(order, conflict_map, preferred, d3_cost) {
	if (d3_cost === undefined) {
		throw new Error('Missing d3_cost');
	}

	var res = 0;
	for (var i = 0;i < order.length;i++) {
		// conflicts
		if (i - 3 >= 0) {
			res += d3_cost * conflict_map[order[i]][order[i - 3]];
		}
		if (i - 2 >= 0) {
			res += 10000 * conflict_map[order[i]][order[i - 2]];
		}
		if (i - 1 >= 0) {
			res += 100000 * conflict_map[order[i]][order[i - 1]];
		}

		// preferred order
		for (var j = i + 1;j < order.length;j++) {
			var ipos = preferred.indexOf(order[i]);
			var jpos = preferred.indexOf(order[j]);
			if (ipos > jpos) {
				res++;
			}
		}
	}
	return res;
}

function _swap(ar, i, j) {
	var tmp = ar[i];
	ar[i] = ar[j];
	ar[j] = tmp;
}

/*
costfunc:  cost function to be called with:
           - an order (same format as preferred)
           - map of the conflicts between each map index
           - preferred
           - locked
           - d3_cost
matches:   array of matches, in initial order, say [MD, WD, XD]
preferred: array of indices into matches.
           For instance, [1, 2, 0] means preferred order is [WD, XD, MD]
locked:    map of which match IDs are locked (true means locked)
d3_cost:   Cost for matches that conflict with 2 matches in between.
*/
function optimize(costfunc, matches, preferred, locked, d3_cost) {
	var conflict_map = calc_conflict_map(matches);
	var match_count = matches.length;
	if (match_count < 1) {
		throw new Error('No matches to optimize');
	}

	var locked_list = [];
	for (var i = 0;i < match_count;i++) {
		var setup = matches[i].setup;
		if (locked[setup.match_id] || locked[setup.eventsheet_id] || locked[setup.match_name]) {
			locked_list.push(i);
		}
	}

	var permutation = utils.range(match_count);
	var best_order = permutation.slice();
	var best_cost = costfunc(best_order, conflict_map, preferred, d3_cost);

	// See https://en.wikipedia.org/wiki/Heap%27s_algorithm
	function permute_heap(n) {
		if (n === 1) {
			for (var j = 0;j < locked_list.length;j++) {
				var idx = locked_list[j];
				if (permutation[idx] !== idx) {
					return;
				}
			}

			var cost = costfunc(permutation, conflict_map, preferred, d3_cost);
			if (cost < best_cost) {
				best_order = permutation.slice();
				best_cost = cost;
			}
			return;
		}

		for (var i = 0;i < n - 1;i++) {
			permute_heap(n - 1);
			if (n % 2 === 0) {
				_swap(permutation, i, n - 1);
			} else {
				_swap(permutation, 0, n - 1);
			}
		}
		permute_heap(n - 1);
	}
	permute_heap(match_count);
	return best_order;
}

function init(s) {
	var event = s.event;

	try {
		eventutils.set_metadata(event);
	} catch(e) {
		report_problem.on_error('order init failed: ' + e.message, '(order.js)', null, e);
		uiu.text_qs('.order_error_message', e.message);
		uiu.$show_qs('.order_error');
		return;
	}

	var pref = event.preferred_order;
	if (!pref && event.league_key) {
		pref = preferred_by_league(event.league_key);
	}
	current_matches = init_order_matches(event.matches, pref);

	current_ignore_start = current_matches.length;
	current_locked = {};
	s.event.matches.forEach(function(m) {
		if (m.md_start) {
			current_locked[m.setup.match_id] = true;
		}
	});
	ui_render();
}

function show(options) {
	options = options || {};
	var enable_edit = options.enable_edit;
	var k = enable_edit ? 'mo_visible' : 'order_visible';
	if (state.ui[k]) {
		return;
	}

	uiu.$hide_qs('.order_error');
	current_enable_edit = enable_edit;
	printing.set_orientation('landscape');

	if (state.ui.referee_mode) {
		refmode_referee_ui.hide_tmp();
	} else {
		render.hide();
		settings.hide(true);
	}

	state.ui[k] = true;
	bupui.esc_stack_push(hide);
	control.set_current(state);

	uiu.$visible_qs('.order_change', network.supports_order());

	uiu.$visible_qs('.order_layout', true);
	var display = uiu.qs('.order_display');
	uiu.empty(display);

	if (state.event && state.event.matches) {
		init(state);
	} else {
		uiu.$visible_qs('.order_loading-icon', true);
		network.list_matches(state, function(err, ev) {
			uiu.$visible_qs('.order_error', !!err);
			uiu.$visible_qs('.order_loading-icon', false);
			if (err) {
				uiu.text_qs('.order_error_message', err.msg);
				return;
			}
			network.update_event(state, ev);
			init(state);
		});
	}
}

function preferred_by_league(league_key) {
	if (eventutils.NRW2016_RE.test(league_key) || (league_key === 'RLW-2016')) {
		// See §57.2 SpO
		return [
			'1.HD',
			'2.HD',
			'DD',
			'1.HE',
			'2.HE',
			'3.HE',
			'DE',
			'GD',
		];
	}

	if (eventutils.is_bundesliga(league_key)) {
		// See BLO-DB §8.8
		return [
			'1.HD',
			'DD',
			'2.HD',
			'1.HE',
			'DE',
			'GD',
			'2.HE',
		];
	}

	switch (league_key) {
	case 'RLN-2016':
		// Gruppenspielordnung Nord §7.9
		return [
			'1.HD',
			'DD',
			'2.HD',
			'1.HE',
			'DE',
			'GD',
			'2.HE',
			'3.HE',
		];
	case 'RLM-2016':
	case 'OLM-2020':
	case 'OLSW-2020':
		// SpO Gruppe Mitte §12c
		return [
			'1.HD',
			'DD',
			'2.HD',
			'1.HE',
			'DE',
			'GD',
			'2.HE',
			'3.HE',
		];
	case 'bayern-2018': // Spielordnung §41.5
	case 'OBL-2017': // Bundesligaordnung §6.1
		return [
			'1.HD',
			'2.HD',
			'DD',
			'1.HE',
			'2.HE',
			'DE',
			'3.HE',
			'GD',
		];
	case 'RLSOO-2017':
	case 'RLSOS-2017':
	case 'RLSO-2019':
		// Spielordnung §7.9
		return [
			'1.HD',
			'DD',
			'2.HD',
			'1.HE',
			'DE',
			'GD',
			'2.HE',
			'3.HE',
		];
	}
}

function ui_move_prepare(from_idx) {
	current_from = from_idx;
	$('.order_ignore_match').addClass('order_ignore_match_active');
	uiu.qsEach('.order_insert', function(insert) {
		var idx = parseInt(insert.getAttribute('data-order-idx'), 10);
			uiu.$visible(insert,
			(from_idx >= current_ignore_start) ?
			((idx <= current_ignore_start) && (idx != -99)) :
			((idx !== from_idx) && (idx !== from_idx + 1))
		);
	});

	uiu.qsEach('.order_lock', function(lock) {
		var idx = parseInt(lock.getAttribute('data-order-idx'), 10);
		var match_id = current_matches[idx].setup.match_id;
		uiu.$visible(lock,
			(current_locked[match_id]) ||
			(from_idx === idx)
		);
	});
}

function move(from_idx, to_idx) {
	if (to_idx === -99) { // Move to ignore
		if (from_idx >= current_ignore_start) {
			ui_render();
			return;
		}
		to_idx = current_ignore_start;
		current_ignore_start--;
	} else if (from_idx >= current_ignore_start) {
		current_ignore_start++;
	}

	var tmp_ar = current_matches.splice(from_idx, 1);
	current_matches.splice((from_idx < to_idx) ? to_idx - 1 : to_idx, 0, tmp_ar[0]);
	ui_render();
}

function ui_mark_click(e) {
	var to_idx = parseInt(e.target.getAttribute('data-order-idx'));
	move(current_from, to_idx);
}

function ui_lock_click(e) {
	var el = e.target;
	var idx = parseInt(el.getAttribute('data-order-idx'));
	var match_id = current_matches[idx].setup.match_id;
	if (current_locked[match_id]) {
		uiu.removeClass(el, 'order_lock_locked');
		current_locked[match_id] = false;
	} else {
		uiu.addClass(el, 'order_lock_locked');
		current_locked[match_id] = true;
	}
	ui_move_abort();
}

function ui_rm_click(e) {
	var el = e.target;
	var idx = parseInt(el.getAttribute('data-order-idx'));
	var match = current_matches[idx];
	if (confirm(state._('order:rm:prompt', {
			match_name: match.setup.match_name}
			))) {

		utils.remove_cb(state.event.matches, function(m) {
			return m === match;
		});

		utils.remove_cb(current_matches, function(m) {
			return m.setup.match_id === match.setup.match_id;
		});

		if (idx <= current_ignore_start) {
			current_ignore_start--;
		}
		ui_render();
	}
}

function ui_move_abort() {
	$('.order_insert_active').removeClass('order_insert_active');
	$('.order_ignore_match_active').removeClass('order_ignore_match_active');
	current_from = null;
	uiu.qsEach('.order_insert', function(insert) {
		uiu.$visible(insert, false);
	});

	uiu.qsEach('.order_lock', function(lock) {
		var idx = parseInt(lock.getAttribute('data-order-idx'), 10);
		var match_id = current_matches[idx].setup.match_id;
		uiu.$visible(lock, current_locked[match_id]);
	});
}

function on_match_click(e) {
	var match_el = $(e.target).closest('.order_match')[0];
	$('.order_insert_active').removeClass('order_insert_active');
	$(match_el).addClass('order_insert_active');

	var from_idx = parseInt(match_el.getAttribute('data-order-idx'), 10);
	if (from_idx === current_from) {
		ui_move_abort();
	} else {
		ui_move_prepare(from_idx);
	}
}

function _parse_players(str) {
	return str.split('/').map(function(s) {
		return s.trim();
	}).filter(function(s) {
		return s;
	}).map(function(name) {
		return {
			name: name,
		};
	});
}

function ui_render() {
	var conflicts = calc_conflicting_players(current_matches, current_ignore_start);
	var display = uiu.qs('.order_display');
	uiu.empty(display);

	function _create_num(display, i) {
		var container = uiu.el(display, 'div', {
			'class': 'order_num_container',
		});
		var css_class = 'order_num' + ((i >= current_ignore_start) ? ' order_num_invisible' : '');
		uiu.el(container, 'div', {'class': css_class}, (i + 1) + '.');
	}

	function _create_ignore_after_mark(display) {
		var container = uiu.el(display, 'div', {
			'class': 'order_ignore_match',
		});
		var ignore_label = uiu.el(container, 'span', {
			'class': 'order_ignore_label',
			'data-i18n': 'order:ignore match',
			'data-order-idx': '-99',
		}, state._('order:ignore match'));
		click.on(ignore_label, ui_mark_click);
		_create_insert_mark(display, -99);
	}

	function _create_insert_mark(display, idx) {
		var container = uiu.el(display, 'div', {'class': 'order_insert_container'});
		var mark = uiu.el(container, 'div', {'class': 'order_insert default-invisible', 'data-order-idx': idx});
		click.on(mark, ui_mark_click);
	}

	function _create_lock_mark(display, idx) {
		var container = uiu.el(display, 'div', {'class': 'order_lock_container'});
		var match_id = current_matches[idx].setup.match_id;
		var mark_class = 'order_lock';
		if (current_locked[match_id]) {
			mark_class += ' order_lock_locked';
		} else {
			mark_class += ' default-invisible';
		}
		var mark = uiu.el(container, 'div', {'class': mark_class, 'data-order-idx': idx});
		click.on(mark, ui_lock_click);
	}

	function _create_rm_mark(display, idx) {
		var container = uiu.el(display, 'div', {'class': 'order_rm_container'});
		var mark = uiu.el(container, 'div', {'class': 'order_rm', 'data-order-idx': idx});
		click.on(mark, ui_rm_click);
	}

	function _add_player(team_container, team, player_id) {
		var player_class = 'order_player';
		var player_name;
		if (team.players[player_id]) {
			player_name = team.players[player_id].name;
			var conflict = conflicts[player_name];
			if (conflict === 1) {
				player_class += ' order_conflict1';
			} else if (conflict === 2) {
				player_class += ' order_conflict2';
			} else if (conflict === 3) {
				player_class += ' order_conflict3';
			}
		} else {
			// Player not configured yet
			player_name = 'N.N.';
		}
		uiu.el(team_container, 'span', {'class': player_class}, player_name);
	}

	_create_insert_mark(display, 0);
	current_matches.forEach(function(match, i) {
		if (current_ignore_start === i) {
			_create_ignore_after_mark(display);
		}

		_create_num(display, i);
		if (i < current_ignore_start) {
			_create_lock_mark(display, i);
		}
		if (current_enable_edit) {
			_create_rm_mark(display, i);
		}

		var setup = match.setup;
		var match_class = 'order_match';
		if (match.network_finished) {
			match_class += ' order_finished';
		} else if (match.md_start) {
			match_class += ' order_ongoing';
		}
		var match_el = uiu.el(display, 'table', {
			'class': match_class,
			'data-order-idx': i,
		});
		var match_tr = uiu.el(match_el, 'tr');
		uiu.el(match_tr, 'td', {'class': 'order_match_name'}, setup.match_name);
		for (var team_id = 0;team_id <= 1;team_id++) {
			var team = setup.teams[team_id];
			var team_container = uiu.el(match_tr, 'td', {'class': 'order_match_team'});
			_add_player(team_container, team, 0);
			if (setup.is_doubles) {
				_add_player(team_container, team, 1);
			}
		}
		click.on(match_el, on_match_click);

		var time_td = uiu.el(match_tr, 'td', {
			'class': 'order_match_time',
		});
		uiu.el(time_td, 'span', {}, match.md_start ? utils.time_str(match.md_start) + '-' : '\xa0');
		uiu.el(time_td, 'span', {}, match.md_end ? utils.time_str(match.md_end) : '\xa0');

		if (i < current_ignore_start) {
			_create_insert_mark(display, i + 1);
		}
	});

	if (current_ignore_start === current_matches.length) {
		_create_ignore_after_mark(display);
	}

	var manual_ui = uiu.qs('.order_edit');
	uiu.empty(manual_ui);
	if (current_enable_edit) {
		uiu.$show(manual_ui);
		var add_form = uiu.el(manual_ui, 'form', {
			class: 'order_add',
		});
		var discipline = uiu.el(add_form, 'input', {
			required: 'required',
			placeholder: state._('order:add:discipline'),
			size: 4,
		});
		var p1 = uiu.el(add_form, 'input', {
			placeholder: state._('order:add:placeholder'),
			required: 'required',
			size: 40,
		});
		var p2 = uiu.el(add_form, 'input', {
			placeholder: state._('order:add:placeholder2'),
			size: 40,
		});

		var _check_validity = function() {
			var p1_players = _parse_players(p1.value);
			var p2_players = _parse_players(p2.value);

			if ((p2_players.length > 2) || (p1_players.length !== p2_players.length)) {
				p2.setCustomValidity(state._('order:add:invalid'));
			} else {
				p2.setCustomValidity('');
			}
		};

		p1.addEventListener('input', _check_validity);
		p2.addEventListener('input', _check_validity);

		uiu.el(add_form, 'button', {
			type: 'submit',
		}, state._('order:add:match'));
		add_form.addEventListener('submit', function(e) {
			e.preventDefault();

			var p1_players = _parse_players(p1.value);
			var p2_players = _parse_players(p2.value);

			var d = new Date();
			var match_id = 'mo_' + utils.iso8601(d) + utils.timesecs_str(d) + '_' + discipline.value;

			var setup = {
				is_doubles: (p1_players.length === 2),
				counting: '3x21',
				match_name: discipline.value,
				match_id: match_id,
				teams: [{
					players: p1_players,
				}, {
					players: p2_players,
				}],
				team_competition: false,
			};
			var match = {setup: setup};
			state.event.matches.push(match);

			network.on_edit_event(state, function() {
				current_matches.push(match);
				current_ignore_start++;
				ui_render();
			});
		});

		var import_form = uiu.el(manual_ui, 'form', {
			class: 'order_import',
		});
		var import_url = uiu.el(import_form, 'input', {
			type: 'url',
			size: 50,
			required: 'required',
			placeholder: state._('order:import:placeholder'),
			value: '',
		});
		uiu.el(import_form, 'button', {
			type: 'submit',
		}, state._('order:import matches'));
		import_form.addEventListener('submit', function(e) {
			e.preventDefault();
			uiu.qsEach('.order_error', uiu.remove, import_form);
			var url = import_url.value;
			urlimport.download_tde_day(state, url, function(errmsg, imported_event) {
				if (errmsg) {
					uiu.el(import_form, 'div', 'order_error', state._('order:import:error', {
						msg: errmsg,
					}));
					return;
				}

				imported_event.staticnet_message = 'none';
				var netw = network.get_netw();
				netw.swap_event(imported_event);
				network.update_event(state, imported_event);

				init(state);
			});
		});

		discipline.focus();
	}
}

function hide() {
	if (! state.ui.order_visible && !state.ui.mo_visible) {
		return;
	}

	bupui.esc_stack_pop();
	uiu.$hide_qs('.order_layout');
	state.ui.order_visible = false;
	state.ui.mo_visible = false;

	if (state.ui.referee_mode) {
		refmode_referee_ui.back_to_ui();
	} else {
		settings.show();
	}
}

function ui_init() {
	click.qs('.order_link', function(e) {
		e.preventDefault();
		show();
	});

	click.qs('.order_back', function(e) {
		e.preventDefault();
		hide();
	});

	click.qs('.order_print', function() {
		window.print();
	});

	// No click.qs because that would block form submission
	uiu.qs('.order_layout').addEventListener('click', function(e) {
		if (e.target === this) {
			ui_move_abort();
		}
	});

	click.qs('.order_optimize', function() {
		var matches_to_sort = current_matches.slice(0, current_ignore_start);
		var d3_cost = 100;
		var best_order = optimize(calc_cost, matches_to_sort, utils.range(current_ignore_start), current_locked, d3_cost);
		var sorted = sort_by_order(matches_to_sort, best_order, current_ignore_start);
		current_matches = sorted.concat(current_matches.slice(current_ignore_start));
		ui_render();
	});

	click.qs('.order_reset', function() {
		init(state);
	});

	click.qs('.order_change', function() {
		network.get_netw().save_order(state, current_matches, function(err) {
			if (err) {
				uiu.text_qs('.order_error', err.message);
				uiu.$show_qs('.order_error');
			} else {
				hide();
			}
		});
	});
}

function mshow() {
	// network is initialized separately
	show({enable_edit: true});
}

return {
	hide: hide,
	show: show,
	ui_init: ui_init,
	mshow: mshow,
	/*@DEV*/
	// Testing only
	calc_conflicting_players: calc_conflicting_players,
	init_order_matches: init_order_matches,
	calc_cost: calc_cost,
	calc_conflict_map: calc_conflict_map,
	optimize: optimize,
	preferred_by_league: preferred_by_league,
	/*/@DEV*/
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var bupui = require('./bupui');
	var click = require('./click');
	var control = require('./control');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var printing = require('./printing');
	var refmode_referee_ui = null; // break cycle, should be require('./refmode_referee_ui');
	var render = require('./render');
	var report_problem = require('./report_problem');
	var settings = require('./settings');
	var uiu = require('./uiu');
	var urlimport = require('./urlimport');
	var utils = require('./utils');

	module.exports = order;
}
/*/@DEV*/
