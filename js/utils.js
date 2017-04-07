var utils = (function() {
'use strict';

function repeat(val, len) {
	var res = [];
	while (len--) {
		res.push(val);
	}
	return res;
}

function values(obj) {
	var res = [];
	for (var key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			res.push(obj[key]);
		}
	}
	return res;
}

function any(ar) {
	for (var i = 0;i < ar.length;i++) {
		if (ar[i]) {
			return true;
		}
	}
	return false;
}

function find(ar, cb) {
	for (var i = 0;i < ar.length;i++) {
		if (cb(ar[i])) {
			return ar[i];
		}
	}
	return null;
}

function pluck(obj, keys) {
	var res = {};
	keys.forEach(function(k) {
		if (obj.hasOwnProperty(k)) {
			res[k] = obj[k];
		}
	});
	return res;
}

function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
}

function iso8601(d) {
	return d.getFullYear() + '-' + add_zeroes(d.getMonth()+1) + '-' + add_zeroes(d.getDate());
}

function date_str(ts) {
	var d = new Date(ts);
	return add_zeroes(d.getDate()) + '.' + add_zeroes(d.getMonth()+1) + '.' + d.getFullYear();
}

function time_str(ts) {
	var d = new Date(ts);
	return add_zeroes(d.getHours()) + ':' + add_zeroes(d.getMinutes());
}

function timesecs_str(ts) {
	var d = new Date(ts);
	return add_zeroes(d.getHours()) + ':' + add_zeroes(d.getMinutes()) + ':' + add_zeroes(d.getSeconds());
}

function datetime_str(ts) {
	return date_str(ts) + ' ' + time_str(ts);
}

function human_date_str(s, ts) {
	var d = new Date(ts);
	return s._('weekday:' + d.getDay()) + ' ' + utils.date_str(d);
}

function add_zeroes(n) {
	if (n < 10) {
		return '0' + n;
	} else {
		return '' + n;
	}
}

function parse_query_string(qs) {
	// http://stackoverflow.com/a/2880929/35070
	var pl     = /\+/g;
	var search = /([^&=]+)=?([^&]*)/g;
	var decode = function (s) { return decodeURIComponent(s.replace(pl, ' ')); };

	var res = {};
	var m;
	while ((m = search.exec(qs)) !== null) {
		res[decode(m[1])] = decode(m[2]);
	}
	return res;
}

function multiline_regexp(regs, options) {
    return new RegExp(regs.map(
        function(reg){ return reg.source; }
    ).join(''), options);
}

function duration_mins(start_timestamp, end_timestamp) {
	var start = new Date(start_timestamp);
	var end = new Date(end_timestamp);

	// Since we're not showing seconds, we pretend to calculate in minutes:
	// start:      10:00:59 | 10:00:01
	// end:        11:12:01 | 11:12:59
	// precise:     1:11:02 |  1:12:58
	// our result:  1:12    |  1:12
	start.setSeconds(0);
	end.setSeconds(0);
	start.setMilliseconds(0);
	end.setMilliseconds(0);

	var diff_ms = end.getTime() - start.getTime();
	var mins = Math.round(diff_ms / 60000);
	return mins;
}

function duration_hours(start_timestamp, end_timestamp) {
	var mins = duration_mins(start_timestamp, end_timestamp);
	var hours = (mins - (mins % 60)) / 60;
	return hours + ':' + add_zeroes(mins % 60);
}

function duration_secs(start_timestamp, end_timestamp) {
	var diff_s = Math.round((end_timestamp - start_timestamp) / 1000);
	var secs = diff_s % 60;
	var diff_mins = (diff_s - secs) / 60;
	var mins = diff_mins % 60;
	var hours = (diff_mins - mins) / 60;

	if (hours) {
		return hours + ':' + add_zeroes(mins) + ':' + add_zeroes(secs);
	} else {
		return mins + ':' + add_zeroes(secs);
	}
}

function plucked_deep_equal(x, y, keys) {
	for (var i = 0;i < keys.length;i++) {
		var k = keys[i];
		if (! deep_equal(x[k], y[k])) {
			return false;
		}
	}
	return true;
}

function deep_equal(x, y) {
	if (x === y) {
		return true;
	}
	if ((x === null) || (y === null)) {
		return false;
	}
	if ((typeof x == 'object') && (typeof y == 'object')) {
		var key_count = 0;
		for (var k in x) {
			if (! deep_equal(x[k], y[k])) {
				return false;
			}
			key_count++;
		}

		for (k in y) {
			key_count--;
		}
		return key_count === 0;
	}
	return false;
}

function reverse_every(ar, every) {
	var res = [];
	for (var i = 0;i < ar.length;i += every) {
		for (var j = every - 1;j >= 0;j--) {
			if (i + j < ar.length) {
				res.push(ar[i + j]);
			}
		}
	}
	return res;
}

function map_dict(fields, func) {
	var res = {};
	fields.forEach(function(f) {
		res[f] = func(f);
	});
	return res;
}

function sum(ar) {
	return ar.reduce(function(x, y) {
		return x + y;
	}, 0);
}

function range(n) {
	var res = [];
	for (var i = 0;i < n;i++) {
		res.push(i);
	}
	return res;
}

function svg_el(parent, tagName, attrs, text) {
	var doc = parent.ownerDocument;
	var el = doc.createElementNS('http://www.w3.org/2000/svg', tagName);
	if (attrs) {
		for (var k in attrs) {
			el.setAttribute(k, attrs[k]);
		}
	}
	if (text !== undefined) {
		el.appendChild(doc.createTextNode(text));
	}
	parent.appendChild(el);
	return el;
}

