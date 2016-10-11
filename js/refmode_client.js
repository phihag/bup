'use strict';

var refmode_client = (function() {
var enabled = false;
var ws;

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

	if (changed) {
		disconnect();
		if (enabled) {
			connect(function(estate) {
				network.errstate('refmode.client.ws', estate);
				update_status_str(s);
			});
		}
	}

	update_status_str(s);
}

function connect(status_cb) {
	var wsurl = 'wss://live.aufschlagwechsel.de/refmode_server/';
	ws = new WebSocket(wsurl, 'bup-refmode');
	ws.onopen = function() {
		ws.bup_connected = true;
		status_cb(null);
	};
	ws.onmessage = function() {
		console.log('got message', arguments); // eslint-disable-line no-console
	};
	ws.onclose = function() {
		if (!enabled) {
			return;
		}
		status_cb(state._('refmode:lost connection'));
		connect(status_cb);
	};
}

function disconnect() {
	if (ws) {
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
