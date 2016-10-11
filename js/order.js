var order = (function() {
'use strict';

var current_from = null;
var current_matches;
var current_ignore_start;
var current_locked;

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
		for (var dist = 1;dist <= 2;dist++) {
			if (i + dist >= ignore_start) {
				break;
			}
			if (omatches[i].md_start && omatches[i + dist].md_start) {
				// Both matches started already, so no need to color conflict
				continue;
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
	var conflicts = [];
	matches.forEach(function(m1) {
		var m1_players = calc_players(m1);
		var m1_conflicts = matches.map(function(m2) {
			if (m1 === m2) {
				return undefined;
			}
			var m2_players = calc_players(m2);
			var conflicting = m1_players.filter(function(n) {
				return m2_players.indexOf(n) >= 0;
			});	
			return conflicting.length;
		});
		conflicts.push(m1_conflicts);
	});
	return conflicts;
}

function cost_rest2(order, conflict_map, preferred) {
	var res = 0;
	for (var i = 0;i < order.length;i++) {
		// conflicts
		if (i - 2 >= 0) {
			res += 1000 * conflict_map[order[i]][order[i - 2]];
		}
		if (i - 1 >= 0) {
			res += 10000 * conflict_map[order[i]][order[i - 1]];
		}

		// preferred
		res += Math.abs(i - preferred.indexOf(order[i]));
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
matches:   array of matches, in initial order, say [MD, WD, XD]
preferred: array of indices into matches.
           For instance, [1, 2, 0] means preferred order is [WD, XD, MD]
locked:    map of which match IDs are locked (true means locked)
*/
function optimize(costfunc, matches, preferred, locked) {
	var conflict_map = calc_conflict_map(matches);
	var match_count = matches.length;
	if (match_count < 1) {
		throw new Error('No matches to optimize');
	}

	var locked_list = [];
	for (var i = 0;i < match_count;i++) {
		if (locked[matches[i].setup.match_id]) {
			locked_list.push(i);
		}
	}

	var permutation = utils.range(match_count);
	var best_order = permutation.slice();
	var best_cost = costfunc(best_order, conflict_map, preferred);

	// See https://en.wikipedia.org/wiki/Heap%27s_algorithm
	function permute_heap(n) {
		if (n === 1) {
			for (var j = 0;j < locked_list.length;j++) {
				var idx = locked_list[j];
				if (permutation[idx] !== idx) {
					return;
				}
			}

			var cost = costfunc(permutation, conflict_map, preferred);
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

	eventutils.set_metadata(event);

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

function show() {
	if (state.ui.order_visible) {
		return;
	}

	render.hide();
	settings.hide(true);

	state.ui.order_visible = true;
	uiu.esc_stack_push(hide);
	control.set_current(state);

	uiu.visible_qs('.order_layout', true);
	var display = uiu.qs('.order_display');
	uiu.empty(display);

	if (state.event && state.event.matches) {
		init(state);
	} else {
		uiu.visible_qs('.order_loading-icon', true);
		network.list_matches(state, function(err, ev) {
			uiu.visible_qs('.order_error', !!err);
			uiu.visible_qs('.order_loading-icon', false);
			if (err) {
				uiu.text_qs('.order_error_message', err.msg);
				return;
			}
			state.event = ev;
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

	switch (league_key) {
	case '1BL-2016':
	case '2BLN-2016':
	case '2BLS-2016':
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
	}
}

function ui_move_prepare(from_idx) {
	current_from = from_idx;
	$('.order_ignore_match').addClass('order_ignore_match_active');
	uiu.qsEach('.order_insert', function(insert) {
		var idx = parseInt(insert.getAttribute('data-order-idx'), 10);
		uiu.visible(insert,
			(from_idx >= current_ignore_start) ?
			((idx <= current_ignore_start) && (idx != -99)) :
			((idx !== from_idx) && (idx !== from_idx + 1))
		);
	});

	uiu.qsEach('.order_lock', function(lock) {
		var idx = parseInt(lock.getAttribute('data-order-idx'), 10);
		var match_id = current_matches[idx].setup.match_id;
		uiu.visible(lock,
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

function ui_move_abort() {
	$('.order_insert_active').removeClass('order_insert_active');
	$('.order_ignore_match_active').removeClass('order_ignore_match_active');
	current_from = null;
	uiu.qsEach('.order_insert', function(insert) {
		uiu.visible(insert, false);
	});

	uiu.qsEach('.order_lock', function(lock) {
		var idx = parseInt(lock.getAttribute('data-order-idx'), 10);
		var match_id = current_matches[idx].setup.match_id;
		uiu.visible(lock, current_locked[match_id]);
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
		ui_move_prepare(from_idx, 10);
	}
}

function ui_render() {
	var conflicts = calc_conflicting_players(current_matches, current_ignore_start);
	var display = uiu.qs('.order_display');
	uiu.empty(display);

	function _create_num(display, i) {
		var container = uiu.create_el(display, 'div', {
			'class': 'order_num_container',
		});
		var css_class = 'order_num' + ((i >= current_ignore_start) ? ' order_num_invisible' : '');
		uiu.create_el(container, 'div', {'class': css_class}, (i + 1) + '.');
	}

	function _create_ignore_after_mark(display) {
		var container = uiu.create_el(display, 'div', {
			'class': 'order_ignore_match',
		});
		var ignore_label = uiu.create_el(container, 'span', {
			'class': 'order_ignore_label',
			'data-i18n': 'order:ignore match',
			'data-order-idx': '-99',
		}, state._('order:ignore match'));
		click.on(ignore_label, ui_mark_click);
		_create_insert_mark(display, -99);
	}

	function _create_insert_mark(display, idx) {
		var container = uiu.create_el(display, 'div', {'class': 'order_insert_container'});
		var mark = uiu.create_el(container, 'div', {'class': 'order_insert default-invisible', 'data-order-idx': idx});
		click.on(mark, ui_mark_click);
	}

	function _create_lock_mark(display, idx) {
		var container = uiu.create_el(display, 'div', {'class': 'order_lock_container'});
		var match_id = current_matches[idx].setup.match_id;
		var mark_class = 'order_lock';
		if (current_locked[match_id]) {
			mark_class += ' order_lock_locked';
		} else {
			mark_class += ' default-invisible';
		}
		var mark = uiu.create_el(container, 'div', {'class': mark_class, 'data-order-idx': idx});
		click.on(mark, ui_lock_click);
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
			}
		} else {
			// Player not configured yet
			player_name = 'N.N.';
		}
		uiu.create_el(team_container, 'span', {'class': player_class}, player_name);
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

		var setup = match.setup;
		var match_class = 'order_match';
		if (match.network_finished) {
			match_class += ' order_finished';
		} else if (match.md_start) {
			match_class += ' order_ongoing';
		}
		var match_el = uiu.create_el(display, 'table', {
			'class': match_class,
			'data-order-idx': i,
		});
		var match_tr = uiu.create_el(match_el, 'tr');
		uiu.create_el(match_tr, 'td', {'class': 'order_match_name'}, setup.match_name);
		for (var team_id = 0;team_id <= 1;team_id++) {
			var team = setup.teams[team_id];
			var team_container = uiu.create_el(match_tr, 'td', {'class': 'order_match_team'});
			_add_player(team_container, team, 0);
			if (setup.is_doubles) {
				_add_player(team_container, team, 1);
			}
		}
		click.on(match_el, on_match_click);

		var time_td = uiu.create_el(match_tr, 'td', {
			'class': 'order_match_time',
		});
		uiu.create_el(time_td, 'span', {}, match.md_start ? utils.time_str(match.md_start) + '-' : '\xa0');
		uiu.create_el(time_td, 'span', {}, match.md_end ? utils.time_str(match.md_end) : '\xa0');

		if (i < current_ignore_start) {
			_create_insert_mark(display, i + 1);
		}
	});

	if (current_ignore_start === current_matches.length) {
		_create_ignore_after_mark(display);
	}
}

function hide() {
	if (! state.ui.order_visible) {
		return;
	}

	uiu.esc_stack_pop();
	$('.order_layout').hide();
	state.ui.order_visible = false;
	control.set_current(state);
	settings.show();
}

function ui_init() {
	click.qs('.order_link', function(e) {
		e.preventDefault();
		show();
		return false;
	});

	click.qs('.order_back', function(e) {
		e.preventDefault();
		hide();
		return false;
	});

	click.qs('.order_layout', function(e) {
		if (e.target === this) {
			ui_move_abort();
		}
	});

	click.qs('.order_optimize', function() {
		var matches_to_sort = current_matches.slice(0, current_ignore_start);
		var best_order = optimize(cost_rest2, matches_to_sort, utils.range(current_ignore_start), current_locked);
		var sorted = sort_by_order(matches_to_sort, best_order, current_ignore_start);
		current_matches = sorted.concat(current_matches.slice(current_ignore_start));
		ui_render();
	});

	click.qs('.order_reset', function() {
		init(state);
	});
}

return {
	hide: hide,
	show: show,
	ui_init: ui_init,
	// Testing only
	calc_conflicting_players: calc_conflicting_players,
	init_order_matches: init_order_matches,
	cost_rest2: cost_rest2,
	calc_conflict_map: calc_conflict_map,
	optimize: optimize,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var control = require('./control');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = order;
}
/*/@DEV*/
