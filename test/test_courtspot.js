'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;


_describe('courtspot', function() {
	var courtspot = tutils.bup.courtspot('');


	return; // TODO
	_it('calc_actions score', function() {
		function make_local(scores) {
			return tutils.state_at(scores, undefined, {
				court_id: '1',
			});
		}

		assert.deepEqual(courtspot.calc_actions(
			make_local([[0, 0]]), {
				score: [[0, 0]]
			}
		), []);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[0, 0]]), {
				score: []
			}
		), []);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[17, 19]]), {
				score: [[17, 19]]
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


		assert.deepEqual(courtspot.calc_actions(
			make_local([[17, 20]]), {
				score: [[17, 19]]
			}
		), [
			'/incrementOneRight'
		]);
		assert.deepEqual(courtspot.calc_actions(
			make_local([[17, 20]]), {
				score: [[17, 19]]
			}
		), [
			'/incrementOneLeft'
		]);
		// TODO test we're one game ahead
		// TODO first game of 3 is wrong
	});
});