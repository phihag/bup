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
	var command_m = /^\s*([ZzvVhHmMlLcAaCqQsStT])/.exec(str);
	if (!command_m) return;
	var c = command_m[1];

	var args = [];
	var numeric_search = /(?:\s*,\s*|\s*)(-?(?:[0-9]*\.[0-9]+|[0-9]+\.?)(?:e-?[0-9]+)?)/g;
	var flag_search = /\s*([01])/g;
	var rest_pos = command_m[0].length;
	for (;;) {
		var is_flag = false;
		if (c === 'a' || c === 'A') {
			is_flag = (
				(args.length % 7 === 3) ||  // large-arc-flag
				(args.length % 7 === 4));  // sweep-flag
		}

		if (is_flag) {
			flag_search.lastIndex = rest_pos;
			var flag_m = flag_search.exec(str);
			if (!flag_m) {
				break;
			}
			args.push(parseInt(flag_m[1]));
			rest_pos = flag_search.lastIndex;
			continue;
		}

		// Normal numeric argument
		numeric_search.lastIndex = rest_pos;
		var numeric_m = numeric_search.exec(str);
		if (!numeric_m) {
			break;
		}

		if (numeric_m.index !== rest_pos) {
			// Skipped over characters
			break;
		}
		args.push(parseFloat(numeric_m[1]));
		rest_pos = numeric_search.lastIndex;
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

function translate_points(points, scale, dx, dy) {
	for (var i = 0;i < points.length;i+=2) {
		points[i] = points[i] * scale + dx;
		points[i + 1] = points[i + 1] * scale + dy;
	}
	return points;
}

function translate_path(d, scale, dx, dy) {
	var res = (/^M/.test(d) || ((dx === 0) && (dy === 0)) ? '' : 'M ' + dx + ' ' + dy);
	while (d) {
		var cmd = parse_cmd(d);
		if (!cmd) {
			if (/^\s*$/.test(d)) {
				break;
			}

			report_problem.silent_error('Cannot parse path ' + d);
			break;
		}
		var args = cmd.args;

		res += ' ' + cmd.c + ' ';
		switch (cmd.c) {
		case 'Z':
		case 'z':
			break;
		case 'c':
		case 'h':
		case 'l':
		case 'm':
		case 'q':
		case 'v':
		case 's':
		case 't':
			res += args.map(function(a) {
				return scale * a;
			}).join(' ');
			break;
		case 'C':
		case 'L':
		case 'M':
		case 'Q':
		case 'S':
		case 'T':
			res += translate_points(args, scale, dx, dy).join(' ');
			break;
		case 'H':
			res += args.map(function(a) {
				return a * scale + dx;
			}).join(' ');
			break;
		case 'V':
			res += args.map(function(a) {
				return a * scale + dy;
			}).join(' ');
			break;
		case 'A':
			for (var i = 0;i < args.length;i += 7) {
				args[i] *= scale;
				args[i + 1] *= scale;
				args[i + 5] = args[i + 5] * scale + dx;
				args[i + 6] = args[i + 6] * scale + dy;
			}
			res += args.join(' ');
			break;
		case 'a':
			for (var j = 0;j < args.length;j += 7) {
				args[j] *= scale;
				args[j + 1] *= scale;
				args[j + 5] = args[j + 5] * scale;
				args[j + 6] = args[j + 6] * scale;
			}
			res += args.join(' ');
			break;
		default:
			report_problem.silent_error('Cannot copy path cmd ' + cmd.c);
			return '';
		}

		d = cmd.rest;
	}
	return res.trim();
}

function translate_css_defs(defs, scale) {
	return defs.split(';').filter(function(def) {
		return !/^\s*$/.test(def);
	}).map(function(def) {
		var css_m = /^([^:]+:\s*)(-?[0-9.]*)?([-a-z]*|#[0-9a-fA-F]+|"[^"]*")$/.exec(def);
		if (!css_m) {
			report_problem.silent_error('Failed to parse SVG-CSS ' + def);
			return def; // Just hope for the best
		}

		if (!css_m[2]) {
			return def;
		}

		// numeric value, rescale
		return css_m[1] + scale * parseFloat(css_m[2]) + css_m[3];
	}).join(';');
}

function translate_css(css, prefix, scale) {
	var matches = utils.match_all(/([^{]+)\{([^}]*)\}/g, css);
	return matches.map(function(m) {
		return (
			utils.replace_all(utils.replace_all(m[1], '#', '#' + prefix), '.', '.' + prefix) +
			'{' + translate_css_defs(m[2], scale) + '}'
		);
	}).join('');
}

function import_el(dst_doc, el) {
	var res = dst_doc.importNode(el);
	utils.forEach(el.attributes, function(anode) {
		res.setAttribute(anode.name, anode.value);
	});
	return res;
}

// dst is a destination container where all the elements will be put into
// src_svg is the root node of an SVG document
// Silently fails (because that's best for our applications)
function copy(dst, src_svg, x_offset, y_offset, width) {
	var viewBox = src_svg.getAttribute('viewBox');
	if (!viewBox) {
		report_problem.silent_error('SVG copy failed: no viewBox');
		return;
	}

	var prefix = 'copy_' + utils.uuid() + '_';
	var vb = viewBox.split(' ').map(parseFloat);
	var scale = width / vb[2];
	var dst_doc = dst.ownerDocument;

	var do_copy = function(into, node, dx, dy) {
		if (node.nodeType === 3) {
			// Text
			into.appendChild(dst_doc.createTextNode(node.data));
			return;
		}

		if (node.nodeType !== 1) {
			return; // Not an element, ignore
		}
		var tagName = node.tagName.toLowerCase();

		var el;

		var transform_attr = node.getAttribute('transform');
		if (transform_attr) {
			var transform_m = /^translate\(([-0-9.]+)(?:,\s*|\s+)([-0-9.]+)\)$/.exec(transform_attr);
			if (!transform_m) {
				report_problem.silent_error('Cannot parse transformation ' + transform_attr + ', skipping element.');
				return;
			}

			dx += parseFloat(transform_m[1]) * scale;
			dy += parseFloat(transform_m[2]) * scale;
		}

		switch (tagName) {
		case 'mask': // Surprisingly, with all our test SVGs work fine, so ignore mask for now.
		case 'title':
		case 'desc':
		case 'sodipodi:namedview':
		case 'metadata':
			// suppress
			break;
		case 'g':
		case 'defs':
			el = import_el(dst_doc, node);
			break;
		case 'style':
			el = import_el(dst_doc, node);
			el.appendChild(dst_doc.createTextNode(translate_css(node.textContent, prefix, scale)));
			into.appendChild(el);
			return;
		case 'polygon':
			var points = translate_points(split_args(node.getAttribute('points')), scale, dx, dy);
			el = import_el(dst_doc, node);
			el.setAttribute('points', points.join(' '));
			break;
		case 'path':
			var d = translate_path(node.getAttribute('d'), scale, dx, dy);
			el = import_el(dst_doc, node);
			el.setAttribute('d', d);
			el.removeAttribute('transform');
			break;
		case 'line':
			el = import_el(dst_doc, node);
			el.setAttribute('x1', scale * parseFloat(node.getAttribute('x1')) + dx);
			el.setAttribute('y1', scale * parseFloat(node.getAttribute('y1')) + dy);
			el.setAttribute('x2', scale * parseFloat(node.getAttribute('x2')) + dx);
			el.setAttribute('y2', scale * parseFloat(node.getAttribute('y2')) + dy);
			break;
		case 'image':
			el = import_el(dst_doc, node);
			el.setAttribute('x', scale * parseFloat(node.getAttribute('x') || 0) + dx);
			el.setAttribute('y', scale * parseFloat(node.getAttribute('y') || 0) + dy);
			el.setAttribute('width', scale * parseFloat(node.getAttribute('width')));
			el.setAttribute('height', scale * parseFloat(node.getAttribute('height')));
			break;
		case 'circle':
			el = import_el(dst_doc, node);
			el.setAttribute('cx', scale * parseFloat(node.getAttribute('cx')) + dx);
			el.setAttribute('cy', scale * parseFloat(node.getAttribute('cy')) + dy);
			el.setAttribute('r', scale * parseFloat(node.getAttribute('r')));
			break;
		default:
			report_problem.silent_error('Unsupported element to copy: ' + tagName);
		}

		if (el) {
			into.appendChild(el);

			utils.forEach(node.childNodes, function(child) {
				do_copy(el, child, dx, dy);
			});

			el.removeAttribute('transform');

			var el_id = el.getAttribute('id');
			if (el_id) {
				el.setAttribute('id', prefix + el_id);
			}

			var classes = el.getAttribute('class');
			if (classes) {
				el.setAttribute('class', classes.split(/\s+/).map(function(cname) {
					return prefix + cname;
				}).join(' '));
			}
		}
	};
	utils.forEach(src_svg.childNodes, function(el) {
		do_copy(dst, el, x_offset, y_offset);
	});
}

return {
	el: el,
	parse: parse,
	parse_cmd: parse_cmd,
	copy: copy,
	split_args: split_args,
	translate_path: translate_path,
/*@DEV*/
	// Testing only
	_translate_css: translate_css,
/*/@DEV*/
};
})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = svg_utils;

	var report_problem = require('./report_problem');
	var utils = require('./utils');
}
/*/@DEV*/
