'use strict';

var refmode_conn = function(status_cb, handle_msg) {

var ws;
var enabled = false;
var ws_url;
var last_status = {
	status: 'disabled',
};

function send_error(emsg) {
	send({
		type: 'error',
		message: emsg,
	});
}

function handle_msg_json(e) {
	try {
		var msg = JSON.parse(e.data);
	} catch(e) {
		send_error('Invalid JSON: ' + e.message);
		return;
	}
	handle_msg(msg);
}

function connect(ws_url) {
	var my_ws = new WebSocket(ws_url, 'bup-refmode');
	last_status = {
		status: 'enabled',
	};
	status_cb(last_status);
	ws = my_ws;
	my_ws.onopen = function() {
		my_ws.bup_connected = true;
		last_status = {
			status: 'connected to hub',
		};
		status_cb(last_status);
	};
	my_ws.onmessage = handle_msg_json;
	my_ws.onclose = function() {
		if (my_ws.bup_die) {
			return;
		}
		last_status = {
			status: 'error',
			message_i18n: 'refmode:lost connection',
		};
		status_cb(last_status);
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

function on_settings_change(new_enabled, new_ws_url) {
	var changed = false;

	if (new_enabled !== enabled) {
		enabled = new_enabled;
		changed = true;
	}
	if (new_ws_url !== ws_url) {
		ws_url = new_ws_url;
		changed = true;
	}

	if (changed) {
		disconnect();
		if (enabled) {
			connect(ws_url);
		} else {
			last_status = {
				status: 'disabled',
			};
			status_cb(last_status);
		}
	}
}

function status_str(s) {
	if (last_status.status === 'error') {
		return s._(last_status.message_i18n);
	}
	return s._('refmode:status:'+ last_status.status);
}

function send(msg) {
	if (ws) {
		ws.send(JSON.stringify(msg));
	}
}

function set_status(status) {
	last_status = status;
	status_cb(last_status);
}

return {
	on_settings_change: on_settings_change,
	status_str: status_str,
	set_status: set_status,
	send: send,
	send_error: send_error,
};

};
	
/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var WebSocket = require('ws');

	module.exports = refmode_conn;
}
/*/@DEV*/
