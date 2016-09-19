var report_problem = (function() {
'use strict';

var REPORT_URL = 'https://aufschlagwechsel.de/bupbug/';
var last_error = '-';
var reported_count = 0;


function get_info() {
	return {
		ua: window.navigator.userAgent,
		url: window.location.href,
		bup_version: bup_version,
		setup: state.setup,
		event_id: (state.event ? state.event.id : '(no event)'),
		state_ui: state.ui,
		fullscreen: {
			supported: fullscreen.supported(),
			active: fullscreen.active(),
		},
		lang: state.lang,
		size: document.documentElement.clientWidth + 'x' + document.documentElement.clientHeight,
		screen: window.screen.width + 'x' + window.screen.height,
		settings: state.settings,
		last_error: last_error,
		reported_count: reported_count,
		click_mode: click.get_mode(),
		presses: state.presses,
		netstats: netstats.all_stats,
	};
}

function _send(obj) {
	var json_report = JSON.stringify(obj);
	var xhr = new XMLHttpRequest();
	xhr.open('POST', REPORT_URL, true);
	xhr.setRequestHeader('Content-type', 'text/plain');  // To be a simple CORS request
	xhr.send(json_report);
}

function report(info_obj) {
	var is_dev = false;
	/*@DEV*/
	is_dev = true;
	/*/@DEV*/
	if (is_dev) {
		return;
	}

	reported_count++;
	if (reported_count > 5) {
		return;
	}

	info_obj._type = 'bup-error';
	_send(info_obj);
}

function send_export(data) {
	var info_obj = {
		_type: 'export',
		data: data,
	};
	_send(info_obj);
}

function update() {
	var report_problem_body = state._('report:body');
	var info = get_info();
	info.last_error = (info.last_error ? JSON.stringify(info.last_error) : '-');
	info.settings = JSON.stringify(info.settings);
	for (var k in info) {
		report_problem_body = report_problem_body.replace('{' + k + '}', info[k]);
	}
	var report_problem_link = (
		'mailto:phihag@phihag.de?' +
		'subject=' + encodeURIComponent(state._('report:subject')) +
		'&body=' + encodeURIComponent(report_problem_body)
	);
	$('.settings_report_problem').attr('href', report_problem_link);
}

function on_error(msg, script_url, line, col, err) {
	last_error = {
		msg: msg,
		script_url: script_url,
		line: line,
		col: col,
	};
	if (err) {
		last_error.stack = err.stack;
	}
	update();
	report(get_info());
}

function silent_error(msg) {
	console.error(msg); // eslint-disable-line no-console
	last_error = {
		msg: msg,
		type: 'silent-error',
	};
	update();
	report(get_info());
}

function ui_init() {
	update();
	window.onerror = on_error;
	click.qs('.version', function() {
		uiu.visible_qs('.settings_test_reporting', true);
		uiu.visible_qs('.settings_send_export', true);
	});
	click.qs('.settings_test_reporting', function() {
		throw new Error('test error reporting');
	});
}

return {
	report: report,
	send_export: send_export,
	silent_error: silent_error,
	on_error: on_error,
	ui_init: ui_init,
	update: update,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var fullscreen = require('./fullscreen');
	var netstats = require('./netstats');
	var uiu = require('./uiu');

	module.exports = report_problem;
}
/*/@DEV*/
