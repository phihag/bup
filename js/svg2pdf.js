'use strict';
var svg2pdf = (function() {

function parse_path(d) {
	if (!d) return null;

	var res = [];

	var x = 0;
	var y = 0;
	var i; // no let :(
	var acc;
	var cur;
	var epx;
	var epy;
	var p1x;
	var p1y;
	var last_sc_segment_ax = null;
	var last_sc_segment_ay = null;
	var last_qt_segment_ax = null;
	var last_qt_segment_ay = null;

	function _new_subpath() {
		acc = [];
		cur = {
			x1: x,
			y1: y,
			acc: acc,
			closed: false,
		};
		res.push(cur);
	}

	while (d && !/^\s*$/.test(d)) {
		var cmd = svg_utils.parse_cmd(d);
		if (!cmd) {
			report_problem.silent_error('Unsupported path data: ' + JSON.stringify(d));
			return;
		}
		d = cmd.rest;
		var c = cmd.c;
		var args = cmd.args;
		var a1 = args[0];
		var a2 = args[1];

		if ((c === 'z') || (c === 'Z')) {
			x = cur.x1;
			y = cur.y1;
			cur.closed = true;
		} else if (c === 'v') {
			args.forEach(function(a) {
				acc.push([0, a]);
				y += a;
			});
		} else if (c === 'V') {
			args.forEach(function(a) {
				acc.push([0, a - y]);
				y = a;
			});
		} else if (c === 'h') {
			args.forEach(function(a) {
				acc.push([a, 0]);
				x += a;
			});
		} else if (c === 'H') {
			args.forEach(function(a) {
				acc.push([a - x, 0]);
				x = a;
			});
		} else if (c === 'l') {
			for (i = 0; i < args.length;i += 2) {
				acc.push([args[i], args[i + 1]]);
				x += args[i];
				y += args[i + 1];
			}
		} else if (c === 'L') {
			for (i = 0; i < args.length;i += 2) {
				acc.push([args[i] - x, args[i + 1] - y]);
				x = args[i];
				y = args[i + 1];
			}
		} else if (c === 'm') {
			x += a1;
			y += a2;
			_new_subpath();

			for (i = 2; i < args.length;i += 2) {
				acc.push([args[i], args[i + 1]]);
				x += args[i];
				y += args[i + 1];
			}
		} else if (c === 'M') {
			x = a1;
			y = a2;
			_new_subpath();

			for (i = 2; i < args.length;i += 2) {
				acc.push([args[i] - x, args[i + 1] - y]);
				x = args[i];
				y = args[i + 1];
			}
		} else if (c === 'A') {
			for (i = 0;i < args.length;i += 7) {
				var relex = args[i + 5] - x;
				var reley = args[i + 6] - y;
				var draw = arc2beziers(
					args[i], args[i + 1], args[i + 2],
					args[i + 3], args[i + 4],
					relex, reley);
				acc.push.apply(acc, draw);
				x = args[i + 5];
				y = args[i + 6];
			}
		} else if (c === 'a') {
			for (i = 0;i < args.length;i += 7) {
				var bdraw = arc2beziers(
					args[i], args[i + 1],
					args[i + 2],
					args[i + 3], args[i + 4],
					args[i + 5], args[i + 6]);
				acc.push.apply(acc, bdraw);
				x += args[i + 5];
				y += args[i + 6];
			}
		} else if (c === 'c') {
			for (i = 0;i < args.length;i += 6) {
				acc.push(args.slice(i, i + 6));
				last_sc_segment_ax = x + args[i + 2];
				last_sc_segment_ay = y + args[i + 3];
				x += args[i + 4];
				y += args[i + 5];
			}
		} else if (c === 'C') {
			for (i = 0;i < args.length;i += 6) {
				acc.push(args.slice(i, i + 6).map(function(a, i) {
					return a - ((i % 2) ? y : x);
				}));
				last_sc_segment_ax = args[i + 2];
				last_sc_segment_ay = args[i + 3];
				x = args[i + 4];
				y = args[i + 5];
			}
		} else if (c === 's') {
			for (i = 0;i < args.length;i += 4) {
				epx = args[i + 2];
				epy = args[i + 3];

				acc.push([
					(last_sc_segment_ax === null) ? 0 : (x - last_sc_segment_ax),
					(last_sc_segment_ay === null) ? 0 : (y - last_sc_segment_ay),
					args[i],
					args[i + 1],
					epx,
					epy,
				]);
				last_sc_segment_ax = x + args[i];
				last_sc_segment_ay = y + args[i + 1];
				x += epx;
				y += epy;
			}
		} else if (c === 'S') {
			for (i = 0;i < args.length;i += 4) {
				epx = args[i + 2];
				epy = args[i + 3];

				acc.push([
					(last_sc_segment_ax === null) ? 0 : (x - last_sc_segment_ax),
					(last_sc_segment_ay === null) ? 0 : (y - last_sc_segment_ay),
					args[i] - x,
					args[i + 1] - y,
					epx - x,
					epy - y,
				]);
				last_sc_segment_ax = args[i];
				last_sc_segment_ay = args[i + 1];
				x = epx;
				y = epy;
			}
		} else if (c === 'q') {
			for (i = 0;i < args.length;i += 4) {
				// See https://stackoverflow.com/q/9485788/35070
				p1x = args[i];
				p1y = args[i + 1];
				epx = args[i + 2];
				epy = args[i + 3];

				acc.push([
					p1x * 2 / 3,
					p1y * 2 / 3,
					epx + ((p1x - epx) * 2 / 3),
					epy + ((p1y - epy) * 2 / 3),
					epx,
					epy,
				]);
				last_qt_segment_ax = x + args[i];
				last_qt_segment_ay = y +args[i + 1];
				x += epx;
				y += epy;
			}
		} else if (c === 'Q') {
			for (i = 0;i < args.length;i += 4) {
				p1x = args[i] - x;
				p1y = args[i + 1] - y;
				epx = args[i + 2] - x;
				epy = args[i + 3] - y;

				acc.push([
					p1x * 2 / 3,
					p1y * 2 / 3,
					epx + ((p1x - epx) * 2 / 3),
					epy + ((p1y - epy) * 2 / 3),
					epx,
					epy,
				]);
				last_qt_segment_ax = args[i];
				last_qt_segment_ay = args[i + 1];
				x = args[i + 2];
				y = args[i + 3];
			}
		} else if (c === 't') {
			for (i = 0;i < args.length;i += 4) {
				p1x = (last_qt_segment_ax === null) ? 0 : (x - last_qt_segment_ax);
				p1y = (last_qt_segment_ay === null) ? 0 : (y - last_qt_segment_ay);
				epx = args[i];
				epy = args[i + 1];
				last_qt_segment_ax = x + p1x;
				last_qt_segment_ay = y + p1y;

				acc.push([
					p1x * 2 / 3,
					p1y * 2 / 3,
					epx + ((p1x - epx) * 2 / 3),
					epy + ((p1y - epy) * 2 / 3),
					epx,
					epy,
				]);
				x += epx;
				y += epy;
			}
		} else if (c === 'T') {
			for (i = 0;i < args.length;i += 4) {
				p1x = (last_qt_segment_ax === null) ? 0 : (x - last_qt_segment_ax);
				p1y = (last_qt_segment_ay === null) ? 0 : (y - last_qt_segment_ay);
				epx = args[i] - x;
				epy = args[i + 1] - y;
				last_qt_segment_ax = x + p1x;
				last_qt_segment_ay = y + p1y;

				acc.push([
					p1x * 2 / 3,
					p1y * 2 / 3,
					epx + ((p1x - epx) * 2 / 3),
					epy + ((p1y - epy) * 2 / 3),
					epx,
					epy,
				]);
				x += epx;
				y += epy;
			}
		} else {
			report_problem.silent_error('Unsupported SVG command ' + c);
		}

		if ((c !== 'c') && (c !== 'C') && (c === 's') && (c !== 'S')) {
			last_sc_segment_ax = last_sc_segment_ay = null;
		}
		if ((c !== 'q') && (c !== 'Q') && (c === 't') && (c !== 'T')) {
			last_qt_segment_ax = last_qt_segment_ay = null;
		}
	}
	return res;
}

function _to_degrees(radians) {
	return radians * 180 / Math.PI;
}

function _to_radians(degrees) {
	return degrees / 180 * Math.PI;
}

// Find the bezier representation (if any) of an arc.
// Start of the arc is [0, 0].
// [rx, ry] is radius of the ellipse.
// angle is the rotation of the ellipse
// large_flag and sweep_flag determine which solution to find.
// [ex, ey] is the end of the arc.
// See https://www.w3.org/TR/SVG/paths.html#PathDataCurveCommands#PathDataEllipticalArcCommands for more details on the input
// Returns an array of jsPDF specs for the bezier curves to draw
function arc2beziers(rx, ry, angle, large_flag, sweep_flag, ex, ey) {
	// See https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter for the formulas used here.
	// Much of this source has been copied/adapted from https://github.com/BigBadaboom/androidsvg/blob/418cf676849b200cacf3465478079f39709fe5b1/androidsvg/src/main/java/com/caverock/androidsvg/SVGAndroidRenderer.java#L2579 (ASL 2.0)

	if (!ex && !ey) {
		// End points = start points - nothing to draw (mandated by spec)
		return [];
	}

	// Straight line
	if (rx == 0 || ry == 0) {
		return [[ex, ey]];
	}

	// Sign of the radii is ignored (behaviour specified by the spec)
	rx = Math.abs(rx);
	ry = Math.abs(ry);

	// Convert angle from degrees to radians
	var angleRad = (angle % 360.0) / 180 * Math.PI;
	var cosAngle = Math.cos(angleRad);
	var sinAngle = Math.sin(angleRad);

	var dx2 = - ex / 2;
	var dy2 = - ey / 2;

	// Step 1 : Compute (x1', y1') - the transformed start point
	var x1 = (cosAngle * dx2 + sinAngle * dy2);
	var y1 = (-sinAngle * dx2 + cosAngle * dy2);
	var x1_sq = x1 * x1;
	var y1_sq = y1 * y1;

	// Check that radii are large enough.
	// If they are not, the spec says to scale them up so they are.
	// This is to compensate for potential rounding errors/differences between SVG implementations.
	var radiiCheck = x1_sq / rx_sq + y1_sq / ry_sq;
	if (radiiCheck > 1) {
		rx = Math.sqrt(radiiCheck) * rx;
		ry = Math.sqrt(radiiCheck) * ry;
	}
	var rx_sq = rx * rx;
	var ry_sq = ry * ry;

	// Step 2 : Compute (cx1, cy1) - the transformed centre point
	var sign = (large_flag == sweep_flag) ? -1 : 1;

	var sq = ((rx_sq * ry_sq) - (rx_sq * y1_sq) - (ry_sq * x1_sq)) / ((rx_sq * y1_sq) + (ry_sq * x1_sq));
	sq = (sq < 0) ? 0 : sq;
	var coef = sign * Math.sqrt(sq);
	var cx1 = coef * ((rx * y1) / ry);
	var cy1 = coef * -((ry * x1) / rx);

	// Step 3 : Compute (cx, cy) from (cx1, cy1)
	var sx2 = ex / 2;
	var sy2 = ey / 2;
	var cx = sx2 + (cosAngle * cx1 - sinAngle * cy1);
	var cy = sy2 + (sinAngle * cx1 + cosAngle * cy1);

	// Step 4 : Compute the angleStart (angle1) and the angleExtent (dangle)
	var ux = (x1 - cx1) / rx;

	var uy = (y1 - cy1) / ry;
	var vx = (-x1 - cx1) / rx;
	var vy = (-y1 - cy1) / ry;

	// Compute the angle start
	var n = Math.sqrt((ux * ux) + (uy * uy));
	var p = ux; // (1 * ux) + (0 * uy)
	sign = (uy < 0) ? -1 : 1;
	var angleStart = _to_degrees(sign * Math.acos(p / n));

	// Compute the angle extent
	n = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
	p = ux * vx + uy * vy;
	sign = (ux * vy - uy * vx < 0) ? -1 : 1;
	var angleExtent = _to_degrees(sign * Math.acos(p / n));

	if (!sweep_flag && angleExtent > 0) {
		angleExtent -= 360;
	} else if (sweep_flag && angleExtent < 0) {
		angleExtent += 360;
	}

	angleStart %= 360;
	angleExtent %= 360;

	var bezierPoints = _make_beziers(angleStart, angleExtent);
	var arad = _to_radians(angle);
	var sinm = Math.sin(arad);
	var cosm = Math.cos(arad);

	bezierPoints = bezierPoints.map(function(p) {
		var x = p[0] * rx;
		var y = p[1] * ry;

		x = cosm * x - sinm * y + cx;
		y = sinm * x + cosm * y + cy;
		return [x, y];
	});

	// The last point in the bezier set should match exactly the last coord pair in the arc (ie: x,y). But
	// considering all the mathematical manipulation we have been doing, it is bound to be off by a tiny
	// fraction. Experiments show that it can be up to around 0.00002.  So why don't we just set it to
	// exactly what it ought to be.
	bezierPoints[bezierPoints.length - 1] = [ex, ey];

	var res = [];
	var offx = 0;
	var offy = 0;
	for (var i=0;i < bezierPoints.length;i += 3) {
		var p1 = bezierPoints[i];
		var p2 = bezierPoints[i + 1];
		var p3 = bezierPoints[i + 2];

		res.push([
			p1[0] - offx, p1[1] - offy,
			p2[0] - offx, p2[1] - offy,
			p3[0] - offx, p3[1] - offy,
		]);

		offx = p3[0];
		offy = p3[1];
	}

	return res;
}

// Helper function for arc2bezier above
function _make_beziers(angleStart, angleExtent) {
	// copied / adapted from https://github.com/BigBadaboom/androidsvg/blob/418cf676849b200cacf3465478079f39709fe5b1/androidsvg/src/main/java/com/caverock/androidsvg/SVGAndroidRenderer.java#L2579 (ASL 2.0)
	var numSegments = Math.ceil(Math.abs(angleExtent) / 90.0);
	angleStart = _to_radians(angleStart);
	angleExtent = _to_radians(angleExtent);
	var angleIncrement = (angleExtent / numSegments);

	// The length of each control point vector is given by the following formula.
	var controlLength = 4 / 3 * Math.sin(angleIncrement / 2) / (1 + Math.cos(angleIncrement / 2));
	var coords = [];

	for (var i = 0;i < numSegments;i++) {
		var angle = angleStart + i * angleIncrement;
		var dx = Math.cos(angle);
		var dy = Math.sin(angle);
		
		// First control point
		coords.push([
			dx - controlLength * dy,
			dy + controlLength * dx,
		]);

		// Second control point
		angle += angleIncrement;
		dx = Math.cos(angle);
		dy = Math.sin(angle);
		coords.push([
			dx + controlLength * dy,
			dy - controlLength * dx,
		]);
		
		// Endpoint of bezier
		coords.push([dx, dy]);
	}

	return coords;
}

function parse_color(col_str) {
	var m = col_str.match(/^rgb\(([0-9]+),\s*([0-9]+),\s*([0-9]+)\)$/);
	if (m) {
		return {
			r: parseInt(m[1], 10),
			g: parseInt(m[2], 10),
			b: parseInt(m[3], 10),
		};
	}

	m = col_str.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
	if (m) {
		return {
			r: parseInt(m[1], 16),
			g: parseInt(m[2], 16),
			b: parseInt(m[3], 16),
		};
	}

	m = col_str.match(/^#[0-9a-fA-F]{3}$/);
	if (m) {
		return {
			r: (17 * parseInt(col_str[1], 16)),
			g: (17 * parseInt(col_str[2], 16)),
			b: (17 * parseInt(col_str[3], 16)),
		};
	}

	return {
		r: 0,
		g: 0,
		b: 0,
	};
}

function _all_els(svg) {
	var to_visit = [(svg.nodeType === 1) ? svg : svg.documentElement];
	var res = [];
	while (to_visit.length > 0) {
		var el = to_visit.pop();

		if (el.nodeType !== 1) {
			continue; // Not an element, not interested
		}
		var tagName = el.tagName.toLowerCase();
		if (tagName === 'defs') {
			continue; // Not interested
		}

		if (tagName !== 'svg') {
			res.push(el);
		}

		var children = el.childNodes;
		for (var i = children.length - 1;i >= 0;i--) {
			to_visit.push(children[i]);
		}
	}
	return res;
}

function render_page(svg, pdf, scale) {
	_all_els(svg).forEach(function(el) {
		render_el(el, pdf, scale);
	});
}

function render_el(el, pdf, scale) {
	// Due to absence of let, declare vars here
	var x;
	var y;
	var m;
	var width;
	var height;
	var cx;
	var cy;

	var style = window.getComputedStyle(el);

	if (style.visibility === 'hidden') {
		return;
	}

	var mode = '';
	if (style.fill != 'none') {
		var col = parse_color(style.fill);
		pdf.setFillColor(col.r, col.g, col.b);
		mode = (style.fillRule === 'evenodd') ? 'f*' : 'f';
	}
	if ((style.stroke != 'none') && (style.stroke)) {
		var scol = parse_color(style.stroke);
		pdf.setDrawColor(scol.r, scol.g, scol.b);

		var stroke_width = parseFloat(style['stroke-width']);
		pdf.setLineWidth(scale * stroke_width);

		if (stroke_width > 0) {
			if (style.fill != 'none') {
				mode = (style.fillRule === 'evenodd') ? 'B*' : 'B';
			} else {
				mode = 'S';
			}
		}
	}

	var tagName = el.tagName.toLowerCase();
	if (tagName.indexOf(':') >= 0) {
		return;
	}
	switch (tagName) {
	case 'line':
		var x1 = parseFloat(el.getAttribute('x1'));
		var x2 = parseFloat(el.getAttribute('x2'));
		var y1 = parseFloat(el.getAttribute('y1'));
		var y2 = parseFloat(el.getAttribute('y2'));

		var dash_len = undefined;
		var gap_len = undefined;
		var style_dasharray = style['stroke-dasharray'];
		if ((m = style_dasharray.match(/^([0-9.]+)\s*px,\s*([0-9.]+)\s*px$/))) {
			dash_len = parseFloat(m[1]);
			gap_len = parseFloat(m[2]);
		} else if ((m = style_dasharray.match(/^([0-9.]+)\s*px$/))) {
			dash_len = parseFloat(m[1]);
			gap_len = dash_len;
		}

		if (dash_len !== undefined) {
			if (dash_len + gap_len <= 0) {
				report_problem.silent_error('svg line dash/gap too small: ' + (dash_len + gap_len));
				return;
			}

			x = x1;
			y = y1;

			// Normalize vector
			var vector_len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
			var dx = (x2 - x1) / vector_len;
			var dy = (y2 - y1) / vector_len;
			var remaining_len = vector_len;
			while (remaining_len > 0) {
				dash_len = Math.min(dash_len, remaining_len);
				var next_x = x + dx * dash_len;
				var next_y = y + dy * dash_len;
				pdf.line(x * scale, y  * scale, next_x  * scale, next_y * scale);
				remaining_len -= dash_len;
				x = next_x + dx * gap_len;
				y = next_y + dy * gap_len;
				remaining_len -= gap_len;
			}
		} else {
			pdf.line(x1 * scale, y1 * scale, x2 * scale, y2 * scale);
		}
		break;
	case 'rect':
		x = parseFloat(el.getAttribute('x'));
		y = parseFloat(el.getAttribute('y'));
		width = parseFloat(el.getAttribute('width'));
		height = parseFloat(el.getAttribute('height'));
		pdf.rect(x * scale, y * scale, width * scale, height * scale, mode);
		break;
	case 'circle':
		cx = parseFloat(el.getAttribute('cx'));
		cy = parseFloat(el.getAttribute('cy'));
		var r = parseFloat(el.getAttribute('r'));
		pdf.ellipse(cx * scale, cy * scale, r * scale, r * scale, mode);
		break;
	case 'ellipse':
		cx = parseFloat(el.getAttribute('cx'));
		cy = parseFloat(el.getAttribute('cy'));
		var rx = parseFloat(el.getAttribute('rx'));
		var ry = parseFloat(el.getAttribute('ry'));
		pdf.ellipse(cx * scale, cy * scale, rx * scale, ry * scale, mode);
		break;
	case 'path':
		var paths = parse_path(el.getAttribute('d'));
		if (paths) {
			paths.forEach(function(path, path_idx) {
				var path_style = (path_idx === paths.length - 1) ? mode : null;
				pdf.lines(path.acc, path.x1 * scale, path.y1 * scale, [scale, scale], path_style, path.closed);
			});
		}
		break;
	case 'polygon':
		var points = svg_utils.split_args(el.getAttribute('points')).map(parseFloat);
		var px1 = scale * points[0];
		var py1 = scale * points[1];
		x = px1;
		y = py1;
		var acc = [];
		for (var point_i = 2;point_i < points.length;point_i += 2) {
			var px = scale * points[point_i];
			var py = scale * points[point_i + 1];

			acc.push([px - x, py - y]);
			x = px;
			y = py;
		}
		pdf.lines(acc, px1, py1, [1, 1], mode, true);
		break;
	case 'text':
		x = parseFloat(el.getAttribute('x'));
		y = parseFloat(el.getAttribute('y'));

		switch (style['text-anchor']) {
		case 'middle':
			x -= (el.getBBox().width / 2);
			break;
		case 'end':
			x -= el.getBBox().width;
			break;
		}

		var font_weight = style['font-weight'];
		var is_bold = (font_weight == 'bold') || (font_weight == '700');
		pdf.setFontStyle(is_bold ? 'bold' : 'normal');
		var pt_font_size = parseFloat(style['font-size']);
		var font_size = scale * 72 / 25.6 * pt_font_size;
		pdf.setFontSize(font_size);

		var transform = el.getAttribute('transform');
		var transform_m = transform && (
			transform.match(/^rotate\(\s*(-?[0-9.]+)\s+(-?[0-9.]+),(-?[0-9.]+)\)$/));

		var _render_text = function(str, x, y) {
			if (transform_m) {
				var angle = parseFloat(transform_m[1]);
				var corex = parseFloat(transform_m[2]);
				var corey = parseFloat(transform_m[3]);

				var diffx = x - corex;
				var diffy = y - corey;

				var nx = corex + diffx * Math.cos(angle * Math.PI / 180) - diffy * Math.sin(angle * Math.PI / 180);
				var ny = corey + diffx * Math.sin(angle * Math.PI / 180) + diffy * Math.cos(angle * Math.PI / 180);
				pdf.text(nx * scale, ny * scale, str, null, -angle);
			} else {
				pdf.text(x * scale, y * scale, str);
			}
		};

		var text = el.textContent;
		var dx_attr = el.getAttribute('dx');
		if (dx_attr) {
			var dx_vals = svg_utils.split_args(dx_attr).map(parseFloat);
			var ax = x;
			for (var j = 0;j < text.length;j++) {
				if (j < dx_vals.length) {
					ax += dx_vals[j];
				}
				_render_text(text[j], ax, y);
				ax += pdf.getStringUnitWidth(text[j]) * pt_font_size;
			}
		} else {
			_render_text(text, x, y);
		}
		break;
	case 'image':
		var imgData = el.getAttribute('xlink:href');
		x = parseFloat(el.getAttribute('x'));
		y = parseFloat(el.getAttribute('y'));
		width = parseFloat(el.getAttribute('width'));
		height = parseFloat(el.getAttribute('height'));
		pdf.addImage(imgData, x * scale, y * scale, width, height);
		break;
	/*@DEV*/
	case 'defs':
	case 'style':
	case 'title':
	case 'metadata':
	case 'g':
		// We don't care
		break;
	default:
		report_problem.silent_error('Unsupported element: ' + el.tagName.toLowerCase());
	/*/@DEV*/
	}
}

function make(svg_nodes, props, orientation, scale) {
	var pdf = new jsPDF({
		orientation: orientation,
		unit: 'mm',
		format: 'a4',
		autoAddFonts: false,
	});
	pdf.addFont('Helvetica', 'helvetica', 'normal');
	pdf.addFont('Helvetica-Bold', 'helvetica', 'bold');
	pdf.setFont('helvetica', 'normal');
	scale = scale || 1;

	for (var i = 0;i < svg_nodes.length;i++) {
		if (i > 0) {
			pdf.addPage();
		}
		render_page(svg_nodes[i], pdf, scale);
	}
	pdf.setProperties(props);
	return pdf;
}

function save(svg_nodes, props, orientation, filename, scale) {
	var pdf = make(svg_nodes, props, orientation, scale);
	var blob = pdf.output('blob');
	save_file(blob, filename);
}

return {
	make: make,
	save: save,
/*@DEV*/
	// Testing only
	parse_path: parse_path,
	arc2beziers: arc2beziers,
	_make_beziers: _make_beziers,
	parse_color: parse_color,
	_all_els: _all_els,
/*/@DEV*/
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = svg2pdf;

	var report_problem = require('./report_problem');
	var save_file = require('./save_file');
	var svg_utils = require('./svg_utils');
}
/*/@DEV*/