function obj_update(obj, other) {
	for (var key in other) {
		obj[key] = other[key];
	}
}

function deep_copy(obj) {
	if (obj === undefined) {
		return obj;
	}
	return JSON.parse(JSON.stringify(obj));
}

function remove_cb(ar, cb) {
	for (var i = 0;i < ar.length;i++) {
		if (cb(ar[i])) {
			ar.splice(i, 1);
			return true;
		}
	}
	return false;
}

function remove(ar, val) {
	for (var i = 0;i < ar.length;i++) {
		if (ar[i] === val) {
			ar.splice(i, 1);
			return true;
		}
	}
	return false;
}

function parallel(tasks, callback) {
	var errored = false;
	var done = repeat(false, tasks.length);
	tasks.forEach(function(task, i) {
		task(function(err) {
			if (errored) return;

			if (err) {
				errored = true;
				callback(err);
				return;
			}

			done[i] = true;
			if (done.every(function(x) {return x;})) {
				callback();
			}
		});
	});
}

function count_lines(s) {
	return s.split(/\n/).length;
}

function replace_all(str, search, replacement) {
	return str.split(search).join(replacement);
}

var encode_utf8;
if (typeof TextEncoder != 'undefined') {
	encode_utf8 = function(str) {
		return new TextEncoder('utf-8').encode(str);
	};
} else {
	encode_utf8 = function(str) {
		var ints = [];
		for (var i = 0;i < str.length;i++) {
			var c = str.charCodeAt(i);
			if (c <= 0x7f) {
				ints.push(c);
			} else if (c <= 0x7ff) {
				ints.push(0xc0 | (c >> 6));
				ints.push(0x80 | (c & 0x3f));
			} else if ((c <= 0xd7ff) || (c > 0xdfff)) {
				ints.push(0xe0 | (c >> 12));
				ints.push(0x80 | ((c >> 6) & 0x3f));
				ints.push(0x80 | (c & 0x3f));
			} else {
				// Non-BMP, first reconstruct the codepoint from JavaScript's UTF-16 representation
				var c2 = str.charCodeAt(++i);
				c = ((c - 0xd800) << 10) + (c2 - 0xdc00) + 0x10000;

				ints.push(0xf0 | (c >> 18));
				ints.push(0x80 | ((c >> 12) & 0x3f));
				ints.push(0x80 | ((c >> 6) & 0x3f));
				ints.push(0x80 | (c & 0x3f));
			}
		}
		return new Uint8Array(ints);
	};
}

var decode_utf8;
if (typeof TextDecoder != 'undefined') {
	decode_utf8 = function(ab) {
		return new TextDecoder('utf-8').decode(ab);
	};
} else {
	decode_utf8 = function(ui8r) {
		// Neat but crazy
		return decodeURIComponent(escape(String.fromCharCode.apply(null, ui8r)));
	};
}

function hex(ab) {
	var lst = [];
	var r = new Uint8Array(ab);
	for (var i = 0;i < r.byteLength;i++) {
		var s = r[i].toString(16);
		while (s.length < 2) {
			s = '0' + s;
		}
		lst.push(s);
	}
	return lst.join('');
}

function unhex(str) {
	var lst = [];
	for (var i = 0;i < str.length;i += 2) {
		var byte = parseInt(str.slice(i, i + 2), 16);
		lst.push(byte);
	}
	return Uint8Array.from(lst);
}

function match_all(pattern, input) {
	var res = [];
	var match;
	while ((match = pattern.exec(input))) {
		res.push(match);
	}
	return res;
}

function filter_map(ar, cb) {
	var res = [];
	ar.forEach(function(el, idx) {
		var mapped = cb(el, idx);
		if (mapped) {
			res.push(mapped);
		}
	});
	return res;
}

function hash_obj(obj) {
	if (!obj) {
		obj = {__bup_hash: obj};
	}
	return deep_copy(obj);
}

// Returns false if the object is not new, otherwise the new hash
function hash_new(hashed_obj, obj) {
	if (!obj) {
		obj = {__bup_hash: obj};
	}
	return deep_equal(hashed_obj, obj) ? false : hash_obj(obj);
}

function forEach(str, cb) {
	for (var i = 0;i < str.length;i++) {
		cb(str[i], i);
	}
}

return {
	add_zeroes: add_zeroes,
	any: any,
	count_lines: count_lines,
	date_str: date_str,
	datetime_str: datetime_str,
	decode_utf8: decode_utf8,
	deep_equal: deep_equal,
	deep_copy: deep_copy,
	duration_hours: duration_hours,
	duration_mins: duration_mins,
	duration_secs: duration_secs,
	encode_utf8: encode_utf8,
	filter_map: filter_map,
	find: find,
	forEach: forEach,
	hex: hex,
	hash_obj: hash_obj,
	hash_new: hash_new,
	human_date_str: human_date_str,
	iso8601: iso8601,
	match_all: match_all,
	map_dict: map_dict,
	multiline_regexp: multiline_regexp,
	obj_update: obj_update,
	parse_query_string: parse_query_string,
	parallel: parallel,
	pluck: pluck,
	plucked_deep_equal: plucked_deep_equal,
	range: range,
	remove: remove,
	remove_cb: remove_cb,
	repeat: repeat,
	replace_all: replace_all,
	reverse_every: reverse_every,
	sum: sum,
	svg_el: svg_el,
	time_str: time_str,
	timesecs_str: timesecs_str,
	unhex: unhex,
	uuid: uuid,
	values: values,
};
})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = utils;
}
/*/@DEV*/
