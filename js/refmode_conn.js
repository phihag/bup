'use strict';

var refmode_conn = function(status_cb, handle_msg) {

var ws;
var enabled = false;
var ws_url;
var last_status = {
	status: 'disabled',
};
var outstanding_msgs = []; // Messages sent while we were still connecting

var request_id = 0;

var keepalive_interval_duration = 60000;
var keepalive_interval;

var INITIAL_RECONNECT = 50;
var max_reconnect = 10000;
var reconnect_duration = INITIAL_RECONNECT;
var reconnect_timeout;

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
	if (msg.type === 'welcome') {
		set_status({
			status: 'welcomed',
			challenge: msg.challenge,
		});
	}
}

function keepalive() {
	send({
		type: 'keepalive',
		sent: Date.now(),
		rid: request_id++,
	});
}

function connect() {
	var my_ws = new WebSocket(ws_url, 'bup-refmode');
	last_status = {
		status: 'enabled',
	};
	status_cb(last_status);
	ws = my_ws;
	my_ws.onopen = function() {
		reconnect_duration = INITIAL_RECONNECT;
		if (reconnect_timeout) {
			clearTimeout(reconnect_timeout);
			reconnect_timeout = null;
		}

		if (keepalive_interval) {
			clearInterval(keepalive_interval);
		}
		keepalive_interval = setInterval(keepalive, keepalive_interval_duration);

		my_ws.bup_connected = true;
		set_status({
			status: 'connected to hub',
		});
		var to_send = outstanding_msgs;
		if (to_send.length > 0) {
			outstanding_msgs = [];
			to_send.forEach(send);
		}
	};
	my_ws.onmessage = handle_msg_json;
	my_ws.onclose = function() {
		if (my_ws.bup_die) {
			return;
		}
		set_status({
			status: 'error',
			message_i18n: 'refmode:lost connection',
		});

		if (reconnect_timeout) {
			clearTimeout(reconnect_timeout);
			reconnect_timeout = null;
		}
		if (keepalive_interval) {
			clearInterval(keepalive_interval);
			keepalive_interval = null;
		}
		reconnect_timeout = setTimeout(connect, reconnect_duration);
		reconnect_duration = Math.min(reconnect_duration * 2, max_reconnect);
	};
}

function disconnect() {
	outstanding_msgs = [];
	if (ws) {
		ws.bup_die = true;
		ws.close();
		ws = null;
	}
}

function on_settings_change(new_enabled, new_ws_url, network_timeout) {
	var changed = false;

	if (new_enabled !== enabled) {
		enabled = new_enabled;
		changed = true;
	}
	if (new_ws_url !== ws_url) {
		ws_url = new_ws_url;
		changed = true;
	}
	if (max_reconnect !== network_timeout) {
		max_reconnect = network_timeout;
		changed = true;
	}

	if (changed) {
		disconnect();
		if (enabled) {
			connect();
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
	return s._('refmode:status:' + last_status.status, last_status);
}

function send(msg) {
	if (!ws) {
		report_problem.silent_error('websocket conn tried to send message while no websocket active: ' + JSON.stringify(msg));
		return;
	}

	if (ws.readyState === 0) { // Still connecting
		outstanding_msgs.push(msg);
		return;
	}

	var msg_json = JSON.stringify(msg);
	try {
		ws.send(msg_json);
	} catch(e) {
		report_problem.on_error('Failed to send refmode message: ' + e.message, 'refmode_conn', 'synthetic', 0, e);
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
	var report_problem = require('./report_problem');

	var WebSocket = require('ws');

	module.exports = refmode_conn;
}
/*/@DEV*/
