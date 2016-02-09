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
		var team = teams[team_id];
		team.players.forEach(function(p) {
			res.push(p.name);
		});
	}
	return res;
}

function order_by_names(matches, match_names) {
	return match_names.map(function(match_name) {
		for (var i = 0;i < matches.length;i++) {
			if (matches[i].setup.match_name === match_name) {
				return matches[i];
			}
		}
		throw new Error('Could not find match ' + match_name);
	});
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

function show() {
	if (state.ui.order_visible) {
		return;
	}

	render.hide();
	settings.hide(true);

	state.ui.order_visible = true;
	uiu.esc_stack_push(hide);
	control.set_current(state);

	utils.visible_qs('.order_layout', true);
	var display = document.querySelector('.order_display');
	utils.empty(display);

	if (state.event && state.event.matches) {
		current_matches = get_omatches(state);
		current_ignore_start = current_matches.length;
		current_locked = {};
		ui_render();
	} else {
		utils.visible_qs('.order_loading-icon', true);
		network.list_matches(state, function(err, ev) {
			utils.visible_qs('.order_error', !!err);
			utils.visible_qs('.order_loading-icon', false);
			if (err) {
				$('.order_error_message').text(err.msg);
				return;
			}
			state.event = ev;
			current_matches = get_omatches(state);
			current_ignore_start = current_matches.length;
			current_locked = {};
			ui_render();
		});
	}
}

function get_omatches(s) {
	var event = s.event;
	if (!event.preferred_order) {
		return event.matches.slice();
	}
	return order_by_names(event.matches, event.preferred_order);
}

function ui_move_prepare(from_idx) {
	current_from = from_idx;
	$('.order_ignore_match').addClass('order_ignore_match_active');
	utils.qsEach('.order_insert', function(insert) {
		var idx = parseInt(insert.getAttribute('data-order-idx'), 10);
		utils.visible(insert,
			(from_idx >= current_ignore_start) ?
			((idx <= current_ignore_start) && (idx != -99)) :
			((idx !== from_idx) && (idx !== from_idx + 1))
		);
	});

	utils.qsEach('.order_lock', function(lock) {
		var idx = parseInt(lock.getAttribute('data-order-idx'), 10);
		var match_id = current_matches[idx].setup.match_id;
		utils.visible(lock,
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
		$(el).removeClass('order_lock_locked');
		current_locked[match_id] = false;
	} else {
		$(el).addClass('order_lock_locked');
		current_locked[match_id] = true;
	}
	ui_move_abort();
}

function ui_move_abort() {
	$('.order_insert_active').removeClass('order_insert_active');
	$('.order_ignore_match_active').removeClass('order_ignore_match_active');
	current_from = null;
	utils.qsEach('.order_insert', function(insert) {
		utils.visible(insert, false);
	});

	utils.qsEach('.order_lock', function(lock) {
		var idx = parseInt(lock.getAttribute('data-order-idx'), 10);
		var match_id = current_matches[idx].setup.match_id;
		utils.visible(lock, current_locked[match_id]);
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
	var display = document.querySelector('.order_display');
	utils.empty(display);

	function _create_num(display, i) {
		var container = utils.create_el(display, 'div', {
			'class': 'order_num_container',
		});
		var css_class = 'order_num' + ((i >= current_ignore_start) ? ' order_num_invisible' : '');
		utils.create_el(container, 'div', {'class': css_class}, (i + 1) + '.');
	}

	function _create_ignore_after_mark(display) {
		var container = utils.create_el(display, 'div', {
			'class': 'order_ignore_match',
		});
		var ignore_label = utils.create_el(container, 'span', {
			'class': 'order_ignore_label',
			'data-i18n': 'order:ignore match',
			'data-order-idx': '-99',
		}, state._('order:ignore match'));
		utils.on_click(ignore_label, ui_mark_click);
		_create_insert_mark(display, -99);
	}

	function _create_insert_mark(display, idx) {
		var container = utils.create_el(display, 'div', {'class': 'order_insert_container'});
		var mark = utils.create_el(container, 'div', {'class': 'order_insert default-invisible', 'data-order-idx': idx});
		utils.on_click(mark, ui_mark_click);
	}

	function _create_lock_mark(display, idx) {
		var container = utils.create_el(display, 'div', {'class': 'order_lock_container'});
		var match_id = current_matches[idx].setup.match_id;
		var mark_class = 'order_lock';
		if (current_locked[match_id]) {
			mark_class += ' order_lock_locked';
		} else {
			mark_class += ' default-invisible';
		}
		var mark = utils.create_el(container, 'div', {'class': mark_class, 'data-order-idx': idx});
		utils.on_click(mark, ui_lock_click);
	}

	function _add_player(team_container, team, player_id) {
		var style = '';
		var player_name;
		if (team.players[player_id]) {
			player_name = team.players[player_id].name;
			var conflict = conflicts[player_name];
			if (conflict === 1) {
				style = 'color: red;';
			} else if (conflict === 2) {
				style = 'color: orange;';
			}
		} else {
			// Player not configured yet
			player_name = 'N.N.';
		}
		utils.create_el(team_container, 'span', {'class': 'order_player', style: style}, player_name);
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
		var match_el = utils.create_el(display, 'table', {'class': 'order_match', 'data-order-idx': i});
		var match_tr = utils.create_el(match_el, 'tr');
		utils.create_el(match_tr, 'td', {'class': 'order_match_name'}, setup.match_name);
		for (var team_id = 0;team_id <= 1;team_id++) {
			var team = setup.teams[team_id];
			var team_container = utils.create_el(match_tr, 'td', {'class': 'order_match_team'});
			_add_player(team_container, team, 0);
			if (setup.is_doubles) {
				_add_player(team_container, team, 1);
			}
		}
		utils.on_click(match_el, on_match_click);

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
	utils.on_click_qs('.order_link', function(e) {
		e.preventDefault();
		show();
		return false;
	});

	utils.on_click_qs('.order_back', function(e) {
		e.preventDefault();
		hide();
		return false;
	});

	utils.on_click_qs('.order_layout', function(e) {
		if (e.target === this) {
			ui_move_abort();
		}
	});

	utils.on_click_qs('.order_optimize', function() {
		var matches_to_sort = current_matches.slice(0, current_ignore_start);
		var best_order = optimize(cost_rest2, matches_to_sort, utils.range(current_ignore_start), current_locked);
		var sorted = sort_by_order(matches_to_sort, best_order, current_ignore_start);
		current_matches = sorted.concat(current_matches.slice(current_ignore_start));
		ui_render();
	});

	utils.on_click_qs('.order_reset', function() {
		current_matches = get_omatches(state);
		current_ignore_start = current_matches.length;
		current_locked = {};
		ui_render();
	});
}

return {
	hide: hide,
	show: show,
	ui_init: ui_init,
	// Testing only
	calc_conflicting_players: calc_conflicting_players,
	order_by_names: order_by_names,
	cost_rest2: cost_rest2,
	calc_conflict_map: calc_conflict_map,
	optimize: optimize,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var control = require('./control');
	var network = require('./network');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = order;
}
/*/@DEV*/