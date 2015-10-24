'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;


_describe('helper functions', function() {
	_it('duration_str', function() {
		assert.equal(bup.utils.duration_str(1420084800000, 1420093200000), '2:20');
		assert.equal(bup.utils.duration_str(1420109940000, 1420110660000), '0:12');
		assert.equal(bup.utils.duration_str(1420149600000, 1420155720000), '1:42'); // new day in CET
		assert.equal(bup.utils.duration_str(1420153260000, 1420171380000), '5:02'); // new day in UTC
		assert.equal(bup.utils.duration_str(1420110059000, 1420111201000), '0:20');
		assert.equal(bup.utils.duration_str(1420110001000, 1420111259000), '0:20');
		assert.equal(bup.utils.duration_str(1420110660000, 1420110710000), '0:00');
	});

	_it('deep_equal', function() {
		assert.strictEqual(bup.utils.deep_equal(1, 1), true);
		assert.strictEqual(bup.utils.deep_equal(1, 2), false);
		assert.strictEqual(bup.utils.deep_equal(1, '1'), false);
		assert.strictEqual(bup.utils.deep_equal([1, 2], [1, 2, 3]), false);
		assert.strictEqual(bup.utils.deep_equal([1, 2, 3], [1, 2, 3]), true);
		assert.strictEqual(bup.utils.deep_equal([1, 2, '3'], [1, 2, 3]), false);
		assert.strictEqual(bup.utils.deep_equal({x: 1, y: 2}, {x: 1, y: 2}), true);
		assert.strictEqual(bup.utils.deep_equal({x: 1, y: 2}, {x: 1, y: 3}), false);
		assert.strictEqual(bup.utils.deep_equal({x: 1, y: 2}, {x: 1, y: 2, z: 3}), false);
		assert.strictEqual(bup.utils.deep_equal({x: 1, y: 2}, {x: 1}), false);
	});
});