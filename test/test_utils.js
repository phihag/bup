var assert = require('assert');
var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

(function() {
'use strict';

_describe('helper functions', function() {
	_it('duration_mins', function() {
		assert.equal(bup.utils.duration_mins(1420084800000, 1420093200000), 140);
		assert.equal(bup.utils.duration_mins(1420109940000, 1420110660000), 12);
		assert.equal(bup.utils.duration_mins(1420149600000, 1420155720000), 102); // new day in CET
		assert.equal(bup.utils.duration_mins(1420153260000, 1420171380000), 302); // new day in UTC
		assert.equal(bup.utils.duration_mins(1420110059000, 1420111201000), 20);
		assert.equal(bup.utils.duration_mins(1420110001000, 1420111259000), 20);
		assert.equal(bup.utils.duration_mins(1420110660000, 1420110710000), 0);
	});

	_it('duration_hours', function() {
		assert.equal(bup.utils.duration_hours(1420084800000, 1420093200000), '2:20');
		assert.equal(bup.utils.duration_hours(1420109940000, 1420110660000), '0:12');
		assert.equal(bup.utils.duration_hours(1420149600000, 1420155720000), '1:42'); // new day in CET
		assert.equal(bup.utils.duration_hours(1420153260000, 1420171380000), '5:02'); // new day in UTC
		assert.equal(bup.utils.duration_hours(1420110059000, 1420111201000), '0:20');
		assert.equal(bup.utils.duration_hours(1420110001000, 1420111259000), '0:20');
		assert.equal(bup.utils.duration_hours(1420110660000, 1420110710000), '0:00');
	});

	_it('duration_secs', function() {
		assert.equal(bup.utils.duration_secs(0, 1005), '0:01');
		assert.equal(bup.utils.duration_secs(0, 62070), '1:02');
		assert.equal(bup.utils.duration_secs(0, 18129090), '5:02:09');
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
		assert.strictEqual(bup.utils.deep_equal({x: 1, y: 2}, null), false);
		assert.strictEqual(bup.utils.deep_equal(null, {x: 1, y: 2}), false);
	});

	_it('repeat', function() {
		assert.deepEqual(bup.utils.repeat(1, 0), []);
		assert.deepEqual(bup.utils.repeat('abc', 3), ['abc', 'abc', 'abc']);
	});

	_it('values', function() {
		assert.deepEqual(bup.utils.values({
			'x': 1,
		}), [1]);
	});

	_it('any', function() {
		assert.equal(bup.utils.any([]), false);
		assert.equal(bup.utils.any([false, 0, '']), false);
		assert.equal(bup.utils.any([2]), true);
		assert.equal(bup.utils.any([1, 2]), true);
	});

	_it('sum', function() {
		assert.strictEqual(bup.utils.sum([]), 0);
		assert.strictEqual(bup.utils.sum([1, 2, 3]), 6);
		assert.strictEqual(bup.utils.sum([2]), 2);
	});

	_it('reverse_every', function() {
		assert.deepStrictEqual(
			bup.utils.reverse_every(['a', 'b', 'c', 'd', 'e', 'f'], 2),
			['b', 'a', 'd', 'c', 'f', 'e']);
		assert.deepStrictEqual(
			bup.utils.reverse_every(['a', 'b', 'c', 'd', 'e', 'f'], 3),
			['c', 'b', 'a', 'f', 'e', 'd']);
		assert.deepStrictEqual(
			bup.utils.reverse_every(['a', 'b', 'c', 'd', 'e', 'f'], 4),
			['d', 'c', 'b', 'a', 'f', 'e']);
	});

	_it('map_dict', function() {
		assert.deepStrictEqual(
			bup.utils.map_dict(['a', 'b', 'c'], function(s) {
				return s.toUpperCase();
			}),
			{
				'a': 'A',
				'b': 'B',
				'c': 'C',
			}
		);
	});

	_it('range', function() {
		assert.deepStrictEqual(
			bup.utils.range(10), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
		assert.deepStrictEqual(
			bup.utils.range(1), [0]);
		assert.deepStrictEqual(
			bup.utils.range(0), []);
	});

	_it('remove', function() {
		var ar = [1, 2, 3, 4, 5, 4, '4'];

		assert.strictEqual(bup.utils.remove(ar, 1), true);
		assert.deepStrictEqual(ar, [2, 3, 4, 5, 4, '4']);

		assert.strictEqual(bup.utils.remove(ar, 1), false);
		assert.deepStrictEqual(ar, [2, 3, 4, 5, 4, '4']);

		assert.strictEqual(bup.utils.remove(ar, 4), true);
		assert.deepStrictEqual(ar, [2, 3, 5, 4, '4']);

		assert.strictEqual(bup.utils.remove(ar, 4), true);
		assert.deepStrictEqual(ar, [2, 3, 5, '4']);

		assert.strictEqual(bup.utils.remove(ar, 4), false);
		assert.deepStrictEqual(ar, [2, 3, 5, '4']);
	});

	_it('parallel (without errors)', function(done) {
		var r = [];
		var called = false;
		bup.utils.parallel([function(cb) {
			r.push(1);
			cb();
		}, function(cb) {
			r.push(2);
			cb();
		}, function(cb) {
			r.push(3);
			cb();
		}], function(err) {
			assert(!called);
			assert(!err);
			called = true;
			assert(r.indexOf(1) >= 0);
			assert(r.indexOf(2) >= 0);
			assert(r.indexOf(3) >= 0);
			assert(r.indexOf(4) < 0);
			done();
		});
	});

	_it('parallel (with errors)', function(done) {
		var called = false;
		bup.utils.parallel([function(cb) {
			cb('ERROR');
		}, function(cb) {
			cb();
		}, function(cb) {
			cb('fail!');
		}], function(err) {
			assert(!called);
			assert(err);
			called = true;

			done();
		});
	});
});

})();