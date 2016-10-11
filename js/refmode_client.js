'use strict';

var refmode_client = (function() {
var enabled = false;
var ws;
var ws_url;

function status_str(s) {
	if (!enabled) {
		return s._('refmode:status:disabled');
	}
	if (ws.bup_connected) {
		return s._('refmode:status:connected to hub');
	}
	return s._('refmode:status:enabled');
}

function update_status_str(s) {
	uiu.text_qs('.refmode_status', status_str(s));
}

function on_settings_change(s) {
	var settings_enabled = s.settings.refmode_client_enabled;
	var changed = false;

	if (settings_enabled !== enabled) {
		enabled = settings_enabled;
		changed = true;
	}

	var new_ws_url = s.settings.refmode_client_ws_url;
	if (new_ws_url !== ws_url) {
		ws_url = new_ws_url;
		changed = true;
	}

	if (changed) {
		disconnect();
		if (enabled) {
			connect(ws_url, function(estate) {
				network.errstate('refmode.client.ws', estate);
				update_status_str(s);
			});
		}
	}

	update_status_str(s);
}

function connect(ws_url, status_cb) {
	var my_ws = new WebSocket(ws_url, 'bup-refmode');
	ws = my_ws;
	my_ws.onopen = function() {
		my_ws.bup_connected = true;
		status_cb(null);
	};
	my_ws.onmessage = function() {
		console.log('got message', arguments); // eslint-disable-line no-console
	};
	my_ws.onclose = function() {
		if (my_ws.bup_die) {
			return;
		}
		status_cb(state._('refmode:lost connection'));
		connect(ws_url, status_cb);
	};
}

function disconnect() {
	if (ws) {
		ws.bup_die = true;
		ws.close();
		ws = null;
	}
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
