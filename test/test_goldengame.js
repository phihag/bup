var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;

var press_score = tutils.press_score;
var state_after = tutils.state_after;
var bup = tutils.bup;

(function() {
'use strict';

var SINGLES_SETUP = bup.utils.deep_copy(tutils.SINGLES_SETUP);
SINGLES_SETUP.counting = '1x21';


_describe('Golden game (1x21) counting', function() {
	_it('go through a whole match', function() {
		var test_pronunciation = require('./test_pronunciation');
		var pronounce_de = test_pronunciation.pronounce_de;
		var pronounce_en = test_pronunciation.pronounce_en;

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
		assert.strictEqual(pronounce_de(s),
			'Aufschlagwechsel. 9 beide');
		assert.strictEqual(pronounce_en(s),
			'Service over. 9 all');

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [0, 0]);
		assert.deepStrictEqual(s.game.score, [10, 9]);
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

		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 1000,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [0, 0]);
		assert.deepStrictEqual(s.game.score, [11, 9]);
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
			start: 1000,
			duration: 60000,
			exigent: 25000,
		});

		press_score(presses, 0, 8);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [19, 9]);
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

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [20, 9]);
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
		assert.deepStrictEqual(s.timer, false);

		var alt_presses = presses.slice();
		press_score(alt_presses, 0, 1);
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [21, 9]);
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
		assert.strictEqual(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von Alice 21-9');
		assert.strictEqual(pronounce_en(s),
			'Game.\n\n' +
			'Match won by Alice 21-9');

		press_score(presses, 12, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [20, 21]);
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

		alt_presses = presses.slice();
		press_score(alt_presses, 1, 0);
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [20, 22]);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.game, true);
		assert.strictEqual(s.game.finished, true);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.game.team1_won, false);
		assert.strictEqual(s.match.team1_won, false);
		assert.deepStrictEqual(s.timer, false);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [21, 21]);
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

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [22, 21]);
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

		alt_presses = presses.slice();
		press_score(alt_presses, 0, 1);
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [23, 21]);
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

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [22, 22]);
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

		press_score(presses, 6, 6);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [28, 28]);
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

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [28, 29]);
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
		assert.deepStrictEqual(s.timer, false);

		alt_presses = presses.slice();
		press_score(alt_presses, 1, 0);
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [28, 30]);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.game, true);
		assert.strictEqual(s.game.finished, true);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.game.team1_won, false);
		assert.strictEqual(s.match.team1_won, false);
		assert.deepStrictEqual(s.timer, false);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [29, 29]);
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
		assert.deepStrictEqual(s.timer, false);

		alt_presses = presses.slice();
		press_score(alt_presses, 1, 0);
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [29, 30]);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.interval, false);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.game, true);
		assert.strictEqual(s.game.finished, true);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.game.team1_won, false);
		assert.strictEqual(s.match.team1_won, false);
		assert.deepStrictEqual(s.timer, false);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [30, 29]);
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

		presses.push({
			type: 'postmatch-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [30, 29]);
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
		assert.equal(bup.calc.game_winner('1x21', 0, 21, 19), 'left');
		assert.equal(bup.calc.game_winner('1x21', 0, 19, 21), 'right');
		assert.equal(bup.calc.game_winner('1x21', 0, 22, 20), 'left');
		assert.equal(bup.calc.game_winner('1x21', 0, 21, 23), 'right');
		assert.equal(bup.calc.game_winner('1x21', 0, 24, 26), 'right');
		assert.equal(bup.calc.game_winner('1x21', 0, 23, 25), 'right');
		assert.equal(bup.calc.game_winner('1x21', 0, 28, 30), 'right');
		assert.equal(bup.calc.game_winner('1x21', 0, 29, 30), 'right');
		assert.equal(bup.calc.game_winner('1x21', 0, 30, 29), 'left');
		assert.equal(bup.calc.game_winner('1x21', 0, 0, 0), 'inprogress');
		assert.equal(bup.calc.game_winner('1x21', 0, 20, 19), 'inprogress');
		assert.equal(bup.calc.game_winner('1x21', 0, 24, 23), 'inprogress');
		assert.equal(bup.calc.game_winner('1x21', 0, 24, 24), 'inprogress');
		assert.equal(bup.calc.game_winner('1x21', 0, 20, 21), 'inprogress');
		assert.equal(bup.calc.game_winner('1x21', 0, 22, 19), 'invalid');
		assert.equal(bup.calc.game_winner('1x21', 0, 32, 30), 'invalid');
		assert.equal(bup.calc.game_winner('1x21', 0, 31, 30), 'invalid');
		assert.equal(bup.calc.game_winner('1x21', 0, 31, 29), 'invalid');
		assert.equal(bup.calc.game_winner('1x21', 0, 30, 31), 'invalid');
		assert.equal(bup.calc.game_winner('1x21', 0, 30, 30), 'invalid');
		assert.equal(bup.calc.game_winner('1x21', 0, 24, 21), 'invalid');
	});

	_it('match_winner helper function', function() {
		assert.equal(
			bup.calc.match_winner('1x21', [[20, 19]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('1x21', [[21, 20]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('1x21', [[25, 23]]),
			'left');
		assert.equal(
			bup.calc.match_winner('1x21', [[7, 3]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('1x21', [[20, 22]]),
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
		assert.deepStrictEqual(bup.calc.netscore(s), [[21, 0]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[0, 21]]);

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
		assert.deepStrictEqual(bup.calc.netscore(s), [[21, 2]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[3, 21]]);

		press_score(presses, 7, 7);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[10, 9]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 9]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[11, 21]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[21, 9]]);

		press_score(presses, 11, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[12, 20]]);

		press_score(presses, 0, 9);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[21, 20]]);

		press_score(presses, 2, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[21, 22]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[21, 23]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[24, 22]]);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[22, 22]]);

		press_score(presses, 1, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[23, 23]]);

		press_score(presses, 5, 5);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[28, 28]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[28, 30]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[30, 28]]);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[29, 28]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[29, 30]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[30, 28]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[29, 29]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[29, 30]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[30, 29]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[29, 30]]);

		presses.push({
			type: 'postmatch-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[29, 30]]);
	});
});

})();