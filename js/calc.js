var calc = (function() {
'use strict';

var SPECIAL_PRESSES = [
	'correction',
	'disqualified',
	'injury',
	'overrule',
	'red-card',
	'referee',
	'retired',
	'suspension',
	'yellow-card',
];
function press_char(s, press) {
	if (SPECIAL_PRESSES.indexOf(press.type) >= 0) {
		return s._('mark:' + press.type);
	}
}

function match_started(game_scores) {
	return (game_scores.length > 0) && ((game_scores[0][0] > 0) || (game_scores[0][1] > 0));
}

function _is_winner(candidate, other) {
	return (
		((candidate == 21) && (other < 20)) ||
		((candidate > 21) && (candidate <= 30) && (other == candidate - 2)) ||
		(candidate == 30) && (other == 29)
	);
}

// Returns null if score cannot be mapped
function lr2score(s, lrscore) {
	if ((lrscore.left === undefined) || (lrscore.right === undefined)) {
		throw new Error('Score expressed as side, but side information missing');
	}
	if (typeof s.game.team1_left == 'boolean') {
		return (s.game.team1_left) ? [lrscore.left, lrscore.right] : [lrscore.right, lrscore.left];
	}
	return null;
}

// Returns:
//  'inprogress' for game in progress
//  'invalid' if the score can't happen
//  'left' if left side won this game
//  'right' if right side won this game
function game_winner(left_score, right_score) {
	if (_is_winner(left_score, right_score)) {
		return 'left';
	}
	if (_is_winner(right_score, left_score)) {
		return 'right';
	}
	if ((left_score < 21) && (right_score < 21)) {
		return 'inprogress';
	}
	if ((left_score < 30) && (right_score >= left_score - 1) && (right_score <= left_score + 1)) {
		return 'inprogress';
	}
	return 'invalid';
}

function match_winner(input_scores) {
	var score = [0, 0];
	for (var i = 0;i < input_scores.length;i++) {
		var iscore = input_scores[i];
		var winner = (iscore.winner ? iscore.winner : game_winner(iscore[0], iscore[1]));
		switch (winner) {
		case 'left':
			score[0]++;
			if (score[0] >= 2) {
				return 'left';
			}
			break;
		case 'right':
			score[1]++;
			if (score[1] >= 2) {
				return 'right';
			}
			break;
		case 'inprogress':
			return 'inprogress';
		case 'invalid':
			return 'invalid';
		}
	}
	return 'inprogress';
}

function calc_game_score(games) {
	var res = [0, 0];
	games.forEach(function(g) {
		var winner = game_winner(g.score[0], g.score[1]);
		if (winner === 'left') {
			res[0]++;
		} else if (winner === 'right') {
			res[1]++;
		} else {
			throw new Error('Invalid status for a finished game: ' + winner);
		}
	});
	return res;
}

function init_state(s, setup, presses, keep_metadata) {
	if (! keep_metadata) {
		var now = Date.now();
		s.metadata = {
			id: setup.match_id ? setup.match_id : utils.uuid(),
			start: now,
			updated: now,
		};
	}
	if (setup) {
		s.setup = setup;
	}

	s.initialized = true;
	s.presses = presses ? presses : [];
	s.timer = false;
	s.remote = {};

	delete s.match;
	delete s.game;
	delete s.court;
}

function make_game_state(s, previous_game) {
	var res = {
		start_team1_left: (previous_game ? !previous_game.start_team1_left : null),
		start_server_team_id: (previous_game ? (previous_game.team1_won ? 0 : 1) : null),
		start_server_player_id: null,
		start_receiver_player_id: null,
		team1_serving: previous_game ? previous_game.team1_won : null,

		score: [0, 0],
		started: false,
		teams_player1_even: [null, null],

		service_over: false,
		interval: false,
		change_sides: false,
		gamepoint: false,
		game: false,
		matchpoint: false,

		finished: false,
		team1_won: null,
		won_by_score: null,
	};
	res.team1_left = res.start_team1_left;
	if (!s.setup.is_doubles) {
		if (previous_game) {
			res.start_server_player_id = 0;
			res.start_receiver_player_id = 0;
		}
		res.teams_player1_even = [true, true];
	}
	return res;
}

function recalc_after_score(s, team_id, press) {
	var team1_won = _is_winner(s.game.score[0], s.game.score[1]);
	var team2_won = _is_winner(s.game.score[1], s.game.score[0]);
	if (team1_won || team2_won) {
		var winner_idx = team1_won ? 0 : 1;
		s.match.game_score = calc_game_score(s.match.finished_games);
		s.match.game_score[winner_idx]++;
		s.game.won_by_score = true;
		s.game.team1_won = team1_won;
		if (!s.game.game) {
			s.game.final_marks = s.match.marks.slice();
			if (press.type == 'red-card') {
				s.game.final_marks.push(press);
			}
		}
		s.game.game = true;
		s.game.finished = true;
		s.match.injuries = false;
		if (s.match.game_score[winner_idx] == 2) {
			s.match.finished = true;
			s.match.team1_won = team1_won;
		}
		if (s.game.team1_serving !== null) {
			s.game.team1_serving_last = s.game.team1_serving;
		}
		s.game.team1_serving = null;
		s.game.service_over = null;
	} else if (! press.type.match(/^editmode_.*/)) {
		if (s.game.teams_player1_even[0] !== null) { // red card before beginning of game
			if (s.setup.is_doubles) {
				if (! s.game.service_over) {
					s.game.teams_player1_even[team_id] = !s.game.teams_player1_even[team_id];
				}
			} else {
				var even_score = (s.game.score[team_id] % 2) === 0;
				s.game.teams_player1_even[team_id] = even_score;
				s.game.teams_player1_even[1 - team_id] = even_score;
			}
		}
		s.game.team1_serving = team_id === 0;
	}

	var is_interval = null;
	if (team_id !== null) {
		is_interval = (
			(s.game.score[team_id] === 11) && (s.game.score[1 - team_id] < 11)
		);
		if (is_interval) { // First time
			s.game.interval_score = s.game.score.slice();
			s.game.interval_service_over = s.game.service_over;
			s.game.interval_team1_serving = s.game.team1_serving;
			s.game.interval_marks = s.match.marks.slice();
			if (press.type == 'red-card') {
				s.game.interval_marks.push(press);
			}
			s.timer = {
				start: press.timestamp,
				duration: 60 * 1000,
				exigent: 20499,
			};
		}
		if ((press.type != 'red-card') || is_interval) {
			s.game.interval = is_interval;
		}
	}

	if (s.game.finished && !s.match.finished) {
		s.timer = {
			start: press.timestamp,
			duration: 120 * 1000,
			exigent: 20499,
		};
	} else if (!s.game.interval && !s.match.suspended && !s.match.injuries) {
		s.timer = false;
	}

	if ((press.type != 'red-card') && (s.match.marks.length > 0)) {
		s.match.marks = [];
		s.match.just_unsuspended = false;
	}
}

function score(s, team_id, press) {
	var team1_scored = team_id === 0;
	s.game.service_over = team1_scored != s.game.team1_serving;
	s.game.score[team_id] += 1;

	recalc_after_score(s, team_id, press);

	s.game.change_sides = (s.game.interval && s.match.finished_games.length == 2);
	if (s.game.change_sides) {
		s.game.team1_left = ! s.game.team1_left;
	}
}

function calc_press(s, press) {
	switch (press.type) {
	case 'pick_side':
		s.game.start_team1_left = press.team1_left;
		s.game.team1_left = s.game.start_team1_left;
		if (!s.game.started) {
			s.timer = {
				start: press.timestamp,
				duration: 120 * 1000,
			};
		}
		if (! s.game.team1_left) {
			if (s.game.editmode_by_side) {
				// (If the edited score was intended to be by end instead of by team)
				s.game.score = [s.game.score[1], s.game.score[0]];
			}
			s.match.finished_games.forEach(function(g, i) {
				if (g.editmode_by_side) {
					s.match.finished_games[i].score = [g.score[1], g.score[0]];
				}
			});
		}
		break;
	case 'pick_server':
		s.game.start_server_team_id = press.team_id;
		s.game.start_server_player_id = press.player_id;
		if (s.setup.is_doubles) {
			s.game.teams_player1_even[s.game.start_server_team_id] = s.game.start_server_player_id == (s.game.score[s.game.start_server_team_id] % 2);
		} else {
			s.game.start_receiver_player_id = 0;
			s.game.teams_player1_even[s.game.start_server_team_id] = (s.game.score[s.game.start_server_team_id] % 2) === 0;
			s.game.teams_player1_even[1 - s.game.start_server_team_id] = s.game.teams_player1_even[s.game.start_server_team_id];
		}
		if (s.game.team1_serving === null) {
			s.game.team1_serving = s.game.start_server_team_id === 0;
		}
		break;
	case 'pick_receiver':
		s.game.start_receiver_player_id = press.player_id;
		s.game.teams_player1_even[press.team_id] = s.game.start_receiver_player_id == (s.game.score[s.game.start_server_team_id] % 2);
		break;
	case 'love-all':
		s.game.started = true;
		s.match.marks = [];
		s.match.just_unsuspended = false;
		break;
	case 'score':
		var team1_scored = (s.game.team1_left == (press.side == 'left'));
		score(s, (team1_scored ? 0 : 1), press);
		break;
	case 'postgame-confirm':
		if (s.match.finished) {
			throw new Error('Match finished, but game instead of matched confirmed.');
		}
		s.match.marks = s.match.marks.slice(s.game.final_marks.length);
		s.match.finished_games.push(s.game);
		s.game = make_game_state(s, s.game);
		s.match.pending_red_cards.forEach(function(red_card_press) {
			score(s, 1 - red_card_press.team_id, red_card_press);
		});
		s.match.pending_red_cards = [];
		break;
	case 'postmatch-confirm':
		if (!s.match.finished) {
			throw new Error('Match not finished, but match end confirmed.');
		}
		if (s.match.finish_confirmed) {
			throw new Error('Match already confirmed.');
		}
		s.match.finished_games.push(s.game);
		s.match.finish_confirmed = true;
		break;
	case 'overrule':
		s.match.marks.push(press);
		break;
	case 'referee':
		s.match.marks.push(press);
		break;
	case 'correction':
		s.match.marks.push(press);
		break;
	case 'yellow-card':
		s.match.marks.push(press);
		s.match.carded[press.team_id] = true;
		break;
	case 'red-card':
		if (! s.match.finished) {
			if ((! s.game.started) && (s.match.finished_games.length === 0)) { // Before match
				// See RTTO 3.7.7:
				// Misconduct before and after the match (...)
				// shall have no effect on the score of the match.
			} else if (s.game.finished) {
				// Before postgame-confirm
				s.match.pending_red_cards.push(press);
			} else {
				score(s, 1 - press.team_id, press);
			}
		}
		s.match.marks.push(press);
		break;
	case 'injury':
		s.match.marks.push(press);
		if (! s.match.injuries) {
			s.match.injuries = [];
			if (s.match.suspended) {
				s.match.preinjury_timer = s.match.suspended_timer;
				s.match.suspended_timer = {
					start: press.timestamp,
					upwards: true,
				};
			} else {
				s.match.preinjury_timer = s.timer;
				s.timer = {
					start: press.timestamp,
					upwards: true,
				};
			}
		}
		s.match.injuries.push(press);
		break;
	case 'injury-resume':
		s.timer = s.match.preinjury_timer;
		s.match.injuries = false;
		break;
	case 'retired':
		s.match.marks.push(press);
		s.game.team1_won = press.team_id !== 0;
		s.match.team1_won = s.game.team1_won;
		s.game.won_by_score = false;
		s.game.finished = true;
		s.match.finished = true;
		s.game.team1_serving = null;
		s.game.service_over = null;
		s.timer = false;
		s.match.injuries = false;
		break;
	case 'disqualified':
		s.match.marks = [];  // Red cards do not matter now
		s.match.marks.push(press);
		s.game.won_by_score = false;
		s.game.finished = true;
		s.game.team1_won = press.team_id !== 0;
		s.match.team1_won = s.game.team1_won;
		s.match.finished = true;
		s.game.team1_serving = null;
		s.game.service_over = null;
		s.timer = false;
		s.match.injuries = false;
		break;
	case 'suspension':
		if (s.match.suspended) {
			return; // Ignore double suspension
		}
		s.match.marks.push(press);
		s.match.suspended = true;
		s.match.suspended_timer = s.timer;
		s.timer = {
			start: press.timestamp,
			upwards: true,
		};
		break;
	case 'resume':
		s.match.suspended = false;
		s.match.just_unsuspended = true;
		s.timer = s.match.suspended_timer;
		break;
	case 'shuttle':
		s.match.shuttle_count++;
		break;
	case 'editmode_change-ends':
		s.game.team1_left = !s.game.team1_left;
		break;
	case 'editmode_switch-sides':
		var team_id = (s.game.team1_left == (press.side == 'left')) ? 0 : 1;
		s.game.teams_player1_even[team_id] = ! s.game.teams_player1_even[team_id];
		break;
	case 'editmode_change-serve':
		if (s.game.team1_serving !== null) {
			s.game.team1_serving = !s.game.team1_serving;
		}
		if (!s.setup.is_doubles) {
			var side = (s.game.score[s.game.team1_serving ? 0 : 1] % 2) === 0;
			s.game.teams_player1_even = [side, side];
		}
		break;
	case 'editmode_set-score':
		s.game.editmode_by_side = !! press.by_side;
		var new_score;
		if (press.by_side) {
			new_score = lr2score(s, press.score);
			if (new_score === null) {
				new_score = [press.score.left, press.score.right];
			}
		} else {
			new_score = press.score.slice();
		}

		if (press.resumed) {
			s.game.started = true;
		}

		s.game.score = new_score;
		s.game.service_over = false;
		s.game.finished = false;
		s.game.game = false;
		s.game.won_by_score = null;
		s.game.team1_won = null;
		s.game.final_marks = [];
		s.match.finished = false;
		s.match.team1_won = null;
		if ((s.game.team1_serving === null) && (s.game.team1_serving_last !== undefined)) {
			s.game.team1_serving = s.game.team1_serving_last;
		}
		recalc_after_score(s, s.game.team1_serving ? 0 : 1, press);

		if (!s.setup.is_doubles) {
			var serving_side = (s.game.score[s.game.team1_serving ? 0 : 1] % 2) === 0;
			s.game.teams_player1_even = [serving_side, serving_side];
		}
		break;
	case 'editmode_set-finished_games':
		s.match.finished_games = press.scores.map(function(score, i) {
			var new_score;
			if (press.by_side) {
				new_score = lr2score(s, score);
				if (new_score === null) {
					new_score = [score.left, score.right];
				}
			} else {
				new_score = score;
			}

			var fgame = s.match.finished_games[i];
			if (fgame && utils.deep_equal(fgame.score, new_score)) {
				return fgame;
			}

			return {
				synthetic: true,
				finished: true,
				start_team1_left: (fgame ? fgame.start_team1_left : null),
				team1_won: _is_winner(new_score[0], new_score[1]),
				score: new_score,
				editmode_by_side: !! press.by_side,
			};
		});

		s.match.finished = false;
		s.match.team1_won = null;
		s.match.game_score = calc_game_score(s.match.finished_games);
		recalc_after_score(s, null, press);
		break;
	case 'timer_restart':
		if (s.timer) {
			s.timer = {
				start: press.timestamp,
				duration: s.timer.duration,
				exigent: s.timer.exigent,
			};
		}
		break;
	// Display-only types
	case 'note':
		break;
	default:
		throw new Error('Unsupported press type ' + press.type);
	}
}

function init_calc(s) {
	s.match = {
		finished_games: [],
		game_score: [0, 0],
		finished: false,
		suspended: false,
		just_unsuspended: false,
		marks: [],
		finish_confirmed: false,
		carded: [false, false],
		team1_won: null,
		shuttle_count: 0,
		announce_pregame: null,
		pending_red_cards: [],
		injuries: false,
	};

	switch (s.setup.counting) {
	case '3x21':
		s.match.max_games = 3;
		break;
	default:
		throw new Error('Invalid counting scheme ' + s.setup.counting);
	}

	s.game = make_game_state(s);
}

function state(s) {
	if (s.presses.length > 0) {
		s.metadata.updated = s.presses[s.presses.length - 1].timestamp;
	}

	init_calc(s);
	undo(s);
	s.flattened_presses.forEach(function(press) {
		calc_press(s, press);
	});

	if ((s.game.score[0] === 11) && (s.game.score[1] < 11) && (s.game.team1_serving)) {
		s.game.interval = true;
	} else if ((s.game.score[1] === 11) && (s.game.score[0] < 11) && (!s.game.team1_serving)) {
		s.game.interval = true;
	}

	if (! s.game.finished) {
		if ((s.game.team1_serving) && (((s.game.score[0] === 20) && (s.game.score[1] < 20)) || (s.game.score[0] == 29))) {
			if (s.match.game_score[0] === 0) {
				s.game.gamepoint = true;
			} else {
				s.game.matchpoint = true;
			}
		} else if ((!s.game.team1_serving) && (((s.game.score[1] === 20) && (s.game.score[0] < 20)) || (s.game.score[1] == 29))) {
			if (s.match.game_score[1] === 0) {
				s.game.gamepoint = true;
			} else {
				s.game.matchpoint = true;
			}
		}
	}

	s.court = {
		player_left_odd: null,
		player_left_even: null,
		player_right_even: null,
		player_right_odd: null,

		left_serving: null,
		serving_downwards: null,
	};
	if ((s.game.team1_left !== null) && (s.game.teams_player1_even[0] !== null)) {
		s.court[
			'player_' + (s.game.team1_left ? 'left' : 'right') + '_' +
			(s.game.teams_player1_even[0] ? 'even' : 'odd')] = s.setup.teams[0].players[0];
		if (s.setup.is_doubles) {
			s.court[
				'player_' + (s.game.team1_left ? 'left' : 'right') + '_' +
				(s.game.teams_player1_even[0] ? 'odd' : 'even')] = s.setup.teams[0].players[1];
		}
	}
	if ((s.game.team1_left !== null) && (s.game.teams_player1_even[1] !== null)) {
		s.court[
			'player_' + (s.game.team1_left ? 'right' : 'left') + '_' +
			(s.game.teams_player1_even[1] ? 'even' : 'odd')] = s.setup.teams[1].players[0];
		if (s.setup.is_doubles) {
			s.court[
				'player_' + (s.game.team1_left ? 'right' : 'left') + '_' +
				(s.game.teams_player1_even[1] ? 'odd' : 'even')] = s.setup.teams[1].players[1];
		}
	}

	if ((! s.game.finished) && (s.game.team1_serving !== null) && (s.game.team1_left !== null)) {
		s.court.left_serving = s.game.team1_serving == s.game.team1_left;
		var serving_score = s.game.score[s.game.team1_serving ? 0 : 1];
		s.court.serving_downwards = (serving_score % 2 === 0) != s.court.left_serving;
	}

	s.match.announce_pregame = (
		(s.game.start_server_player_id !== null) &&
		(s.game.start_receiver_player_id !== null) &&
		(!s.game.started) &&
		(!s.game.finished));

	return s;
}

function undo(s) {
	s.flattened_presses = [];
	s.redo_stack = [];
	s.undo_possible = false;
	s.redo_possible = false;
	s.presses.forEach(function(press) {
		if (press.type == 'undo') {
			if (! s.undo_possible) {
				throw new Error('Nothing to undo');
			}
			var last_press = s.flattened_presses.pop();
			s.redo_stack.push(last_press);
		} else if (press.type == 'redo') {
			if (! s.redo_possible) {
				throw new Error('Nothing to redo');
			}
			var p = s.redo_stack.pop();
			s.flattened_presses.push(p);
		} else {
			if (s.redo_stack.length > 0) {
				s.redo_stack = [];
			}
			s.flattened_presses.push(press);
		}

		s.undo_possible = s.flattened_presses.length > 0;
		s.redo_possible = s.redo_stack.length > 0;
	});
}


return {
	init_state: init_state,
	init_calc: init_calc,
	state: state,
	undo: undo,
	calc_press: calc_press,
	game_winner: game_winner,
	match_winner: match_winner,
	press_char: press_char,
	lr2score: lr2score,
	match_started: match_started,
	SPECIAL_PRESSES: SPECIAL_PRESSES,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var utils = require('./utils');

	module.exports = calc;
}
/*/@DEV*/