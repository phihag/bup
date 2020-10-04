'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;

var press_score = tutils.press_score;
var state_after = tutils.state_after;
var bup = tutils.bup;


var DOUBLES_SETUP = bup.utils.deep_copy(tutils.DOUBLES_SETUP);
DOUBLES_SETUP.counting = '5x11_11';
var SINGLES_SETUP = bup.utils.deep_copy(tutils.SINGLES_SETUP);
SINGLES_SETUP.counting = '5x11_11';


_describe('UAE 5x11_11 sudden death scoring', function() {
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

		press_score(presses, 4, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [0, 0]);
		assert.deepStrictEqual(s.game.score, [10, 5]);
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
		assert.deepStrictEqual(s.game.score, [10, 6]);
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
		assert.deepStrictEqual(s.game.score, [11, 6]);
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
			duration: 60 * 1000,
			exigent: 25000,
			start: 1000,
		});
		assert.strictEqual(pronounce_de(s),
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von Alice 11-6');
		assert.strictEqual(pronounce_en(s),
			'Game.\n\n' +
			'First game won by Alice 11-6');

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
			duration: 60 * 1000,
			exigent: 25000,
			start: 1000,
		});
		assert.strictEqual(pronounce_de(s),
			'Zweiter Satz. 0 beide.\nBitte spielen.');
		assert.strictEqual(pronounce_en(s),
			'Second game; love all; play');

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

		press_score(presses, 9, 8);
		press_score(presses, 0, 2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [10, 9]);
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
		assert.strictEqual(pronounce_de(s),
			'10 Satzpunkt 9');
		assert.strictEqual(pronounce_en(s),
			'10 game point 9');

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [10, 10]);
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
		assert.strictEqual(pronounce_de(s),
			'Aufschlagwechsel. 10 Satzpunkt beide');
		assert.strictEqual(pronounce_en(s),
			'Service over. 10 game point all');

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'score',
			side: 'left',
			timestamp: 100000,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [10, 11]);
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
			duration: 60 * 1000,
			exigent: 25000,
			start: 100000,
		});
		assert.strictEqual(pronounce_de(s),
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von Bob 11-10; einen Satz beide');
		assert.strictEqual(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by Bob 11-10; One game all');

		alt_presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.strictEqual(s.game.team1_left, true);
		assert.strictEqual(pronounce_de(s),
			'Dritter Satz. 0 beide.\nBitte spielen.');
		assert.strictEqual(pronounce_en(s),
			'Third game; love all; play');

		// Back to the original match
		presses.push({
			type: 'score',
			side: 'right',
			timestamp: 130000,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [11, 10]);
		assert.deepStrictEqual(bup.calc.gamescore(s), [2, 0]);
		assert.strictEqual(s.game.team1_left, false);
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
			duration: 60000,
			start: 130000,
			exigent: 25000,
		});
		assert.strictEqual(pronounce_de(s),
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von Alice 11-10. Alice führt mit 2:0 Sätzen');
		assert.strictEqual(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by Alice 11-10. Alice leads two games to love');

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [2, 0]);
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
			duration: 60000,
			start: 130000,
			exigent: 25000,
		});
		assert.strictEqual(pronounce_de(s),
			'Dritter Satz. 0 beide.\nBitte spielen.');
		assert.strictEqual(pronounce_en(s),
			'Third game; love all; play');

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

		press_score(presses, 6, 5);
		s = state_after(presses, SINGLES_SETUP);
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

		press_score(presses, 4, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [10, 5]);
		assert.strictEqual(s.game.team1_left, true);
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
		assert.deepStrictEqual(s.game.score, [11, 5]);
		assert.strictEqual(s.game.team1_left, true);
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
			'Das Spiel wurde gewonnen von Alice 11-6 11-10 11-5');
		assert.strictEqual(pronounce_en(s),
			'Game.\n\n' +
			'Match won by Alice 11-6 11-10 11-5');

		alt_presses.push({
			type: 'postmatch-confirm',
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [11, 5]);
		assert.strictEqual(s.game.team1_left, true);
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
			'Das Spiel wurde gewonnen von Alice 11-6 11-10 11-5');
		assert.strictEqual(pronounce_en(s),
			'Game.\n\n' +
			'Match won by Alice 11-6 11-10 11-5');

		press_score(presses, 0, 5);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [10, 10]);
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
			side: 'right',
			timestamp: 140000,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [10, 11]);
		assert.strictEqual(s.game.team1_left, true);
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
			duration: 60000,
			start: 140000,
			exigent: 25000,
		});
		assert.strictEqual(pronounce_de(s),
			'Satz.\n\n' +
			'Der dritte Satz wurde gewonnen von Bob 11-10. Alice führt mit 2:1 Sätzen');
		assert.strictEqual(pronounce_en(s),
			'Game.\n\n' +
			'Third game won by Bob 11-10. Alice leads two games to one');

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [2, 1]);
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
			duration: 60000,
			start: 140000,
			exigent: 25000,
		});
		assert.strictEqual(pronounce_de(s),
			'Vierter Satz. 0 beide.\nBitte spielen.');
		assert.strictEqual(pronounce_en(s),
			'Fourth game; love all; play');

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

		press_score(presses, 6, 2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [2, 6]);
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

		press_score(presses, 3, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [2, 9]);
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
		press_score(alt_presses, 0, 8);
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [10, 9]);
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

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [2, 10]);
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

		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 250000,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [2, 11]);
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
			duration: 60000,
			start: 250000,
			exigent: 25000,
		});
		assert.strictEqual(pronounce_de(s),
			'Satz.\n\n' +
			'Der vierte Satz wurde gewonnen von Bob 11-2; zwei Sätze beide');
		assert.strictEqual(pronounce_en(s),
			'Game.\n\n' +
			'Fourth game won by Bob 11-2; Two games all');

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [2, 2]);
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
			duration: 60000,
			start: 250000,
			exigent: 25000,
		});
		assert.strictEqual(pronounce_de(s),
			'Entscheidungssatz. 0 beide.\nBitte spielen.');
		assert.strictEqual(pronounce_en(s),
			'Final game; love all; play');

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [2, 2]);
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
		assert.strictEqual(pronounce_de(s), null);
		assert.strictEqual(pronounce_en(s), null);

		press_score(presses, 4, 5);
		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [5, 5]);
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
		assert.strictEqual(pronounce_de(s), 'Aufschlagwechsel. 5 beide');
		assert.strictEqual(pronounce_en(s), 'Service over. 5 all');

		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 300000,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [6, 5]);
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
		assert.strictEqual(pronounce_de(s, 300001),
			'6-5 Pause. Feldseiten wechseln.\n\n' +
			'6-5. Bitte spielen.');
		assert.strictEqual(pronounce_en(s, 300001),
			'6-5 Interval; change ends\n\n' +
			'6-5. Play.');


		press_score(presses, 4, 3);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [9, 9]);
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
		assert.deepStrictEqual(bup.calc.gamescore(s), [2, 2]);
		assert.deepStrictEqual(s.game.score, [9, 10]);
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
		assert.deepStrictEqual(bup.calc.gamescore(s), [2, 3]);
		assert.deepStrictEqual(s.game.score, [9, 11]);
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
		assert.strictEqual(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von Bob 6-11 10-11 11-10 11-2 11-9');
		assert.strictEqual(pronounce_en(s),
			'Game.\n\n' +
			'Match won by Bob 6-11 10-11 11-10 11-2 11-9');

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [10, 10]);
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
		assert.strictEqual(pronounce_de(s),
			'Aufschlagwechsel. 10 Spielpunkt beide');
		assert.strictEqual(pronounce_en(s),
			'Service over. 10 match point all');

		alt_presses = presses.slice();
		press_score(alt_presses, 1, 0);
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [2, 3]);
		assert.deepStrictEqual(s.game.score, [10, 11]);
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
		assert.strictEqual(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von Bob 6-11 10-11 11-10 11-2 11-10');
		assert.strictEqual(pronounce_en(s),
			'Game.\n\n' +
			'Match won by Bob 6-11 10-11 11-10 11-2 11-10');

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [3, 2]);
		assert.deepStrictEqual(s.game.score, [11, 10]);
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
			'Das Spiel wurde gewonnen von Alice 11-6 11-10 10-11 2-11 11-10');
		assert.strictEqual(pronounce_en(s),
			'Game.\n\n' +
			'Match won by Alice 11-6 11-10 10-11 2-11 11-10');

		presses.push({
			type: 'postmatch-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.gamescore(s), [3, 2]);
		assert.deepStrictEqual(s.game.score, [11, 10]);
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
			'Das Spiel wurde gewonnen von Alice 11-6 11-10 10-11 2-11 11-10');
		assert.strictEqual(pronounce_en(s),
			'Game.\n\n' +
			'Match won by Alice 11-6 11-10 10-11 2-11 11-10');
	});

	_it('game_winner helper function', function() {
		assert.equal(bup.calc.game_winner('5x11_11', 0, 11, 9), 'left');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 9, 11), 'right');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 11, 10), 'left');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 10, 11), 'right');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 1, 11), 'right');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 0, 11), 'right');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 0, 0), 'inprogress');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 10, 9), 'inprogress');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 10, 10), 'inprogress');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 5, 2), 'inprogress');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 10, 0), 'inprogress');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 12, 9), 'invalid');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 12, 10), 'invalid');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 12, 11), 'invalid');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 13, 11), 'invalid');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 11, 11), 'invalid');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 11, 12), 'invalid');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 10, 12), 'invalid');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 17, 15), 'invalid');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 15, 16), 'invalid');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 15, 15), 'invalid');
		assert.equal(bup.calc.game_winner('5x11_11', 0, 14, 11), 'invalid');
	});

	_it('match_winner helper function', function() {
		assert.equal(
			bup.calc.match_winner('5x11_11', [[10, 9]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('5x11_11', [[10, 10]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('5x11_11', [[11, 10], [11, 3]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('5x11_11', [[11, 10], [11, 3], [2, 11], [2, 4]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('5x11_11', [[1, 11], [11, 3], [2, 11], [11, 10], [2, 4]]),
			'inprogress');
		assert.equal(
			bup.calc.match_winner('5x11_11', [[11, 10], [11, 9], [11, 3]]),
			'left');
		assert.equal(
			bup.calc.match_winner('5x11_11', [[11, 10], [11, 9], [1, 11], [5, 11], [11, 10]]),
			'left');
		assert.equal(
			bup.calc.match_winner('5x11_11', [[11, 9], [5, 11], [2, 11], [7, 11]]),
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
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 0], [11, 0], [11, 0]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[0, 11], [0, 11], [0, 11]]);

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
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 2], [11, 0], [11, 0]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[3, 11], [0, 11], [0, 11]]);

		press_score(presses, 7, 8);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[10, 10]]);

		press_score(presses, 1, 0);
		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 8, 7);

		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 10], [7, 8]]);

		press_score(presses, 2, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 10], [8, 10]]);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 10], [9, 10]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 10], [9, 11]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[11, 10], [9, 11], [0, 11], [0, 11]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[11, 10], [9, 11], [11, 0], [11, 0]]);

		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 10], [9, 11], [0, 0]]);

		press_score(presses, 7, 7);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [7, 7]);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 10], [9, 11], [7, 7]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [8, 7]);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 10], [9, 11], [8, 7]]);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [8, 8]);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 10], [9, 11], [8, 8]]);

		press_score(presses, 2, 2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 10], [9, 11], [10, 10]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[11, 10], [9, 11], [10, 11], [0, 11]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[11, 10], [9, 11], [11, 10], [11, 0]]);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(bup.calc.netscore(s), [[11, 10], [9, 11], [11, 10]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[11, 10], [9, 11], [11, 10], [11, 0]]);

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepStrictEqual(
			bup.calc.netscore(s), [[11, 10], [9, 11], [11, 10], [0, 11], [0, 11]]);
	});
});
