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

function _layout(games, col_count, notes) {
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

	var row_idx = 0;
	notes.forEach(function(note) {
		cells.push({
			table: table_idx,
			row: row_idx,
			type: 'note',
			val: note,
		});

		row_idx++;
		if (row_idx > 3) {
			row_idx = 0;
			table_idx++;
		}
	});

	return cells;
}

function _clean_editmode(sgame) {
	while (sgame.cells.length > 0 && sgame.cells[sgame.cells.length - 1].editmode_related) {
		var c = sgame.cells.pop();
		sgame.col_idx = c.col;
	}
}

function _loveall(s, game, sgame, extra_attrs) {
	var serving_team = (sgame.serving_team === null) ? 0 : sgame.serving_team;
	var server_row = (
		((sgame.serving_team === null) || (sgame.servers[serving_team] === null)) ?
		0 :
		2 * sgame.serving_team + sgame.servers[sgame.serving_team]
	);

	var cell = {
		type: 'score',
		col: sgame.col_idx,
		row: server_row,
		val: game.score[serving_team],
	};
	if (extra_attrs) {
		utils.obj_update(cell, extra_attrs);
	}
	sgame.cells.push(cell);
	var receiving_team = 1 - serving_team;
	var receiver_row = (
		((sgame.serving_team === null) || (sgame.servers[receiving_team] === null)) ?
		2 :
		2 * receiving_team + (s.setup.is_doubles ? sgame.servers[receiving_team] : 0)
	);
	cell = {
		type: 'score',
		col: sgame.col_idx,
		row: receiver_row,
		val: game.score[1 - sgame.serving_team],
	};
	if (extra_attrs) {
		utils.obj_update(cell, extra_attrs);
	}
	sgame.cells.push(cell);
	sgame.col_idx++;
}

function _correct_editmode_score(sgame, incorrect_row, correct_row) {
	for (var i = sgame.cells.length - 1;i >= 0;i--) {
		var cell = sgame.cells[i];
		if (cell.type != 'score') {
			continue;
		}
		if (!cell.editmode_related) {
			break;
		}
		if (cell.row == incorrect_row) {
			cell.row = correct_row;
			break;
		}
	}
}

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

function _after_injuries(s, press) {
	s.scoresheet_injuries.forEach(function(si) {
		s.scoresheet_game.cells.push({
			type: 'vertical-text',
			col: si.cell.col,
			row: ((si.cell.row < 2) ? 2.5 : 0.5),
			val: utils.duration_secs(si.press.timestamp, press.timestamp),
		});
	});
	s.scoresheet_injuries = [];
}

