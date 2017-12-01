'use strict';
// Virtual DOM for unit tests

var assert = require('assert');

function TextNode(ownerDocument, data) {
	this.ownerDocument = ownerDocument;
	this.data = data;

	Object.defineProperty(this, 'nodeType', {
		get: function() {
			return 3;
		},
	});
}
// Nonstandard
TextNode.prototype.toxml = function() {
	return encode(this.data);
};


function Element(ownerDocument, tagName) {
	this.ownerDocument = ownerDocument;
	this.tagName = tagName;
	this.attrs = {};
	this.childNodes = [];
	Object.defineProperty(this, 'nodeType', {
		get: function() {
			return 1;
		},
	});
	Object.defineProperty(this, 'textContent', {
		get: function() {
			var res = '';
			for (var i = 0;i < this.childNodes.length;i++) {
				var node = this.childNodes[i];
				if (node instanceof TextNode) {
					res += node.data;
				}
			}
			return res;
		},
	});
	Object.defineProperty(this, 'attributes', {
		get: function() {
			var res = [];
			for (var name in this.attrs) {
				res.push({
					name: name,
					value: this.attrs[name],
				});
			}
			return res;
		},
	});
}
Element.prototype.setAttribute = function(k, v) {
	this.attrs[k] = v;
};
Element.prototype.getAttribute = function(k) {
	return this.attrs[k] ? ('' + this.attrs[k]) : '';
};
Element.prototype.removeAttribute = function(k) {
	delete this.attrs[k];
};
Element.prototype.appendChild = function(node) {
	this.childNodes.push(node);
	return node;
};

function _parse_attrqs(aqs) {
	var m = /^([a-z]+)="([^"]+)"$/.exec(aqs);
	if (m) {
		return function(el) {
			return el.getAttribute(m[1]) === m[2];
		};
	}

	m = /^([a-z]+)\*="([^"]+)"$/.exec(aqs);
	if (m) {
		return function(el) {
			return el.getAttribute(m[1]).includes(m[2]);
		};
	}

	throw new Error('Cannot parse attribute check ' + aqs);
}

// Returns a function that can be applied on any Element and returns true if it matches
function parse_qs(qs) {
	var next; // no let in all browsers yet :(
	function _parse_next(next_str) {
		if (!next_str) {
			return function() {
				return true;
			};
		}

		return parse_qs(next_str);
	}

	var m = /^\*(.*)$/.exec(qs);
	if (m) {
		return _parse_next(m[1]);
	}

	m = /^([a-z]+)(.*)$/.exec(qs);
	if (m) {
		next = _parse_next(m[2]);
		return function(el) {
			return (el.tagName === m[1]) && next(el);
		};
	}

	m = /^\[([^\]]+)\](.*)$/.exec(qs);
	if (m) {
		next = _parse_next(m[2]);
		var attr_check = _parse_attrqs(m[1]);
		return function(el) {
			return attr_check(el) && next(el);
		};
	}

	throw new Error('Cannot parse query selector ' + qs);
}

Element.prototype.querySelectorAll = function(qs) {
	var qs_func = parse_qs(qs);

	var to_visit = [this];
	var res = [];
	while (to_visit.length > 0) {
		var el = to_visit.pop();
		if (qs_func(el)) {
			res.push(el);
		}
		var children = el.childNodes;
		for (var i = children.length - 1;i >= 0;i--) {
			var c = children[i];
			if (c instanceof Element) {
				to_visit.push(c);
			}
		}
	}
	return res;
};

function encode(text) {
	if (typeof text === 'number') {
		text = '' + text;
	}
	assert(typeof text === 'string');
	return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

Element.prototype._toxml = function(indent, add_indent) {
	var attrs = this.attrs;
	var keys = Object.keys(attrs);
	keys.sort();
	var attrs_str = keys.map(function(k) {
		var val = attrs[k];
		assert(/^[-:_a-zA-Z0-9]+$/.test(k), 'Unsupported attribute name ' + JSON.stringify(k));
		return k + '="' + encode(val) + '"';
	}).join(' ');

	var children = this.childNodes;
	var child_xml = children.map(function(c) {
		if (c instanceof Element) {
			return (add_indent ? '\n' : '') + c._toxml(indent + add_indent, add_indent);
		}
		return c.toxml();
	}).join('');
	return (
		indent +
		'<' + this.tagName + (attrs_str ? ' ' + attrs_str : '') + '>' +
		child_xml +
		((add_indent && (children.length > 0) && (children[children.length - 1] instanceof Element)) ? '\n' + indent : '') +
		'</' + this.tagName + '>'
	);
};

Element.prototype.toxml = function(indent) {
	return this._toxml('', indent || '');
};

function Document(tagName) {
	this.documentElement = new Element(this, tagName);
	Object.defineProperty(this, 'nodeType', {
		get: function() {
			return 9;
		},
	});
}
Document.prototype.createElement = function(tagName) {
	return new Element(this, tagName);
};
Document.prototype.createElementNS = function(namespace, tagName) {
	return new Element(this, tagName);
};
Document.prototype.createTextNode = function(text) {
	return new TextNode(this, text);
};
Document.prototype.toxml = function(indent) {
	return '<?xml version="1.0"?>' + (indent ? '\n' : '') + this.documentElement.toxml(indent);
};
Document.prototype.importNode = function(node, deep) {
	if (node.nodeType === 3) {
		return new TextNode(this, node.data);
	}
	if (node.nodeType !== 1) {
		throw new Error('Unsupported nodeType ' + node.nodeType);
	}

	var el = this.createElement(node.tagName);
	for (var i = 0;i < el.attributes.length;i++) {
		var a = el.attributes[i];
		el.setAttribute(a.name, a.value);
	}

	if (deep) {
		var children = node.childNodes;
		for (var child_i = 0;child_i < children.length;child_i++) {
			var imported_child = this.importNode(children[child_i], deep);
			el.appendChild(imported_child);
		}
	}

	return el;
};

module.exports = {
	Document: Document,
	encode: encode,
};
