'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var SINGLES_SETUP = tutils.SINGLES_SETUP;
var press_score = tutils.press_score;
var state_after = tutils.state_after;

_describe('network functions', function() {
	_it('network_calc_score', function() {
		var presses = [];
		var s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[]]);

		presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[]]);

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[]]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[0, 0]]);

		press_score(presses, 5, 2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[5, 2]]);

		press_score(presses, 3, 19);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[8, 21]]);

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[8, 21]]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[8, 21], [0, 0]]);

		press_score(presses, 17, 21);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[8, 21], [21, 17]]);

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[8, 21], [21, 17]]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[8, 21], [21, 17], [0, 0]]);

		press_score(presses, 10, 10);
		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[8, 21], [21, 17], [11, 10]]);

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[8, 21], [21, 17], [11, 11]]);

		press_score(presses, 12, 10);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[8, 21], [21, 17], [21, 23]]);
	});

	_it('network_calc_score with red cards before match / game', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: false,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'red-card',
			team_id: 0,
			player_id: 0,
		}];
		// Show state before love all if red cards have been given
		var s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[0, 1]]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[0, 1]]);

		press_score(presses, 5, 21);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[21, 6]]);

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 1,
		});
		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[21, 6], [1, 0]]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[21, 6], [1, 0]]);
	});

	_it('network_calc_score with disqualification', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: false,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
			team_id: 0,
			player_id: 0,
		}];
		// Show state before love all if red cards have been given
		var s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[0, 1]]);

		presses.push({
			type: 'love-all',
		});
	});

	_it('network_calc_score with retiring', function() {
		var presses = [{
			type: 'retired',
			team_id: 0,
			player_id: 0,
		}];
		var s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.network_calc_score(s), [[0, 21], [0, 21]]);
	});

});