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

		// scientific notation
		// Minus as separator
		assert.deepStrictEqual(
			bup.svg2pdf.parse_path(
				'M.1e1,200e-2L30000000000e-10-24-10,2'
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

	_it('parse_path of svgo', function() {
		assert.deepStrictEqual(
			bup.svg2pdf.parse_path(
				'M1,2l-.038.012'
			),
			[{
				x1: 1,
				y1: 2,
				acc: [[-.038, .012]],
				closed: false,
			}]
		);
	});

	_it('parse_color', function() {
		assert.deepStrictEqual(
			bup.svg2pdf.parse_color('rgb(12, 233, 0)'),
			{
				r: 12,
				g: 233,
				b: 0,
			}
		);
		assert.deepStrictEqual(
			bup.svg2pdf.parse_color('rgb(220,233,255)'),
			{
				r: 220,
				g: 233,
				b: 255,
			}
		);

		assert.deepStrictEqual(
			bup.svg2pdf.parse_color('#0123af'),
			{
				r: 1,
				g: 35,
				b: 175,
			}
		);
		assert.deepStrictEqual(
			bup.svg2pdf.parse_color('#000000'),
			{
				r: 0,
				g: 0,
				b: 0,
			}
		);

		assert.deepStrictEqual(
			bup.svg2pdf.parse_color('#bbb'),
			{
				r: 187,
				g: 187,
				b: 187,
			}
		);
		assert.deepStrictEqual(
			bup.svg2pdf.parse_color('#012'),
			{
				r: 0,
				g: 17,
				b: 34,
			}
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
				10,
			]]
		);
	});

	_it('complex _make_beziers', function() {
		assert.deepStrictEqual(
			bup.svg2pdf._make_beziers(-58.04755401611328, 137.59865912485483),
			[
				[1.3038343028184407, -0.36534538528186505],
				[1.0791601225036562, 0.8178475223112786],
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
