'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;


_describe('svg2pdf', function() {
	_it('parse_path', function() {
		assert.deepStrictEqual(
			bup.svg2pdf.parse_path(
				'M 12 13 L 17 15'
			),
			[{
				x1: 12,
				y1: 13,
				acc: [[5, 2]],
				closed: false,
			}]
		);

		assert.deepStrictEqual(
			bup.svg2pdf.parse_path(
				'M -1.2 1.5 l 4 -1 L 12,14'
			),
			[{
				x1: -1.2,
				y1: 1.5,
				acc: [[4, -1], [9.2, 13.5]],
				closed: false,
			}]
		);

		assert.deepStrictEqual(
			bup.svg2pdf.parse_path(
				'M 10 20 l -1 , -1 Z'
			),
			[{
				x1: 10,
				y1: 20,
				acc: [[-1, -1]],
				closed: true,
			}]
		);

		assert.deepStrictEqual(
			bup.svg2pdf.parse_path(
				'M 100 200 h 10 v 2 H 5 V 999 z'
			),
			[{
				x1: 100,
				y1: 200,
				acc: [
					[10, 0],
					[0, 2],
					[-105, 0],
					[0, 797],
				],
				closed: true,
			}]
		);

		assert.deepStrictEqual(
			bup.svg2pdf.parse_path(
				'M 1 2 3 24 5 36'
			),
			[{
				x1: 1,
				y1: 2,
				acc: [
					[2, 22],
					[2, 12],
				],
				closed: false,
			}]
		);


		assert.deepStrictEqual(
			bup.svg2pdf.parse_path(
				'M 1 2 L 3 24 5 36'
			),
			[{
				x1: 1,
				y1: 2,
				acc: [
					[2, 22],
					[2, 12],
				],
				closed: false,
			}]
		);

	});
});
