'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var vdom = require('./vdom');
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

	_it('parse_path shorthands', function() {
		assert.deepStrictEqual(
			bup.svg2pdf.parse_path(
				'M 5,5 s 1,2 3,4'
			),
			[{
				x1: 5,
				y1: 5,
				acc: [
					[0, 0, 1, 2, 3, 4],
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
				0.46290903364459424,
				0.2887236923516555,
				0.7008804547888376,
				0.8321801044183256,
				0.5991020139212984,
				1.3681719820895437,
			], [
				-0.10177844086753929,
				0.5359918776712185,
				-0.5223945977509199,
				0.9543903930443545,
				-1.0589170139212984,
				1.0533340179104562,
			]]
		);
	});

	_it('_all_els', function() {
		var doc = new vdom.Document('svg');
		var root = doc.documentElement;
		root.setAttribute('id', 'root');
		var defs = bup.svg_utils.el(root, 'defs');
		bup.svg_utils.el(defs, 'style', {}, '* {fill: lime;}');
		bup.svg_utils.el(defs, 'polygon', {
			points: '0,0 100,0 300,300 250,250',
			fill: '#000',
			id: 'defs_polygon',
		});

		var g1 = bup.svg_utils.el(root, 'g', {id: 'g1'});
		bup.svg_utils.el(g1, 'g', {id: 'g1a'});
		var g1b = bup.svg_utils.el(g1, 'g', {id: 'g1b'});
		bup.svg_utils.el(g1, 'g', {id: 'g1c'});
		bup.svg_utils.el(g1, 'g', {id: 'g1d'});
		bup.svg_utils.el(g1b, 'g', {id: 'g1b1'});
		var g1b2 = bup.svg_utils.el(g1b, 'g', {id: 'g1b2'});
		bup.svg_utils.el(g1b, 'g', {id: 'g1b3'});
		bup.svg_utils.el(root, 'g', {id: 'g2'});

		bup.svg_utils.el(g1b2, 'polygon', {
			points: '1,1 101,0 301,301 251,251',
			fill: '#000',
			id: 'normal_polygon',
		});

		assert.deepStrictEqual(bup.svg2pdf._all_els(doc).map(function(e) {
			return e.getAttribute('id');
		}), [
			'g1',
			'g1a',
			'g1b',
			'g1b1',
			'g1b2',
			'normal_polygon',
			'g1b3',
			'g1c',
			'g1d',
			'g2',
		]);
	});
});
