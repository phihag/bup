'use strict';
var urlimport = (function() {
var baseurl = '../';

function display_error(msg) {
	var form = uiu.qs('.urlimport_form');
	uiu.qsEach('.error', uiu.remove, form);
	if (msg) {
		uiu.el(form, 'div', 'error', state._('urlimport:error', {
			msg: msg,
		}));
	}
}

function import_tde(match_url) {
	var import_url = baseurl + 'bup/http_proxy/tde_import?format=export&url=' + encodeURIComponent(match_url);
	ajax.req({
		method: 'GET',
		url: import_url,
	}, function(import_json) {
		var data = utils.parse_json(import_json);
		if (!data) {
			display_error('JSON parse failed');
			return;
		}

		var event = importexport.load_data(state, data).event;
		event.staticnet_message = state._('urlimport:staticnet_message');
		var snet = staticnet(event);
		network.ui_install_staticnet(state, snet);
	}, function(http_code, body, response) {
		var content_type = response.getResponseHeader('content-type');
		if (content_type === 'application/json') {
			var data = utils.parse_json(body);
			if (data) {
				display_error(data.message);
			} else {
				display_error('invalid JSON');
			}
		} else {
			display_error('Code ' + http_code);
		}
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
		var url = uiu.qs('input[name="urlimport_url"]').value;
		import_tde(url);
	});
}

return {
	ui_init: ui_init,
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
