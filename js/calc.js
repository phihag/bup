'use strict';

var calc = (function() {

function init_state(s, setup) {
	if (setup) {
		var now = Date.now();
		s.metadata = {
			id: setup.match_id ? setup.match_id : utils.uuid(),
			start: now,
			updated: now,
		};
		s.setup = setup;
	}

	s.initialized = true;
	s.presses = [];
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

function score(s, team_id, press) {
	var team1_scored = team_id == 0;
	s.game.service_over = team1_scored != s.game.team1_serving;
	s.game.score[team_id] += 1;

	var team1_won = (
		((s.game.score[0] == 21) && (s.game.score[1] < 20)) ||
		((s.game.score[0] > 21) && (s.game.score[1] < s.game.score[0] - 1)) ||
		(s.game.score[0] == 30)
	);
	var team2_won = (
		((s.game.score[1] == 21) && (s.game.score[0] < 20)) ||
		((s.game.score[1] > 21) && (s.game.score[0] < s.game.score[1] - 1)) ||
		(s.game.score[1] == 30)
	);
	if (team1_won) {
		s.match.game_score[0]++;
	} else if (team2_won) {
		s.match.game_score[1]++;
	}
	if (team1_won || team2_won) {
		s.game.won_by_score = true;
		s.game.team1_won = team1_won;
		s.game.game = true;
		s.game.finished = true;
		if (s.match.game_score[team_id] == 2) {
			s.match.finished = true;
			s.match.team1_won = team1_won;
		}
		s.game.team1_serving = null;
		s.game.service_over = null;
	} else {
		if (s.game.teams_player1_even[0] !== null) { // red card before beginning of game
			if (s.setup.is_doubles) {
				if (! s.game.service_over) {
					s.game.teams_player1_even[team_id] = !s.game.teams_player1_even[team_id];
				}
			} else {
				var even_score = s.game.score[team_id] % 2 == 0;
				s.game.teams_player1_even[team_id] = even_score;
				s.game.teams_player1_even[1 - team_id] = even_score;
			}
		}
		s.game.team1_serving = team1_scored;
	}

	s.game.interval = (
		(s.game.score[team_id] === 11) && (s.game.score[1 - team_id] < 11)
	);

	if (s.game.interval) {
		s.timer = {
			start: press.timestamp,
			duration: 60 * 1000,
			exigent: 20499,
		};
	} else if (s.game.finished && !s.match.finished) {
		s.timer = {
			start: press.timestamp,
			duration: 120 * 1000,
			exigent: 20499,
		};
	} else if (press.type == 'score') {
		// Only interrupt timers on regular scores, not red cards or so
		s.timer = false;
	}

	s.game.change_sides = (s.game.interval && s.match.finished_games.length == 2);
	if (s.game.change_sides) {
		s.game.team1_left = ! s.game.team1_left;
	}

	if ((press.type != 'red-card') && (s.match.marks.length > 0)) {
		s.match.marks = [];
	}
}

function calc_press(s, press) {
	switch (press.type) {
	case 'pick_side':
		s.game.start_team1_left = press.team1_left;
		s.game.team1_left = s.game.start_team1_left;
		s.timer = {
			start: press.timestamp,
			duration: 120 * 1000,
		};
		break;
	case 'pick_server':
		s.game.start_server_team_id = press.team_id;
		s.game.start_server_player_id = press.player_id;
		if (s.setup.is_doubles) {
			s.game.teams_player1_even[s.game.start_server_team_id] = s.game.start_server_player_id == s.game.score[s.game.start_server_team_id];
		} else {
			s.game.start_receiver_player_id = 0;
		}
		if (s.match.finished_games.length == 0) {
			s.game.team1_serving = s.game.start_server_team_id == 0;
		}
		break;
	case 'pick_receiver':
		s.game.start_receiver_player_id = press.player_id;
		s.game.teams_player1_even[press.team_id] = s.game.start_receiver_player_id == s.game.score[s.game.start_server_team_id];
		break;
	case 'love-all':
		s.game.started = true;
		s.match.marks = [];
		break;
	case 'score':
		var team1_scored = (s.game.team1_left == (press.side == 'left'));
		score(s, (team1_scored ? 0 : 1), press);
		break;
	case 'postgame-confirm':
		if (s.match.finished) {
			throw new Error('Match finished, but game instead of matched confirmed.');
		}
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
		press.char = 'O';
		s.match.marks.push(press);
		break;
	case 'referee':
		press.char = 'R';
		s.match.marks.push(press);
		break;
	case 'correction':
		press.char = 'C';
		s.match.marks.push(press);
		break;
	case 'interruption':
		press.char = 'U';
		s.match.marks.push(press);
		break;
	case 'mark': // Deprecated
		s.match.marks.push(press);
		break;
	case 'yellow-card':
		press.char = 'W';
		s.match.marks.push(press);
		s.match.carded[press.team_id] = true;
		break;
	case 'red-card':
		press.char = 'F';
		if (! s.match.finished) {
			if ((! s.game.started) && (s.match.finished_games.length == 0)) { // Before match
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
		press.char = 'V';
		s.match.marks.push(press);
		break;
	case 'retired':
		press.char = 'A';
		s.match.marks.push(press);
		s.game.team1_won = press.team_id != 0;
		s.match.team1_won = s.game.team1_won;
		s.game.won_by_score = false;
		s.game.finished = true;
		s.match.finished = true;
		s.game.team1_serving = null;
		s.game.service_over = null;
		s.timer = false;
		break;
	case 'disqualified':
		press.char = 'Disqualifiziert';
		s.match.marks = [];  // Red cards do not matter now
		s.match.marks.push(press);
		s.game.won_by_score = false;
		s.game.finished = true;
		s.game.team1_won = press.team_id != 0;
		s.match.team1_won = s.game.team1_won;
		s.match.finished = true;
		s.game.team1_serving = null;
		s.game.service_over = null;
		s.timer = false;
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
		s.game.service_over = false;
		s.game.team1_serving = !s.game.team1_serving;
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
		marks: [],
		finish_confirmed: false,
		carded: [false, false],
		team1_won: null,
		shuttle_count: 0,
		announce_pregame: null,
		pending_red_cards: [],
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
			if (s.match.game_score[0] == 0) {
				s.game.gamepoint = true;
			} else {
				s.game.matchpoint = true;
			}
		} else if ((!s.game.team1_serving) && (((s.game.score[1] === 20) && (s.game.score[0] < 20)) || (s.game.score[1] == 29))) {
			if (s.match.game_score[1] == 0) {
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
		s.court.serving_downwards = (serving_score % 2 == 0) != s.court.left_serving;
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
}

})();

if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var utils = require('./utils');

	module.exports = calc;
}
