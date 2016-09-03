var xlsx = (function() {
'use strict';

function Sheet(doc) {
	function text(cell_id, text) {
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
				row = uiu.create_el(sheet_data, 'row', {r: row_id});
			}
			cell = uiu.create_el(row, 'c', {r: cell_id});
		}
		cell.setAttribute('t', 'inlineStr');
		var is_node = uiu.create_el(cell, 'is');
		uiu.create_el(is_node, 't', {}, text);
	}

	function val(cell_id, val) {
		var cell = doc.querySelector('c[r="' + cell_id + '"]');
		if (!cell) {
			report_problem.silent_error('Cannot find cell ' + cell_id);
			return;
		}
		var v_node = cell.querySelector('v');
		if (v_node) {
			uiu.text(v_node, val);
		} else {
			uiu.create_el(cell, 'v', {}, val);
		}
	}

	function merge_cells(ref) {
		var merges = doc.querySelector('mergeCells');
		if (!merges) {
			merges = uiu.create_el(doc.querySelector('worksheet'), 'mergeCells', {count: 0});
		}
		var count = parseInt(merges.getAttribute('count'), 10);
		if (count) {
			merges.setAttribute('count', count + 1);
		}
		uiu.create_el(merges, 'mergeCell', {ref: ref});
	}

	return {
		val: val,
		merge_cells: merge_cells,
		text: text,
	};
}

function open(ui8r, cb) {
	JSZip.loadAsync(ui8r).then(function(zipfile) {
		// TODO open relations
		// TODO open drawings doc
		function modify_sheet(sheet_fn, cb, func) {
			zipfile.file(sheet_fn).async('string').then(function(xml_str) {
				var xml_doc = (new DOMParser()).parseFromString(xml_str, 'application/xml');
				var sheet = Sheet(xml_doc);

				func(sheet);

				var new_xml = (new XMLSerializer()).serializeToString(xml_doc);
				zipfile.file(sheet_fn, new_xml);

				cb();
			});
		}

		function save(fn) {
			zipfile.generateAsync({
				type: 'blob',
				mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			}).then(function(content) {
				saveAs(content, fn);
			});
		}

		cb({
			modify_sheet: modify_sheet,
			save: save,
		});
	});
}


function add_col(col, add) {
	var num = _col2num(col) + add;
	return _num2col(num);
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

function _num2col(num) {
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
	// testing only
	_num2col: _num2col,
	_col2num: _col2num,
	_leap_year: _leap_year,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var report_problem = require('./report_problem');
	var uiu = require('./uiu');

	module.exports = xlsx;
}
/*/@DEV*/