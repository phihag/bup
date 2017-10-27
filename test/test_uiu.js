'use strict';

var assert = require('assert');
var tutils = require('./tutils');
var vdom = require('./vdom');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;


_describe('ui utils', function() {
	_it('attrs', function() {
		var doc = new vdom.Document('root');
		var root = doc.documentElement;
		bup.uiu.attr(root, {
			'foo': 'bar',
			'a': 1,
		});
		assert.strictEqual(root.getAttribute('b'), '');
		assert.strictEqual(root.getAttribute('foo'), 'bar');
		assert.strictEqual(root.getAttribute('a'), '1');
	});
});
