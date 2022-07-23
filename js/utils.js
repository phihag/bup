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
		if (Object.prototype.hasOwnProperty.call(obj, k)) {
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
	return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
}

function german_date(d) {
	return pad(d.getDate()) + '.' + pad(d.getMonth()+1) + '.' + d.getFullYear();
}

function date_str(ts) {
	var d = new Date(ts);
	return pad(d.getDate()) + '.' + pad(d.getMonth()+1) + '.' + d.getFullYear();
}

function time_str(ts) {
	var d = new Date(ts);
	return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function timesecs_str(ts) {
	var d = new Date(ts);
	return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function datetime_str(ts) {
	return date_str(ts) + ' ' + time_str(ts);
}

function human_date_str(s, ts) {
	var d = new Date(ts);
	return s._('weekday|' + d.getDay()) + ' ' + utils.date_str(d);
}

// Returns a timestamp, or undefined if nothing can be parsed
function parse_time(str, now_ts) {
	var m = /^([0-9]{1,2}):([0-9]{1,2})(?::([0-9]{1,2}))?(?:\.[0-9]*)?$/.exec(str);
	var now = new Date(now_ts);
	if (m) {
		now.setMilliseconds(0);
		now.setSeconds(m[3] ? parseInt(m[3]) : 0);
		now.setMinutes(parseInt(m[2]));
		now.setHours(parseInt(m[1]));
		return now.getTime();
	}
}

function pad(n) {
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
	return hours + ':' + pad(mins % 60);
}

function duration_secs(start_timestamp, end_timestamp) {
	var diff = end_timestamp ? (end_timestamp - start_timestamp) : start_timestamp;
	var diff_s = Math.round(diff / 1000);
	var secs = diff_s % 60;
	var diff_mins = (diff_s - secs) / 60;
	var mins = diff_mins % 60;
	var hours = (diff_mins - mins) / 60;

	if (hours) {
		return hours + ':' + pad(mins) + ':' + pad(secs);
	} else {
		return mins + ':' + pad(secs);
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
	return fields.reduce(function(res, f) {
		res[f] = func(f);
		return res;
	}, {});
}

function sum(ar) {
	return ar.reduce(function(x, y) {
		return x + y;
	}, 0);
}

function min(ar) {
	return Math.min.apply(Math, ar);
}

function range(n) {
	var res = [];
	for (var i = 0;i < n;i++) {
		res.push(i);
	}
	return res;
}

function svg_el(parent, tagName, init_attrs, text) {
	var doc = parent.ownerDocument;
	var el = doc.createElementNS('http://www.w3.org/2000/svg', tagName);
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

// Parse JSON without crashing
function parse_json(json_str) {
	try {
		return JSON.parse(json_str);
	} catch(e) {
		return;
	}
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
	if (typeof replacement != 'string') {
		replacement = '' + replacement;
	}
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

function forEach(array_like, cb) {
	for (var i = 0;i < array_like.length;i++) {
		cb(array_like[i], i);
	}
}

// Returns a value between 0 (extremely dark) and 1 (extremely bright)
function brightness(rgb_str) {
	// formula from https://www.w3.org/TR/AERT#color-contrast
	var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(rgb_str);
	if (!m) {
		return; // undefined
	}

	return (
		0.299 * parseInt(m[1], 16) + // r
		0.587 * parseInt(m[2], 16) + // g
		0.114 * parseInt(m[3], 16)   // b
	);
}

function parse_rgb(rgb_str) {
	var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(rgb_str);
	if (!m) {
		return; // undefined
	}
	return {
		r: parseInt(m[1], 16),
		g: parseInt(m[2], 16),
		b: parseInt(m[3], 16),
	};
}

function color_diff(crgb1, crgb2) {
	var c1 = parse_rgb(crgb1);
	var c2 = parse_rgb(crgb2);
	if (!c1 || !c2) {
		return; // undefined
	}
	return Math.abs(c1.g - c2.g) + Math.abs(c1.r - c2.r) + Math.abs(c1.b - c2.b);
}

// Returns the color that's farthest away
function contrast_color(col, option1, option2) {
	if (color_diff(col, option1) < color_diff(col, option2)) {
		return option2;
	} else {
		return option1;
	}
}

function includes(ar, el) {
	if (ar.includes) {
		return ar.includes(el);
	}
	for (var i = 0;i < ar.length;i++) {
		if (ar[i] === el) {
			return true;
		}
	}
	return false;
}

function cmp(a, b) {
	if (a < b) {
		return -1;
	} else if (a > b) {
		return 1;
	} else {
		return 0;
	}
}

function cmp_key(key) {
	return function(x, y) {
		return cmp(x[key], y[key]);
	};
}

function urlencode(obj) {
	var res = '';
	for (var k in obj) {
		res += (res ? '&' : '') + encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
	}
	return res;
}

function domain(url) {
	var m = /^https?:\/\/(?:.*?\.)?([a-zA-Z0-9_]+\.[a-zA-Z]+)(?::[0-9]+)?\//.exec(url);
	return m && m[1];
}

function annotate_lastname(player) {
	if (player.lastname) return;

	var m = /^(.*)\s+(\S+)$/.exec(player.name);
	if (m) {
		player.firstname = m[1];
		player.lastname = m[2];
	} else {
		player.firstname = '';
		player.lastname = player.name;
	}
}

return {
	annotate_lastname: annotate_lastname,
	any: any,
	brightness: brightness,
	cmp: cmp,
	cmp_key: cmp_key,
	contrast_color: contrast_color,
	count_lines: count_lines,
	date_str: date_str,
	datetime_str: datetime_str,
	decode_utf8: decode_utf8,
	deep_copy: deep_copy,
	deep_equal: deep_equal,
	domain: domain,
	duration_hours: duration_hours,
	duration_mins: duration_mins,
	duration_secs: duration_secs,
	encode_utf8: encode_utf8,
	filter_map: filter_map,
	find: find,
	forEach: forEach,
	german_date: german_date,
	hash_new: hash_new,
	hash_obj: hash_obj,
	hex: hex,
	human_date_str: human_date_str,
	includes: includes,
	iso8601: iso8601,
	map_dict: map_dict,
	match_all: match_all,
	min: min,
	multiline_regexp: multiline_regexp,
	obj_update: obj_update,
	pad: pad,
	parallel: parallel,
	parse_json: parse_json,
	parse_query_string: parse_query_string,
	parse_time: parse_time,
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
	urlencode: urlencode,
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
