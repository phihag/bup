
var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;
var SINGLES_SETUP = tutils.SINGLES_SETUP;
var press_score = tutils.press_score;
var state_after = tutils.state_after;

(function() {
'use strict';

_describe('calc.netscore', function() {
	_it('whole example game', function() {
		var presses = [];
		var s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), []);

		presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), []);

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), []);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[0, 0]]);

		press_score(presses, 5, 2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[5, 2]]);

		press_score(presses, 3, 19);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[8, 21]]);

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[8, 21]]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[8, 21], [0, 0]]);

		press_score(presses, 17, 21);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[8, 21], [21, 17]]);

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[8, 21], [21, 17]]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[8, 21], [21, 17], [0, 0]]);

		press_score(presses, 10, 10);
		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[8, 21], [21, 17], [11, 10]]);

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[8, 21], [21, 17], [11, 11]]);

		press_score(presses, 12, 10);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[8, 21], [21, 17], [21, 23]]);
	});

	_it('red cards before second game', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: false,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		var s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[0, 0]]);

		press_score(presses, 6, 21);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[21, 6]]);

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 1,
		});
		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[21, 6], [1, 0]]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[21, 6], [1, 0]]);
	});

	_it('retiring / disqualification', function() {
		var base_presses = [{
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
		press_score(base_presses, 5, 7);
		var s = state_after(base_presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[7, 5]]);

		var presses = base_presses.slice();
		presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[7, 21], [0, 21]]);

		presses = base_presses.slice();
		presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[7, 21], [0, 21]]);

		press_score(base_presses, 2, 0);
		press_score(base_presses, 18, 18);
		s = state_after(base_presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[25, 25]]);

		presses = base_presses.slice();
		presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[27, 25], [21, 0]]);

		presses = base_presses.slice();
		presses.push({
			type: 'retired',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[27, 25], [21, 0]]);

		press_score(base_presses, 0, 2);
		base_presses.push({
			type: 'postgame-confirm',
		});
		base_presses.push({
			type: 'love-all',
		});
		presses = base_presses.slice();
		press_score(presses, 29, 29);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[27, 25], [29, 29]]);

		presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[27, 25], [29, 30], [0, 21]]);

		presses = [];
		presses.push({
			type: 'retired',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[21, 0], [21, 0]]);
	});

	_it('always_zero option', function() {
		var s = state_after([], SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), []);
		assert.deepEqual(bup.calc.netscore(s, true), [[0, 0]]);
	});

	_it('after match end', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}, {
			type: 'editmode_set-finished_games',
			scores: [[21, 18]],
		}];
		var s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 18]);
		assert.deepEqual(s.match.game_score, [1, 0]);
		assert.deepEqual(bup.calc.netscore(s), [[21, 18], [0, 0]]);

		press_score(presses, 21, 12);
		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 18]);
		assert.deepEqual(s.match.game_score, [2, 0]);
		assert.strictEqual(s.match.finished, true);

		assert.deepEqual(bup.calc.netscore(s), [[21, 18], [21, 12]]);

		presses.push({
			type: 'postmatch-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(bup.calc.netscore(s), [[21, 18], [21, 12]]);
	});

	_it('calc.netscore with state_at', function() {
		function _assert_network_score(scores) {
			var s = tutils.state_at(scores);
			assert.deepEqual(bup.calc.netscore(s), scores);
		}

		_assert_network_score([[12, 13]]);
		_assert_network_score([[0, 0]]);
		_assert_network_score([[21, 23], [21, 5]]);
		_assert_network_score([[21, 23], [9, 5]]);
		_assert_network_score([[21, 23], [21, 5], [30, 29]]);
	});
});

})();