function _parse_match(state, col_count) {
	var s = {
		initialized: state.initialized,
		scoresheet_game: _make_scoresheet_game(),
		scoresheet_games: [],
		scoresheet_injuries: [],
		settings: state.settings,
		lang: state.lang,
		_: state._,
	};
	var notes = [];

	calc.init_state(s, state.setup);
	s.presses = state.presses;
	calc.init_calc(s);
	calc.undo(s);
	s.flattened_presses.forEach(function(press) {
		// Since using "let" would break on a lot of browser, define these variables here
		var score_team;
		var prev_cell;
		var row;

		switch (press.type) {
		case 'pick_server':
			_correct_editmode_score(
				s.scoresheet_game,
				press.team_id * 2 + (1 - press.player_id),
				press.team_id * 2 + press.player_id);

			s.scoresheet_game.servers[press.team_id] = press.player_id;
			if (! s.setup.is_doubles) {
				s.scoresheet_game.servers[1 - press.team_id] = 0;
			}
			s.scoresheet_game.serving_team = press.team_id;

			s.scoresheet_game.cells.push({
				col: -1,
				row: press.team_id * 2 + press.player_id,
				val: s._('scoresheet:server'),
			});
			break;
		case 'pick_receiver':
			if (s.setup.is_doubles) {
				s.scoresheet_game.servers[press.team_id] = press.player_id;
				_correct_editmode_score(
					s.scoresheet_game,
					press.team_id * 2 + (1 - press.player_id),
					press.team_id * 2 + press.player_id);
			}
			s.scoresheet_game.cells.push({
				col: -1,
				row: 2 * press.team_id + press.player_id,
				val: s._('scoresheet:receiver'),
			});
			break;
		case 'love-all':
			_loveall(s, s.game, s.scoresheet_game);
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
					val: s._('scoresheet:server'),
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
				if (s.game.started || (s.match.finished_games.length > 0)) { // Not before match
					// See RTTO 3.7.7:
					// Misconduct before and after the match (...)
					// shall have no effect on the score of the match.
					s.scoresheet_game.cells.push({
						col: s.scoresheet_game.col_idx,
						row: 2 * score_team + s.scoresheet_game.servers[score_team],
						type: 'score',
						val: s.game.score[score_team] + 1,
					});
				}
			}
			s.scoresheet_game.cells.push({
				col: s.scoresheet_game.col_idx,
				row: 2 * press.team_id + press.player_id,
				val: calc.press_char(s, press),
				press_type: press.type,
			});
			s.scoresheet_game.col_idx++;
			break;
		}
		
		calc.calc_press(s, press);

		switch (press.type) {
		case 'injury-resume':
			_after_injuries(s, press);
			break;
		case 'injury':
			var cell = {
				col: s.scoresheet_game.col_idx,
				row: 2 * press.team_id + press.player_id,
				val: calc.press_char(s, press),
				press_type: press.type,
			};
			s.scoresheet_game.cells.push(cell);
			s.scoresheet_game.col_idx++;
			s.scoresheet_injuries.push({
				cell: cell,
				press: press,
			});
			break;
		case 'overrule':
			var found = false;
			for (var i = s.scoresheet_game.cells.length - 1;i >= 0;i--) {
				prev_cell = s.scoresheet_game.cells[i];
				if (prev_cell.type == 'score') {
					s.scoresheet_game.cells.push({
						row: ({0:1, 1:0, 2: 3, 3:2})[prev_cell.row],
						col: prev_cell.col,
						val: calc.press_char(s, press),
					});
					found = true;
					break;
				}
			}
			if (! found) {
				s.scoresheet_game.cells.push({
					row: 1,
					col: s.scoresheet_game.col_idx,
					val: calc.press_char(s, press),
				});
				s.scoresheet_game.col_idx++;
			}

			break;
		case 'referee':
			// Guess row
			row = 1;
			if (s.scoresheet_game.cells.length > 0) {
				prev_cell = s.scoresheet_game.cells[s.scoresheet_game.cells.length - 1];
				if ((prev_cell.press_type === 'injury') || (prev_cell.press_type === 'red-card') || (prev_cell.press_type === 'yellow-card')) {
					s.scoresheet_game.cells.push({
						row: [1, 0, 3, 2][prev_cell.row],
						col: prev_cell.col,
						val: calc.press_char(s, press),
					});
					break;
				}

				if ((typeof prev_cell.val == 'string') && (typeof prev_cell.row == 'number')) {
					row = prev_cell.row;
				}
			}

			s.scoresheet_game.cells.push({
				row: row,
				col: s.scoresheet_game.col_idx,
				val: calc.press_char(s, press),
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
						val: calc.press_char(s, press),
					});
					found = true;
					break;
				}
			}
			if (! found) {
				s.scoresheet_game.cells.push({
					row: 1,
					col: s.scoresheet_game.col_idx,
					val: calc.press_char(s, press),
				});
				s.scoresheet_game.col_idx++;
			}
			break;
		case 'yellow-card':
			s.scoresheet_game.cells.push({
				row: 2 * press.team_id + press.player_id,
				col: s.scoresheet_game.col_idx,
				val: calc.press_char(s, press),
			});
			s.scoresheet_game.col_idx++;
			break;
		case 'retired':
			_after_injuries(s, press);
			var press_char = calc.press_char(s, press);
			var retired_cell = {
				row: 2 * press.team_id + press.player_id,
				col: s.scoresheet_game.col_idx,
				val: press_char,
			};
			if (press_char.length > 1) {
				retired_cell.type = 'longtext';
				retired_cell.width = 2;
			}
			s.scoresheet_game.cells.push(retired_cell);
			s.scoresheet_game.col_idx++;
			break;
		case 'disqualified':
			_after_injuries(s, press);
			var dq_cell = {
				type: 'longtext',
				row: 2 * press.team_id + press.player_id,
				col: s.scoresheet_game.col_idx,
				val: 'Disqualifiziert',
				width: 4,
			};
			s.scoresheet_game.cells.push(dq_cell);
			s.scoresheet_game.col_idx += dq_cell.width;
			break;
		case 'suspension':
			s.scoresheet_game.cells.push({
				row: 1,
				col: s.scoresheet_game.col_idx,
				val: calc.press_char(s, press),
				_suspension_timestamp: press.timestamp,
			});
			s.scoresheet_game.col_idx++;
			break;
		case 'resume':
			for (var search_col_idx2 = s.scoresheet_game.cells.length - 1;search_col_idx2 >= 0;search_col_idx2--) {
				prev_cell = s.scoresheet_game.cells[search_col_idx2];
				if (prev_cell._suspension_timestamp === undefined) {
					continue;
				}

				s.scoresheet_game.cells.push({
					type: 'vertical-text',
					col: prev_cell.col,
					row: 2.5,
					val: utils.duration_secs(prev_cell._suspension_timestamp, press.timestamp),
				});
				break;
			}
			break;
		case 'editmode_set-score':
			_clean_editmode(s.scoresheet_game);
			s.scoresheet_game.cells.push({
				col: s.scoresheet_game.col_idx,
				type: 'editmode-sign',
				editmode_related: true,
			});
			if ((s.scoresheet_game.serving_team !== null) || press.resumed) {
				_loveall(s, s.game, s.scoresheet_game, {editmode_related: true});
			}
			break;
		case 'editmode_set-finished_games':
			s.scoresheet_games = s.match.finished_games.map(function(fgame, i) {
				var sgame = s.scoresheet_games[i];
				if (!sgame) {
					sgame = _make_scoresheet_game();
				}
				sgame.editmode_synthetic = true;
				return sgame;
			});
			break;
		case 'note':
			notes.push(press.val);
			break;
		}

		if (s.game.finished) {
			_after_injuries(s, press);
		}

		if ((s.game.score[0] == 20) && (s.game.score[1] == 20) && !s.scoresheet_game.reached_20_all) {
			s.scoresheet_game.reached_20_all = true;
			s.scoresheet_game.cells.push({
				col: s.scoresheet_game.col_idx,
				type: 'dash',
			});
			s.scoresheet_game.col_idx++;
		}

		if (s.game.finished && !s.scoresheet_game.circle) {
			s.scoresheet_game.circle = s.game.score;
		}
	});

	if (s.scoresheet_game.cells.length > 0) {
		s.scoresheet_games.push(s.scoresheet_game);
	}

	s.scoresheet_games.forEach(function(sgame, i) {
		if (!sgame.editmode_synthetic) {
			return;
		}
		var fgame = s.match.finished_games[i];
		if (!fgame.synthetic) {
			return;
		}
		sgame.circle = fgame.score;
		if (sgame.serving_team === null) {
			sgame.serving_team = 0;
		}
		if (sgame.servers[0] === null) {
			sgame.servers[0] = 0;
		}
		if (sgame.servers[1] === null) {
			sgame.servers[1] = 0;
		}
		_clean_editmode(sgame);
		sgame.cells.push({
			col: sgame.col_idx,
			type: 'editmode-sign',
			editmode_related: true,
		});

		_loveall(s, fgame, sgame, {editmode_related: true});
	});

	return _layout(s.scoresheet_games, col_count, notes);
}

