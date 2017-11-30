'use strict';
var svg_utils = (function() {

var SVG_NS = 'http://www.w3.org/2000/svg';

function el(parent, tagName, init_attrs, text) {
	var doc = parent.ownerDocument;
	var el = doc.createElementNS(SVG_NS, tagName);
	if (init_attrs) {
		for (var k in init_attrs) {
			el.setAttribute(k, init_attrs[k]);
		}
	}
	if (text !== undefined) {
		el.appendChild(doc.createTextNode(text));
	}
	parent.appendChild(el);
	return el;
}

function parse(ab) {
	var xml_str = utils.decode_utf8(ab);
	var svg_doc = (new DOMParser()).parseFromString(xml_str, 'image/svg+xml');
	return svg_doc.getElementsByTagName('svg')[0];
}

// Returns: null (parse failed) or
// - rest: remaining string
// - c: The actual command
// - args: Array of arguments
function parse_cmd(str) {
	var m = /^\s*([ZzvVhHmMlLcAaC])/.exec(str);
	if (!m) return;
	var c = m[1];

	var args = [];
	var search = /(?:\s*,\s*|\s*)(-?(?:[0-9]*\.[0-9]+|[0-9]+\.?)(?:e-?[0-9]+)?)/g;
	var rest_pos = m[0].length;
	search.lastIndex = rest_pos;
	while ((m = search.exec(str))) {
		if (m.index !== rest_pos) {
			// Skipped over characters
			break;
		}
		args.push(parseFloat(m[1]));
		rest_pos = search.lastIndex;
	}
	return {
		c: c,
		args: args,
		rest: str.substr(rest_pos),
	};
}

// dst is a destination container where all the elements will be put into
// Silently fails (because that's best for our applications)
function copy(dst, src_svg, x, y, width) {
	var viewBox = src_svg.getAttribute('viewBox');
	if (!viewBox) {
		report_problem.silent_error('SVG copy failed: no viewBox');
		return;
	}

	var vb = viewBox.split(' ').map(parseFloat);
	var scale = width / vb[2];
	var height = width * vb[3] / vb[2];
	var dst_doc = dst.ownerDocument;

	var do_copy = function(into, node) {
		if (node.elementType === 3) {
			// Text
			into.appendChild(dst_doc.createTextNode(node.data));
		}

		if (node.elementType !== 1) {
			return; // Not an element, ignore
		}

		var tagName = node.tagName.toLowerCase();
		var el;

		switch (tagName) {
		case 'defs':
			el = dst.appendChild(dst_doc.importNode(node));
			break;
		case 'style':
			return dst.appendChild(dst_doc.importNode(node, true));
		default:
			report_problem.silent_error('Unsupported element to copy: ' + tagName);
		}

		if (el) {
			utils.forEach(node.childNodes, function(child) {
				do_copy(el, child);
			});
		}
	};

	utils.forEach(src_svg.childNodes, function(el) {
		do_copy(dst, el);
	});
}

return {
	el: el,
	parse: parse,
	parse_cmd: parse_cmd,
	copy: copy,
};
})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = svg_utils;

	var report_problem = require('./report_problem');
	var utils = require('./utils');
}
/*/@DEV*/
