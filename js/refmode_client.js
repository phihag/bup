'use strict';

var refmode_client = (function() {
var enabled = false;
var ws;

function status_str(s) {
	if (!enabled) {
		return s._('refmode:client:disabled');
	}
	return s._('refmode:client:enabled');
}

function update_status_str(s) {
	uiu.text_qs('.refmode_status', status_str(s));
}

function on_settings_change(s) {
	var settings_enabled = s.settings.refmode_client_enabled;
	if (settings_enabled === enabled) {
		return;
	}
	enabled = settings_enabled;

	if (enabled && !ws) { // TODO: simply this to 1 var
		connect();
	}
	// TODO disconnect
	update_status_str(s);
}

function connect() {
	var wsurl = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.hostname + (location.port ? ':' + location.port: '')  + '/ws/bup';
	var new_ws = new WebSocket(wsurl, 'bup-refmode');
	new_ws.onopen = function() {
		ws = new_ws;
		network.errstate('refmode.client.ws', null);
	};
	new_ws.onmessage = function() {
		console.log('got message', arguments); // eslint-disable-line no-console
	};
	new_ws.onclose = function() {
		network.errstate('refmode.client.ws', state._('refmode:lost connection'));
		ws = null;
		connect();
	};
}

function ui_init(s) {
	on_settings_change(s);
}

return {
	on_settings_change: on_settings_change,
	ui_init: ui_init,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var network = require('./network');
	var uiu = require('./uiu');

	module.exports = refmode_client;
}
/*/@DEV*/
