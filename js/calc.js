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
	'walkover',
];
function press_char(s, press) {
	if (utils.includes(SPECIAL_PRESSES, press.type)) {
		return s._('mark|' + press.type);
	}
}

function players_present(s) {
	return (
		(s.match && s.match.finished_games && (s.match.finished_games.length > 0)) ||
		(s.game && s.game.started) ||
		(s.game && (typeof s.game.team1_left === 'boolean'))
	);
}

function match_started(game_scores) {
	return (game_scores.length > 0) && ((game_scores[0][0] > 0) || (game_scores[0][1] > 0));
}

function _is_winner(counting, game_idx, candidate, other) {
	if ((counting === '3x21') || (counting === '1x21') || ((counting === '2x21+11') && (game_idx < 2))) {
		return (
			((candidate == 21) && (other < 20)) ||
			((candidate > 21) && (candidate <= 30) && (other == candidate - 2)) ||
			(candidate == 30) && (other == 29)
		);
	}
	if ((counting === '5x11_15') || (counting === '5x11_15^90') || (counting === '5x11_15~NLA') || (counting === '1x11_15') || ((counting === '2x21+11') && (game_idx === 2))) {
		return (
			((candidate == 11) && (other < 10)) ||
			((candidate > 11) && (candidate <= 15) && (other == candidate - 2)) ||
			(candidate == 15) && (other == 14)
		);
	}
	if (counting === '5x11/3') {
		return (
			((candidate == 11) && (other < 10)) ||
			((candidate == 13) && (other >= 10) && (other < 13))
		);
	}
	if (counting === '3x15_18') {
		return (
			((candidate == 15) && (other < 14)) ||
			((candidate > 15) && (candidate <= 18) && (other == candidate - 2)) ||
			(candidate == 18) && (other == 17)
		);
	}
	if (counting === '5x11_11') {
		return (candidate === 11) && (other < 11);
	}

	throw new Error('Invalid counting scheme ' + counting);
}

function warmup_timer(s, cointoss_ts) {
	switch (s.setup.warmup) {
	case 'none':
		return false;
	case 'bwf-2016':
		return {
			start: cointoss_ts,
			duration: 120000,
			exigent: 30499,
		};
	case 'legacy':
	default:
		return {
			start: cointoss_ts,
			duration: 120000,
			exigent: 5499,
		};
	}
}

function team_carded(s, team_id) {
	return s.match.cards.reduce(function(res, card) {
		return card.team_id === team_id ? card : res;
	}, null);
}

