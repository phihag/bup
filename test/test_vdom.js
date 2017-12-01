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

	_it('appendChild', function() {
		var doc = new vdom.Document('root');
		var c = doc.createElement('c');
		assert.strictEqual(c, doc.documentElement.appendChild(c));

		var t = doc.createTextNode('foobar');
		assert.strictEqual(t, c.appendChild(t));

		assert.strictEqual(
			doc.toxml(),
			'<?xml version="1.0"?><root><c>foobar</c></root>');
	});

	_it('attributes', function() {
		var doc = new vdom.Document('root');
		var el = doc.documentElement;
		assert.strictEqual(el.attributes.length, 0);

		el.setAttribute('foo', 'bar');
		assert.strictEqual(el.getAttribute('foo'), 'bar');
		assert.strictEqual(el.attributes.length, 1);
		assert.strictEqual(el.attributes[0].name, 'foo');
		assert.strictEqual(el.attributes[0].value, 'bar');

		el.removeAttribute('foo');
		assert.strictEqual(el.getAttribute('foo'), '');
		assert.strictEqual(el.attributes.length, 0);
	});

	_it('texContent', function() {
		var doc = new vdom.Document('root');
		var el = doc.documentElement;
		el.appendChild(doc.createTextNode('foo'));
		var c = el.appendChild(doc.createElement('c'));
		c.appendChild(doc.createTextNode('bar'));
		c.appendChild(doc.createTextNode('baz'));
		el.appendChild(doc.createTextNode('qwup'));

		assert.strictEqual(c.textContent, 'barbaz');
		assert.strictEqual(el.textContent, 'fooqwup');
	});

	_it('nodeTypes', function() {
		var doc = new vdom.Document('root');
		assert.strictEqual(doc.nodeType, 9);
		assert.strictEqual(doc.documentElement.nodeType, 1);
		assert.strictEqual(doc.createElement('foo').nodeType, 1);
		assert.strictEqual(doc.createTextNode('bar').nodeType, 3);
	});
});
