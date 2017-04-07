'use strict';

var assert = require('assert');
var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;


_describe('timer', function() {
	_it('calc', function() {
		assert.deepStrictEqual(
			bup.timer.calc({}),
			{visible: false}
		);

		// After resuming
		assert.deepStrictEqual(
			bup.timer.calc({
				duration: 20000,
				exigent: 12000,
			}),
			{visible: false}
		);

		assert.deepStrictEqual(
			bup.timer.calc({
				timer: {
					upwards: true,
					start: 1000000,
				},
			}, 1230000),
			{
				visible: true,
				upwards: true,
				ms: 230000,
				next: 1000,
				str: '3:50',
				exigent: false,
			}
		);

		assert.deepStrictEqual(
			bup.timer.calc({
				timer: {
					start: 1000000,
					duration: 120000,
					exigent: 25499,
				},
				settings: {},
			}, 1050280),
			{
				visible: true,
				ms: 69720,
				next: 720,
				str: '1:10',
				exigent: false,
			}
		);

		assert.deepEqual(
			bup.timer.calc({
				timer: {
					start: 9000000,
					duration: 120000,
					exigent: 25499,
				},
				settings: {},
			}, 9115280),
			{
				visible: true,
				ms: 4720,
				next: 720,
				str: '5',
				exigent: true,
			}
		);

		assert.deepStrictEqual(
			bup.timer.calc({
				timer: {
					start: 1000000,
					duration: 120000,
					exigent: 25499,
				},
				settings: {},
			}, 1250280),
			{
				visible: false,
				str: '0',
			}
		);

		assert.deepStrictEqual(
			bup.timer.calc({
				timer: {
					start: 1000000,
					duration: 120000,
					exigent: 25499,
				},
				settings: {
					negative_timers: true,
				},
			}, 1250280),
			{
				visible: true,
				ms: -130280,
				str: '-2:10',
				next: 1000,
				exigent: false,
			}
		);
	});
});
