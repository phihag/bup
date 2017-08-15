'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;

var press_score = tutils.press_score;
var state_after = tutils.state_after;
var bup = tutils.bup;


var DOUBLES_SETUP = bup.utils.deep_copy(tutils.DOUBLES_SETUP);
DOUBLES_SETUP.counting = '3x15_18';
var SINGLES_SETUP = bup.utils.deep_copy(tutils.SINGLES_SETUP);
SINGLES_SETUP.counting = '3x15_18';


_describe('Short Swiss Match (3x15_18)', function() {
	_it('go through a whole match', function() {
		var test_pronunciation = require('./test_pronunciation');
		var pronounce_dech = test_pronunciation.pronounce_dech;
		var pronounce_frch = test_pronunciation.pronounce_frch;

		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}];
		press_score(presses, 6, 5);
		var s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [6, 5]);
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
		assert.deepStrictEqual(s.game.score, [7, 5]);
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
			timestamp: 500,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [8, 5]);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(s.game.interval, true);
		assert.strictEqual(s.game.change_sides, false);
		assert.strictEqual(s.game.matchpoint, false);
		assert.strictEqual(s.game.gamepoint, false);
		assert.strictEqual(s.game.game, false);
		assert.strictEqual(s.game.finished, false);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.game.team1_won, null);
		assert.strictEqual(s.match.team1_won, null);
		assert.deepStrictEqual(s.timer, {
			duration: 60000,
			exigent: 25000,
			start: 500,
		});

		press_score(presses, 6, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [0, 0]);
		assert.deepStrictEqual(s.game.score, [14, 5]);
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

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [14, 6]);
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
		assert.deepStrictEqual(s.game.score, [15, 6]);
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
			duration: 120 * 1000,
			exigent: 25000,
			start: 1000,
		});
		assert.strictEqual(pronounce_dech(s),
			'Satz.\n\n' +
			'Erster Satz gewonnen von Alice 15-6');
		assert.strictEqual(pronounce_frch(s),
			'Set.\n\n' +
			'Premier set gagné par Alice 15-6');

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [0, 0]);
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
		assert.deepStrictEqual(s.timer, {
			duration: 120 * 1000,
			exigent: 25000,
			start: 1000,
		});
		assert.strictEqual(pronounce_dech(s),
			'Zweiter Satz. 0 beide.\nBitte spielen.');

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [0, 0]);
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

		press_score(presses, 7, 7);
		presses.push({
			type: 'score',
			side: 'right',
			timestamp: 1500,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [8, 7]);
		assert.strictEqual(s.game.team1_left, false);
		assert.strictEqual(s.game.interval, true);
		assert.strictEqual(s.game.change_sides, false);
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
			start: 1500,
		});

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [8, 8]);
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

		press_score(presses, 5, 5);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [13, 13]);
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
		assert.deepStrictEqual(s.game.score, [13, 14]);
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
		assert.deepStrictEqual(s.timer, false);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [14, 14]);
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
		assert.deepStrictEqual(s.game.score, [14, 15]);
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

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'score',
			side: 'left',
			timestamp: 100000,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [14, 16]);
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
			start: 100000,
		});
		assert.strictEqual(pronounce_dech(s),
			'Satz.\n\n' +
			'Zweiter Satz gewonnen von Bob 16-14; einen Satz beide');

		alt_presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(pronounce_dech(s),
			'Entscheidungssatz. 0 beide.\nBitte spielen.');
		assert.strictEqual(pronounce_frch(s),
			'Set décisif. 0 partout.\nJouez.');

		// Back to the original match
		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [15, 15]);
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
		assert.deepStrictEqual(s.game.score, [15, 16]);
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
		alt_presses.push({
			type: 'score',
			side: 'left',
			timestamp: 120000,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [15, 17]);
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
			duration: 120000,
			start: 120000,
			exigent: 25000,
		});
		assert.strictEqual(pronounce_dech(s),
			'Satz.\n\n' +
			'Zweiter Satz gewonnen von Bob 17-15; einen Satz beide');
		assert.strictEqual(pronounce_frch(s),
			'Set.\n\n' +
			'Deuxième set gagné par Bob 17-15. Un set partout');

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [16, 16]);
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
		assert.deepStrictEqual(s.game.score, [16, 17]);
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
		assert.deepStrictEqual(s.timer, false);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'score',
			side: 'left',
			timestamp: 120000,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [16, 18]);
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
			duration: 120000,
			start: 120000,
			exigent: 25000,
		});
		assert.strictEqual(pronounce_dech(s),
			'Satz.\n\n' +
			'Zweiter Satz gewonnen von Bob 18-16; einen Satz beide');
		assert.strictEqual(pronounce_frch(s),
			'Set.\n\n' +
			'Deuxième set gagné par Bob 18-16. Un set partout');

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [17, 17]);
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
		assert.strictEqual(pronounce_dech(s),
			'Aufschlagwechsel. 17 Spielpunkt beide');
		assert.strictEqual(pronounce_frch(s),
			'Changement de service. 17 point de match partout');

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'score',
			side: 'right',
			timestamp: 120000,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [18, 17]);
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
		assert.strictEqual(pronounce_dech(s),
			'Satz.\n\n' +
			'Spiel gewonnen von Alice 15-6 18-17');
		assert.strictEqual(pronounce_frch(s),
			'Set.\n\n' +
			'Match gagné par Alice 15-6 18-17');

		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 130000,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [17, 18]);
		assert.deepStrictEqual(bup.calc.gamescore(s), [1, 1]);
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
			duration: 120000,
			start: 130000,
			exigent: 25000,
		});
		assert.strictEqual(pronounce_dech(s),
			'Satz.\n\n' +
			'Zweiter Satz gewonnen von Bob 18-17; einen Satz beide');
		assert.strictEqual(pronounce_frch(s),
			'Set.\n\n' +
			'Deuxième set gagné par Bob 18-17. Un set partout');

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [1, 1]);
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
		assert.deepStrictEqual(s.timer, {
			duration: 120000,
			start: 130000,
			exigent: 25000,
		});
		assert.strictEqual(pronounce_dech(s),
			'Entscheidungssatz. 0 beide.\nBitte spielen.');

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [1, 1]);
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
		assert.strictEqual(pronounce_dech(s), null);

		press_score(presses, 6, 7);
		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [7, 7]);
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
		assert.strictEqual(pronounce_dech(s), 'Aufschlagwechsel. 7 beide');

		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 300000,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [8, 7]);
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
			start: 300000,
			duration: 60000,
			exigent: 25000,
		});
		assert.strictEqual(pronounce_dech(s, 300001),
			'8-7 Pause. Seitenwechsel.\n\n' +
			'8-7. Bitte spielen.');
		assert.strictEqual(pronounce_frch(s, 300001),
			'8-7 pause. Changez de côté.\n\n' +
			'8-7. Jouez.');

		press_score(presses, 6, 5);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [13, 13]);
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
		assert.deepStrictEqual(bup.calc.gamescore(s), [1, 1]);
		assert.deepStrictEqual(s.game.score, [13, 14]);
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
		assert.deepStrictEqual(bup.calc.gamescore(s), [1, 2]);
		assert.deepStrictEqual(s.game.score, [13, 15]);
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
		assert.strictEqual(pronounce_dech(s),
			'Satz.\n\n' +
			'Spiel gewonnen von Bob 6-15 18-17 15-13');
		assert.strictEqual(pronounce_frch(s),
			'Set.\n\n' +
			'Match gagné par Bob 6-15 18-17 15-13');

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [14, 14]);
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

		press_score(presses, 2, 2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [16, 16]);
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
		assert.strictEqual(pronounce_dech(s),
			'Aufschlagwechsel. 16 beide');

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [17, 16]);
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
		assert.strictEqual(pronounce_dech(s),
			'17 Spielpunkt 16');

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [17, 17]);
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
		assert.strictEqual(pronounce_dech(s),
			'Aufschlagwechsel. 17 Spielpunkt beide');
		assert.strictEqual(pronounce_frch(s),
			'Changement de service. 17 point de match partout');

		alt_presses = presses.slice();
		press_score(alt_presses, 1, 0);
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [1, 2]);
		assert.deepStrictEqual(s.game.score, [17, 18]);
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
		assert.strictEqual(pronounce_dech(s),
			'Satz.\n\n' +
			'Spiel gewonnen von Bob 6-15 18-17 18-17');
		assert.strictEqual(pronounce_frch(s),
			'Set.\n\n' +
			'Match gagné par Bob 6-15 18-17 18-17');


		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [2, 1]);
		assert.deepStrictEqual(s.game.score, [18, 17]);
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
		assert.strictEqual(pronounce_dech(s),
			'Satz.\n\n' +
			'Spiel gewonnen von Alice 15-6 17-18 18-17');
		assert.strictEqual(pronounce_frch(s),
			'Set.\n\n' +
			'Match gagné par Alice 15-6 17-18 18-17');

		presses.push({
			type: 'postmatch-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [2, 1]);
		assert.deepStrictEqual(s.game.score, [18, 17]);
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
		assert.strictEqual(pronounce_dech(s),
			'Satz.\n\n' +
			'Spiel gewonnen von Alice 15-6 17-18 18-17');
		assert.strictEqual(pronounce_frch(s),
			'Set.\n\n' +
			'Match gagné par Alice 15-6 17-18 18-17');
	});

	_it('game_winner helper function', function() {
		assert.equal(bup.calc.game_winner('3x15_18', 0, 15, 13), 'left');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 13, 15), 'right');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 16, 14), 'left');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 15, 17), 'right');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 17, 18), 'right');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 16, 18), 'right');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 0, 0), 'inprogress');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 10, 9), 'inprogress');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 14, 14), 'inprogress');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 14, 13), 'inprogress');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 17, 16), 'inprogress');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 16, 16), 'inprogress');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 14, 15), 'inprogress');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 16, 15), 'inprogress');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 16, 9), 'invalid');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 18, 18), 'invalid');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 19, 18), 'invalid');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 20, 18), 'invalid');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 15, 18), 'invalid');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 14, 17), 'invalid');
		assert.equal(bup.calc.game_winner('3x15_18', 0, 13, 17), 'invalid');
	});

	_it('match_winner helper function', function() {
		assert.equal(
			bup.calc.match_winner('3x15_18', [[10, 9]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('3x15_18', [[15, 13]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('3x15_18', [[15, 13], [12, 14]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('3x15_18', [[15, 9], [15, 9]]),
			'left');
		assert.equal(
			bup.calc.match_winner('3x15_18', [[15, 9], [15, 17], [12, 15]]),
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
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 0], [15, 0]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[0, 15], [0, 15]]);

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
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 2], [15, 0]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[3, 15], [0, 15]]);

		press_score(presses, 12, 11);
		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 8, 7);

		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [7, 8]]);

		press_score(presses, 2, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [8, 10]]);

		press_score(presses, 4, 4);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [12, 14]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[15, 13], [12, 15], [0, 15]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[15, 13], [16, 14]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [12, 15]]);

		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [12, 15], [0, 0]]);

		press_score(presses, 7, 7);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [7, 7]);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [12, 15], [7, 7]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [8, 7]);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [12, 15], [8, 7]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [8, 8]);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [12, 15], [8, 8]]);

		press_score(presses, 6, 6);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [12, 15], [14, 14]]);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [12, 15], [15, 14]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [12, 15], [15, 15]]);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [12, 15], [16, 15]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[15, 13], [12, 15], [16, 18]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[15, 13], [12, 15], [17, 15]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [12, 15], [16, 16]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[15, 13], [12, 15], [18, 16]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[15, 13], [12, 15], [16, 18]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [12, 15], [16, 17]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[15, 13], [12, 15], [18, 17]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[15, 13], [12, 15], [16, 18]]);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[15, 13], [12, 15], [17, 17]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[15, 13], [12, 15], [18, 17]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[15, 13], [12, 15], [17, 18]]);
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

		press_score(presses, 15, 2);
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