function player_carded(s, team_id, player_id) {
	return s.match.cards.reduce(function(res, card) {
		return ((card.team_id === team_id) && (card.player_id === player_id))
			? card
			: res;
	}, null);
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

// Copy a state (except presses / setup), for example in order to go through its history
function copy_state(s) {
	return {
		initialized: s.initialized,
		settings: s.settings,
		lang: s.lang,
		_: s._,
	};
}

function all_games(s) {
	var res = s.match.finished_games.slice();
	if (res[res.length - 1] !== s.game) {
		res.push(s.game);
	}
	return res;
}


function gamescore(s) {
	var gscores = [0, 0];
	all_games(s).forEach(function(g, game_idx) {
		var gs = g.score;
		var winner = game_winner(s.setup.counting, game_idx, gs[0], gs[1]);
		if (winner == 'left') {
			gscores[0]++;
		} else if (winner == 'right') {
			gscores[1]++;
		}
	});
	return gscores;
}

function score_str(s, left_id) {
	var game_score; // No "let" in current browsers
	var res = '';
	var finished_games = s.match.finished_games;
	for (var i = 0;i < finished_games.length;i++) {
		if (res) {
			res += ' ';
		}

		game_score = finished_games[i].score;
		res += game_score[left_id] + '-' + game_score[1 - left_id];
	}
	if (finished_games[finished_games.length - 1] !== s.game) {
		if (res) {
			res += ' ';
		}
		game_score = s.game.score;
		res += game_score[left_id] + '-' + game_score[1 - left_id];
	}
	return res;
}

// Returns:
//  'inprogress' for game in progress
//  'invalid' if the score can't happen
//  'left' if left side won this game
//  'right' if right side won this game
function game_winner(counting, game_idx, left_score, right_score) {
	if (_is_winner(counting, game_idx, left_score, right_score)) {
		return 'left';
	}
	if (_is_winner(counting, game_idx, right_score, left_score)) {
		return 'right';
	}
	if ((counting === '3x21') || (counting === '1x21') || ((counting === '2x21+11') && (game_idx < 2))) {
		if ((left_score < 21) && (right_score < 21)) {
			return 'inprogress';
		}
		if ((left_score < 30) && (right_score >= left_score - 1) && (right_score <= left_score + 1)) {
			return 'inprogress';
		}
	} else if ((counting === '5x11_15') || (counting === '5x11_15^90') || (counting === '5x11_15~NLA') || (counting === '1x11_15') || ((counting === '2x21+11') && (game_idx === 2))) {
		if ((left_score < 11) && (right_score < 11)) {
			return 'inprogress';
		}
		if ((left_score < 15) && (right_score >= left_score - 1) && (right_score <= left_score + 1)) {
			return 'inprogress';
		}
	} else if (counting === '5x11_11') {
		if ((left_score < 11) && (right_score < 11)) {
			return 'inprogress';
		}
	} else if (counting === '5x11/3') {
		if ((left_score < 11) && (right_score < 11)) {
			return 'inprogress';
		}
		if ((left_score >= 10) && (left_score < 13) && (right_score >= 10) && (right_score < 13)) {
			return 'inprogress';
		}
	} else if (counting === '3x15_18') {
		if ((left_score < 15) && (right_score < 15)) {
			return 'inprogress';
		}
		if ((left_score < 18) && (right_score >= left_score - 1) && (right_score <= left_score + 1)) {
			return 'inprogress';
		}
	}
	return 'invalid';
}

function winning_game_count(counting) {
	switch (counting) {
	case '5x11_15':
	case '5x11_15^90':
	case '5x11_15~NLA':
	case '5x11/3':
	case '5x11_11':
		return 3;
	case '3x21':
	case '2x21+11':
	case '3x15_18':
		return 2;
	case '1x21':
	case '1x11_15':
		return 1;
	default:
		throw new Error('Invalid counting scheme ' + counting);
	}
}

function max_game_count(counting) {
	switch (counting) {
	case '5x11_15':
	case '5x11_15^90':
	case '5x11_15~NLA':
	case '5x11/3':
	case '5x11_11':
		return 5;
	case '3x21':
	case '3x15_18':
	case '2x21+11':
		return 3;
	case '1x21':
	case '1x11_15':
		return 1;
	default:
		throw new Error('Invalid counting scheme ' + counting);
	}
}

function match_winner(counting, input_scores) {
	var winning_count = winning_game_count(counting);

	var score = [0, 0];
	for (var i = 0;i < input_scores.length;i++) {
		var iscore = input_scores[i];
		var winner = iscore.winner;
		if (!winner) {
			winner = game_winner(counting, i, iscore[0], iscore[1]);
		}
		switch (winner) {
		case 'left':
			score[0]++;
			if (score[0] >= winning_count) {
				return 'left';
			}
			break;
		case 'right':
			score[1]++;
			if (score[1] >= winning_count) {
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

function calc_game_score(counting, games) {
	var res = [0, 0];
	games.forEach(function(g, game_index) {
		var winner = game_winner(counting, game_index, g.score[0], g.score[1]);
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
			start: null,
			end: null,
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
}

function server(s) {
	var serving_team_id = s.game.team1_serving ? 0 : 1;
	var server_score_side = s.game.score[serving_team_id] % 2;
	var serving_player_id = s.game.teams_player1_even[serving_team_id] ? server_score_side : (1 - server_score_side);
	return s.setup.teams[serving_team_id].players[serving_player_id];
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

		marks: [],
		final_marks: [],
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
	var counting = s.setup.counting;
	var game_idx = s.match.finished_games.length;
	var team1_won = _is_winner(counting, game_idx, s.game.score[0], s.game.score[1]);
	var team2_won = _is_winner(counting, game_idx, s.game.score[1], s.game.score[0]);
	if (team1_won || team2_won) {
		var winner_idx = team1_won ? 0 : 1;
		s.match.game_score = calc_game_score(counting, s.match.finished_games);
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
		var winning_count = winning_game_count(counting);
		if (s.match.game_score[winner_idx] === winning_count) {
			if (! s.metadata.end) {
				s.metadata.end = press.timestamp;
			}
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
		if ((counting === '3x21') || (counting === '1x21') || ((counting === '2x21+11') && (game_idx < 2))) {
			is_interval = (
				(s.game.score[team_id] === 11) && (s.game.score[1 - team_id] < 11)
			);
		} else if (counting === '3x15_18') {
			is_interval = (
				(s.game.score[team_id] === 8) && (s.game.score[1 - team_id] < 8)
			);
		} else if ((counting === '1x11_15') || (((counting === '5x11_15') || (counting === '5x11_15^90') || (counting === '5x11_15~NLA') || (counting === '5x11/3') || (counting === '5x11_11')) && (game_idx === 4)) || ((counting === '2x21+11') && (game_idx === 2))) {
			is_interval = (
				(s.game.score[team_id] === 6) && (s.game.score[1 - team_id] < 6)
			);
		} else if ((counting === '5x11_15') || (counting === '5x11_15^90') || (counting === '5x11_15~NLA') || (counting === '5x11/3') || (counting === '5x11_11')) {
			is_interval = false;
		} else {
			throw new Error('Invalid counting scheme ' + s.setup.counting);
		}
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
				duration: (counting === '5x11_15^90' ? 90000 : 60000),
				exigent: 25000,
			};
		}
		if ((press.type != 'red-card') || is_interval) {
			s.game.interval = is_interval;
		}
	}

	if (s.game.finished && !s.match.finished) {
		var rest_duration;
		switch (counting) {
		case '5x11_15^90':
			rest_duration = 90000;
			break;
		case '5x11_15':
		case '5x11/3':
		case '5x11_11':
			rest_duration = 60000;
			break;
		case '3x21':
		case '3x15_18':
		case '2x21+11':
		case '5x11_15~NLA':
			rest_duration = 120000;
			break;
		case '1x21':
		case '1x11_15':
			throw new Error('Should never happen with ' + counting);
		default:
			throw new Error('Invalid counting scheme ' + counting);
		}
		s.timer = {
			start: press.timestamp,
			duration: rest_duration,
			exigent: 25000,
		};
	} else if (!s.game.interval && !s.match.suspended && !s.match.injuries) {
		if (press.type !== 'red-card') {
			s.timer = false;
		}
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

	s.game.change_sides = (s.game.interval && (s.match.finished_games.length === s.match.max_games - 1));
	if (s.game.change_sides) {
		s.game.team1_left = ! s.game.team1_left;
	}
}

function calc_press(s, press) {
	if (press.umpire_name) {
		s.match.umpire_name = press.umpire_name;
	}
	if (press.service_judge_name) {
		s.match.service_judge_name = press.service_judge_name;
	}
	if (press.court_id) {
		s.match.court_id = press.court_id;
	}

	switch (press.type) {
	case 'pick_side':
		// Manuel Lappe reported a mysterious error where team1_left seems to have been not boolean
		if (typeof press.team1_left != 'boolean') {
			report_problem.silent_error('pick_side value not boolean, but ' + (typeof press.team1_left));
		}

		s.game.start_team1_left = press.team1_left;
		s.game.team1_left = s.game.start_team1_left;
		if (!s.game.started) {
			s.timer = warmup_timer(s, press.timestamp);
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
		s.timer = false;
		if (! s.metadata.start) {
			s.metadata.start = press.timestamp;
		}
		break;
	case 'score':
		// Report by Manuel Lappe: It is possible to get into a state where both presses effect the same side.
		var side_type = typeof s.game.team1_left;
		if (side_type != 'boolean') {
			report_problem.silent_error('Unclear sides while scoring, type ' + side_type);
		}

		// This should not be possible in the UI, but could be caused by a race condition or invalid data
		if (s.game.finished) {
			report_problem.silent_error('Ignoring score press: Game is already finished');
			break;
		}

		var team1_scored = (!!s.game.team1_left == (press.side == 'left'));
		s.game.just_interval = false;
		score(s, (team1_scored ? 0 : 1), press);
		break;
	case 'postgame-confirm':
		if (s.match.finished) {
			throw new Error('Match finished, but game instead of match confirmed.');
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
	case 'postinterval-confirm':
		s.game.interval = false;
		s.game.change_sides = false;
		s.game.just_interval = true;
		s.timer = false;
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
		s.match.cards.push(press);
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
		s.match.cards.push(press);
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
		s.metadata.end = press.timestamp;
		s.game.team1_serving = null;
		s.game.service_over = null;
		s.timer = false;
		s.match.injuries = false;
		break;
	case 'disqualified':
		// Clear previous other cards, don't matter now
		s.match.marks = [];
		s.game.final_marks = [];

		s.match.marks.push(press);
		if (! s.match.finished) {
			s.game.won_by_score = false;
			s.game.finished = true;
			s.game.team1_won = press.team_id !== 0;
			s.game.team1_serving = null;
			s.game.service_over = null;
			s.match.team1_won = s.game.team1_won;
			s.match.finished = true;
		}
		s.metadata.end = press.timestamp;
		s.timer = false;
		s.match.injuries = false;
		s.match.cards.push(press);
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
		s.game.start_team1_left = !s.game.start_team1_left;
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
				team1_won: _is_winner(s.setup.counting, i, new_score[0], new_score[1]),
				score: new_score,
				editmode_by_side: !! press.by_side,
			};
		});

		s.match.finished = false;
		s.match.team1_won = null;
		s.match.game_score = calc_game_score(s.setup.counting, s.match.finished_games);
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
	case 'walkover':
		s.game.finished = true;
		s.game.team1_won = (press.team_id === 1);
		s.match.finished = true;
		s.match.team1_won = (press.team_id === 1);
		s.match.walkover = true;
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
		just_interval: false,
		marks: [],
		finish_confirmed: false,
		cards: [],
		team1_won: null,
		shuttle_count: 0,
		announce_pregame: null,
		pending_red_cards: [],
		injuries: false,
	};

	s.match.max_games = max_game_count(s.setup.counting); // TODO: deprecate this property
	s.game = make_game_state(s);
}

function state(s) {
	if (s.presses.length > 0) {
		s.metadata.updated = s.presses[s.presses.length - 1].timestamp;
	}
	// Reset properties about to be recalculated
	s.metadata.start = null;
	s.metadata.end = null;

	init_calc(s);
	undo(s);
	s.flattened_presses.forEach(function(press) {
		calc_press(s, press);
	});

	var counting = s.setup.counting;
	var game_idx = s.match.finished_games.length;

	if (! s.game.finished) {
		var team_id; // No let in modern browsers :(
		if ((counting === '3x21') || ((counting === '2x21+11') && (game_idx < 2))) {
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
		} else if (counting === '3x15_18') {
			if ((s.game.team1_serving) && (((s.game.score[0] === 14) && (s.game.score[1] < 14)) || (s.game.score[0] == 17))) {
				if (s.match.game_score[0] === 0) {
					s.game.gamepoint = true;
				} else {
					s.game.matchpoint = true;
				}
			} else if ((!s.game.team1_serving) && (((s.game.score[1] === 14) && (s.game.score[0] < 14)) || (s.game.score[1] == 17))) {
				if (s.match.game_score[1] === 0) {
					s.game.gamepoint = true;
				} else {
					s.game.matchpoint = true;
				}
			}
		} else if (counting === '1x21') {
			if ((s.game.team1_serving) && (((s.game.score[0] === 20) && (s.game.score[1] < 20)) || (s.game.score[0] == 29))) {
				s.game.matchpoint = true;
			} else if ((!s.game.team1_serving) && (((s.game.score[1] === 20) && (s.game.score[0] < 20)) || (s.game.score[1] == 29))) {
				s.game.matchpoint = true;
			}
		} else if ((counting === '2x21+11') && (game_idx === 2)) {
			if ((s.game.team1_serving) && (((s.game.score[0] === 10) && (s.game.score[1] < 10)) || (s.game.score[0] == 14))) {
				s.game.matchpoint = true;
			} else if ((!s.game.team1_serving) && (((s.game.score[1] === 10) && (s.game.score[0] < 10)) || (s.game.score[1] == 14))) {
				s.game.matchpoint = true;
			}
		} else if ((counting === '5x11_15') || (counting === '5x11_15^90') || (counting === '5x11_15~NLA') || (counting === '1x11_15')) {
			team_id = s.game.team1_serving ? 0 : 1;
			if (((s.game.score[team_id] === 10) && (s.game.score[1 - team_id] < 10)) || (s.game.score[team_id] == 14)) {
				if ((s.match.game_score[team_id] >= 2) || (counting === '1x11_15')) {
					s.game.matchpoint = true;
				} else {
					s.game.gamepoint = true;
				}
			}
		} else if (counting === '5x11/3') {
			team_id = s.game.team1_serving ? 0 : 1;
			if (((s.game.score[team_id] === 10) && (s.game.score[1 - team_id] < 10)) || (s.game.score[team_id] == 12)) {
				if (s.match.game_score[team_id] < 2) {
					s.game.gamepoint = true;
				} else {
					s.game.matchpoint = true;
				}
			}
		} else if (counting === '5x11_11') {
			team_id = s.game.team1_serving ? 0 : 1;
			if (s.game.score[team_id] === 10) {
				if (s.match.game_score[team_id] < 2) {
					s.game.gamepoint = true;
				} else {
					s.game.matchpoint = true;
				}
			}
		} else {
			throw new Error('Invalid counting scheme ' + counting);
		}
	}

	s.match.announce_pregame = (
		(s.game.start_server_player_id !== null) &&
		(s.game.start_receiver_player_id !== null) &&
		(!s.game.started) &&
		(!s.game.finished));

	return s;
}

function court(s) {
	var res = {
		left_odd: null,
		left_even: null,
		right_even: null,
		right_odd: null,

		left_serving: null,
		serving_downwards: null,
	};
	for (var team_id = 0;team_id < 2;team_id++) {
		if ((s.game.team1_left === null) || (s.game.teams_player1_even[team_id] === null)) {
			continue;
		}

		var prefix = ((s.game.team1_left == (team_id === 0)) ? 'left' : 'right') + '_';
		var players = s.setup.teams[team_id].players;
		res[prefix + (s.game.teams_player1_even[team_id] ? 'even' : 'odd')] = {
			player: players[0],
			carded: player_carded(s, team_id, 0),
		};
		if (s.setup.is_doubles) {
			res[prefix + (s.game.teams_player1_even[team_id] ? 'odd' : 'even')] = {
				player: players[1],
				carded: player_carded(s, team_id, 1),
			};
		}
	}

	if ((! s.game.finished) && (s.game.team1_serving !== null) && (s.game.team1_left !== null)) {
		res.left_serving = s.game.team1_serving == s.game.team1_left;
		var serving_score = s.game.score[s.game.team1_serving ? 0 : 1];
		res.serving_downwards = (serving_score % 2 === 0) != res.left_serving;
	}
	return res;
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

// Calculate score according to tournament/division/network adapter rules.
// state(s) must have been called before.
// Not necessarily the same as the score according to the main Badminton laws
function netscore(s, always_zero) {
	var counting = s.setup.counting;

	function _finish_score(game_idx, score, team1_won) {
		var winner = team1_won ? 0 : 1;
		if ((counting === '3x21') || (counting === '1x21') || ((counting === '2x21+11') && (game_idx < 2))) {
			if (score[1 - winner] >= 29) {
				score[winner] = 30;
			} else if (score[1 - winner] >= 20) {
				score[winner] = score[1 - winner] + 2;
			} else {
				score[winner] = 21;
			}
		} else if ((counting === '5x11_15') || (counting === '5x11_15^90') || (counting === '5x11_15~NLA') || (counting === '1x11_15') || ((counting === '2x21+11') && (game_idx === 2))) {
			if (score[1 - winner] >= 14) {
				score[winner] = 15;
			} else if (score[1 - winner] >= 10) {
				score[winner] = score[1 - winner] + 2;
			} else {
				score[winner] = 11;
			}
		} else if (counting === '5x11/3') {
			if (score[1 - winner] >= 10) {
				score[winner] = 13;
			} else {
				score[winner] = 11;
			}
		} else if (counting === '5x11_11') {
			score[winner] = 11;
		} else if (counting === '3x15_18') {
			if (score[1 - winner] >= 17) {
				score[winner] = 18;
			} else if (score[1 - winner] >= 14) {
				score[winner] = score[1 - winner] + 2;
			} else {
				score[winner] = 15;
			}
		} else {
			throw new Error('Invalid counting scheme ' + counting);
		}
	}

	var scores = s.match.finished_games.map(function(fg) {
		return fg.score.slice();
	});
	if (! s.match.finish_confirmed && ((s.game.started || s.match.finished || (s.game.score[0] > 0) || (s.game.score[1] > 0) || always_zero))) {
		scores.push(s.game.score.slice());
	}

	if (s.match.finished && !s.match.won_by_score) {
		if (scores.length > 0) {
			var last_score = scores[scores.length - 1];
			if (game_winner(counting, scores.length - 1, last_score[0], last_score[1]) === 'inprogress') {
				_finish_score(scores.length - 1, last_score, s.match.team1_won);
			}
		}

		var max_games = max_game_count(counting);
		while (scores.length < max_games) {
			var mwinner = match_winner(counting, scores);
			if ((mwinner == 'left') || (mwinner == 'right')) {
				break;
			}

			var new_score = [0, 0];
			_finish_score(scores.length, new_score, s.match.team1_won);
			scores.push(new_score);
		}
	}

	return scores;
}

function remote_state(s, setup, presses) {
	var res = s ? copy_state(s) : {};
	res.metadata = {};
	init_state(res, setup, presses, true);
	state(res);
	return res;
}

// A human-readable decscription of the current state of the match
function desc(s, now) {
	if (s.setup.incomplete) {
		return s._('mdesc:incomplete');
	}

	var res = s.match.finished_games.map(function(g) {
		return g.score.join(':');
	}).join(' ');
	if (! s.match.finish_confirmed && (s.game.started || s.match.finished)) {
		res += (res ? ' ' : '') + s.game.score.join(':');
	}
	if (s.game.interval) {
		res += ' ' + s._('mdesc:interval');
	}
	if (s.match.finished) {
		res += ' ' + s._('mdesc:finished');
	} else if (!s.game.started) {
		res += (res ? ' ' : '') + ((s.game.start_team1_left === null) ? (
			(s.not_before === undefined) ? s._('mdesc:selected') : (
				(s.not_before === 'playing') ?
					s._('mdesc:blocked', {
						matches: s.not_before_matches.map(function(m) {
							return m.setup.match_name;
						}).join(', '),
					}
					) : (
					(s.not_before <= now) ?
						s._('mdesc:selectable')
						:
						s._('mdesc:waiting', {
							time: utils.time_str(s.not_before),
						})
					)
			)
		) : (
			s._(
				(((s.game.start_server_player_id === null) || (s.game.start_receiver_player_id === null)) ?
				/*i18n-term:*/'mdesc:toss' :
				((s.match.finished_games.length > 0) ?
				'mdesc:interval' :
				/*i18n-term:*/'mdesc:warmup'
		)))));
	}
	return res;
}

function duration(s) {
	var fps = s.flattened_presses;
	if (!fps || (fps.length < 1)) {
		return; // undefined
	}

	return fps[fps.length - 1].timestamp - fps[0].timestamp;
}

return {
	all_games: all_games,
	calc_press: calc_press,
	court: court,
	copy_state: copy_state,
	desc: desc,
	duration: duration,
	gamescore: gamescore,
	game_winner: game_winner,
	init_calc: init_calc,
	init_state: init_state,
	lr2score: lr2score,
	match_started: match_started,
	max_game_count: max_game_count,
	match_winner: match_winner,
	netscore: netscore,
	press_char: press_char,
	score_str: score_str,
	server: server,
	SPECIAL_PRESSES: SPECIAL_PRESSES,
	state: state,
	team_carded: team_carded,
	player_carded: player_carded,
	players_present: players_present,
	undo: undo,
	remote_state: remote_state,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var report_problem = require('./report_problem');
	var utils = require('./utils');

	module.exports = calc;
}
/*/@DEV*/