'use strict';

var utils = (function() {

function qsEach(selector, func) {
	var nodes = document.querySelectorAll(selector);
	for (var i = 0;i < nodes.length;i++) {
		func(nodes[i], i);
	}
}

function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
}

function on_click(node, callback) {
	node.on('click', callback);
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
	var decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };

	var res = {};
	var m;
	while (m = search.exec(qs)) {
		res[decode(m[1])] = decode(m[2]);
	}
	return res;
}

function multiline_regexp(regs, options) {
    return new RegExp(regs.map(
        function(reg){ return reg.source; }
    ).join(''), options);
}

function duration_str(start_timestamp, end_timestamp) {
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

function visible(node, visible) {
	if (visible) {
		$(node).show();
	} else {
		$(node).hide();
	}
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

return {
	uuid: uuid,
	on_click: on_click,
	iso8601: iso8601,
	time_str: time_str,
	date_str: date_str,
	datetime_str: datetime_str,
	human_date_str: human_date_str,
	add_zeroes: add_zeroes,
	multiline_regexp: multiline_regexp,
	parse_query_string: parse_query_string,
	duration_str: duration_str,
	visible: visible,
	qsEach: qsEach,
	set_class: set_class,
}
})();

if (typeof module !== 'undefined') {
	module.exports = utils;
}
