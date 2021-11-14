'use strict';

var assert = require('assert');
var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;


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
		assert.equal(bup.utils.duration_secs(1005), '0:01');
		assert.equal(bup.utils.duration_secs(0, 62070), '1:02');
		assert.equal(bup.utils.duration_secs(62070), '1:02');
		assert.equal(bup.utils.duration_secs(1000, 18129090), '5:02:08');
		assert.equal(bup.utils.duration_secs(18129090), '5:02:09');
		assert.equal(bup.utils.duration_secs(1636885238637, 1636885257188), '0:19');
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

	_it('replace_all', function() {
		assert.strictEqual(
			bup.utils.replace_all('a.b c.d..', '.', '_-_'),
			'a_-_b c_-_d_-__-_'
		);
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

	_it('min', function() {
		assert.strictEqual(bup.utils.min([]), Infinity);
		assert.strictEqual(bup.utils.min([1, 2, 3]), 1);
		assert.strictEqual(bup.utils.min([2, 1, 99, -5, 22]), -5);
		assert.strictEqual(bup.utils.min([1]), 1);
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

	_it('encode_utf8', function() {
		tutils.assert_u8r_eq(
			bup.utils.encode_utf8(''),
			[]);
		tutils.assert_u8r_eq(
			bup.utils.encode_utf8('abc'),
			[97, 98, 99]);
		tutils.assert_u8r_eq(
			bup.utils.encode_utf8('ö'),
			[195, 182]);
		tutils.assert_u8r_eq(
			bup.utils.encode_utf8('Düsseldorf'),
			[68, 195, 188, 115, 115, 101, 108, 100, 111, 114, 102]);
		tutils.assert_u8r_eq(
			bup.utils.encode_utf8('ℝ'),
			[226, 132, 157]);
		tutils.assert_u8r_eq(
			bup.utils.encode_utf8('אּ'),
			[239, 172, 176]);
		tutils.assert_u8r_eq(
			bup.utils.encode_utf8('אּאּ'),
			[239, 172, 176, 239, 172, 176]);
		tutils.assert_u8r_eq(
			bup.utils.encode_utf8('😂'),
			[240, 159, 152, 130]);
		tutils.assert_u8r_eq(
			bup.utils.encode_utf8('a ä ℝ 😂'),
			[97, 32, 195, 164, 32, 226, 132, 157, 32, 240, 159, 152, 130]);
	});

	_it('decode_utf8', function() {
		assert.deepStrictEqual(
			bup.utils.decode_utf8(Buffer.from([])),
			'');
		assert.deepStrictEqual(
			bup.utils.decode_utf8(Buffer.from([97, 98, 99])),
			'abc');
		assert.deepStrictEqual(
			bup.utils.decode_utf8(Buffer.from([195, 182])),
			'ö');
		assert.deepStrictEqual(
			bup.utils.decode_utf8(Buffer.from([68, 195, 188, 115, 115, 101, 108, 100, 111, 114, 102])),
			'Düsseldorf');
		assert.deepStrictEqual(
			bup.utils.decode_utf8(Buffer.from([226, 132, 157])),
			'ℝ');
		assert.deepStrictEqual(
			bup.utils.decode_utf8(Buffer.from([239, 172, 176])),
			'אּ');
		assert.deepStrictEqual(
			bup.utils.decode_utf8(Buffer.from([239, 172, 176, 239, 172, 176])),
			'אּאּ');
		assert.deepStrictEqual(
			bup.utils.decode_utf8(Buffer.from([240, 159, 152, 130])),
			'😂');
		assert.deepStrictEqual(
			bup.utils.decode_utf8(Buffer.from([97, 32, 195, 164, 32, 226, 132, 157, 32, 240, 159, 152, 130])),
			'a ä ℝ 😂');
	});

	_it('hex', function() {
		assert.deepStrictEqual(
			bup.utils.hex(Uint8Array.from([])),
			'');
		assert.deepStrictEqual(
			bup.utils.hex(Uint8Array.from([0, 10])),
			'000a');
		assert.deepStrictEqual(
			bup.utils.hex(Uint8Array.from([0, 10, 16, 32, 128, 120, 255])),
			'000a10208078ff');
	});

	_it('unhex', function() {
		tutils.assert_u8r_eq(
			bup.utils.unhex(''),
			[]);
		tutils.assert_u8r_eq(
			bup.utils.unhex('000a10208078ff'),
			[0, 10, 16, 32, 128, 120, 255]);
	});

	_it('match_all', function() {
		assert.deepStrictEqual(
			bup.utils.match_all(
				/<option>([^<,]+),\s*([^<,]+)<\/option>/g,
				'<option>Dubs, Konstantin</option>' +
				'<option>Heumann, Manuel</option><option>Krasimir, Yankov</option>' +
				'<option>Obernosterer, David</option><option>Patz, Eric</option>' +
				'<option>Szydlowski, Przemyskaw</option><option>Wadenka, Tobias</option>').map(
				function(m) {
					return [m[1], m[2]];
				}),
			[
				['Dubs', 'Konstantin'],
				['Heumann', 'Manuel'],
				['Krasimir', 'Yankov'],
				['Obernosterer', 'David'],
				['Patz', 'Eric'],
				['Szydlowski', 'Przemyskaw'],
				['Wadenka', 'Tobias'],
			]
		);
	});

	_it('filter_map', function() {
		assert.deepStrictEqual(
			bup.utils.filter_map([1, 29, 2, 4, 15], function(i) {
				if (i >= 10) {
					return;
				}
				return 10 * i;
			}),
			[10, 20, 40]
		);
	});

	_it('forEach', function() {
		var ar = [];
		bup.utils.forEach('foobar', function(c, i) {
			ar.push({
				c: c,
				i: i,
			});
		});
		assert.deepStrictEqual(ar, [
			{c: 'f', i: 0},
			{c: 'o', i: 1},
			{c: 'o', i: 2},
			{c: 'b', i: 3},
			{c: 'a', i: 4},
			{c: 'r', i: 5},
		]);
	});

	_it('hash_new', function() {
		var hashval;
		hashval = bup.utils.hash_new(hashval, {});
		assert(hashval);

		var ret1 = bup.utils.hash_new(hashval, false);
		assert(ret1);
		hashval = ret1;

		var ret2 = bup.utils.hash_new(hashval, false);
		assert(!ret2);
	});

	_it('closest_color', function() {
		assert.strictEqual(
			bup.utils.contrast_color('ffffff', '#ffffff', '#000000'),
			'#000000');
		assert.strictEqual(
			bup.utils.contrast_color('fabca0', '#ffffff', '#000000'),
			'#000000');
	});

	_it('parse_json', function() {
		assert.deepStrictEqual(bup.utils.parse_json('{"x": 2}'), {x: 2});
		assert.deepStrictEqual(bup.utils.parse_json('ERROR{"x": 2}'), undefined);
	});

	_it('parse_time', function() {
		assert.strictEqual(
			bup.utils.timesecs_str(bup.utils.parse_time('12:39:23', 1502335546914)),
			'12:39:23'
		);
		assert.strictEqual(
			bup.utils.timesecs_str(bup.utils.parse_time('15:39', 1502335546914)),
			'15:39:00'
		);
		assert.strictEqual(
			bup.utils.timesecs_str(bup.utils.parse_time('23:20:50.52', 1502350131246)),
			'23:20:50'
		);
		assert.strictEqual(
			bup.utils.parse_time('x', 1502350131246),
			undefined
		);
	});

	_it('domain', function() {
		assert.strictEqual(
			bup.utils.domain('http://ix.de:8080/foo?bar/x/z'),
			'ix.de'
		);
		assert(!bup.utils.domain('nodomainx/z'));
		assert.strictEqual(
			bup.utils.domain('https://www.test.example.org/foo?bar/x/z'),
			'example.org'
		);
	});
});
