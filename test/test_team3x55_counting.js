'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;

const {assert_flags, bup, press_score, state_after} = tutils;
const {pronounce_en} = require('./test_pronunciation.js');


var SINGLES_TEAM_SETUP = bup.utils.deep_copy(tutils.SINGLES_TEAM_SETUP);
SINGLES_TEAM_SETUP.counting = 'team3x55';


_describe('team 3x55 counting', function() {
	_it('go through a whole match', function() {
		let presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 5, 5);
		let s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.team1_left, true);
		assert.deepStrictEqual(s.game.score, [5, 5]);
		assert_flags(s, []);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [6, 5]);
		assert_flags(s, ['interval', 'timer']);
		assert.deepStrictEqual(s.timer.duration, 60000);

		press_score(presses, 4, 0);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [10, 5]);
		assert_flags(s, []); // could eventually be gamepoint

		press_score(presses, 1, 0, {timestamp: 1000});
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [11, 5]);
		assert_flags(s, ['interval', 'timer']); // could eventually be game
		assert.deepStrictEqual(s.timer.duration, 120000);
		assert.equal(pronounce_en(s, 1000), '11-5 Interval\n\n11-5. Play.'); // TODO: game instead?

		presses.push({type: 'red-card', team_id: 0, player_id: 0});
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [11, 6]);
		assert_flags(s, ['interval', 'timer']);
		assert.deepStrictEqual(s.timer.duration, 120000);

		press_score(presses, 42, 47);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [53, 53]);
		assert_flags(s, []);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [53, 54]);
		assert_flags(s, ['gamepoint']);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [54, 54]);
		assert_flags(s, ['gamepoint']);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [55, 54]);
		assert.deepStrictEqual(s.match.game_score, [1, 0]);
		assert_flags(s, ['game', 'finished', 'team1_won', 'timer']);
		assert.deepStrictEqual(s.timer.duration, 180000);

		presses.push({type: 'postgame-confirm'});
		presses.push({type: 'love-all'});
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [0, 0]);
		assert.deepStrictEqual(s.game.team1_left, false);
		assert_flags(s, []);

		press_score(presses, 0, 54);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [54, 0]);
		assert.deepStrictEqual(s.match.game_score, [1, 0]);
		assert_flags(s, ['matchpoint']);

		press_score(presses, 54, 0);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [54, 54]);
		assert_flags(s, ['gamepoint']);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [54, 55]);
		assert_flags(s, ['game', 'finished', '!team1_won', 'timer']);
		assert.deepStrictEqual(s.timer.duration, 180000);
		presses.push({type: 'postgame-confirm'});

		presses.push({type: 'love-all'});
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [0, 0]);
		assert.deepStrictEqual(s.game.team1_left, true);
		assert_flags(s, []);

		press_score(presses, 5, 0);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [5, 0]);
		assert.deepStrictEqual(s.game.team1_left, true);
		assert_flags(s, []);

		press_score(presses, 1, 0);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [6, 0]);
		assert.deepStrictEqual(s.game.team1_left, false);
		assert_flags(s, ['interval', 'change_sides', 'timer']);
		assert.deepStrictEqual(s.timer.duration, 60000);

		press_score(presses, 0, 4);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [10, 0]);
		assert.deepStrictEqual(s.game.team1_left, false);
		assert_flags(s, []);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [11, 0]);
		assert.deepStrictEqual(s.game.team1_left, false);
		assert_flags(s, ['interval', 'timer']);
		assert.deepStrictEqual(s.timer.duration, 120000);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [12, 0]);
		assert.deepStrictEqual(s.game.team1_left, false);
		assert_flags(s, []);

		press_score(presses, 0, 4);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [16, 0]);
		assert.deepStrictEqual(s.game.team1_left, false);

		press_score(presses, 0, 1);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [17, 0]);
		assert.deepStrictEqual(s.game.team1_left, true);
		assert_flags(s, ['interval', 'change_sides', 'timer']);
		assert.deepStrictEqual(s.timer.duration, 60000);

		press_score(presses, 11, 0);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.deepStrictEqual(s.game.score, [28, 0]);
		assert.deepStrictEqual(s.game.team1_left, false);
		assert_flags(s, ['interval', 'change_sides', 'timer']);
		assert.deepStrictEqual(s.timer.duration, 60000);
	});
});
