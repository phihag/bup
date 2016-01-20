var order = (function() {
'use strict';

var current_from = null;
var current_matches;

function calc_players(match) {
	var setup = match.setup;
	var teams = setup.teams;
	if (setup.is_doubles) {
		return [
			teams[0].players[0].name, teams[0].players[1].name,
			teams[1].players[0].name, teams[1].players[1].name,
		];
	} else {
		return [
			teams[0].players[0].name,
			teams[1].players[0].name,
		];
	}
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

function calc_conflicting_players(omatches) {
	var len = omatches.length;
	var o_players = omatches.map(calc_players);
	var conflicts = {};
	for (var i = 0;i < len;i++) {
		var my_players = o_players[i];
		for (var dist = 1;dist <= 2;dist++) {
			if (i + dist >= len) {
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

function optimize(costfunc, matches, preferred) {
	var conflict_map = calc_conflict_map(matches);
	var match_count = matches.length;
	if (match_count < 1) {
		throw new Error('No matches to optimize');
	}

	var permutation = utils.range(match_count);
	var best_order = permutation.slice();
	var best_cost = costfunc(best_order, conflict_map, preferred);

	// See https://en.wikipedia.org/wiki/Heap%27s_algorithm
	function permute_heap(n) {
		if (n === 1) {
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
	utils.qsEach('.order_insert', function(insert) {
		var idx = parseInt(insert.getAttribute('data-order-idx'), 10);
		utils.visible(insert, (idx !== from_idx) && (idx !== from_idx + 1));
	});
}

function move(from_idx, to_idx) {
	var tmp_ar = current_matches.splice(from_idx, 1);
	current_matches.splice((from_idx < to_idx) ? to_idx - 1 : to_idx, 0, tmp_ar[0]);
	ui_render();
}

function ui_move_abort() {
	$('.order_insert_active').removeClass('order_insert_active');
	current_from = null;
	utils.qsEach('.order_insert', function(insert) {
		utils.visible(insert, false);
	});
}

function ui_render() {
	var nums = document.querySelector('.order_nums');
	utils.empty(nums);
	for (var i = 1;i <= current_matches.length;i++) {
		utils.create_el(nums, 'div', {'class': 'order_num'}, i + '.');
	}

	var conflicts = calc_conflicting_players(current_matches);
	var display = document.querySelector('.order_display');
	utils.empty(display);

	function _create_insert_mark(display, idx) {
		var container = utils.create_el(display, 'div', {'class': 'order_insert_container'});
		var mark = utils.create_el(container, 'div', {'class': 'order_insert default-invisible', 'data-order-idx': idx});
		utils.on_click(mark, function() {
			var to_idx = parseInt(mark.getAttribute('data-order-idx'));
			move(current_from, to_idx);
		});
	}

	function _add_player(team_container, team, player_id) {
		var player_name = team.players[player_id].name;
		var conflict = conflicts[player_name];
		var style = '';
		if (conflict === 1) {
			style = 'color: red;';
		} else if (conflict === 2) {
			style = 'color: orange;';
		}
		utils.create_el(team_container, 'span', {'class': 'order_player', style: style}, player_name);
	}

	_create_insert_mark(display, 0);
	current_matches.forEach(function(match, i) {
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
		utils.on_click(match_el, function() {
			$('.order_insert_active').removeClass('order_insert_active');
			$(match_el).addClass('order_insert_active');

			var from_idx = parseInt(match_el.getAttribute('data-order-idx'));
			if (from_idx === current_from) {
				ui_move_abort();
			} else {
				ui_move_prepare(from_idx, 10);
			}
		});

		_create_insert_mark(display, i + 1);
	});
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
		var best_order = optimize(cost_rest2, current_matches, utils.range(current_matches.length));
		current_matches = sort_by_order(current_matches, best_order);
		ui_render();
	});

	utils.on_click_qs('.order_reset', function() {
		current_matches = get_omatches(state);
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