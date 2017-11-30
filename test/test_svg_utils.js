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

/* // Not yet supported, worked around
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
*/
});
