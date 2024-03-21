'use strict';
var scoresheet = (function() {

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
		if (Object.prototype.hasOwnProperty.call(attrs, key)) {
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

		var mark_col_start = undefined;
		var mark_col_end = undefined;
		var mark_row_start = undefined;
		var mark_row_end = undefined;
		var mark_table = undefined;

		var _finish_marks = function() {
			cells.push({
				type: 'mark-circle',
				col: mark_col_start,
				row: mark_row_start,
				width: (mark_col_end - mark_col_start + 1),
				height: (mark_row_end - mark_row_start + 1),
				table: mark_table,
			});

			mark_col_start = undefined;
			mark_col_end = undefined;
			mark_row_start = undefined;
			mark_row_end = undefined;
			mark_table = undefined;
		};

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

			if (cell.mark) {
				if ((mark_table !== undefined) && ((mark_table !== cell.table) || (mark_col_start !== cell.col))) {
					_finish_marks();
				}

				var cell_row_end = cell.type === 'vertical-text' ? 3 : cell.row;
				var cell_row_start = cell.type === 'vertical-text' ? 0 : cell.row;
				if (mark_col_start === undefined) {
					// First time
					mark_row_start = cell_row_start;
					mark_row_end = cell_row_end;
					mark_col_start = cell.col;
					mark_col_end = max_col;
					mark_table = cell.table;
				} else {
					// Extend circle (same column)
					mark_row_start = Math.min(mark_row_start, cell_row_start);
					mark_row_end = Math.max(mark_row_end, cell_row_end);
					mark_col_start = Math.min(mark_col_start, cell.col);
					mark_col_end = Math.max(mark_col_end, cell.col);
				}
			} else if (mark_col_start !== undefined) {
				_finish_marks();
			}
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
			mark: true,
		});
	});
	s.scoresheet_injuries = [];
}

