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
	var m = /^\s*([ZzvVhHmMlLcAaCq])/.exec(str);
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

function split_args(str) {
	if (!str) return [];

	str = str.replace(/[eE]-/g, '_');
	return str.split(/\s*,\s*|\s+|(?=-)/).map(function(el) {
		if (el.includes('_')) {
			el = el.replace('_', 'e-');
		}
		return el;
	});
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
	var dst_doc = dst.ownerDocument;

	var translate_points = function(points, dx, dy) {
		for (var i = 0;i < points.length;i+=2) {
			points[i] = points[i] * scale + dx;
			points[i + 1] = points[i + 1] * scale + dy;
		}
		return points;
	};

	var translate_path = function(d, dx, dy) {
		var res = 'M ' + dx + ' ' + dy;
		while (d) {
			var cmd = parse_cmd(d);
			if (!cmd) {
				report_problem.silent_error('Cannot parse path ' + d);
				break;
			}
			var args = cmd.args;

			res += ' ' + cmd.c + ' ';
			switch (cmd.c) {
			case 'Z':
			case 'z':
				break;
			case 'a':
			case 'c':
			case 'h':
			case 'l':
			case 'm':
			case 'q':
			case 'v':
				// relative, simply keep
				res += args.join(' ');
				break;
			case 'M':
			case 'L':
				res += translate_points(args, dx, dy).join(' ');
				break;
			case 'H':
				res += args[0] * scale + dx;
				break;
			case 'V':
				res += args[0] * scale + y;
				break;
			case 'A':
				for (var i = 0;i < args.length;i += 7) {
					args[i] *= scale;
					args[i + 1] *= scale;
					args[i + 5] = args[i + 5] * scale + dx;
					args[i + 6] = args[i + 6] * scale + y;
				}
				res += args.join(' ');
				break;
			default:
				report_problem.silent_error('Cannot copy path cmd ' + cmd.c);
				return '';
			}

			d = cmd.rest;
		}
		return res;
	}

	var do_copy = function(into, node) {
		if (node.nodeType === 3) {
			// Text
			into.appendChild(dst_doc.createTextNode(node.data));
		}

		if (node.nodeType !== 1) {
			return; // Not an element, ignore
		}

		var tagName = node.tagName.toLowerCase();
		var el;

		switch (tagName) {
		case 'title':
			// suppress
			break;
		case 'defs':
			el = dst_doc.importNode(node);
			break;
		case 'style':
			return dst.appendChild(dst_doc.importNode(node, true));
		case 'polygon':
			var points = translate_points(split_args(node.getAttribute('points')), x, y);
			el = dst_doc.importNode(node);
			el.setAttribute('points', points.join(' '));
			break;
		case 'path':
			var transform_attr = node.getAttribute('transform');
			var dx = x;
			var dy = y;
			if (transform_attr) {
				var transform_m = /^translate\(([-0-9.]+)(?:,\s*|\s+)([-0-9.]+)\)$/.exec(transform_attr);
				if (!transform_m) {
					report_problem.silent_error('Cannot parse transformation ' + transform_attr + ', skipping.');
					break;
				}

				dx += parseFloat(transform_m[1]) * scale;
				dy += parseFloat(transform_m[2]) * scale;
			}

			var d = translate_path(node.getAttribute('d'), dx, dy);
			el = dst_doc.importNode(node);
			el.setAttribute('d', d);
			el.removeAttribute('transform');
			break;
		default:
			report_problem.silent_error('Unsupported element to copy: ' + tagName);
		}

		if (el) {
			into.appendChild(el);
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
	split_args: split_args,
};
})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = svg_utils;

	var report_problem = require('./report_problem');
	var utils = require('./utils');
}
/*/@DEV*/
