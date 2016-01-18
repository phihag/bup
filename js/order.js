var order = (function() {
'use strict';

var COLORS = ['#791399', '#829900', '#375Edf', '#042998', '#AD0000', '#D17D00', 'red', 'blue'];

function colorize(matches) {
	var player_conflicts = calc_conflicting_players(matches);
	var player_colors = {};
	var color_idx = 0;

	// First colorize singles
	matches.forEach(function(match) {
		var setup = match.setup;
		if (setup.is_doubles) {
			return;
		}

		var p1 = setup.teams[0].players[0].name;
		var p2 = setup.teams[1].players[0].name;
		if (player_conflicts[p1] || player_conflicts[p2]) {
			var col = COLORS[color_idx];
			if (player_conflicts[p1]) {
				player_colors[p1] = col;
			}
			if (player_conflicts[p2]) {
				player_colors[p2] = col;
			}
			color_idx = (color_idx + 1) % COLORS.length;
		}
	});

	// Colorize doubles
	matches.forEach(function(match) {
		var setup = match.setup;
		if (!setup.is_doubles) {
			return;
		}

		var new_color_idx = color_idx;
		for (var team_idx = 0;team_idx <= 1;team_idx++) {
			var cidx = color_idx;
			for (var player_idx = 0;player_idx <= 1;player_idx++) {
				var p = setup.teams[team_idx].players[player_idx].name;
				if (player_colors[p] || !player_conflicts[p]) {
					continue;
				}

				player_colors[p] = COLORS[cidx % COLORS.length];
				cidx++;
			}
			new_color_idx = Math.max(new_color_idx, cidx);
		}
		color_idx = new_color_idx % COLORS.length;
	});

	return player_colors;
}

function calc_players(match) {
	var setup = match.setup;
	if (setup.is_doubles) {
		return [
			setup.teams[0].players[0].name, setup.teams[0].players[1].name,
			setup.teams[1].players[0].name, setup.teams[1].players[1].name];
	} else {
		return [setup.teams[0].players[0].name, setup.teams[1].players[0].name];
	}
}

function calc_conflicts(matches) {
	var conflicts = [];
	matches.forEach(function(m1) {
		var m1_players = calc_players(m1);
		var m1_conflicts = matches.map(function(m2) {
			if (m1 === m2) {
				return undefined;
			}
			var m2_players = calc_players(m2);
			var conflicting = m1_players.filter(function(n) {
				return m2_players.indexOf(n) != -1;
			});	
			return conflicting.length;
		});
		conflicts.push(m1_conflicts);
	});
	return conflicts;
}

function calc_conflicting_players(matches) {
	var res = {};
	matches.forEach(function(m1) {
		var players = calc_players(m1);
		players.forEach(function(player) {
			if (player in res) {
				res[player]++;
			} else {
				res[player] = 0;
			}
		});
	});
	return res;	
}

function calc_order(matches, match_names) {
	return match_names.map(function(match_name) {
		for (var i = 0;i < matches.length;i++) {
			if (matches[i].setup.match_name === match_name) {
				return i;
			}
		}
		throw new Error('Could not find match ' + match_name);
	});
}

function cost_rest2(order, conflicts, preferred) {
	var res = 0;
	for (var i = 0;i < order.length;i++) {
		// conflicts
		if (i - 2 >= 0) {
			res += 1000 * conflicts[order[i]][order[i - 2]];
		}
		if (i - 1 >= 0) {
			res += 10000 * conflicts[order[i]][order[i - 1]];
		}

		// preferred
		res += Math.abs(i - preferred.indexOf(order[i]));
	}
	return res;
}

// rest 2 matches, but first two matches are evaluated identically
function cost_rest2_2courts(order, conflicts, preferred) {
	var res = 0;
	for (var i = 0;i < order.length;i++) {
		var my_conflicts = conflicts[order[i]];

		if (i === 1) {
			res += 10000 * my_conflicts[order[0]];
		} else if (i === 2) {
			res += 10000 * (my_conflicts[order[0]] + my_conflicts[order[1]]);
		} else if (i === 3) {
			res += 1000 * (my_conflicts[order[0]] + my_conflicts[order[1]]);
			res += 10000 * my_conflicts[order[i - 1]];
		} else if (i > 0) {
			res += 10000 * my_conflicts[order[i - 1]];
			res += 1000 * my_conflicts[order[i - 2]];
		}

		// preferred
		res += Math.abs(i - preferred.indexOf(order[i]));
	}
	return res;
}

function cost_maxrest(order, conflicts, preferred) {
	var res = 0;
	for (var i = 0;i < order.length;i++) {
		var my_conflicts = conflicts[order[i]];
		for (var j = 1;i - j >= 0;j++) {
			var factor = (j === 1) ? 10000 : ((j === 2) ? 1000 : 500);
			res += factor * my_conflicts[order[i - j]];
		}

		// preferred
		res += Math.abs(i - preferred.indexOf(order[i]));
	}
	return res;
}

function cost_norest(order, conflicts, preferred) {
	var res = 0;
	for (var i = 0;i < order.length;i++) {
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
	var conflicts = calc_conflicts(matches);
	var match_count = matches.length;
	if (match_count < 1) {
		throw new Error('No matches to optimize');
	}

	var permutation = utils.range(match_count);
	var best_order = permutation.slice();
	var best_cost = costfunc(best_order, conflicts, preferred);

	// See https://en.wikipedia.org/wiki/Heap%27s_algorithm
	function permute_heap(n) {
		if (n === 1) {
			var cost = costfunc(permutation, conflicts, preferred);
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
	var result = document.querySelector('.order_result');
	utils.empty(result);

	if (state.event && state.event.matches) {
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
			ui_render();
		});
	}

}

var COSTFUNCS = {
	rest2: cost_rest2,
	rest2_2courts: cost_rest2_2courts,
	maxrest: cost_maxrest,
	norest: cost_norest,
};

function ui_render() {
	var result = document.querySelector('.order_result');
	utils.empty(result);
	utils.visible_qs('.order_loading-icon', true);
	var matches = state.event.matches;

	// Configure preferred order
	// By default prefer keeping current order
	var preferred = (
		state.event.preferred_order ?
		calc_order(matches, state.event.preferred_order) :
		utils.range(matches.length)
	);
	// TODO: Add more options here
	var preferred_str = preferred.map(function(idx) {
		return matches[idx].setup.match_name;
	}).join(' - ');
	utils.text_qs('.order_preferred', preferred_str);

	// Configure costfunc
	var costfunc_id = document.querySelector('#order_costfunc').value;
	var costfunc = COSTFUNCS[costfunc_id];

	var best_order = optimize(costfunc, matches, preferred);
	var best_matches = best_order.map(function(idx) {
		return matches[idx];
	});
	var colors = colorize(best_matches);

	best_matches.forEach(function(match) {
		var setup = match.setup;
		var li = utils.create_el(result, 'li', {});

		if (setup.match_name) {
			utils.create_el(li, 'span', {'class': 'order_match_name'}, setup.match_name);
		}

		function player_add_span(team_id, player_id) {
			var player_name = setup.teams[team_id].players[player_id].name;
			var col = colors[player_name];
			utils.create_el(li, 'span', {style: 'color: ' + (col ? col : '#ccc;') + ';'}, player_name);
		}	

		player_add_span(0, 0);
		if (setup.is_doubles) {
			utils.create_el(li, 'span', {'class': 'order_result_and'}, ' / ');
			player_add_span(0, 1);
		}
		utils.create_el(li, 'span', {'class': 'order_result_vs'}, ' - ');
		player_add_span(1, 0);
		if (setup.is_doubles) {
			utils.create_el(li, 'span', {'class': 'order_result_and'}, ' / ');
			player_add_span(1, 1);
		}
	});
	utils.visible_qs('.order_loading-icon', false);

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

	var black = document.querySelector('.order_layout');
	utils.on_click(black, function(e) {
		if (e.target === black) {
			hide();
		}
	});

	document.querySelector('#order_costfunc').addEventListener('change', ui_render);
}

return {
	hide: hide,
	show: show,
	ui_init: ui_init,
	// Testing only
	calc_order: calc_order,
	calc_conflicts: calc_conflicts,
	calc_conflicting_players: calc_conflicting_players,
	cost_rest2: cost_rest2,
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