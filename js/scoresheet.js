var scoresheet = (function() {
'use strict';

function _svg_align_vcenter(text, vcenter) {
	var bbox = text.getBBox();
	var text_center = bbox.y + bbox.height / 2;
	var y_str = text.getAttribute('y');
	var cur_y = (y_str) ? parseFloat(text.getAttribute('y')) : 0;
	text.setAttribute('y', cur_y - (text_center - vcenter));
}

function _svg_align_hcenter(text, hcenter) {
	var bbox = text.getBBox();
	var text_center = bbox.x + bbox.width / 2;
	var x_str = text.getAttribute('x');
	var cur_x = (x_str) ? parseFloat(text.getAttribute('x')) : 0;
	text.setAttribute('x', cur_x - (text_center - hcenter));
}

function _svg_el(tagName, attrs, parent, text) {
	var el = document.createElementNS('http://www.w3.org/2000/svg', tagName);
	for (var key in attrs) {
		if (attrs.hasOwnProperty(key)) {
			el.setAttribute(key, attrs[key]);
		}
	}
	if ((text !== undefined) && (text !== null) && (text !== '')) {
		el.appendChild(document.createTextNode(text));
	}
	parent.appendChild(el);
	return el;
}

function _layout(games, col_count) {
	var table_idx = 0;
	var cells = [];
	games.forEach(function(game) {
		var max_table = table_idx;
		var max_col = 0;
		game.cells.forEach(function(cell) {
			var cell_width = (typeof cell.width == 'number') ? cell.width : 1;
			var rightmost_col = cell.col + cell_width - 1;
			if (cell.col >= 0) {
				cell.table = table_idx + Math.floor(rightmost_col / col_count);
				rightmost_col = Math.max(cell_width - 1, rightmost_col % col_count);
				cell.col = rightmost_col - cell_width + 1;
			} else {
				cell.table = table_idx;
			}
			if (cell.table > max_table) {
				max_table = cell.table;
				max_col = rightmost_col;
			} else {
				max_col = Math.max(max_col, rightmost_col);
			}
			cells.push(cell);
		});

		if (game.circle && game.circle != 'suppressed') {
			var CIRCLE_SIZE = 3;
			var CIRCLE_SMALL_SIZE = 2;
			var width;
			if (max_col + CIRCLE_SMALL_SIZE >= col_count) {
				// Result into next table
				max_col = -1;
				max_table++;
				width = CIRCLE_SIZE;
			} else {
				width = (max_col + CIRCLE_SIZE >= col_count) ? CIRCLE_SMALL_SIZE: CIRCLE_SIZE;
				max_col = Math.min(max_col + 2, col_count - width - 1);
			}

			cells.push({
				table: max_table,
				col: max_col + 1,
				type: 'circle',
				score: game.circle,
				width: width,
			});
		}

		table_idx = max_table + 1;
	});
	return cells;
}

function _clean_editmode(s) {
	while (s.scoresheet_game.cells.length > 0 && s.scoresheet_game.cells[s.scoresheet_game.cells.length - 1].editmode_related) {
		var c = s.scoresheet_game.cells.pop();
		s.scoresheet_game.col_idx = c.col;
	}
}

function _parse_match(state, col_count) {
	function _make_scoresheet_game() {
		return {
			score: [0, 0],
			servers: [null, null],
			serving_team: null,
			cells: [],
			col_idx: 0,
			reached_20_all: false,
			finished: false,
			circle: null,
		};
	}

	var s = {
		initialized: state.initialized,
		scoresheet_game: _make_scoresheet_game(),
		scoresheet_games: [],
	};
	calc.init_state(s, state.setup);
	s.presses = state.presses;
	calc.init_calc(s);
	calc.undo(s);
	s.flattened_presses.forEach(function(press) {
		// Since using "let" would break on a lot of browser, define these variables here
		var score_team;
		var prev_cell;
		var row;

		function _loveall(extra_attrs) {
			var cell = {
				type: 'score',
				col: s.scoresheet_game.col_idx,
				row: 2 * s.scoresheet_game.serving_team + s.scoresheet_game.servers[s.scoresheet_game.serving_team],
				val: s.game.score[s.scoresheet_game.serving_team],
			};
			if (extra_attrs) {
				utils.obj_update(cell, extra_attrs);
			}
			s.scoresheet_game.cells.push(cell);
			var receiving_team = 1 - s.scoresheet_game.serving_team;
			var receiver_row = (
				2 * receiving_team +
				(s.setup.is_doubles ? s.scoresheet_game.servers[receiving_team] : 0)
			);
			cell = {
				type: 'score',
				col: s.scoresheet_game.col_idx,
				row: receiver_row,
				val: s.game.score[1 - s.scoresheet_game.serving_team],
			};
			if (extra_attrs) {
				utils.obj_update(cell, extra_attrs);
			}
			s.scoresheet_game.cells.push(cell);
			s.scoresheet_game.col_idx++;
		}

		switch (press.type) {
		case 'pick_server':
			s.scoresheet_game.servers[press.team_id] = press.player_id;
			if (! s.setup.is_doubles) {
				s.scoresheet_game.servers[1 - press.team_id] = 0;
			}
			s.scoresheet_game.serving_team = press.team_id;

			s.scoresheet_game.cells.push({
				col: -1,
				row: press.team_id * 2 + press.player_id,
				val: 'A'
			});
			break;
		case 'pick_receiver':
			if (s.setup.is_doubles) {
				s.scoresheet_game.servers[press.team_id] = press.player_id;
			}
			s.scoresheet_game.cells.push({
				col: -1,
				row: 2 * press.team_id + press.player_id,
				val: 'R'
			});
			break;
		case 'love-all':
			_loveall();
			break;
		case 'postgame-confirm':
			s.scoresheet_games.push(s.scoresheet_game);
			s.scoresheet_game = _make_scoresheet_game();

			if (! s.setup.is_doubles) {
				s.scoresheet_game.servers = [0, 0];
				s.scoresheet_game.serving_team = s.game.team1_won ? 0 : 1;
				s.scoresheet_game.cells.push({
					col: -1,
					row: 2 * s.scoresheet_game.serving_team,
					val: 'A'
				});
			}
			// In doubles we'll get future pick-server and pick-receiver events
			break;
		case 'score':
			score_team = (s.game.team1_left == (press.side == 'left')) ? 0 : 1;
			if (s.game.team1_serving != (score_team === 0)) {
				// Service over
				if (s.setup.is_doubles) {
					s.scoresheet_game.servers[score_team] = 1 - s.scoresheet_game.servers[score_team];
				}
			}
			s.scoresheet_game.cells.push({
				col: s.scoresheet_game.col_idx,
				row: 2 * score_team + s.scoresheet_game.servers[score_team],
				val: s.game.score[score_team] + 1,
				type: 'score',
			});
			s.scoresheet_game.col_idx++;
			break;
		case 'red-card':
			if (! s.game.finished) {
				score_team = 1 - press.team_id;
				if (s.game.team1_serving != (score_team === 0)) {
					// Service over
					if (s.setup.is_doubles) {
						s.scoresheet_game.servers[score_team] = 1 - s.scoresheet_game.servers[score_team];
					}
				}
				s.scoresheet_game.cells.push({
					col: s.scoresheet_game.col_idx,
					row: 2 * score_team + s.scoresheet_game.servers[score_team],
					type: 'score',
					val: s.game.score[score_team] + 1,
				});
			}
			s.scoresheet_game.cells.push({
				col: s.scoresheet_game.col_idx,
				row: 2 * press.team_id + press.player_id,
				val: press.char,
			});
			s.scoresheet_game.col_idx++;
			break;
		}
		
		calc.calc_press(s, press);

		switch (press.type) {
		case 'injury':
			s.scoresheet_game.cells.push({
				col: s.scoresheet_game.col_idx,
				row: 2 * press.team_id + press.player_id,
				val: press.char,
			});
			s.scoresheet_game.col_idx++;
			break;
		case 'overrule':
			var found = false;
			for (var i = s.scoresheet_game.cells.length - 1;i >= 0;i--) {
				prev_cell = s.scoresheet_game.cells[i];
				if (prev_cell.type == 'score') {
					s.scoresheet_game.cells.push({
						row: ({0:1, 1:0, 2: 3, 3:2})[prev_cell.row],
						col: prev_cell.col,
						val: press.char,
					});
					found = true;
					break;
				}
			}
			if (! found) {
				s.scoresheet_game.cells.push({
					row: 1,
					col: s.scoresheet_game.col_idx,
					val: press.char,
				});
				s.scoresheet_game.col_idx++;
			}

			break;
		case 'referee':
			// Guess row
			row = 1;
			if (s.scoresheet_game.cells.length > 0) {
				prev_cell = s.scoresheet_game.cells[s.scoresheet_game.cells.length - 1];
				if ((typeof prev_cell.val == 'string') && (typeof prev_cell.row == 'number')) {
					row = prev_cell.row;
				}
			}

			s.scoresheet_game.cells.push({
				row: row,
				col: s.scoresheet_game.col_idx,
				val: press.char,
			});
			s.scoresheet_game.col_idx++;
			break;
		case 'interruption':
			s.scoresheet_game.cells.push({
				row: 1,
				col: s.scoresheet_game.col_idx,
				val: press.char,
			});
			s.scoresheet_game.col_idx++;
			break;
		case 'correction':
			for (var search_col_idx = s.scoresheet_game.cells.length - 1;search_col_idx >= 0;search_col_idx--) {
				prev_cell = s.scoresheet_game.cells[search_col_idx];
				if (prev_cell.type == 'score') {
					if ((prev_cell.row < 2) == (press.team_id === 0)) {
						// server's mistake
						row = ({0:1, 1:0, 2:3, 3:2})[prev_cell.row];
					} else {
						// receiver's mistake
						row = ({0:3, 1:3, 2:0, 3:0})[prev_cell.row];
					}
					s.scoresheet_game.cells.push({
						row: row,
						col: prev_cell.col,
						val: press.char,
					});
					found = true;
					break;
				}
			}
			if (! found) {
				s.scoresheet_game.cells.push({
					row: 1,
					col: s.scoresheet_game.col_idx,
					val: press.char,
				});
				s.scoresheet_game.col_idx++;
			}
			break;
		case 'yellow-card':
			s.scoresheet_game.cells.push({
				row: 2 * press.team_id + press.player_id,
				col: s.scoresheet_game.col_idx,
				val: press.char,
			});
			s.scoresheet_game.col_idx++;
			break;
		case 'retired':
			s.scoresheet_game.cells.push({
				row: 2 * press.team_id + press.player_id,
				col: s.scoresheet_game.col_idx,
				val: press.char,
			});
			s.scoresheet_game.circle = 'suppressed';
			s.scoresheet_game.col_idx++;
			break;
		case 'disqualified':
			var cell = {
				type: 'longtext',
				row: 2 * press.team_id + press.player_id,
				col: s.scoresheet_game.col_idx,
				val: 'Disqualifiziert',
				width: 4,
			};
			s.scoresheet_game.circle = 'suppressed';
			s.scoresheet_game.cells.push(cell);
			s.scoresheet_game.col_idx += cell.width;
			break;
		case 'editmode_set-score':
			_clean_editmode(s);
			s.scoresheet_game.cells.push({
				col: s.scoresheet_game.col_idx,
				type: 'editmode-sign',
				editmode_related: true,
			});
			if (s.scoresheet_game.serving_team !== null) {
				_loveall({editmode_related: true});
			}
			break;
		}

		if ((s.game.score[0] == 20) && (s.game.score[1] == 20) && !s.scoresheet_game.reached_20_all) {
			s.scoresheet_game.reached_20_all = true;
			s.scoresheet_game.cells.push({
				col: s.scoresheet_game.col_idx,
				type: 'dash',
			});
			s.scoresheet_game.col_idx++;
		}

		if (s.game.finished && !s.scoresheet_game.circle && s.game.won_by_score) {
			s.scoresheet_game.circle = s.game.score;
		}
	});

	if (s.scoresheet_game.cells.length > 0) {
		s.scoresheet_games.push(s.scoresheet_game);
	}

	return _layout(s.scoresheet_games, col_count);
}

function ui_show() {
	if (!state.initialized) {
		return; // Called on start with Shift+S
	}

	if (typeof jsPDF != 'undefined') {
		jspdf_loaded();
	}

	function _text(search, str) {
		if (!str) {
			str = '';
		}
		$(search).text(str);
	}

	// Show SVG before modifying it, otherwise getBBox won't work
	var settings_visible = $('#settings_wrapper').is(':visible');
	$('.scoresheet_container').attr('data-settings-visible', settings_visible ? 'true' : 'false');
	if (settings_visible) {
		$('#settings_wrapper').hide();
	}
	$('#game').hide();
	$('.scoresheet_container').show();
	ui_esc_stack_push(ui_hide);

	// Set text fields
	_text('.scoresheet_tournament_name', state.setup.tournament_name);

	// Special handling for event name
	var tname_bbox = $('.scoresheet_tournament_name')[0].getBBox();
	$('.scoresheet_event_name').attr('x', tname_bbox.x + tname_bbox.width + 4);
	var event_name = state.setup.event_name;
	if (!event_name && state.setup.team_competition && state.setup.teams[0].name && state.setup.teams[1].name) {
		event_name = state.setup.teams[0].name + ' - ' + state.setup.teams[1].name;
	}
	_text('.scoresheet_event_name', event_name);


	_text('.scoresheet_match_name', state.setup.match_name);
	_text('.scoresheet_date_value', utils.human_date_str(state.metadata.start));

	_text('.scoresheet_court_id', settings.court_id);
	_text('.scoresheet_umpire_name', settings.umpire_name);

	_text('.scoresheet_begin_value', state.metadata.start ? utils.time_str(state.metadata.start) : '');
	if (state.match.finished) {
		_text('.scoresheet_end_value', state.metadata.updated ? utils.time_str(state.metadata.updated) : '');
		_text('.scoresheet_duration_value', state.metadata.updated ? utils.duration_str(state.metadata.start, state.metadata.updated) : '');
	} else {
		_text('.scoresheet_end_value', null);
		_text('.scoresheet_duration_value', null);
	}

	_text('.scoresheet_results_team1_player1', state.setup.teams[0].players[0].name);
	_text('.scoresheet_results_team1_player2', state.setup.is_doubles ? state.setup.teams[0].players[1].name : '');
	_text('.scoresheet_results_team1_name', state.setup.teams[0].name);
	_text('.scoresheet_results_team2_player1', state.setup.teams[1].players[0].name);
	_text('.scoresheet_results_team2_player2', state.setup.is_doubles ? state.setup.teams[1].players[1].name: '');
	_text('.scoresheet_results_team2_name', state.setup.teams[1].name);

	$('.scoresheet_results_circle_team1').attr('visibility',
		(state.match.finished && state.match.team1_won) ? 'visible' : 'hidden');
	$('.scoresheet_results_circle_team2').attr('visibility',
		(state.match.finished && !state.match.team1_won) ? 'visible' : 'hidden');

	var shuttle_counter_active = (typeof state.match.shuttle_count == 'number');
	$('.scoresheet_shuttle_counter').attr('visibility', shuttle_counter_active ? 'visible' : 'hidden');
	_text('.scoresheet_shuttle_counter_value', state.match.shuttle_count ? state.match.shuttle_count : '');

	var side1_str = '';
	var side2_str = '';
	var first_game = null;
	if (state.match && state.match.finished_games.length > 0) {
		first_game = state.match.finished_games[0];
	} else {
		first_game = state.game;
	}
	if (first_game && first_game.start_team1_left !== undefined) {
		if (first_game.start_team1_left) {
			side1_str = 'L';
			side2_str = 'R';
		} else {
			side1_str = 'R';
			side2_str = 'L';
		}
	}
	_text('.scoresheet_results_team1_side', side1_str);	
	_text('.scoresheet_results_team2_side', side2_str);	

	if (state.match) {
		var all_finished_games = state.match.finished_games.slice();
		if (state.match.finished) {
			all_finished_games.push(state.game);
		}

		all_finished_games.forEach(function(g, i) {
			$('.scoresheet_results_team1_score' + (i + 1)).text(g.score[0]);
			$('.scoresheet_results_team2_score' + (i + 1)).text(g.score[1]);
		});
	}

	// Big table(s)
	var all_players;
	if (state.setup.is_doubles) {
		all_players = [
			state.setup.teams[0].players[0],
			state.setup.teams[0].players[1],
			state.setup.teams[1].players[0],
			state.setup.teams[1].players[1]
		];
	} else {
		all_players = [
			state.setup.teams[0].players[0],
			null,
			state.setup.teams[1].players[0],
			null,
		];
	}

	var SCORESHEET_COL_COUNT = 35;
	var cells = _parse_match(state, SCORESHEET_COL_COUNT);
	var $t = $('.scoresheet_table_container');
	$t.empty();
	var t = $t[0];

	var padding_left = 0.5;
	var table_left = 15;
	var table_height = 21;
	var table_width = 297 - table_left * 2;
	var cols_left = 59;
	var cell_width = (table_width - (cols_left - table_left)) / SCORESHEET_COL_COUNT;
	var cell_height = table_height / 4;
	for (var table_idx = 0;table_idx < 6;table_idx++) {
		// Due to absence of let, declare vars here
		var text;

		var table_top = 57 + 22 * table_idx;


		_svg_el('rect', {
			'class': 'shade',
			'x': table_left,
			'y': table_top + table_height / 2,
			'width': table_width,
			'height': table_height / 2,
		}, t);

		_svg_el('rect', {
			'class': 'table',
			'x': table_left,
			'y': table_top,
			'width': table_width,
			'height': table_height,
		}, t);

		// Horizontal lines
		_svg_el('line', {
			'class': 'table_line',
			'x1': table_left,
			'x2': table_left + table_width,
			'y1': table_top + cell_height,
			'y2': table_top + cell_height,
		}, t);
		_svg_el('line', {
			'class': 'table_thick-line',
			'x1': table_left,
			'x2': table_left + table_width,
			'y1': table_top + 2 * cell_height,
			'y2': table_top + 2 * cell_height,
		}, t);
		_svg_el('line', {
			'class': 'table_line',
			'x1': table_left,
			'x2': table_left + table_width,
			'y1': table_top + 3 * cell_height,
			'y2': table_top + 3 * cell_height,
		}, t);

		// First vertical divider line for Server/Receiver marks
		_svg_el('line', {
			'class': 'table_line',
			'x1': cols_left - cell_width,
			'x2': cols_left - cell_width,
			'y1': table_top,
			'y2': table_top + table_height,
		}, t);

		_svg_el('line', {
			'class': 'table_thick-line',
			'x1': cols_left,
			'x2': cols_left,
			'y1': table_top,
			'y2': table_top + table_height,
		}, t);

		for (var player_idx = 0;player_idx < all_players.length;player_idx++) {
			var player = all_players[player_idx];
			if (! player) {
				return;
			}

			text = _svg_el('text', {
				'class': 'table_name',
				'x': table_left + padding_left,
			}, t, player.name);
			_svg_align_vcenter(text, table_top + player_idx * cell_height + cell_height / 2);
		}

		for (var i = 1;i < SCORESHEET_COL_COUNT;i++) {
			_svg_el('line', {
				'class': 'table_line',
				'x1': cols_left + i * cell_width,
				'x2': cols_left + i * cell_width,
				'y1': table_top,
				'y2': table_top + table_height,
			}, t);
		}
	}

	cells.forEach(function(cell) {
		var table_top = 57 + 22 * cell.table;

		switch (cell.type) {
		case 'dash':
			_svg_el('line', {
				'class': 'table_20all_dash',
				'x1': cols_left + cell.col * cell_width,
				'x2': cols_left + cell.col * cell_width + cell_width,
				'y1': table_top + table_height,
				'y2': table_top,
			}, t);
			break;
		case 'circle':
			var cx = cols_left + cell.col * cell_width + cell.width * cell_width / 2;
			var cy = table_top + table_height / 2;
			var rx = 1.8 * cell_width / 2;
			var ry = 0.94 * table_height / 2;
			_svg_el('ellipse', {
				'class': 'table_game_result',
				'cx': cx,
				'rx': rx,
				'cy': cy,
				'ry': ry,
			}, t);

			var ANGLE = 7;
			_svg_el('line', {
				'class': 'table_game_result',
				'x1': cx - rx * Math.cos(ANGLE * Math.PI / 180),
				'x2': cx + rx * Math.cos(ANGLE * Math.PI / 180),
				'y1': cy + ry * Math.sin(ANGLE * Math.PI / 180),
				'y2': cy - ry * Math.sin(ANGLE * Math.PI / 180),
			}, t);

			var TEXT_CENTER_FACTOR = 0.35;
			var text = _svg_el('text', {}, t, cell.score[0]);
			var cx_top = cx + TEXT_CENTER_FACTOR * rx * Math.cos((90 + ANGLE) * Math.PI / 180);
			var cy_top = cy - TEXT_CENTER_FACTOR * ry * Math.sin((90 + ANGLE) * Math.PI / 180);
			_svg_align_vcenter(text, cy_top);
			_svg_align_hcenter(text, cx_top);

			text = _svg_el('text', {}, t, cell.score[1]);
			var cx_bottom = cx - TEXT_CENTER_FACTOR * rx * Math.cos((90 + ANGLE) * Math.PI / 180);
			var cy_bottom = cy + TEXT_CENTER_FACTOR * ry * Math.sin((90 + ANGLE) * Math.PI / 180);
			_svg_align_vcenter(text, cy_bottom);
			_svg_align_hcenter(text, cx_bottom);

			break;
		case 'longtext':
			var bg = _svg_el('rect', {
				'class': ((cell.row > 1) ? 'table_longtext_background shaded' : 'table_longtext_background'),
			}, t);

			text = _svg_el('text', {
				'x': cols_left + cell.col * cell_width + padding_left,
			}, t, cell.val);
			_svg_align_vcenter(text, table_top + cell.row * cell_height + cell_height / 2);

			var padding = 0.3;
			var bb = text.getBBox();
			bg.setAttribute('x', bb.x);
			bg.setAttribute('y', bb.y + padding);
			bg.setAttribute('width', bb.width);
			bg.setAttribute('height', bb.height - 2 * padding);
			break;
		case 'editmode-sign':
			var EDITMODE_SIGN_LINE_COUNT = 15;
			var EDITMODE_SIGN_XR = 0.15;
			var cell_left = cols_left + cell.col * cell_width;
			var sign_top = table_top;
			var sign_height = 4 * cell_height;
			var path_data = 'M ' + (cell_left - EDITMODE_SIGN_XR * cell_width) + ' ' + sign_top + ' L';
			for (var i = 0;i < EDITMODE_SIGN_LINE_COUNT;i++) {
				path_data += ' ' + (cell_left + ((i % 2 == 1) ? -1 : 1) * EDITMODE_SIGN_XR * cell_width) + ' ' + (sign_top + sign_height * (i + 1) / EDITMODE_SIGN_LINE_COUNT);
			}
			_svg_el('path', {
				'class': 'editmode-sign',
				'd': path_data
			}, t);
			break;
		case 'score':
			/* falls through */
		case 'text':
			/* falls through */
		default:
			text = _svg_el('text', {
				'x': cols_left + cell.col * cell_width + cell_width / 2,
				'text-anchor': 'middle',
			}, t, cell.val);
			_svg_align_vcenter(text, table_top + cell.row * cell_height + cell_height / 2);
		}
	});
}

function ui_hide() {
	ui_esc_stack_pop();
	$('.scoresheet_container').hide();
	$('#game').show();
	if ($('.scoresheet_container').attr('data-settings-visible') === 'true') {
		$('#settings_wrapper').show();
	}
}

function _svg_to_pdf(svg, pdf) {
	var nodes = svg.querySelectorAll('*');
	for (var i = 0;i < nodes.length;i++) {
		// Due to absence of let, declare vars here
		var x;
		var y;
		var m;

		var n = nodes[i];
		var style = window.getComputedStyle(n);

		if (style.visibility === 'hidden') {
			continue;
		}

		var mode = '';
		if (style.fill != 'none') {
			m = style.fill.match(/^rgb\(([0-9]+),\s*([0-9]+),\s*([0-9]+)\)|\#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
			var r = 0;
			var g = 0;
			var b = 0;
			if (m && m[1]) {
				r = parseInt(m[1], 10);
				g = parseInt(m[2], 10);
				b = parseInt(m[3], 10);
			} else if (m && m[4]) {
				r = parseInt(m[4], 16);
				g = parseInt(m[5], 16);
				b = parseInt(m[6], 16);
			}
			pdf.setFillColor(r, g, b);
			mode += 'F';
		}
		if (style.stroke != 'none') {
			var stroke_width = parseFloat(style['stroke-width']);
			pdf.setLineWidth(stroke_width);

			if (stroke_width > 0) {
				mode += 'D';
			}
		}

		switch (n.tagName.toLowerCase()) {
		case 'line':
			var x1 = parseFloat(n.getAttribute('x1'));
			var x2 = parseFloat(n.getAttribute('x2'));
			var y1 = parseFloat(n.getAttribute('y1'));
			var y2 = parseFloat(n.getAttribute('y2'));

			m = style['stroke-dasharray'].match(/^([0-9.]+)\s*px,\s*([0-9.]+)\s*px$/);
			if (m) {
				var dash_len = parseFloat(m[1]);
				var gap_len = parseFloat(m[2]);
				x = x1;
				y = y1;

				// Normalize vector
				var vector_len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
				var dx = (x2 - x1) / vector_len;
				var dy = (y2 - y1) / vector_len;
				var remaining_len = vector_len;
				while (remaining_len > 0) {
					dash_len = Math.min(dash_len, remaining_len);
					var next_x = x + dx * dash_len;
					var next_y = y + dy * dash_len;
					pdf.line(x, y, next_x, next_y);
					remaining_len -= dash_len;
					x = next_x + dx * gap_len;
					y = next_y + dy * gap_len;
					remaining_len -= gap_len;
				}
			} else {
				pdf.line(x1, y1, x2, y2);
			}
			break;
		case 'rect':
			x = parseFloat(n.getAttribute('x'));
			y = parseFloat(n.getAttribute('y'));
			var width = parseFloat(n.getAttribute('width'));
			var height = parseFloat(n.getAttribute('height'));
			pdf.rect(x, y, width, height, mode);
			break;
		case 'ellipse':
			var cx = parseFloat(n.getAttribute('cx'));
			var cy = parseFloat(n.getAttribute('cy'));
			var rx = parseFloat(n.getAttribute('rx'));
			var ry = parseFloat(n.getAttribute('ry'));
			pdf.ellipse(cx, cy, rx, ry, mode);
			break;
		case 'path':
			m = /^M\s*([0-9.]+)\s+([0-9.]+)\s+L\s*((?:[0-9.]+\s+[0-9.]+(?:$|\s+))+)$/.exec(n.getAttribute('d'));
			if (m) {
				x = parseFloat(m[1]);
				y = parseFloat(m[2]);

				var lines = m[3].split(/\s+/).map(parseFloat);
				for (var j = 0;j < lines.length;j+=2) {
					pdf.line(x, y, lines[j], lines[j+1]);
					x = lines[j];
					y = lines[j+1];
				}
			}
			break;
		case 'text':
			x = parseFloat(n.getAttribute('x'));
			y = parseFloat(n.getAttribute('y'));

			switch (style['text-anchor']) {
			case 'middle':
				x -= n.getBBox().width / 2;
				break;
			case 'end':
				x -= n.getBBox().width;
				break;
			}

			pdf.setFontStyle((style['font-weight'] == 'bold') ? 'bold' : 'normal');
			pdf.setFontSize(72 / 25.4 * parseFloat(style['font-size']));

			var str = $(n).text();
			pdf.text(x, y, str);
			break;
		}
	}
}

function _match_title(s, sep) {
	var title = utils.date_str(state.metadata.start) + ' ';
	if (state.setup.match_name) {
		title += state.setup.match_name + ' ';
	}
	if (state.setup.is_doubles) {
		title += state.setup.teams[0].players[0].name + sep + state.setup.teams[0].players[1].name + ' vs ' + state.setup.teams[1].players[0].name + sep + state.setup.teams[1].players[1].name;
	} else {
		title += state.setup.teams[0].players[0].name + ' vs ' + state.setup.teams[1].players[0].name;
	}
	return title;
}

function ui_pdf() {
	var pdf = new jsPDF({
		orientation: 'landscape',
		unit: 'mm',
		format: 'a4',
		autoAddFonts: false,
	});
	pdf.addFont('Helvetica', 'helvetica', 'normal');
	pdf.addFont('Helvetica-Bold', 'helvetica', 'bold');
	pdf.setFont('helvetica', 'normal');

	_svg_to_pdf(document.getElementsByClassName('scoresheet')[0], pdf);

	var props = {
		title: _match_title(state, '/'),
		subject: 'Schiedsrichterzettel',
		creator: 'bup (https://github.com/phihag/bup/)'
	};
	if (state.setup.umpire && state.setup.umpire.name) {
		props.author = state.setup.umpire.name;
	}
	pdf.setProperties(props);

	pdf.save(_match_title(state, ',') + '.pdf');
}

function jspdf_loaded() {
	document.querySelector('.scoresheet_button_pdf').removeAttribute('disabled');
}

function ui_init() {
	$('.postmatch_scoresheet_button').on('click', ui_show);
	$('.scoresheet_button').on('click', ui_show);
	$('.scoresheet_button_pdf').on('click', ui_pdf);
	$('.scoresheet_button_back').on('click', ui_hide);
	$('.scoresheet_button_print').on('click', function() {
		window.print();
	});

}

return {
	jspdf_loaded: jspdf_loaded,
	ui_init: ui_init,
	ui_hide: ui_hide,
	ui_show: ui_show,
	// For testing only
	_parse_match: _parse_match,
};

})();

if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var utils = require('./utils');

	module.exports = scoresheet;
}
