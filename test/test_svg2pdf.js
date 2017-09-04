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

		// No spaces
		assert.deepStrictEqual(
			bup.svg2pdf.parse_path(
				'M1 2 L3 24 5 36'
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

		// Minus as separator
		assert.deepStrictEqual(
			bup.svg2pdf.parse_path(
				'M1,2L3-24-10,2'
			),
			[{
				x1: 1,
				y1: 2,
				acc: [
					[2, -26],
					[-13, 26],
				],
				closed: false,
			}]
		);
	});

	_it('arc2beziers', function() {
		assert.deepStrictEqual(
			bup.svg2pdf.arc2beziers(50, 50, 0, 0, 1, -70, 10),
			[[
				-16.568542494923793,
				22.09138999323173,
				-47.90861000676826,
				26.568542494923804,
				-70,
				10
			]]
		);
	});

	_it('complex _make_beziers', function() {
		assert.deepStrictEqual(
			bup.svg2pdf._make_beziers(-58.04755401611328, 137.59865912485483),
			[
				[0.8794126562399458, -0.6300639156495546],
				[1.0594414977609559, -0.21893120056462587],
				[0.9824446170363229, 0.18655448120147874],
				[0.9054477363116898, 0.5920401629675833],
				[0.5872454767380846, 0.9085647515776218],
				[0.18135843653051348, 0.9834170618304361],
			]
		);
	});

	_it('complex arc2beziers', function() {
		assert.deepStrictEqual(
			bup.svg2pdf.arc2beziers(1.3218515, 1.3218515, 0, 0, 1, -0.459815, 2.421506),
			[[
				1.0239314710179237,
				0.6386422677902073,
				0.7269455661055391,
				2.2026476844485763,
				-0.459815,
				2.421506,
			]]
		);
	});
});
