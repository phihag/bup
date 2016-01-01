var utils = (function() {
'use strict';

function repeat(val, len) {
	var res = [];
	while (len--) {
		res.push(val);
	}
	return res;
}

function qsEach(selector, func) {
	var nodes = document.querySelectorAll(selector);
	for (var i = 0;i < nodes.length;i++) {
		func(nodes[i], i);
	}
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

function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
}

function on_click(node, callback) {
	node.addEventListener('click', callback, false);
}

function on_click_qs(qs, callback) {
	var node = document.querySelector(qs);
	if (! node) {
		report_problem.on_silent_error('Expected to find qs  ' + qs + ' , but no node matching.');
		return;
	}
	return on_click(node, callback);
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

function datetime_str(ts) {
	return date_str(ts) + ' ' + time_str(ts);
}

function human_date_str(ts) {
	var d = new Date(ts);
	var WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	return WEEKDAYS[d.getDay()] + ' ' + utils.date_str(d);
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
	var hours = (mins - (mins % 60)) / 60;
	return hours + ':' + utils.add_zeroes(mins % 60);
}

function duration_secs(start_timestamp, end_timestamp) {
	var diff_s = Math.round((end_timestamp - start_timestamp) / 1000);
	var secs = diff_s % 60;
	var diff_mins = (diff_s - secs) / 60;
	var mins = diff_mins % 60;
	var hours = (diff_mins - mins) / 60;

	if (hours) {
		return hours + ':' + utils.add_zeroes(mins) + ':' + utils.add_zeroes(secs);
	} else {
		return mins + ':' + utils.add_zeroes(secs);
	}
}

function visible(node, val) {
	if (val) {
		$(node).show();
	} else {
		$(node).hide();
	}
}

function visible_qs(qs, val) {
	var node = document.querySelector(qs);
	if (! node) {
		report_problem.on_silent_error('Expected to find qs  ' + qs + ' , but no node matching.');
		return;
	}
	visible(node, val);
}

function de_jq(node) {
	if (typeof node.getAttribute === 'undefined') {
		// jQuery node
		return node[0];
	}
	return node;
}

function set_class(node, class_name) {
	node = de_jq(node);
	if (node.getAttribute('class') != class_name) {
		node.setAttribute('class', class_name);
	}
}

function obj_update(obj, other) {
	for (var key in other) {
		obj[key] = other[key];
	}
}

function deep_equal(x, y) {
	if (x === y) {
		return true;
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

return {
	add_zeroes: add_zeroes,
	any: any,
	date_str: date_str,
	datetime_str: datetime_str,
	deep_equal: deep_equal,
	duration_mins: duration_mins,
	duration_secs: duration_secs,
	human_date_str: human_date_str,
	iso8601: iso8601,
	map_dict: map_dict,
	multiline_regexp: multiline_regexp,
	obj_update: obj_update,
	on_click: on_click,
	on_click_qs: on_click_qs,
	parse_query_string: parse_query_string,
	qsEach: qsEach,
	repeat: repeat,
	reverse_every: reverse_every,
	set_class: set_class,
	sum: sum,
	time_str: time_str,
	uuid: uuid,
	values: values,
	visible: visible,
	visible_qs: visible_qs,
};
})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = utils;

	var report_problem = require('./report_problem');
}
/*/@DEV*/
