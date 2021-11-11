'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;


_describe('svg_utils', function() {
	_it('parse_cmd', function() {
		assert.deepStrictEqual(
			bup.svg_utils.parse_cmd(
				'm 123 M1,2.3 4.5-6 -.038.012 L 91,92'
			),
			{
				c: 'm',
				args: [123],
				rest: ' M1,2.3 4.5-6 -.038.012 L 91,92',
			}
		);

		assert.deepStrictEqual(
			bup.svg_utils.parse_cmd(
				'M1,2.3 4.5-6 -.038.12 5e2-3e-2 L 91,92'
			),
			{
				c: 'M',
				args: [1, 2.3, 4.5, -6, -.038, .12, 500, -.03],
				rest: ' L 91,92',
			}
		);
	});

	_it('parse_cmd with flags', () => {
		assert.deepStrictEqual(
			bup.svg_utils.parse_cmd(
				'a1 3 0 005 7M0 0'
			),
			{
				c: 'a',
				args: [1, 3, 0, 0, 0, 5, 7],
				rest: 'M0 0',
			}
		);
	});

	_it('parse_cmd of svgo', function() {
		assert.deepStrictEqual(
			bup.svg_utils.parse_cmd(
				's-25.2-.002-25.2 0a.592.592 0 0 0 .664.624'
			),
			{
				c: 's',
				args: [-25.2, -.002, -25.2, 0],
				rest: 'a.592.592 0 0 0 .664.624',
			}
		);
	});

	_it('translate_path', function() {
		assert.strictEqual(
			bup.svg_utils.translate_path(
				'm 1,2 L 8,9',
				10, 0, 0),
			'm 10 20 L 80 90'
		);

		assert.strictEqual(
			bup.svg_utils.translate_path(
				'M108.923,216.777h22.631L89.785,288.29h-24.6l-7.3-44.843h22l2.178,23.707Z',
				1, 0, 0),
			'M 108.923 216.777 h 22.631 L 89.785 288.29 h -24.6 l -7.3 -44.843 h 22 l 2.178 23.707 Z'
		);

		assert.strictEqual(
			bup.svg_utils.translate_path(
				'M108.923,216.777h22.631L89.785,288.29h-24.6l-7.3-44.843h22l2.178,23.707Z',
				1, 1000, 2000),
			'M 1108.923 2216.777 h 22.631 L 1089.785 2288.29 h -24.6 l -7.3 -44.843 h 22 l 2.178 23.707 Z'
		);

		assert.strictEqual(
			bup.svg_utils.translate_path(
				'M108.923,216.777h22.631L89.785,288.29h-24.6l-7.3-44.843h22l2.178,23.707Z',
				2, 1000, 2000),
			'M 1217.846 2433.554 h 45.262 L 1179.57 2576.58 h -49.2 l -14.6 -89.686 h 44 l 4.356 47.414 Z'
		);

		// Wild arcs with double zeroes
		assert.strictEqual(
			bup.svg_utils.translate_path(
				'M0 0a1 3 0 005 7',
				2, 0, 0),
			'M 0 0 a 2 6 0 0 0 10 14'
		);
	});

	_it('translate_css', function() {
		assert.strictEqual(
			bup.svg_utils._translate_css('.c1 , .c2 {content: ".c4 .c5"} .c2 {}', 'copy-', 1),
			'.copy-c1 , .copy-c2 {content: ".c4 .c5"} .copy-c2 {}'
		);

		assert.strictEqual(
			bup.svg_utils._translate_css('#id1 {content: ".c4 .c5"} el #id2 {}', 'copy-', 1),
			'#copy-id1 {content: ".c4 .c5"} el #copy-id2 {}'
		);

		assert.strictEqual(
			bup.svg_utils._translate_css('.classa,\n.classb #id1 \n,\ng.classc text .classd {content:\n".c4 .c5";\n\n\n} text#id2 { \t \nmargin:\n1px;}', 'copy-', 1),
			'.copy-classa,\n.copy-classb #copy-id1 \n,\ng.copy-classc text .copy-classd {content:\n".c4 .c5"} text#copy-id2 { \t \nmargin:\n1px}'
		);

		// Rescale
		assert.strictEqual(
			bup.svg_utils._translate_css('.foo {fill:#ff0;stroke-width:2px;}', 'copy-', 2),
			'.copy-foo {fill:#ff0;stroke-width:4px}'
		);
		assert.strictEqual(
			bup.svg_utils._translate_css('.foo {fill:#ff0;stroke-width:2;}', 'copy-', 2),
			'.copy-foo {fill:#ff0;stroke-width:4}'
		);
		assert.strictEqual(
			bup.svg_utils._translate_css('.foo {fill:#ff0;stroke-width:.2cm;}', 'copy-', 2),
			'.copy-foo {fill:#ff0;stroke-width:0.4cm}'
		);
	});
});
