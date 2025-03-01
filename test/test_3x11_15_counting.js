'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;

var press_score = tutils.press_score;
var state_after = tutils.state_after;
var bup = tutils.bup;


var DOUBLES_SETUP = bup.utils.deep_copy(tutils.DOUBLES_SETUP);
DOUBLES_SETUP.counting = '3x11_15';
var SINGLES_SETUP = bup.utils.deep_copy(tutils.SINGLES_SETUP);
SINGLES_SETUP.counting = '3x11_15';


_describe('3x11_15 counting', function() {
	_it('go through a whole match', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 9, 9);
		var s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [9, 9]);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.match.team1_won, null);
		assert.deepStrictEqual(s.timer, false);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [10, 9]);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, true);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.match.team1_won, null);
		assert.deepStrictEqual(s.timer, false);

		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 100000,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [11, 9]);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.game, true);
		assert.strictEqual(s.game.finished, true);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.game.team1_won, true);
		assert.strictEqual(s.match.team1_won, null);
		assert.deepStrictEqual(s.timer, {
			duration: 120000,
			exigent: 25000,
			start: 100000,
		});

		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 10, 10);
		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [1, 0]);
		assert.deepStrictEqual(s.game.score, [10, 11]);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.match.team1_won, null);
		assert.deepStrictEqual(s.timer, false);

		press_score(presses, 0, 2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [12, 11]);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.match.team1_won, null);
		assert.deepStrictEqual(s.timer, false);

		press_score(presses, 2, 0);
		press_score(presses, 0, 2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [14, 13]);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, true);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.match.team1_won, null);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [14, 14]);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, true);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.match.team1_won, null);

		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 200000,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [14, 15]);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.game, true);
		assert.strictEqual(s.game.finished, true);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.game.team1_won, false);
		assert.strictEqual(s.match.team1_won, null);
		assert.deepStrictEqual(s.timer, {
			duration: 120 * 1000,
			exigent: 25000,
			start: 200000,
		});

		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [0, 0]);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.match.team1_won, null);
		assert.deepStrictEqual(s.timer, false);

		press_score(presses, 5, 5);
		presses.push({
			type: 'score',
			side: 'right',
			timestamp: 300000,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [5, 6]);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.interval, true);
		assert.strictEqual(s.game.change_sides, true);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.match.team1_won, null);
		assert.deepStrictEqual(s.timer, {
			duration: 60 * 1000,
			exigent: 25000,
			start: 300000,
		});

		press_score(presses, 0, 6);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [11, 6]);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.game, true);
		assert.strictEqual(s.game.finished, true);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.game.team1_won, true);
		assert.strictEqual(s.match.team1_won, true);
		assert.deepStrictEqual(s.timer, false);
	});

	_it('game_winner helper function', function() {
		assert.equal(bup.calc.game_winner('3x11_15', 0, 11, 9), 'left');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 9, 11), 'right');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 12, 10), 'left');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 12, 14), 'right');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 13, 15), 'right');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 14, 15), 'right');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 0, 0), 'inprogress');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 10, 9), 'inprogress');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 11, 10), 'inprogress');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 11, 11), 'inprogress');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 12, 12), 'inprogress');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 12, 13), 'inprogress');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 13, 12), 'inprogress');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 13, 13), 'inprogress');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 14, 13), 'inprogress');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 13, 14), 'inprogress');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 14, 11), 'invalid');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 16, 9), 'invalid');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 18, 18), 'invalid');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 19, 18), 'invalid');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 20, 18), 'invalid');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 15, 18), 'invalid');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 14, 17), 'invalid');
		assert.equal(bup.calc.game_winner('3x11_15', 0, 13, 17), 'invalid');
	});

	_it('match_winner helper function', function() {
		assert.equal(
			bup.calc.match_winner('3x11_15', [[10, 9]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('3x11_15', [[15, 13]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('3x11_15', [[15, 13], [12, 14]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('3x11_15', [[11, 9], [11, 9]]),
			'left');
		assert.equal(
			bup.calc.match_winner('3x11_15', [[11, 9], [11, 13], [5, 11]]),
			'right');
	});

	_it('calc.netscore', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}];

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 1,
			player_id: 0,
		});
		var s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 0], [11, 0]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[0, 11], [0, 11]]);

		press_score(presses, 3, 2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[3, 2]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 2], [11, 0]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[3, 11], [0, 11]]);

		press_score(presses, 8, 6);
		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 11, 10);

		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 8], [10, 11]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[11, 8], [13, 11]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[11, 8], [10, 12], [0, 11]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 8], [10, 12]]);

		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 5, 5);
		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [6, 5]);
		assert.equal(s.game.interval, true);

		press_score(presses, 5, 4);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [10, 10]);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 8], [10, 12], [10, 10]]);

		press_score(presses, 1, 1);
		press_score(presses, 1, 1);
		press_score(presses, 1, 1);
		press_score(presses, 1, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [14, 14]);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, true);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 8], [10, 12], [14, 14]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 8], [10, 12], [14, 15]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[11, 8], [10, 12], [15, 14]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 8], [10, 12], [14, 15]]);
		assert.equal(s.game.game, true);
	});

	_it('game.teams_player1_even', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}];
		var start_presses = presses.slice();
		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [null, null]);

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [true, null]);

		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [true, true]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [true, true]);

		presses = start_presses.slice();
		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [false, null]);

		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [false, false]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [false, false]);

		press_score(presses, 11, 2);
		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [null, null]);

		var g1_sav = presses.slice();
		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [true, null]);

		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [true, false]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [true, false]);

		presses = g1_sav.slice();
		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [false, null]);

		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [false, true]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.teams_player1_even, [false, true]);
	});
});
