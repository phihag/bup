'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;

const {assert_flags, bup, press_score, state_after} = tutils;
const {pronounce_en} = require('./test_pronunciation.js');


var DOUBLES_SETUP = bup.utils.deep_copy(tutils.DOUBLES_SETUP);
DOUBLES_SETUP.counting = '3x15';
var SINGLES_SETUP = bup.utils.deep_copy(tutils.SINGLES_SETUP);
SINGLES_SETUP.counting = '3x15';


_describe('3x15 counting', function() {
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
		press_score(presses, 7, 7);
		var s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [7, 7]);
		assert_flags(s, []);

		press_score(presses, 1, 0, {timestamp: 1000});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [8, 7]);
		assert_flags(s, ['interval', 'timer']);
		assert.deepStrictEqual(s.timer, {
			duration: 60000,
			exigent: 25000,
			start: 1000
		});

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [8, 8]);
		assert_flags(s, []);

		press_score(presses, 5, 5);
		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [14, 13]);
		assert.strictEqual(s.game.team1_left, true);
		assert_flags(s, ['gamepoint']);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [15, 13]);
		assert.deepStrictEqual(s.match.game_score, [1, 0]);
		assert_flags(s, ['game', 'finished', 'team1_won', 'timer']);

		presses.push({type: 'undo'});
		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [14, 14]);
		assert_flags(s, []);
		
		press_score(presses, 0, 2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [14, 16]);
		assert_flags(s, ['game', 'finished', '!team1_won', 'timer']);
		presses.push({type: 'undo'});

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [15, 15]);
		assert_flags(s, []);

		press_score(presses, 2, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [17, 15]);
		assert_flags(s, ['game', 'finished', 'team1_won', 'timer']);
		presses.push({type: 'undo'});

		press_score(presses, 0, 2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [16, 17]);
		assert_flags(s, []);

		press_score(presses, 2, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [18, 17]);
		assert_flags(s, []);

		press_score(presses, 0, 2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [18, 19]);
		assert_flags(s, []);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [19, 19]);
		assert_flags(s, []);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [20, 19]);
		assert_flags(s, ['gamepoint']);
		assert.equal(pronounce_en(s, Date.now()), '20 game point 19');

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [20, 20]);
		assert_flags(s, ['gamepoint']);
		assert.equal(pronounce_en(s, Date.now()), 'Service over. 20 game point all');

		press_score(presses, 0, 1, {timestamp: 100000});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [20, 21]);
		assert_flags(s, ['game', 'finished', '!team1_won', 'timer']);
		assert.deepStrictEqual(s.timer, {
			duration: 120000,
     		exigent: 25000,
      		start: 100000,
		});

		presses.push({type: 'postgame-confirm'});
		presses.push({type: 'love-all'});
		press_score(presses, 1, 8, {timestamp: 200000});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [8, 1]);
		assert_flags(s, ['interval', 'timer']);
		assert.deepStrictEqual(s.timer, {
			duration: 60000,
     		exigent: 25000,
      		start: 200000,
		});

		press_score(presses, 0, 6);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.match.game_score, [0, 1]);
		assert.deepStrictEqual(s.game.score, [14, 1]);
		assert_flags(s, ['gamepoint']);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [14, 2]);
		assert_flags(s, []);

		press_score(presses, 13, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [14, 15]);
		assert_flags(s, []);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [15, 15]);
		assert_flags(s, []);

		press_score(presses, 1, 1);
		press_score(presses, 1, 1);
		press_score(presses, 1, 1);
		press_score(presses, 1, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [19, 19]);
		assert_flags(s, []);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [20, 19]);
		assert_flags(s, ['gamepoint']);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [20, 20]);
		assert_flags(s, ['matchpoint']);

		press_score(presses, 0, 1, {timestamp: 300000});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.match.game_score, [1, 1]);
		assert.deepStrictEqual(s.game.score, [21, 20]);
		assert_flags(s, ['game', 'finished', 'team1_won', 'timer']);
		assert.deepStrictEqual(s.timer, {
			duration: 120000,
     		exigent: 25000,
      		start: 300000,
		});

		presses.push({type: 'postgame-confirm'});
		presses.push({type: 'love-all'});
		press_score(presses, 0, 7);
		press_score(presses, 0, 1, {timestamp: 350000});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [0, 8]);
		assert_flags(s, ['interval', 'change_sides', 'timer']);
		assert.deepStrictEqual(s.timer, {
			duration: 60000,
     		exigent: 25000,
      		start: 350000,
		});

		press_score(presses, 6, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [0, 14]);
		assert_flags(s, ['matchpoint']);

		press_score(presses, 1, 0, {timestamp: 400000});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.game.score, [0, 15]);
		assert.deepStrictEqual(s.match.game_score, [1, 2]);
		assert_flags(s, ['game', 'finished', 'match_finished', '!team1_won', '!match_team1_won']);
	});
});
