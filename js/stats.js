var stats = (function() {
'use strict';

function svg_el(parent, tagName, attrs, text) {
	var el = parent.ownerDocument.createElementNS('http://www.w3.org/2000/svg', tagName);
	if (attrs) {
		for (var k in attrs) {
			el.setAttribute(k, attrs[k]);
		}
	}
	if (text) {
		el.appendChild(document.createTextNode(text));
	}
	parent.appendChild(el);
}

function render_graph(svg, s, all_gpoints) {
	// No let in current browsers, so declare these for all
	var gp;
	var i;

	if (all_gpoints.length === 0) {
		return;
	}
	var lines = svg.querySelector('.stats_graph_lines');
	utils.empty(lines);

	var timestamp_now = all_gpoints[0].timestamp;
	var normalized_now = 0;
	var game = all_gpoints[0].game;
	var score = all_gpoints[0].score;
	var max_score = 1;
	var gpoints = [];
	for (i = 0;i < all_gpoints.length;i++) {
		gp = all_gpoints[i];
		if (utils.deep_equal(gp.score, score)) {
			continue;
		}
		gpoints.push(gp);

		var duration = gp.timestamp - timestamp_now;
		if (gp.game > game) {
			gp.draw_line = false;
			duration = Math.min(duration, 200000);
		} else {
			gp.draw_line = (i > 0);
			duration = Math.min(duration, 300000);
		}
		duration = Math.max(3000, duration);
		
		normalized_now += duration;
		gp.normalized = normalized_now;
		timestamp_now = gp.timestamp;
		game = gp.game;
		score = gp.score;
		max_score = Math.max(max_score, Math.max(gp.score[0], gp.score[1]));
	}

	var grid = document.querySelector('.stats_graph_grid');
	utils.empty(grid);
	for (i = 0;i <= max_score;i++) {
		var grid_y = 95 - i * 90 / max_score;
		svg_el(grid, 'line', {
			'x1': 0,
			'x2': 300,
			'y1': grid_y,
			'y2': grid_y,
			'class': (i % 10 === 0) ? 'important' : '',
		});
	}

	var x = [5, 5];
	var y = [95, 95];
	for (i = 1;i < gpoints.length;i++) {
		gp = gpoints[i];
		var gpx = 5 + gp.normalized * 290 / normalized_now;
		for (var team = 0;team < 2;team++) {
			var gpy = 95 - gp.score[team] * 90 / max_score;

			if (gp.draw_line) {
				svg_el(lines, 'line', {
					'x1': x[team],
					'x2': gpx,
					'y1': y[team],
					'y2': y[team],
					'class': 'team' + team,
				});
				svg_el(lines, 'line', {
					'x1': gpx,
					'x2': gpx,
					'y1': y[team],
					'y2': gpy,
					'class': 'team' + team,
				});
			}

			x[team] = gpx;
			y[team] = gpy;
		}
	}
}

function calc_stats(s) {
	var all_games = s.match.finished_games.slice();
	all_games.push(s.game);

	var cols = all_games.map(function(game, i) {
		return {
			label: s._('stats:game').replace('{number}', (i+1)),
			points: game.score.join('-'),
			shuttles: 0,
			points_lr_ar: [0, 0],
			rally_lengths: [],
			serves: s.setup.is_doubles ? [[0, 0], [0, 0]] : [[0], [0]],
		};
	});

	var points_sum = [0, 0];
	all_games.forEach(function(game) {
		points_sum[0] += game.score[0];
		points_sum[1] += game.score[1];
	});
	var mstats = {
		label: s._('stats:match'),
		points: points_sum.join('-'),
		shuttles: s.match.shuttle_count,
		points_lr_ar: [0, 0],
		rally_lengths: [],
		serves: s.setup.is_doubles ? [[0, 0], [0, 0]] : [[0], [0]],
	};
	cols.push(mstats);

	var gpoints = [];
	var scopy = {
		initialized: s.initialized,
		settings: s.settings,
		lang: s.lang,
		_: s._,
	};
	calc.init_state(scopy, s.setup, s.presses);
	calc.undo(scopy);
	var presses = scopy.flattened_presses;
	calc.init_state(scopy, s.setup);
	calc.init_calc(scopy);

	for (var i = 0;i < presses.length;i++) {
		if (presses[i].timestamp) {
			gpoints.push({
				score: [0, 0],
				timestamp: presses[i].timestamp,
				game: 0,
			});
			break;
		}
	}
	presses.forEach(function(p) {
		var current_game_idx = scopy.match.finished_games.length;
		var current_game = cols[current_game_idx];

		switch (p.type) {
		case 'shuttle':
			current_game.shuttles++;
			break;
		case 'love-all':
			current_game.start_ts = p.timestamp;
			if (! mstats.start_ts) {
				mstats.start_ts = p.timestamp;
			}
			current_game.rally_start = p.timestamp;
			break;
		case 'injury-resume':
			current_game.rally_start = p.timestamp;
			break;
		case 'score':
			var server_team_id = scopy.game.team1_serving ? 0 : 1;

			current_game.points_lr_ar[p.side == 'left' ? 0 : 1]++;
			mstats.points_lr_ar[p.side == 'left' ? 0 : 1]++;
			if (!scopy.game.interval && current_game.rally_start) {
				var rally_length = p.timestamp - current_game.rally_start;
				current_game.rally_lengths.push(rally_length);
				mstats.rally_lengths.push(rally_length);

				var score = scopy.game.score;
				var score_str = score[server_team_id] + '-' + score[1 - server_team_id];
				if ((!current_game.longest_rally_length) || (rally_length > current_game.longest_rally_length)) {
					current_game.longest_rally_length = rally_length;
					current_game.longest_rally_desc = (
						utils.duration_secs(0, rally_length) +
						s._('stats:longest rally (game)').replace('{score}', score_str)
					);
				}
				if ((!mstats.longest_rally_length) || (rally_length > mstats.longest_rally_length)) {
					mstats.longest_rally_length = rally_length;
					mstats.longest_rally_desc = (
						utils.duration_secs(0, rally_length) +
						s._('stats:longest rally (match)').replace('{score}', score_str).replace('{game}', (current_game_idx + 1))
					);
				}
			}

			var server_player_id = 0;
			if (scopy.setup.is_doubles) {
				// Find out which of the players served
				var game = scopy.game;
				server_player_id = (game.teams_player1_even[server_team_id] == (game.score[server_team_id] % 2 === 0)) ? 0 : 1;
			}
			current_game.serves[server_team_id][server_player_id]++;
			mstats.serves[server_team_id][server_player_id]++;
			break;
		}
		current_game.last_ts = p.timestamp;
		mstats.last_ts = p.timestamp;

		calc.calc_press(scopy, p);

		if (p.timestamp) {
			gpoints.push({
				timestamp: p.timestamp,
				score: scopy.game.score.slice(),
				game: scopy.match.finished_games.length,
			});
		}

		switch (p.type) {
		case 'love-all':
		case 'score':
			current_game.rally_start = p.timestamp;
			break;
		}
	});

	cols.forEach(function(col) {
		if (col.last_ts && col.start_ts) {
			col.duration = utils.duration_secs(col.start_ts, col.last_ts);
		}
		col.points_lr = col.points_lr_ar.join('/');
		if (col.rally_lengths.length > 0) {
			col.avg_rally_length = utils.duration_secs(
				0, utils.sum(col.rally_lengths) / col.rally_lengths.length
			);
			col.longest_rally = utils.duration_secs(
				0, col.longest_rally_length
			);
		}

		col.serves.forEach(function(players, team_id) {
			players.forEach(function(player_serves, player_id) {
				col['serves_' + team_id + '_' + player_id] = player_serves;
			});
		});
	});

	var server_keys = (
		s.setup.is_doubles ?
		['serves_0_0', 'serves_0_1', 'serves_1_0', 'serves_1_1'] :
		['serves_0_0', 'serves_1_0']
	);
	var teams = s.setup.teams;
	var serve_labels = {
		serves_0_0: teams[0].players[0].name,
		serves_1_0: teams[1].players[0].name,
	};
	if (s.setup.is_doubles) {
		serve_labels.serves_0_1 = teams[0].players[1].name;
		serve_labels.serves_1_1 = teams[1].players[1].name;
	}
	var labels = {};
	for (var k in serve_labels) {
		labels[k] = s._('stats:serves').replace('{player_name}', serve_labels[k]);
	}

	var keys = [].concat(
		['points', 'points_lr'],
		server_keys,
		((!s.settings || s.settings.shuttle_counter) ? ['shuttles'] : []),
		['duration', 'avg_rally_length', 'longest_rally']
	);

	return {
		cols: cols,
		keys: keys,
		labels: labels,
		gpoints: gpoints,
	};
}

function render_table($table, stats) {
	var thead_tr = $table.find('thead>tr');
	thead_tr.children('th:not(:first-child)').remove();
	stats.cols.forEach(function(st) {
		var th = $('<th>');
		th.text(st.label);
		thead_tr.append(th);
	});

	var tbody = $table.find('tbody');
	tbody.empty();

	stats.keys.forEach(function(k) {
		var tr = $('<tr>');
		var th = $('<th>');
		tr.append(th);
		var label = stats.labels[k];
		if (!label) {
			label = state._('stats:' + k);
		}
		th.text(label);

		stats.cols.forEach(function(st) {
			var td = $('<td>');
			if (k === 'longest_rally') {
				td.attr('title', st.longest_rally_desc);
			}
			tr.append(td);
			td.text(st[k]);
		});

		tbody.append(tr);
	});
}

function show() {
	if (state.ui.stats_visible) {
		return;
	}
	uiu.esc_stack_push(hide);

	state.ui.stats_visible = true;
	control.set_current(state);	
	$('.stats_layout').show();

	var match_name = '';
	if (state.setup.match_name) {
		match_name += '(' + state.setup.match_name + ') ';
	}
	if (state.setup.is_doubles) {
		match_name += state.setup.teams[0].players[0].name + ' / ' + state.setup.teams[0].players[1].name + ' - ' + state.setup.teams[1].players[0].name + ' / ' + state.setup.teams[1].players[1].name;
	} else {
		match_name += state.setup.teams[0].players[0].name + ' - ' + state.setup.teams[1].players[0].name;
	}
	$('.stats_match_name').text(match_name);

	var stats = calc_stats(state);
	var table = $('.stats_table');
	render_table(table, stats);
	render_graph(document.querySelector('.stats_graph'), state, stats.gpoints);
}

function hide() {
	if (! state.ui.stats_visible) {
		return;
	}

	uiu.esc_stack_pop();
	$('.stats_layout').hide();
	state.ui.stats_visible = false;
	control.set_current(state);	
}


function ui_init() {
	$('.postmatch_stats_button').on('click', show);
	$('.stats_layout').on('click', function(e) {
		if (e.target === this) {
			hide();
		}
	});
	$('.stats_back').on('click', function(e) {
		e.preventDefault();
		hide();
		return false;
	});
}

return {
	hide: hide,
	show: show,
	ui_init: ui_init,
	calc_stats: calc_stats,
	render_table: render_table,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var utils = require('./utils');
	var control = require('./control');
	var uiu = require('./uiu');

	module.exports = stats;
}
/*/@DEV*/