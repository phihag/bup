'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

function make_local(scores) {
	return tutils.state_at(scores, undefined, {
		court_id: '1',
	});
}

_describe('courtspot', function() {
	var courtspot = tutils.bup.courtspot('');

	_it('calc_actions score - simple counting', function() {
		assert.deepEqual(courtspot.calc_actions(
			make_local([[1, 2]]), {
				score: []
			}
		), [
			['+1', 'home', 0],
			['+1', 'away', 0],
			['+1', 'away', 0],
		]);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[1, 0]]), {
				score: []
			}
		), [
			['+1', 'home', 0],
		]);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[5, 4]]), {
				score: [[1, 1]]
			}
		), [
			['+1', 'home', 0],
			['+1', 'home', 0],
			['+1', 'home', 0],
			['+1', 'home', 0],
			['+1', 'away', 0],
			['+1', 'away', 0],
			['+1', 'away', 0],
		]);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[17, 20]]), {
				score: [[17, 19]]
			}
		), [
			['+1', 'away', 0],
		]);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[17, 21]]), {
				score: [[16, 20]]
			}
		), [
			['+1', 'home', 0],
			['+1', 'away', 0],
		]);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[21, 17]]), {
				score: [[20, 16]]
			}
		), [
			['+1', 'away', 0],
			['+1', 'home', 0],
		]);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[23, 23]]), {
				score: [[19, 19]]
			}
		), [
			['+1', 'home', 0],
			['+1', 'away', 0],
			['+1', 'home', 0],
			['+1', 'away', 0],
			['+1', 'home', 0],
			['+1', 'away', 0],
			['+1', 'home', 0],
			['+1', 'away', 0],
		]);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[23, 23]]), {
				score: [[19, 16]]
			}
		), [
			['+1', 'home', 0],
			['+1', 'away', 0],
			['+1', 'away', 0],
			['+1', 'away', 0],
			['+1', 'away', 0],
			['+1', 'home', 0],
			['+1', 'away', 0],
			['+1', 'home', 0],
			['+1', 'away', 0],
			['+1', 'home', 0],
			['+1', 'away', 0],
		]);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[23, 23]]), {
				score: [[16, 19]]
			}
		), [
			['+1', 'home', 0],
			['+1', 'home', 0],
			['+1', 'home', 0],
			['+1', 'home', 0],
			['+1', 'away', 0],
			['+1', 'home', 0],
			['+1', 'away', 0],
			['+1', 'home', 0],
			['+1', 'away', 0],
			['+1', 'home', 0],
			['+1', 'away', 0],
		]);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[17, 20]]), {
				score: [[17, 19]],
			}
		), [
			['+1', 'away', 0],
		]);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[17, 21], [2, 5]]), {
				score: [[16, 19]],
			}
		), [
			['+1', 'home', 0],
			['+1', 'away', 0],
			['+1', 'away', 0],
			['+1', 'home', 1],
			['+1', 'home', 1],
			['+1', 'away', 1],
			['+1', 'away', 1],
			['+1', 'away', 1],
			['+1', 'away', 1],
			['+1', 'away', 1],
		]);
	});

	_it('calc_actions score - reset', function() {
		assert.deepEqual(courtspot.calc_actions(
			make_local([[17, 21], [2, 3]]), {
				score: [[18, 21], [0, 0]]
			}
		), [
			['reset'],
		]);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[23, 21], [2, 3]]), {
				score: [[19, 21], [1, 0]]
			}
		), [
			['reset'],
		]);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[30, 29], [0, 0]]), {
				score: [[30, 29], [0, 0], [1, 0]],
			}
		), [
			['reset'],
		]);

	});

	_it('calc_actions score - undos', function() {
		assert.deepEqual(courtspot.calc_actions(
			make_local([[5, 5]]), {
				score: [[12, 12]]
			}
		), bup.utils.repeat(['undo'], 14));

		assert.deepEqual(courtspot.calc_actions(
			make_local([[15, 21], [2, 3]]), {
				score: [[18, 20]]
			}
		), [
			['undo'],
			['undo'],
			['undo'],
		]);
	});

	_it('calc_actions score - do not change if both states are identical', function() {
		// Side test - make sure we always end up at 0-0
		assert.deepEqual(bup.network.calc_score(make_local([[0, 0]])), [[0, 0]]);
		assert.deepEqual(bup.network.calc_score(make_local([[21, 12], [0, 0]])), [[21, 12], [0, 0]]);

		assert.deepEqual(courtspot.calc_actions(
			make_local([[0, 0]]), {
				score: [[0, 0]],
			}
		), []);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[0, 0]]), {
				score: [],  // This means an uninitialized match
			}
		), []);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[17, 19]]), {
				score: [[17, 19]]
			}
		), []);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[21, 19]]), {
				score: [[21, 19]]
			}
		), []);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[21, 19], [0, 0]]), {
				score: [[21, 19], [0, 0]]
			}
		), []);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[21, 19], [0, 0]]), {
				score: [[21, 19]]
			}
		), []);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[21, 19], [3, 21], [24, 24]]), {
				score: [[21, 19], [3, 21], [24, 24]]
			}
		), []);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[21, 19], [3, 21], [26, 24]]), {
				score: [[21, 19], [3, 21], [26, 24]]
			}
		), []);
	});
});