function parse_match(state, col_count) {
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
				type: 'text',
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
				type: 'text',
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
					type: 'text',
					col: -1,
					row: 2 * s.scoresheet_game.serving_team,
					val: s._('scoresheet:server'),
				});
			}
			// In doubles we'll get future pick_server and pick_receiver events
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
				type: 'text',
				col: s.scoresheet_game.col_idx,
				row: 2 * press.team_id + press.player_id,
				val: calc.press_char(s, press),
				press_type: press.type,
				mark: true,
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
				type: 'text',
				col: s.scoresheet_game.col_idx,
				row: 2 * press.team_id + press.player_id,
				val: calc.press_char(s, press),
				press_type: press.type,
				mark: true,
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
						type: 'text',
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
					type: 'text',
					row: 1,
					col: s.scoresheet_game.col_idx,
					val: calc.press_char(s, press),
					mark: true,
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
						type: 'text',
						row: [1, 0, 3, 2][prev_cell.row],
						col: prev_cell.col,
						val: calc.press_char(s, press),
						mark: true,
					});
					break;
				}

				if ((typeof prev_cell.val == 'string') && (typeof prev_cell.row == 'number')) {
					row = prev_cell.row;
				}
			}

			s.scoresheet_game.cells.push({
				type: 'text',
				row: row,
				col: s.scoresheet_game.col_idx,
				val: calc.press_char(s, press),
				mark: true,
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
						type: 'text',
						row: row,
						col: prev_cell.col,
						val: calc.press_char(s, press),
						mark: true,
					});
					found = true;
					break;
				}
			}
			if (! found) {
				s.scoresheet_game.cells.push({
					type: 'text',
					row: 1,
					col: s.scoresheet_game.col_idx,
					val: calc.press_char(s, press),
				});
				s.scoresheet_game.col_idx++;
			}
			break;
		case 'yellow-card':
			s.scoresheet_game.cells.push({
				type: 'text',
				row: 2 * press.team_id + press.player_id,
				col: s.scoresheet_game.col_idx,
				val: calc.press_char(s, press),
				mark: true,
			});
			s.scoresheet_game.col_idx++;
			break;
		case 'retired':
			_after_injuries(s, press);
			var press_char = calc.press_char(s, press);
			var retired_cell = {
				type: 'text',
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
				val: calc.press_char(s, press),
				width: 4,
			};
			s.scoresheet_game.cells.push(dq_cell);
			s.scoresheet_game.col_idx += dq_cell.width;
			break;
		case 'suspension':
			s.scoresheet_game.cells.push({
				type: 'text',
				row: 1,
				col: s.scoresheet_game.col_idx,
				val: calc.press_char(s, press),
				_suspension_timestamp: press.timestamp,
				mark: true,
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
					mark: true,
				});
				break;
			}
			break;
		case 'walkover':
			s.scoresheet_game.cells.push({
				type: 'longtext',
				row: 2 * press.team_id + (s.setup.is_doubles ? 0.5 : 0),
				col: s.scoresheet_game.col_idx,
				width: 4,
				val: calc.press_char(s, press),
			});
			s.scoresheet_game.col_idx += 10;
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
		case 'editmode_switch-sides':
			_clean_editmode(s.scoresheet_game);
			s.scoresheet_game.cells.push({
				col: s.scoresheet_game.col_idx,
				type: 'editmode-sign',
				editmode_related: true,
			});
			var team_id = (s.game.start_team1_left == (press.side === 'left')) ? 0 : 1;
			s.scoresheet_game.servers[team_id] = 1 - s.scoresheet_game.servers[team_id];
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

		var INJURY_ENDING_TYPES = ['postmatch-confirm', 'resigned', 'red-card', 'disqualified', 'score'];
		if (s.match.finished && INJURY_ENDING_TYPES.includes(press.type)) {
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

		if (s.game.finished && !s.scoresheet_game.circle && !s.match.walkover) {
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

function _draw_mark_circle(container, cell, cell_width, cell_height, cols_left, table_top) {
	var rx = cell.width * cell_width / 2;
	var ry = cell.height * cell_height / 2;

	var cx = cols_left + cell.col * cell_width + rx;
	var cy = table_top + cell.row * cell_height + ry;
	if (cell.height === 1 && cell.width === 1) {
		var max_dimension = Math.max(rx, ry);
		ry = max_dimension;
		rx = max_dimension;
	} else {
		rx += 0.2 * cell_width;
		ry += 0.2 * cell_width;
	}

	_svg_el('ellipse', {
		'class': 'table_game_result',
		'cx': cx,
		'rx': rx,
		'cy': cy,
		'ry': ry,
	}, container);
}

function sheet_render(s, svg) {
	function _text(search, str) {
		if (str !== 0 && !str) {
			str = '';
		}
		var node = svg.querySelector(search);
		if (! node) {
			report_problem.silent_error('Cannot find scoresheet node ' + search + ' for ' + (s.setup ? s.setup.tournament_name : ' (no setup)'));
			return;
		}
		uiu.text(node, str);
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

	var match_name = s.setup.match_name || '';
	if (s.setup.match_num) {
		match_name += ' - #' + s.setup.match_num;
	}
	_text('.scoresheet_match_name', match_name);
	_text('.scoresheet_date_value',
		s.metadata.start ? utils.human_date_str(s, s.metadata.start) : (
		s.setup.date || utils.human_date_str(s, Date.now())));
	if (s.setup.scheduled_time_str && s.setup.scheduled_time_str != '00:00') {
		_text('.scoresheet_scheduled_time_value', s.setup.scheduled_time_str);
	}

	_text('.scoresheet_court_id', compat.courtnum(s.match.court_id ? s.match.court_id : s.setup.court_id));
	_text('.scoresheet_umpire_name', s.match.umpire_name ? s.match.umpire_name : s.setup.umpire_name);
	_text('.scoresheet_service_judge_name', s.match.service_judge_name ? s.match.service_judge_name : s.setup.service_judge_name);

	_text('.scoresheet_begin_value', ((s.metadata.start && !s.match.walkover) ? utils.time_str(s.metadata.start) : ''));
	if (s.match.finished) {
		_text('.scoresheet_end_value', (s.metadata.end ? utils.time_str(s.metadata.end) : ''));
		_text('.scoresheet_duration_value', ((s.metadata.start && s.metadata.end) ? utils.duration_hours(s.metadata.start, s.metadata.end) : ''));
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
		if (s.match.finished && (all_finished_games[all_finished_games.length - 1] !== s.game) && !s.match.walkover) {
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
	var cells = parse_match(s, SCORESHEET_COL_COUNT);
	var t = svg.querySelector('.scoresheet_table_container');
	uiu.empty(t);

	var padding_left = 5;
	var table_left = 150;
	var table_height = 210;
	var table_width = 2970 - table_left * 2;
	var cols_left = 590;
	var cell_width = (table_width - (cols_left - table_left)) / SCORESHEET_COL_COUNT;
	var cell_height = table_height / 4;
	for (var table_idx = 0;table_idx < 6;table_idx++) {
		// Due to absence of let, declare vars here
		var text;

		var table_top = 570 + 220 * table_idx;

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

	var text_y_padding = 3;
	cells.forEach(function(cell) {
		// No let in current browsers, so declare some variables here
		var bg;
		var bb;

		var table_top = 570 + 220 * cell.table;

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
			// score circle
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
			bg.setAttribute('height', Math.max(0, bb.height - 2 * text_y_padding));
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
			var EDITMODE_SIGN_X_MULTIPLIER = .15;
			var cell_left = cols_left + cell.col * cell_width;
			var sign_top = table_top;
			var sign_height = 4 * cell_height;
			var path_data = 'M ' + (cell_left - EDITMODE_SIGN_X_MULTIPLIER * cell_width) + ' ' + sign_top + ' L';
			for (var i = 0;i < EDITMODE_SIGN_LINE_COUNT;i++) {
				path_data += ' ' + (cell_left + ((i % 2 == 1) ? -1 : 1) * EDITMODE_SIGN_X_MULTIPLIER * cell_width) + ' ' + (sign_top + sign_height * (i + 1) / EDITMODE_SIGN_LINE_COUNT);
			}
			_svg_el('path', {
				'class': 'editmode-sign',
				'd': path_data,
			}, t);
			break;
		case 'mark-circle':
			// Circle around special marks
			_draw_mark_circle(t, cell, cell_width, cell_height, cols_left, table_top);
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

function sheet_name(setup) {
	if (setup.league_key && eventutils.is_5x1190_bundesliga(setup.league_key)) {
		return 'bundesliga-2016';
	}

	if (setup.league_key && /^(?:1BL|2BLN|2BLS)-(2016|2017)$/.test(setup.league_key)) {
		return 'bundesliga-2016';
	}

	if (setup.league_key === 'NLA-2019') {
		return 'nla-2019';
	}

	if (setup.league_key === 'NLA-2017') {
		return 'nla';
	}

	if (setup.league_key === 'OBL-2017') {
		return 'obl';
	}

	if (calc.max_game_count(setup.counting) === 5) {
		return 'international_5x11';
	}
	return 'international';
}

function event_render(container) {
	state.event.matches.forEach(function(match) {
		load_sheet(sheet_name(match.setup), function(xml) {
			var s = {
				settings: state.settings,
				_: state._,
				lang: state.lang,
			};

			var svg = make_sheet_node(s, xml);
			svg.setAttribute('class', 'scoresheet multi_scoresheet');
			container.appendChild(svg);

			calc.init_state(s, match.setup, network.get_presses(match));
			calc.state(s);

			sheet_render(s, svg);
		});

		uiu.hide_qs('.scoresheet_loading-icon');
	});
}

function event_list_matches(container) {
	network.list_matches(state, function(err, ev) {
		uiu.$visible_qs('.scoresheet_error', !!err);
		if (err) {
			$('.scoresheet_error_message').text(err.msg);
			uiu.$visible_qs('.scoresheet_loading-icon', false);
			return;
		}
		network.update_event(state, ev);
		event_render(container);
	});
}

function event_show() {
	if (state.ui.event_scoresheets_visible) {
		return;
	}
	uiu.addClass_qs('.scoresheet_container', 'scoresheet_container_multi');

	printing.set_orientation('landscape');

	if (typeof jsPDF != 'undefined') {
		jspdf_loaded();
	}

	state.ui.event_scoresheets_visible = true;
	render.hide();
	stats.hide();
	settings.hide(true, true);

	control.set_current(state);
	bupui.esc_stack_push(hide);

	var container = uiu.qs('.scoresheet_container');
	uiu.qsEach('.scoresheet', uiu.remove, container);
	uiu.show_qs('.scoresheet_loading-icon');
	uiu.show(container);

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

	printing.set_orientation('landscape');

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

	bupui.esc_stack_push(hide);

	uiu.removeClass_qs('.scoresheet_container', 'scoresheet_container_multi');
	uiu.qs('#scoresheet_note_input').focus();
	ui_show(state);
}

function ui_show(s) {
	uiu.$visible_qs('.scoresheet_loading-icon', true);
	var container = uiu.qs('.scoresheet_container');
	$(container).children('.scoresheet').remove();
	uiu.$visible(container, true);
	load_sheet(sheet_name(s.setup), function(xml) {
		var svg = make_sheet_node(s, xml);
		svg.setAttribute('class', 'scoresheet single_scoresheet');
		// Usually we'd call importNode here to import the document here, but IE/Edge then ignores the styles
		container.appendChild(svg);
		sheet_render(s, svg);
		uiu.$visible_qs('.scoresheet_loading-icon', false);
	});
}

function hide() {
	if ((!state.ui.scoresheet_visible) && (!state.ui.event_scoresheets_visible)) {
		return;
	}

	state.ui.scoresheet_visible = false;
	state.ui.event_scoresheets_visible = false;
	control.set_current(state);

	bupui.esc_stack_pop();
	var $container = $('.scoresheet_container');
	$container.hide();
	$container.removeClass('event_scoresheet_container');
	$container.children('.scoresheet').remove();

	if (state.ui.referee_mode) {
		refmode_referee_ui.back_to_ui();
	} else {
		settings.show();
	}
}

function _match_title(s, sep) {
	var title = '';
	if (!s.setup.team_competition && s.setup.tournament_name) {
		title += s.setup.tournament_name + ' ';
	}
	if (s.metadata.start) {
		title += utils.date_str(s.metadata.start) + ' ';
	}
	if (!s.setup.team_competition && s.setup.event_name) {
		title += s.setup.event_name + ' ';
	}
	if (s.setup.match_name) {
		title += s.setup.match_name + ' ';
	}
	if (s.setup.teams[0].players[0].name || s.setup.teams[1].players[0].name) {
		if (s.setup.is_doubles) {
			title += s.setup.teams[0].players[0].name + sep + s.setup.teams[0].players[1].name + ' vs ' + s.setup.teams[1].players[0].name + sep + s.setup.teams[1].players[1].name;
		} else {
			title += s.setup.teams[0].players[0].name + ' vs ' + s.setup.teams[1].players[0].name;
		}
	}
	if (!title) {
		title = s._('scoresheet:Empty Scoresheet');
	}
	return title;
}

function ui_pdf() {
	var svg_nodes = document.querySelectorAll('.scoresheet_container>.scoresheet');
	save_pdf(state, svg_nodes);
}

function save_pdf(s, svg_nodes) {
	var props = {
		title: (
			(s.ui.event_scoresheets_visible) ?
			(s._('scoresheet:[Event Scoresheet Filename]').replace('{event_name}', s.event.event_name)) :
			_match_title(s, '/')),
		subject: s._('Score Sheet'),
		creator: 'bup (https://phihag.de/bup/)',
	};
	if (s.metadata && s.metadata.umpire_name) {
		props.author = s.metadata.umpire_name;
	} else if (s.settings.umpire_name) {
		props.author = s.settings.umpire_name;
	}
	var filename = (
		(s.ui.event_scoresheets_visible) ?
		(s._('scoresheet:[Event Scoresheet Filename]').replace('{event_name}', s.event.event_name) + '.pdf') :
		(_match_title(s, ',') + '.pdf')
	);
	svg2pdf.save(svg_nodes, props, 'landscape', filename, 0.1);
}

function jspdf_loaded() {
	uiu.qs('.scoresheet_button_pdf').removeAttribute('disabled');
}

var URLS = {
	'international': 'div/scoresheet/international.svg',
	'international_5x11': 'div/scoresheet/international_5x11.svg',
	'bundesliga-2016': 'div/scoresheet/bundesliga-2016.svg',
	'nla': 'div/scoresheet/nla.svg',
	'nla-2019': 'div/scoresheet/nla-2019.svg',
	'obl': 'div/scoresheet/obl.svg',
};
var dl;
function load_sheet(sheet_name, cb, url_prefix) {
	var urls = URLS;
	if (url_prefix) {
		urls = utils.deep_copy(URLS);
		for (var k in urls) {
			urls[k] = url_prefix + urls[k];
		}
	}
	if (! dl) {
		dl = downloader(urls);
	}
	return dl.load(sheet_name, cb);
}

function make_sheet_node(s, xml) {
	var doc = $.parseXML(xml);
	i18n.translate_nodes(doc, s);
	return doc.documentElement;
}

function ui_init() {
	click.qs('.postmatch_scoresheet_button', show);
	click.qs('.scoresheet_button', show);
	click.qs('.scoresheet_button_pdf', ui_pdf);
	click.qs('.scoresheet_button_back', function() {
		hide();
	});
	click.qs('.scoresheet_button_print', function() {
		window.print();
	});
	click.qs('.setup_event_scoresheets', function() {
		event_show();
	});
	click.qs('.scoresheet_reload', function() {
		event_list_matches($('.scoresheet_container'));
	});

	form_utils.onsubmit(uiu.qs('.scoresheet_note_dialog'), function() {
		var input = uiu.qs('#scoresheet_note_input');

		control.on_press({
			type: 'note',
			val: input.value,
		});
		ui_show(state);

		input.value = '';
	});

	load_sheet('international');
	load_sheet('international_5x11');
	load_sheet('bundesliga-2016');
}

return {
	jspdf_loaded: jspdf_loaded,
	ui_init: ui_init,
	hide: hide,
	show: show,
	event_show: event_show,
	parse_match: parse_match,
	// Used by bts
	load_sheet: load_sheet,
	make_sheet_node: make_sheet_node,
	sheet_render: sheet_render,
	sheet_name: sheet_name,
	save_pdf: save_pdf,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var bupui = require('./bupui');
	var calc = require('./calc');
	var click = require('./click');
	var compat = require('./compat');
	var control = require('./control');
	var downloader = require('./downloader');
	var eventutils = require('./eventutils');
	var form_utils = require('./form_utils');
	var i18n = require('./i18n');
	var network = require('./network');
	var printing = require('./printing');
	var refmode_referee_ui = require('./refmode_referee_ui');
	var render = require('./render');
	var report_problem = require('./report_problem');
	var settings = require('./settings');
	var stats = require('./stats');
	var svg2pdf = require('./svg2pdf');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = scoresheet;
}
/*/@DEV*/