'use strict';
var urlimport = (function() {
var baseurl = '../';

function display_error(s, msg) {
	var form = uiu.qs('.urlimport_form');
	uiu.qsEach('.urlimport_error', uiu.remove, form);
	if (msg) {
		uiu.el(form, 'div', 'urlimport_error', s._('urlimport:error', {
			msg: msg,
		}));
	}
}

function ui_import() {
	var url = uiu.qs('input[name="urlimport_url"]').value;
	var btn = uiu.qs('.urlimport_button');
	var progress = uiu.el(btn, 'div', 'loading-icon');
	import_tde(state, url, function(err_msg) {
		uiu.remove(progress);
		display_error(state, err_msg);
		if (!err_msg) {
			window.scrollTo(0, 0);
		}
	});
}

function import_tde(s, match_url, cb) {
	var import_url = baseurl + 'bup/http_proxy/tde_import?format=export&url=' + encodeURIComponent(match_url);
	ajax.req({
		method: 'GET',
		url: import_url,
	}, function(import_json) {
		var data = utils.parse_json(import_json);
		if (!data) {
			return cb('JSON parse failed');
		}

		var event = importexport.load_data(s, data).event;
		event.staticnet_message = s._('urlimport:staticnet_message');
		var snet = staticnet(event);
		network.ui_install_staticnet(s, snet);
		cb();
	}, function(http_code, body, response) {
		var content_type = response.getResponseHeader('content-type');
		var msg = 'Code ' + http_code;
		if (content_type === 'application/json') {
			var data = utils.parse_json(body);
			if (data) {
				msg = data.message;
			} else {
				msg = 'invalid JSON (HTTP ' + http_code + ')';
			}
		}
		cb(msg);
	});
}

// cb gets called with an error message or null, and the downloaded event
function download_tde_day(s, day_url, cb) {
	var import_url = baseurl + 'bup/http_proxy/tde_dayimport?url=' + encodeURIComponent(day_url);
	ajax.req({
		method: 'GET',
		url: import_url,
	}, function(import_json) {
		var data = utils.parse_json(import_json);
		if (!data) {
			return cb('JSON parse failed');
		}

		var event = importexport.load_data(s, data).event;
		cb(null, event);
	}, function(http_code, body, response) {
		var content_type = response.getResponseHeader('content-type');
		var msg = 'Code ' + http_code;
		if (content_type === 'application/json') {
			var data = utils.parse_json(body);
			if (data) {
				msg = data.message;
			} else {
				msg = 'invalid JSON (HTTP ' + http_code + ')';
			}
		}
		cb(msg);
	});
}

function ui_init() {
	var m = window.location.pathname.match(/^(.*\/)bup(?:\/(?:bup\.html)?)?$/);
	if (m) {
		baseurl = m[1];
	}

	var urlimport_form = uiu.qs('.urlimport_form');
	urlimport_form.addEventListener('submit', function(e) {
		e.preventDefault();
		ui_import();
	});
}

return {
	ui_init: ui_init,
	download_tde_day: download_tde_day,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var ajax = require('./ajax');
	var importexport = require('./importexport');
	var network = require('./network');
	var staticnet = require('./staticnet');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = urlimport;
}
/*/@DEV*/
