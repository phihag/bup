var xlsx = (function() {
'use strict';

var NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

function _create_el(parent, tagName, attrs, text) {
	return uiu.ns_el(parent, NS, tagName, attrs, text);
}

function _parse_xml(xml_str) {
	return (new DOMParser()).parseFromString(xml_str, 'application/xml');
}

function _serialize_xml(doc) {
	return (new XMLSerializer()).serializeToString(doc);
}

function Sheet(book, doc, drawing_doc) {
	function text(cell_id, text, style_id) {
		var cell = doc.querySelector('c[r="' + cell_id + '"]');
		if (!cell) {
			var m = /^([A-Z]+)([0-9]+)$/.exec(cell_id);
			if (!m) {
				report_problem.silent_error('Cannot parse cell_id ' + cell_id);
				return;
			}
			var row_id = m[2];

			var sheet_data = doc.querySelector('sheetData');
			var row = sheet_data.querySelector('row[r="' + row_id + '"]');
			if (!row) {
				row = _create_el(sheet_data, 'row', {r: row_id});
			}
			cell = _create_el(row, 'c', {r: cell_id});
		}
		cell.setAttribute('t', 'inlineStr');
		if (style_id) {
			cell.setAttribute('s', style_id);
		}
		uiu.empty(cell);
		var is_node = _create_el(cell, 'is');
		_create_el(is_node, 't', {}, text);
	}

	function rm_protection() {
		var el = doc.querySelector('sheetProtection');
		if (el) {
			uiu.remove(el);
		}
	}

	function val(cell_id, val, del_formula) {
		var cell = doc.querySelector('c[r="' + cell_id + '"]');
		if (!cell) {
			report_problem.silent_error('Cannot find cell ' + cell_id);
			return;
		}
		if (del_formula) {
			uiu.empty(cell);
		}
		var v_node = cell.querySelector('v');
		if (v_node) {
			uiu.text(v_node, val);
		} else {
			_create_el(cell, 'v', {}, val);
		}
		if (typeof val == 'string') {
			cell.setAttribute('t', 'str');
		} else if (typeof val === 'number') {
			cell.setAttribute('t', 'n');
		}
	}

	function get_style_node(cell_id) {
		var cell = doc.querySelector('c[r="' + cell_id + '"]');
		var style_id = parseInt(cell.getAttribute('s'));
		var container = book._style_doc.querySelector('cellXfs');
		return container.childNodes[style_id];
	}

	function merge_cells(ref) {
		var merges = doc.querySelector('mergeCells');
		if (!merges) {
			merges = _create_el(doc.querySelector('worksheet'), 'mergeCells', {count: 0});
		}
		var count = parseInt(merges.getAttribute('count'), 10);
		if (count) {
			merges.setAttribute('count', count + 1);
		}
		_create_el(merges, 'mergeCell', {ref: ref});
	}

	function add_drawing(func) {
		func(drawing_doc.documentElement);
	}

	return {
		rm_protection: rm_protection,
		val: val,
		merge_cells: merge_cells,
		text: text,
		add_drawing: add_drawing,
		get_style_node: get_style_node,
	};
}

function open(ui8r, cb) {
	var STYLE_FN = 'xl/styles.xml';
	JSZip.loadAsync(ui8r).then(function(zipfile) {
		function modify_sheet(sheet_id, cb, func) {
			var sheet_fn = 'xl/worksheets/sheet' + sheet_id + '.xml';
			var rel_fn = 'xl/worksheets/_rels/sheet' + sheet_id + '.xml.rels';
			zipfile.file(sheet_fn).async('string').then(function(xml_str) {
				var doc = _parse_xml(xml_str);
				zipfile.file(rel_fn).async('string').then(function(rel_str) {
					var rel_doc = _parse_xml(rel_str);

					function process(drawing_fn, drawing_doc) {
						var sheet = Sheet(book, doc, drawing_doc);

						func(sheet);

						var new_xml = _serialize_xml(doc);
						zipfile.file(sheet_fn, new_xml);

						if (drawing_fn) {
							var new_drawing_xml = _serialize_xml(drawing_doc);
							zipfile.file(drawing_fn, new_drawing_xml);
						}

						cb();
					}

					var drawing_ref = doc.querySelector('drawing');
					if (drawing_ref) {
						var drawing_id = drawing_ref.getAttribute('r:id');
						var drawing_rel_fn = rel_doc.querySelector('Relationship[Id="' + drawing_id + '"]').getAttribute('Target');
						var m = /(drawing[0-9]+\.xml)$/.exec(drawing_rel_fn);
						var drawing_fn = 'xl/drawings/' + m[1];
						zipfile.file(drawing_fn).async('string').then(function(drawing_str) {
							process(drawing_fn, _parse_xml(drawing_str));
						});
					} else {
						process();
					}
				});
			});
		}

		function save(fn) {
			var new_style_xml = _serialize_xml(book._style_doc);
			zipfile.file(STYLE_FN, new_style_xml);

			zipfile.generateAsync({
				type: 'blob',
				mimeType: (
					/xlsm$/.test(fn) ?
					'application/vnd.ms-excel.sheet.macroEnabled.12' :
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
				),
			}).then(function(blob) {
				save_file(blob, fn);
			});
		}

		// Returns the style ID
		// addfunc gets called with the new <xf> element
		function add_style(addfunc) {
			var style_doc = book._style_doc;
			var container = style_doc.querySelector('cellXfs');
			var el = uiu.ns_el(container, NS, 'xf');
			addfunc(el);
			var id = parseInt(container.getAttribute('count'));
			container.setAttribute('count', id + 1);
			return id;
		}

		// Returns the border ID
		function add_border(thickness) {
			var style_doc = book._style_doc;
			var container = style_doc.querySelector('borders');
			var el = uiu.ns_el(container, NS, 'border');
			['left', 'right', 'top', 'bottom'].forEach(function(direction) {
				var d = uiu.ns_el(el, NS, direction, {
					style: thickness,
				});
				uiu.el(d, 'color', {indexed: 64});
			});
			uiu.el(el, 'diagonal');

			var id = parseInt(container.getAttribute('count'));
			container.setAttribute('count', id + 1);
			return id;
		}

		var book = {
			modify_sheet: modify_sheet,
			save: save,
			add_style: add_style,
			add_border: add_border,
		};

		zipfile.remove('xl/calcChain.xml');

		zipfile.file(STYLE_FN).async('string').then(function(style_str) {
			book._style_doc = _parse_xml(style_str);
			cb(book);
		});
	});
}


function add_col(col, add) {
	var num = _col2num(col) + add;
	return num2col(num);
}

function _col2num(col) {
	// A=0, B=1, Z=26, AA=27
	var num = 0;
	for (var i = 0;i < col.length;i++) {
		num *= 26;
		num += (col.charCodeAt(i) - 65);
	}
	// give bonus to first char
	var bonus = 26;
	for (var j = 1;j < col.length;j++) {
		num += bonus;
		bonus *= 26;
	}
	return num;
}

function num2col(num) {
	var res = '';
	var bonus = 26;
	var minchars = 1;
	while (num >= bonus) {
		num -= bonus;
		bonus *= 26;
		minchars++;
	}

	while (num > 0) {
		res = String.fromCharCode(65 + (num % 26)) + res;
		num = (num - (num % 26)) / 26;
	}
	while (res.length < minchars) {
		res = 'A' + res;
	}
	return res;
}

function _leap_year(y) {
	return (y % 400 === 0) || ((y % 4 === 0) && (y % 100 !== 0));
}

// Convert a JavaScript date object to an excel date number
function date(d) {
	var res = 25569; // 1970-01-01
	var target_year = d.getFullYear();
	for (var year = 1970;year < target_year;year++) {
		res += _leap_year(year) ? 366 : 365;
	}
	var month = d.getMonth();
	if (month > 0) res += 31;
	if (month > 1) res += _leap_year(target_year) ? 29 : 28;
	if (month > 2) res += 31;
	if (month > 3) res += 30;
	if (month > 4) res += 31;
	if (month > 5) res += 30;
	if (month > 6) res += 31;
	if (month > 7) res += 31;
	if (month > 8) res += 30;
	if (month > 9) res += 31;
	if (month > 10) res += 30;
	res += d.getDate() - 1;
	return res;
}

return {
	open: open,
	date: date,
	add_col: add_col,
	num2col: num2col,
	NS: NS,
/*@DEV*/
	// testing only
	_col2num: _col2num,
	_leap_year: _leap_year,
/*/@DEV*/
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var report_problem = require('./report_problem');
	var save_file = require('./save_file');
	var uiu = require('./uiu');

	module.exports = xlsx;
}
/*/@DEV*/