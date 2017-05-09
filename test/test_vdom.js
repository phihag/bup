'use strict';

var assert = require('assert');

var vdom = require('./vdom');
var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

_describe('vdom', function() {
	_it('encode', function() {
		assert.strictEqual(vdom.encode('abc = d'), 'abc = d');
		assert.strictEqual(vdom.encode('<a&">__<&">'), '&lt;a&amp;&quot;&gt;__&lt;&amp;&quot;&gt;');
	});

	_it('toxml', function() {
		var doc = new vdom.Document('root');
		bup.uiu.el(doc.documentElement, 'el1', {
			a: 'aatr',
			b: 'batr',
		}, 'some <text');
		var el2 = bup.uiu.el(doc.documentElement, 'el2');
		bup.uiu.el(el2, 'el3');

		assert.strictEqual(
			doc.toxml(),
			'<?xml version="1.0"?><root><el1 a="aatr" b="batr">some &lt;text</el1><el2><el3></el3></el2></root>');

		assert.strictEqual(
			doc.toxml('  '),
			'<?xml version="1.0"?>\n' +
			'<root>\n' +
			'  <el1 a="aatr" b="batr">some &lt;text</el1>\n' +
			'  <el2>\n' +
			'    <el3></el3>\n' +
			'  </el2>\n' +
			'</root>');
	});
});
