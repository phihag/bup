'use strict';

var assert = require('assert');

var tutils = require('./tutils');
const {
	_describe,
	_it,
	DOUBLES_SETUP,
	DOUBLES_SETUP_5x11,
	SINGLES_SETUP,
} = tutils;

var press_score = tutils.press_score;
var state_after = tutils.state_after;
var bup = tutils.bup;

_describe('editmode', function() {
	_it('serve switching', function() {
		var presses = [{
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		}];
		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 2, 0);
		press_score(presses, 0, 1);
		press_score(presses, 1, 0);

		var s = state_after(presses, DOUBLES_SETUP);
		var court = bup.calc.court(s);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.service_over, true);
		assert.deepEqual(s.game.score, [3, 1]);
		assert.equal(s.game.teams_player1_even[0], false);
		assert.equal(s.game.teams_player1_even[1], true);
		assert.equal(court.left_even.player.name, 'Alice');
		assert.equal(court.left_odd.player.name, 'Andrew');
		assert.equal(court.right_even.player.name, 'Bob');
		assert.equal(court.right_odd.player.name, 'Birgit');

		// Umpire notices wrong order of the last two points, but decides to use manual editing instead of undo
		presses.push({
			type: 'editmode_change-serve',
		});
		s = state_after(presses, DOUBLES_SETUP);
		court = bup.calc.court(s);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.service_over, true);
		assert.deepEqual(s.game.score, [3, 1]);
		assert.equal(s.game.teams_player1_even[0], false);
		assert.equal(s.game.teams_player1_even[1], true);
		assert.equal(court.left_even.player.name, 'Alice');
		assert.equal(court.left_odd.player.name, 'Andrew');
		assert.equal(court.right_even.player.name, 'Bob');
		assert.equal(court.right_odd.player.name, 'Birgit');

		press_score(presses, 1, 0);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [4, 1]);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.service_over, true);
	});

	_it('serve switching at beginning of game', function() {
		var presses = [{
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		}];
		var s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, null);

		presses.push({
			type: 'editmode_change-serve',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, null);

		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, true);

		presses.push({
			type: 'editmode_change-serve',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, false);

		presses.push({
			type: 'editmode_change-serve',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, true);

		presses.push({
			type: 'editmode_change-serve',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, false);

		presses.push({
			type: 'pick_receiver', // Alice receives
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, false);

		presses.push({
			type: 'love-all',
		});

		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, false);
	});

	_it('score setting', function() {
		var presses = [];
		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'score',
			side: 'left',
		});

		presses.push({
			type: 'editmode_set-score',
			score: [5, 3],
		});
		var s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, true);
		assert.strictEqual(s.game.service_over, false);
		assert.strictEqual(s.game.started, true);
		assert.deepEqual(s.game.score, [5, 3]);

		presses.push({
			type: 'editmode_set-score',
			score: [3, 5],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, true);
		assert.strictEqual(s.game.service_over, false);
		assert.deepEqual(s.game.score, [3, 5]);
		assert.strictEqual(s.game.started, true);
		assert(! s.timer);

		presses.push({
			type: 'editmode_set-score',
			score: [11, 7],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, true);
		assert.strictEqual(s.game.service_over, false);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, true);
		assert.strictEqual(s.game.interval, true);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.won_by_score, null);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.match.team1_won, null);
		assert.strictEqual(s.match.finish_confirmed, false);
		assert.strictEqual(s.match.announce_pregame, false);
		assert(s.timer);
		assert.deepEqual(s.game.score, [11, 7]);
		assert.deepEqual(s.match.game_score, [0, 0]);
		assert.deepEqual(s.match.finished_games, []);

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'editmode_change-serve',
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [11, 7]);
		assert.strictEqual(s.game.team1_serving, false);

		presses.push({
			type: 'editmode_set-score',
			score: [7, 11],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.team1_serving, true);
		assert.deepEqual(s.game.score, [7, 11]);

		presses.push({
			type: 'editmode_set-score',
			score: [20, 19],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, true);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, true);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.gamepoint, true);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.won_by_score, null);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.match.team1_won, null);
		assert.strictEqual(s.match.finish_confirmed, false);
		assert.strictEqual(s.match.announce_pregame, false);
		assert(! s.timer);
		assert.deepEqual(s.game.score, [20, 19]);
		assert.deepEqual(s.match.game_score, [0, 0]);
		assert.deepEqual(s.match.finished_games, []);

		presses.push({
			type: 'editmode_set-score',
			score: [29, 28],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, true);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.gamepoint, true);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.won_by_score, null);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.match.team1_won, null);
		assert.strictEqual(s.match.finish_confirmed, false);
		assert.strictEqual(s.match.announce_pregame, false);
		assert(! s.timer);
		assert.deepEqual(s.game.score, [29, 28]);
		assert.deepEqual(s.match.game_score, [0, 0]);
		assert.deepEqual(s.match.finished_games, []);

		presses.push({
			type: 'editmode_set-score',
			score: [22, 20],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.finished, true);
		assert.strictEqual(s.game.game, true);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.started, true);
		assert.strictEqual(s.game.team1_won, true);
		assert.strictEqual(s.game.won_by_score, true);
		assert.strictEqual(s.match.announce_pregame, false);
		assert.strictEqual(s.match.finish_confirmed, false);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.match.team1_won, null);
	});

	_it('score setting before beginning of match (without by_side)', function() {
		var presses = [];
		presses.push({
			type: 'editmode_set-score',
			score: [5, 2],
		});

		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.strictEqual(s.game.start_team1_left, null);
		assert.strictEqual(s.game.team1_left, null);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'pick_side',
			team1_left: false,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.strictEqual(s.game.start_team1_left, false);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);

		presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);
	});

	_it('score setting before beginning of match (with by_side)', function() {
		var presses = [];
		presses.push({
			type: 'editmode_set-score',
			score: {left: 5, right: 2},
			by_side: true,
		});

		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.strictEqual(s.game.start_team1_left, null);
		assert.strictEqual(s.game.team1_left, null);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'pick_side',
			team1_left: false,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [2, 5]);
		assert.strictEqual(s.game.start_team1_left, false);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);

		presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, false);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		// Bob should be on the right
		assert.strictEqual(s.game.teams_player1_even[1], true);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, true);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		// Andrew should be on the left
		assert.strictEqual(s.game.teams_player1_even[0], false);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, true);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		// Alice should be on the left
		assert.strictEqual(s.game.teams_player1_even[0], true);

		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, false);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		// Birgit should be on the right
		assert.strictEqual(s.game.teams_player1_even[1], false);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		// Andrew should be on the right
		assert.deepEqual(s.game.score, [5, 2]);
		assert.strictEqual(s.game.teams_player1_even[0], true);

		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		// Alice should be on the right
		assert.strictEqual(s.game.teams_player1_even[0], false);

	});

	_it('modify previous games', function() {
		var presses = [];
		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 20, 18);

		presses.push({
			type: 'editmode_set-finished_games',
			scores: [[21, 15]],
		});
		var s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 15]);
		assert.strictEqual(s.match.finished_games[0].finished, true);
		assert.deepEqual(s.match.game_score, [1, 0]);
		assert.deepEqual(s.game.score, [20, 18]);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, true);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, true);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.matchpoint, true);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.won_by_score, null);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.match.team1_won, null);
		assert.strictEqual(s.match.finish_confirmed, false);
		assert.strictEqual(s.match.announce_pregame, false);

		presses.push({
			type: 'editmode_set-finished_games',
			scores: [[14, 21]],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [14, 21]);
		assert.strictEqual(s.match.finished_games[0].finished, true);
		assert.deepEqual(s.match.game_score, [0, 1]);
		assert.deepEqual(s.game.score, [20, 18]);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, true);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, true);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.gamepoint, true);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.won_by_score, null);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.match.team1_won, null);
		assert.strictEqual(s.match.finish_confirmed, false);
		assert.strictEqual(s.match.announce_pregame, false);

		presses.push({
			type: 'editmode_set-finished_games',
			scores: [],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.match.finished_games.length, 0);
		assert.strictEqual(s.game.gamepoint, true);
		assert.strictEqual(s.game.matchpoint, false);

		presses.push({
			type: 'editmode_set-finished_games',
			scores: [[14, 21], [22, 20]],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [14, 21]);
		assert.deepEqual(s.match.finished_games[1].score, [22, 20]);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.matchpoint, true);
		assert.deepEqual(s.game.score, [20, 18]);

		press_score(presses, 1, 0);
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [14, 21]);
		assert.deepEqual(s.match.finished_games[1].score, [22, 20]);
		assert.deepEqual(s.game.score, [21, 18]);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.game, true);
		assert.strictEqual(s.game.won_by_score, true);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.match.team1_won, true);
		assert.strictEqual(s.match.finish_confirmed, false);

		presses.push({
			type: 'editmode_set-finished_games',
			scores: [[14, 21]],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [14, 21]);
		assert.strictEqual(s.match.finished_games[0].finished, true);
		assert.equal(s.match.finished_games.length, 1);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.game, true);
		assert.strictEqual(s.game.won_by_score, true);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.match.team1_won, null);
		assert.strictEqual(s.match.finish_confirmed, false);
	});

	_it('undo a match win', function() {
		var presses = [];
		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		
		presses.push({
			type: 'editmode_set-finished_games',
			scores: [[12, 21]],
		});
		presses.push({
			type: 'editmode_set-score',
			score: [13, 21],
		});
		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [13, 21]);
		assert.deepEqual(s.match.finished_games[0].score, [12, 21]);
		assert.strictEqual(s.match.finished_games[0].finished, true);
		assert.strictEqual(s.game.finished, true);
		assert.strictEqual(s.game.game, true);
		assert.strictEqual(s.game.won_by_score, true);
		assert.strictEqual(s.game.team1_won, false);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.match.team1_won, false);

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'editmode_set-score',
			score: [13, 12],
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [13, 12]);
		assert.deepEqual(s.match.finished_games[0].score, [12, 21]);
		assert.strictEqual(s.match.finished_games[0].finished, true);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.won_by_score, null);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.match.team1_won, null);

		presses.push({
			type: 'editmode_set-finished_games',
			scores: [],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [13, 21]);
		assert.strictEqual(s.match.finished_games.length, 0);
		assert.strictEqual(s.game.finished, true);
		assert.strictEqual(s.game.game, true);
		assert.strictEqual(s.game.won_by_score, true);
		assert.strictEqual(s.game.team1_won, false);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.match.team1_won, null);
	});

	_it('entering multiple games and then selecting side (with by_side)', function() {
		var presses = [];
		presses.push({
			type: 'editmode_set-finished_games',
			scores: [{
				left: 21,
				right: 17,
			}],
			by_side: true,
		});
		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [21, 17]);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.strictEqual(s.game.start_team1_left, null);
		assert.strictEqual(s.game.team1_left, null);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'pick_side',
			team1_left: false,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [17, 21]);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.strictEqual(s.game.start_team1_left, false);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.deepEqual(s.match.finished_games[0].score, [21, 17]);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);

		presses.push({
			type: 'editmode_set-score',
			score: {
				left: 5,
				right: 2,
			},
			by_side: true,
		});

		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [21, 17]);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.strictEqual(s.game.start_team1_left, null);
		assert.strictEqual(s.game.team1_left, null);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'pick_side',
			team1_left: false,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [17, 21]);
		assert.deepEqual(s.game.score, [2, 5]);
		assert.strictEqual(s.game.start_team1_left, false);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);

		presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.deepEqual(s.match.finished_games[0].score, [21, 17]);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);

		presses.push({
			type: 'editmode_set-finished_games',
			scores: [{
				left: 26,
				right: 28,
			}],
			by_side: true,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [26, 28]);

		alt_presses.push({
			type: 'editmode_set-finished_games',
			scores: [{
				left: 26,
				right: 28,
			}],
			by_side: true,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [28, 26]);
	});

	_it('entering multiple games and then selecting side (without by_side)', function() {
		var presses = [];
		presses.push({
			type: 'editmode_set-finished_games',
			scores: [[21, 17]],
			by_side: false,
		});
		presses.push({
			type: 'editmode_set-score',
			score: [5, 2],
		});

		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [21, 17]);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.strictEqual(s.game.start_team1_left, null);
		assert.strictEqual(s.game.team1_left, null);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'pick_side',
			team1_left: false,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [21, 17]);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.strictEqual(s.game.start_team1_left, false);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);

		presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [5, 2]);
		assert.deepEqual(s.match.finished_games[0].score, [21, 17]);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.game.started, false);
		assert.strictEqual(s.match.announce_pregame, false);
	});

	_it('set-finished_games should not overwrite sides', function() {
		var presses = [];
		presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 21, 17);
		presses.push({
			type: 'postgame-confirm',
		});
		var s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished_games[0].start_team1_left, true);

		presses.push({
			type: 'editmode_set-finished_games',
			scores: [[21, 18]],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished_games[0].start_team1_left, true);

		presses = [];
		presses.push({
			type: 'editmode_set-finished_games',
			scores: [[21, 18]],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished_games[0].start_team1_left, null);
	});

	_it('set-score in singles should initialize correctly', function() {
		var presses = [{
			type: 'editmode_set-score',
			score: [3, 0],
			by_side: false,
		}, {
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}];

		var s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [3, 0]);
		var court = bup.calc.court(s);
		assert.strictEqual(court.left_odd.player.name, 'Alice');
		assert.strictEqual(court.left_even, null);
		assert.strictEqual(court.right_odd.player.name, 'Bob');
		assert.strictEqual(court.right_even, null);
		assert.strictEqual(court.left_serving, true);
		assert.strictEqual(court.serving_downwards, true);
	});

	_it('crash with postmatch-confirm', function() {
		var presses = [{
			team1_left : true,
			type: 'pick_side',
		}, {
			player_id: 0,
			type: 'pick_server',
			team_id: 0,
		}, {
			type: 'love-all',
		}, {
			type : 'editmode_set-finished_games',
			scores: [{
				left: 21,
				right: 5,
			}],
			'by_side': true,
		}, {
			type: 'editmode_set-score',
			score: {
				left: 21,
				right: 4,
			},
			'by_side' : true,
		}];

		var s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 5]);
		assert.deepEqual(s.game.score, [21, 4]);
		assert.strictEqual(s.game.finished, true);
		assert.strictEqual(s.match.finished, true);

		presses.push({
			type: 'postmatch-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 5]);
		assert.deepEqual(s.match.finished_games[1].score, [21, 4]);
		assert.strictEqual(s.match.finished, true);
	});

	_it('no timer in resumed matches', function() {
		var presses = [{
			type: 'editmode_set-score',
			score: [2, 5],
			resumed: true,
		}, {
			type: 'pick_side',
			team1_left: true,
		}];
		var s = state_after(presses, SINGLES_SETUP);
		assert(!s.timer);
		assert(!s.game.announce_pregame);

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert(!s.timer);
		assert(!s.game.announce_pregame);
	});

	_it('serve switching should fix position in singles', function() {
		var presses = [];
		presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 2, 2);
		var s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(s.game.teams_player1_even[0], true);
		assert.strictEqual(s.game.teams_player1_even[1], true);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(s.game.team1_serving, false);
		assert.strictEqual(s.game.teams_player1_even[0], false);
		assert.strictEqual(s.game.teams_player1_even[1], false);

		presses.push({
			type: 'editmode_change-serve',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(s.game.team1_serving, true);
		assert.strictEqual(s.game.teams_player1_even[0], true);
		assert.strictEqual(s.game.teams_player1_even[1], true);

		presses.push({
			type: 'editmode_change-serve',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(s.game.team1_serving, false);
		assert.strictEqual(s.game.teams_player1_even[0], false);
		assert.strictEqual(s.game.teams_player1_even[1], false);
	});

	_it('timer should continue after serve switching', function() {
		var presses = [];
		presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		var s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.timer, false);

		presses.push({
			type: 'editmode_change-serve',
		});
		s = state_after(presses, DOUBLES_SETUP);
	});

	_it('ending and un-ending a match with a score edit', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}, {
			type: 'editmode_set-finished_games',
			scores: [[21, 0]],
		}, {
			type: 'editmode_set-score',
			score: [21, 5],
		}];

		var s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.finished, true);
		assert.strictEqual(s.game.won_by_score, true);
		assert.strictEqual(s.match.finished, true);

		presses.push({
			type: 'editmode_set-score',
			score: [19, 2],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.game.won_by_score, null);
		assert.strictEqual(s.match.finished, false);

		press_score(presses, 2, 0);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [21, 2]);
		assert.strictEqual(s.game.finished, true);
		assert.strictEqual(s.game.won_by_score, true);
		assert.deepEqual(s.match.game_score, [2, 0]);
		assert.strictEqual(s.match.finished, true);
	});

	_it('setting score and unsetting it again', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		var s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished_games.length, 0);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.strictEqual(s.game.team1_serving, true);
		assert.strictEqual(s.game.teams_player1_even[0], true);
		assert.strictEqual(s.game.teams_player1_even[1], true);
		var court = bup.calc.court(s);
		assert.strictEqual(court.serving_downwards, false);
		assert.strictEqual(court.left_serving, true);

		presses.push({
			type: 'editmode_set-score',
			score: [21, 5],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished_games.length, 0);
		assert.deepEqual(s.game.score, [21, 5]);
		assert.strictEqual(s.game.team1_serving, null);
		assert.strictEqual(s.game.teams_player1_even[0], true);
		assert.strictEqual(s.game.teams_player1_even[1], true);
		assert.strictEqual(s.game.game, true);
		assert.strictEqual(s.game.team1_won, true);
		court = bup.calc.court(s);
		assert.strictEqual(court.serving_downwards, null);
		assert.strictEqual(court.left_serving, null);

		presses.push({
			type: 'editmode_set-score',
			score: [0, 0],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished_games.length, 0);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.strictEqual(s.game.team1_serving, true);
		assert.strictEqual(s.game.teams_player1_even[0], true);
		assert.strictEqual(s.game.teams_player1_even[1], true);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.team1_won, null);
		court = bup.calc.court(s);
		assert.strictEqual(court.serving_downwards, false);
		assert.strictEqual(court.left_serving, true);

		presses.push({
			type: 'editmode_set-score',
			score: [2, 4],
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished_games.length, 0);
		assert.deepEqual(s.game.score, [2, 4]);
		assert.strictEqual(s.game.teams_player1_even[0], true);
		assert.strictEqual(s.game.teams_player1_even[1], true);
		assert.strictEqual(s.game.team1_serving, true);
		court = bup.calc.court(s);
		assert.strictEqual(court.serving_downwards, false);
		assert.strictEqual(court.left_serving, true);

		presses.push({
			type: 'editmode_change-serve',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished_games.length, 0);
		assert.deepEqual(s.game.score, [2, 4]);
		assert.strictEqual(s.game.teams_player1_even[0], true);
		assert.strictEqual(s.game.teams_player1_even[1], true);
		assert.strictEqual(s.game.team1_serving, false);
		court = bup.calc.court(s);
		assert.strictEqual(court.serving_downwards, true);
		assert.strictEqual(court.left_serving, false);

		presses.push({
			type: 'editmode_change-serve',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished_games.length, 0);
		assert.deepEqual(s.game.score, [2, 4]);
		assert.strictEqual(s.game.teams_player1_even[0], true);
		assert.strictEqual(s.game.teams_player1_even[1], true);
		assert.strictEqual(s.game.team1_serving, true);
		court = bup.calc.court(s);
		assert.strictEqual(court.serving_downwards, false);
		assert.strictEqual(court.left_serving, true);
	});


	_it('editing away from an interval', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 10, 0);
		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 1,
		});

		presses.push({
			type: 'editmode_set-score',
			score: [3, 5],
		});

		var s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(
			bup.pronunciation.pronounce(s),
			'3-5'
		);
	});

	_it('synthetic games overwriting natural ones', function() {
		var presses = [];
		presses.push({
			type: 'pick_side', // Alice picks left
			team1_left: true,
		});
		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 21, 15);
		presses.push({
			type: 'postgame-confirm',
		});
		press_score(presses, 22, 20);
		presses.push({
			type: 'postgame-confirm',
		});
		press_score(presses, 5, 3);
		var s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 15]);
		assert.deepEqual(s.match.finished_games[1].score, [20, 22]);
		assert(! s.match.finished_games[0].synthetic);
		assert(! s.match.finished_games[1].synthetic);
		assert.deepEqual(s.game.score, [5, 3]);

		// oops, we noticed it should be 16 in first game
		presses.push({
			type: 'editmode_set-finished_games',
			scores: [[21, 16], [20, 22]],
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 16]);
		assert.deepEqual(s.match.finished_games[1].score, [20, 22]);
		assert(s.match.finished_games[0].synthetic);
		assert(! s.match.finished_games[1].synthetic);
		assert.deepEqual(s.game.score, [5, 3]);
	});

	_it('player side and ends switching', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 1,
			player_id: 1,
		}, {
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];

		var s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.teams_player1_even[0], true);
		assert.equal(s.game.teams_player1_even[1], false);
		var court = bup.calc.court(s);
		assert.equal(court.left_even.player.name, 'Andrew');
		assert.equal(court.left_odd.player.name, 'Alice');
		assert.equal(court.right_even.player.name, 'Birgit');
		assert.equal(court.right_odd.player.name, 'Bob');

		// Umpire notices wrong player is serving, uses edit
		presses.push({
			type: 'editmode_switch-sides',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.teams_player1_even[0], false);
		assert.equal(s.game.teams_player1_even[1], false);
		court = bup.calc.court(s);
		assert.equal(court.left_even.player.name, 'Alice');
		assert.equal(court.left_odd.player.name, 'Andrew');
		assert.equal(court.right_even.player.name, 'Birgit');
		assert.equal(court.right_odd.player.name, 'Bob');

		presses.push({
			type: 'editmode_switch-sides',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.teams_player1_even[0], false);
		assert.equal(s.game.teams_player1_even[1], true);
		court = bup.calc.court(s);
		assert.equal(court.left_even.player.name, 'Alice');
		assert.equal(court.left_odd.player.name, 'Andrew');
		assert.equal(court.right_even.player.name, 'Bob');
		assert.equal(court.right_odd.player.name, 'Birgit');

		presses.push({
			type: 'editmode_switch-sides',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.teams_player1_even[0], false);
		assert.equal(s.game.teams_player1_even[1], false);
		court = bup.calc.court(s);
		assert.equal(court.left_even.player.name, 'Alice');
		assert.equal(court.left_odd.player.name, 'Andrew');
		assert.equal(court.right_even.player.name, 'Birgit');
		assert.equal(court.right_odd.player.name, 'Bob');

		presses.push({
			type: 'editmode_switch-sides',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.teams_player1_even[0], true);
		assert.equal(s.game.teams_player1_even[1], false);
		court = bup.calc.court(s);
		assert.equal(court.left_even.player.name, 'Andrew');
		assert.equal(court.left_odd.player.name, 'Alice');
		assert.equal(court.right_even.player.name, 'Birgit');
		assert.equal(court.right_odd.player.name, 'Bob');

		presses.push({
			type: 'editmode_change-ends',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.teams_player1_even[0], true);
		assert.equal(s.game.teams_player1_even[1], false);
		court = bup.calc.court(s);
		assert.equal(court.left_even.player.name, 'Birgit');
		assert.equal(court.left_odd.player.name, 'Bob');
		assert.equal(court.right_even.player.name, 'Andrew');
		assert.equal(court.right_odd.player.name, 'Alice');

		presses.push({
			type: 'editmode_switch-sides',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.teams_player1_even[0], true);
		assert.equal(s.game.teams_player1_even[1], true);
		court = bup.calc.court(s);
		assert.equal(court.left_even.player.name, 'Bob');
		assert.equal(court.left_odd.player.name, 'Birgit');
		assert.equal(court.right_even.player.name, 'Andrew');
		assert.equal(court.right_odd.player.name, 'Alice');

		presses.push({
			type: 'editmode_switch-sides',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.teams_player1_even[0], true);
		assert.equal(s.game.teams_player1_even[1], false);
		court = bup.calc.court(s);
		assert.equal(court.left_even.player.name, 'Birgit');
		assert.equal(court.left_odd.player.name, 'Bob');
		assert.equal(court.right_even.player.name, 'Andrew');
		assert.equal(court.right_odd.player.name, 'Alice');

		presses.push({
			type: 'editmode_switch-sides',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.teams_player1_even[0], false);
		assert.equal(s.game.teams_player1_even[1], false);
		court = bup.calc.court(s);
		assert.equal(court.left_even.player.name, 'Birgit');
		assert.equal(court.left_odd.player.name, 'Bob');
		assert.equal(court.right_even.player.name, 'Alice');
		assert.equal(court.right_odd.player.name, 'Andrew');

		presses.push({
			type: 'editmode_change-ends',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.game.teams_player1_even[0], false);
		assert.equal(s.game.teams_player1_even[1], false);
		court = bup.calc.court(s);
		assert.equal(court.left_even.player.name, 'Alice');
		assert.equal(court.left_odd.player.name, 'Andrew');
		assert.equal(court.right_even.player.name, 'Birgit');
		assert.equal(court.right_odd.player.name, 'Bob');
	});

	_it('manual ends switch edit should be corrected later', function() {
		function _calc_position(presses) {
			const s = state_after(presses, DOUBLES_SETUP_5x11);

			const court = bup.calc.court(s);
			return {
				left_even: court.left_even.player.name,
				left_odd: court.left_odd.player.name,
				right_even: court.right_even.player.name,
				right_odd: court.right_odd.player.name,
			};
		}

		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 1,
		}, {
			type: 'love-all',
		}];
		let s = state_after(presses, DOUBLES_SETUP_5x11);
		assert.strictEqual(s.game.start_team1_left, true);

		press_score(presses, 2, 2);
		assert.deepStrictEqual(_calc_position(presses), {
			left_even: 'Alice',
			left_odd: 'Andrew',
			right_even: 'Birgit',
			right_odd: 'Bob',
		});

		// Umpire notices ends are switched, corrects it
		presses.push({
			type: 'editmode_change-ends',
		});
		s = state_after(presses, DOUBLES_SETUP_5x11);
		assert.strictEqual(s.game.start_team1_left, false);
		assert.deepStrictEqual(_calc_position(presses), {
			left_even: 'Birgit',
			left_odd: 'Bob',
			right_even: 'Alice',
			right_odd: 'Andrew',
		});

		// game ends
		press_score(presses, 9, 0);
		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP_5x11);
		assert.strictEqual(s.game.start_team1_left, true);
		assert.deepStrictEqual(s.game.score, [0, 0]);
		assert.deepStrictEqual(_calc_position(presses), {
			left_even: 'Andrew',
			left_odd: 'Alice',
			right_even: 'Bob',
			right_odd: 'Birgit',
		});
	});

	_it('score setting in singles should update sides', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];

		var s = state_after(presses, SINGLES_SETUP);
		assert.equal(s.game.teams_player1_even[0], true);
		assert.equal(s.game.teams_player1_even[1], true);
		var court = bup.calc.court(s);
		assert.equal(court.left_even.player.name, 'Alice');
		assert.equal(court.left_odd, null);
		assert.equal(court.right_even.player.name, 'Bob');
		assert.equal(court.right_odd, null);

		presses.push({
			type: 'editmode_set-score',
			score: [5, 3],
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(s.game.teams_player1_even[0], false);
		assert.equal(s.game.teams_player1_even[1], false);
		court = bup.calc.court(s);
		assert.equal(court.left_even, null);
		assert.equal(court.left_odd.player.name, 'Alice');
		assert.equal(court.right_even, null);
		assert.equal(court.right_odd.player.name, 'Bob');
	});
});
