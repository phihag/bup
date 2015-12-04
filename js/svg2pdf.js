var svg2pdf = (function() {
'use strict';

function render(svg, pdf) {
	var nodes = svg.querySelectorAll('*');
	for (var i = 0;i < nodes.length;i++) {
		// Due to absence of let, declare vars here
		var x;
		var y;
		var m;

		var n = nodes[i];
		var style = window.getComputedStyle(n);

		if (style.visibility === 'hidden') {
			continue;
		}

		var mode = '';
		if (style.fill != 'none') {
			m = style.fill.match(/^rgb\(([0-9]+),\s*([0-9]+),\s*([0-9]+)\)|\#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
			var r = 0;
			var g = 0;
			var b = 0;
			if (m && m[1]) {
				r = parseInt(m[1], 10);
				g = parseInt(m[2], 10);
				b = parseInt(m[3], 10);
			} else if (m && m[4]) {
				r = parseInt(m[4], 16);
				g = parseInt(m[5], 16);
				b = parseInt(m[6], 16);
			}
			pdf.setFillColor(r, g, b);
			mode += 'F';
		}
		if (style.stroke != 'none') {
			var stroke_width = parseFloat(style['stroke-width']);
			pdf.setLineWidth(stroke_width);

			if (stroke_width > 0) {
				mode += 'D';
			}
		}

		switch (n.tagName.toLowerCase()) {
		case 'line':
			var x1 = parseFloat(n.getAttribute('x1'));
			var x2 = parseFloat(n.getAttribute('x2'));
			var y1 = parseFloat(n.getAttribute('y1'));
			var y2 = parseFloat(n.getAttribute('y2'));

			m = style['stroke-dasharray'].match(/^([0-9.]+)\s*px,\s*([0-9.]+)\s*px$/);
			if (m) {
				var dash_len = parseFloat(m[1]);
				var gap_len = parseFloat(m[2]);
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
					pdf.line(x, y, next_x, next_y);
					remaining_len -= dash_len;
					x = next_x + dx * gap_len;
					y = next_y + dy * gap_len;
					remaining_len -= gap_len;
				}
			} else {
				pdf.line(x1, y1, x2, y2);
			}
			break;
		case 'rect':
			x = parseFloat(n.getAttribute('x'));
			y = parseFloat(n.getAttribute('y'));
			var width = parseFloat(n.getAttribute('width'));
			var height = parseFloat(n.getAttribute('height'));
			pdf.rect(x, y, width, height, mode);
			break;
		case 'ellipse':
			var cx = parseFloat(n.getAttribute('cx'));
			var cy = parseFloat(n.getAttribute('cy'));
			var rx = parseFloat(n.getAttribute('rx'));
			var ry = parseFloat(n.getAttribute('ry'));
			pdf.ellipse(cx, cy, rx, ry, mode);
			break;
		case 'path':
			m = /^M\s*([0-9.]+)\s+([0-9.]+)\s+L\s*((?:[0-9.]+\s+[0-9.]+(?:$|\s+))+)$/.exec(n.getAttribute('d'));
			if (m) {
				x = parseFloat(m[1]);
				y = parseFloat(m[2]);

				var lines = m[3].split(/\s+/).map(parseFloat);
				for (var j = 0;j < lines.length;j+=2) {
					pdf.line(x, y, lines[j], lines[j+1]);
					x = lines[j];
					y = lines[j+1];
				}
			}
			break;
		case 'text':
			x = parseFloat(n.getAttribute('x'));
			y = parseFloat(n.getAttribute('y'));

			switch (style['text-anchor']) {
			case 'middle':
				x -= n.getBBox().width / 2;
				break;
			case 'end':
				x -= n.getBBox().width;
				break;
			}

			pdf.setFontStyle((style['font-weight'] == 'bold') ? 'bold' : 'normal');
			pdf.setFontSize(72 / 25.4 * parseFloat(style['font-size']));
			var str = $(n).text();

			var transform = n.getAttribute('transform');
			if (transform) {
				var transform_m = transform.match(/^rotate\(\s*(-?[0-9.]+)\s+(-?[0-9.]+),(-?[0-9.]+)\)$/);
				if (!transform_m) {
					pdf.text(x, y, str);
					break;
				}

				var angle = parseFloat(transform_m[1]);
				var corex = parseFloat(transform_m[2]);
				var corey = parseFloat(transform_m[3]);

				var diffx = x - corex;
				var diffy = y - corey;

				var nx = corex + diffx * Math.cos(angle * Math.PI / 180) - diffy * Math.sin(angle * Math.PI / 180);
				var ny = corey + diffx * Math.sin(angle * Math.PI / 180) + diffy * Math.cos(angle * Math.PI / 180);
				pdf.text(nx, ny, str, null, -angle);
			} else {
				pdf.text(x, y, str);
			}

			break;
		}
	}
}

function make(svg_node, props) {
	var pdf = new jsPDF({
		orientation: 'landscape',
		unit: 'mm',
		format: 'a4',
		autoAddFonts: false,
	});
	pdf.addFont('Helvetica', 'helvetica', 'normal');
	pdf.addFont('Helvetica-Bold', 'helvetica', 'bold');
	pdf.setFont('helvetica', 'normal');

	render(svg_node, pdf);
	pdf.setProperties(props);
	return pdf;
}

function save(svg_node, props, filename) {
	var pdf = make(svg_node, props);
	pdf.save(filename);
}

return {
	save: save,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = svg2pdf;
}
/*/@DEV*/