function sheet_render(s, svg, referee_view) {
	function _text(search, str) {
		if (str !== 0 && !str) {
			str = '';
		}
		utils.text(svg.querySelector(search), str);
	}

	// Set text fields
	_text('.scoresheet_tournament_name', s.setup.tournament_name);

	// Special handling for event name: Move it just to the right of the tournament name
	var tname_bbox = svg.querySelector('.scoresheet_tournament_name').getBBox();
	svg.querySelector('.scoresheet_event_name').setAttribute('x', tname_bbox.x + tname_bbox.width + 4);
	var event_name = s.setup.event_name;
	if (!event_name && s.setup.team_competition && s.setup.teams[0].name && s.setup.teams[1].name) {
		event_name = s.setup.teams[0].name + ' - ' + s.setup.teams[1].name;
	}
	_text('.scoresheet_event_name', event_name);


	_text('.scoresheet_match_name', s.setup.match_name);
	_text('.scoresheet_date_value', s.metadata.start ? utils.human_date_str(s, s.metadata.start) : '');

	_text('.scoresheet_court_id', (referee_view ? '' : s.settings.court_id));
	_text('.scoresheet_umpire_name', s.metadata.umpire_name ? s.metadata.umpire_name : (referee_view ? '' : s.settings.umpire_name));
	_text('.scoresheet_service_judge_name', s.metadata.service_judge_name ? s.metadata.service_judge_name : (referee_view ? '' : s.settings.service_judge_name));

	_text('.scoresheet_begin_value', (s.metadata.start ? utils.time_str(s.metadata.start) : ''));
	if (s.match.finished) {
		_text('.scoresheet_end_value', (s.metadata.end ? utils.time_str(s.metadata.end) : ''));
		_text('.scoresheet_duration_value', ((s.metadata.start && s.metadata.end) ? utils.duration_mins(s.metadata.start, s.metadata.end) : ''));
	} else {
		_text('.scoresheet_end_value', null);
		_text('.scoresheet_duration_value', null);
	}

	var teams = s.setup.teams;
	_text('.scoresheet_results_team1_player1', teams[0].players[0] ? teams[0].players[0].name : '');
	_text('.scoresheet_results_team1_player2', (s.setup.is_doubles && teams[0].players[1]) ? teams[0].players[1].name : '');
	_text('.scoresheet_results_team1_name', teams[0].name);
	_text('.scoresheet_results_team2_player1', teams[1].players[0] ? teams[1].players[0].name : '');
	_text('.scoresheet_results_team2_player2', (s.setup.is_doubles && teams[1].players[1]) ? teams[1].players[1].name: '');
	_text('.scoresheet_results_team2_name', teams[1].name);

	svg.querySelector('.scoresheet_results_circle_team1').setAttribute(
		'visibility',
		(s.match.finished && s.match.team1_won) ? 'visible' : 'hidden');
	svg.querySelector('.scoresheet_results_circle_team2').setAttribute(
		'visibility',
		(s.match.finished && !s.match.team1_won) ? 'visible' : 'hidden');

	var shuttle_counter_active = (typeof s.match.shuttle_count == 'number') && (s.settings.shuttle_counter);
	svg.querySelector('.scoresheet_shuttle_counter').setAttribute(
		'visibility',
		shuttle_counter_active ? 'visible' : 'hidden');
	_text('.scoresheet_shuttle_counter_value', s.match.shuttle_count ? s.match.shuttle_count : '');

	var side1_str = '';
	var side2_str = '';
	var first_game = null;
	if (s.match && s.match.finished_games.length > 0) {
		first_game = s.match.finished_games[0];
	} else {
		first_game = s.game;
	}
	if (first_game && first_game.start_team1_left !== null) {
		if (first_game.start_team1_left) {
			side1_str = 'L';
			side2_str = 'R';
		} else {
			side1_str = 'R';
			side2_str = 'L';
		}
		// TODO handle case where first game is synthetic (should be copied over)
	}
	_text('.scoresheet_results_team1_side', side1_str);	
	_text('.scoresheet_results_team2_side', side2_str);	

	if (s.match) {
		var all_finished_games = s.match.finished_games.slice();
		if (s.match.finished && (all_finished_games[all_finished_games.length - 1] !== s.game)) {
			all_finished_games.push(s.game);
		}

		for (var i = 0;i < s.match.max_games;i++) {
			var g = all_finished_games[i];
			_text('.scoresheet_results_team1_score' + (i + 1), g ? g.score[0] : '');
			_text('.scoresheet_results_team2_score' + (i + 1), g ? g.score[1] : '');
		}
	}

	// Big table(s)
	var all_players;
	if (s.setup.is_doubles) {
		all_players = [
			s.setup.teams[0].players[0],
			s.setup.teams[0].players[1],
			s.setup.teams[1].players[0],
			s.setup.teams[1].players[1],
		];
	} else {
		all_players = [
			s.setup.teams[0].players[0],
			null,
			s.setup.teams[1].players[0],
			null,
		];
	}

	var SCORESHEET_COL_COUNT = 35;
	var cells = _parse_match(s, SCORESHEET_COL_COUNT);
	var t = svg.querySelector('.scoresheet_table_container');
	utils.empty(t);

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
				continue;
			}

			text = _svg_el('text', {
				'class': 'table_name',
				'x': table_left + padding_left,
			}, t, player.name);
			_svg_align_vcenter(text, table_top + player_idx * cell_height + cell_height / 2);
		}

		for (var col_idx = 1;col_idx < SCORESHEET_COL_COUNT;col_idx++) {
			_svg_el('line', {
				'class': 'table_line',
				'x1': cols_left + col_idx * cell_width,
				'x2': cols_left + col_idx * cell_width,
				'y1': table_top,
				'y2': table_top + table_height,
			}, t);
		}
	}

	var text_y_padding = 0.3;
	cells.forEach(function(cell) {
		// No let in current browsers, so declare some variables here
		var bg;
		var bb;

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
		case 'note':
			bg = _svg_el('rect', {
				'class': (((cell.table < 6) && (cell.row > 1)) ? 'table_longtext_background shaded' : 'table_longtext_background'),
			}, t);

			text = _svg_el('text', {
				'x': ((cell.table < 6) ? (cols_left + padding_left) : table_left),
			}, t, cell.val);
			_svg_align_vcenter(text, table_top + cell.row * cell_height + cell_height / 2);

			bb = text.getBBox();
			bg.setAttribute('x', bb.x);
			bg.setAttribute('y', bb.y + text_y_padding);
			bg.setAttribute('width', bb.width);
			bg.setAttribute('height', bb.height - 2 * text_y_padding);
			break;
		case 'longtext':
			bg = _svg_el('rect', {
				'class': ((cell.row > 1) ? 'table_longtext_background shaded' : 'table_longtext_background'),
			}, t);

			text = _svg_el('text', {
				'x': cols_left + cell.col * cell_width + padding_left,
			}, t, cell.val);
			_svg_align_vcenter(text, table_top + cell.row * cell_height + cell_height / 2);

			bb = text.getBBox();
			bg.setAttribute('x', bb.x);
			bg.setAttribute('y', bb.y + text_y_padding);
			bg.setAttribute('width', bb.width);
			bg.setAttribute('height', bb.height - 2 * text_y_padding);
			break;
		case 'vertical-text':
			text = _svg_el('text', {}, t, cell.val);
			var corex = cols_left + cell.col * cell_width + cell_width / 2;
			var corey = table_top + cell.row * cell_height + cell_height / 2;
			_svg_align_hcenter(text, corex);
			_svg_align_vcenter(text, corey);
			text.setAttribute('transform', 'rotate(-90 ' + corex + ',' + corey + ')');
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
				'd': path_data,
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

function event_render(container) {
	load_sheet('international', function(xml) {
		state.event.matches.forEach(function(match) {
			var svg = make_sheet_node(xml);
			svg.setAttribute('class', 'scoresheet multi_scoresheet');
			container.appendChild(svg);

			var s = {
				settings: state.settings,
				_: state._,
				lang: state.lang,
			};
			calc.init_state(s, match.setup, network.get_presses(match));
			calc.state(s);
			state.new_s = s;

			sheet_render(s, svg, true);
		});

		utils.visible_qs('.scoresheet_loading-icon', false);
	});
}

function event_list_matches(container) {
	network.list_matches(state, function(err, ev) {
		utils.visible_qs('.scoresheet_error', !!err);
		if (err) {
			$('.scoresheet_error_message').text(err.msg);
			utils.visible_qs('.scoresheet_loading-icon', false);
			return;
		}
		state.event = ev;
		event_render(container);
	});
}

function event_show() {
	if (state.ui.event_scoresheets_visible) {
		return;
	}
	state.ui.event_scoresheets_visible = true;
	control.set_current(state);

	if (typeof jsPDF != 'undefined') {
		jspdf_loaded();
	}

	settings.hide(true);
	stats.hide();
	render.hide();
	uiu.esc_stack_push(hide);

	var container = utils.qs('.scoresheet_container');
	$(container).children('.scoresheet').remove();
	utils.visible_qs('.scoresheet_loading-icon', true);
	utils.visible(container, true);

	utils.visible_qs('.scoresheet_note_dialog', false);

	if (state.event) {
		event_render(container);
	} else {
		event_list_matches(container);
	}
}

function show() {
	if (!state.initialized) {
		return; // Called on start with Shift+S
	}

	if (state.ui.scoresheet_visible) {
		return;
	}
	state.ui.scoresheet_visible = true;
	control.set_current(state);

	if (typeof jsPDF != 'undefined') {
		jspdf_loaded();
	}

	settings.hide();
	stats.hide();
	render.hide();

	uiu.esc_stack_push(hide);

	utils.visible_qs('.scoresheet_note_dialog', true);
	utils.qs('#scoresheet_note_input').focus();
	ui_show();
}

function ui_show() {
	utils.visible_qs('.scoresheet_loading-icon', true);
	var container = utils.qs('.scoresheet_container');
	$(container).children('.scoresheet').remove();
	utils.visible(container, true);	load_sheet('international', function(xml) {
		var svg = make_sheet_node(xml);
		svg.setAttribute('class', 'scoresheet single_scoresheet');
		// Usually we'd call importNode here to import the document here, but IE/Edge then ignores the styles
		container.appendChild(svg);
		sheet_render(state, svg);
		utils.visible_qs('.scoresheet_loading-icon', false);
	});
}

function hide() {
	if ((!state.ui.scoresheet_visible) && (!state.ui.event_scoresheets_visible)) {
		return;
	}

	state.ui.scoresheet_visible = false;
	state.ui.event_scoresheets_visible = false;
	control.set_current(state);

	uiu.esc_stack_pop();
	var $container = $('.scoresheet_container');
	$container.hide();
	$container.removeClass('event_scoresheet_container');
	$container.children('.scoresheet').remove();
}

function _match_title(s, sep) {
	var title = '';
	if (state.metadata.start) {
		title += utils.date_str(state.metadata.start) + ' ';
	}
	if (state.setup.match_name) {
		title += state.setup.match_name + ' ';
	}
	if (state.setup.teams[0].players[0].name || state.setup.teams[1].players[0].name) {
		if (state.setup.is_doubles) {
			title += state.setup.teams[0].players[0].name + sep + state.setup.teams[0].players[1].name + ' vs ' + state.setup.teams[1].players[0].name + sep + state.setup.teams[1].players[1].name;
		} else {
			title += state.setup.teams[0].players[0].name + ' vs ' + state.setup.teams[1].players[0].name;
		}
	}
	if (!title) {
		title = state._('scoresheet:Empty Scoresheet');
	}
	return title;
}

function ui_pdf() {
	var svg_nodes = document.querySelectorAll('.scoresheet_container>.scoresheet');
	var props = {
		title: (
			(state.ui.event_scoresheets_visible) ?
			(state._('scoresheet:[Event Scoresheet Filename]').replace('{event_name}', state.event.event_name)) :
			_match_title(state, '/')),
		subject: state._('Score Sheet'),
		creator: 'bup (https://phihag.de/bup/)',
	};
	if (state.metadata && state.metadata.umpire_name) {
		props.author = state.metadata.umpire_name;
	} else if (state.settings.umpire_name) {
		props.author = state.settings.umpire_name;
	}
	var filename = (
		(state.ui.event_scoresheets_visible) ?
		(state._('scoresheet:[Event Scoresheet Filename]').replace('{event_name}', state.event.event_name) + '.pdf') :
		(_match_title(state, ',') + '.pdf')
	);
	svg2pdf.save(svg_nodes, props, filename);
}

function jspdf_loaded() {
	utils.qs('.scoresheet_button_pdf').removeAttribute('disabled');
}

var URLS = {
	'international': 'div/scoresheet_international.svg',
};
var files = {};
function load_sheet(key, callback) {
	if (key in files) {
		return callback(files[key]);
	}

	var url = URLS[key];
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'text';

	xhr.onload = function() {
		files[key] = this.response;
		if (callback) {
			callback(files[key]);
		}
	};
	xhr.send();
}

function make_sheet_node(xml) {
	var doc = $.parseXML(xml);
	i18n.translate_nodes($(doc), state);
	return doc.documentElement;
}

function ui_init() {
	$('.postmatch_scoresheet_button').on('click', show);
	$('.scoresheet_button').on('click', show);
	$('.scoresheet_button_pdf').on('click', ui_pdf);
	$('.scoresheet_button_back').on('click', function() {
		hide();
	});
	$('.scoresheet_button_print').on('click', function() {
		window.print();
	});
	utils.on_click_qs('.setup_event_scoresheets', function(e) {
		e.preventDefault();
		event_show();
		return false;
	});
	$('.scoresheet_reload').on('click', function() {
		event_list_matches($('.scoresheet_container'));
	});

	$('.scoresheet_note_dialog').on('submit', function(e) {
		e.preventDefault();
		var input = utils.qs('#scoresheet_note_input');

		control.on_press({
			type: 'note',
			val: input.value,
		});
		ui_show();

		input.value = '';
		return false;
	});

	load_sheet('international');
}

return {
	jspdf_loaded: jspdf_loaded,
	ui_init: ui_init,
	hide: hide,
	show: show,
	event_show: event_show,
	// For testing only
	_parse_match: _parse_match,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var control = require('./control');
	var i18n = require('./i18n');
	var network = require('./network');
	var render = require('./render');
	var settings = require('./settings');
	var stats = require('./stats');
	var svg2pdf = require('./svg2pdf');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = scoresheet;
}
/*/@DEV*/