'use strict';

var refmode_referee = (function(handle_change_ui, render_clients, key_storage) {
var conn = refmode_conn(handle_change, handle_msg);
var key;
var key_err;
var last_status = {};
var clients = [];

key_storage.retrieve(function(err, k) {
	if (err) {
		key_err = err;
		throw err;
	}

	key = k;
	if (last_status.status === 'welcomed') {
		register();
	}
});

function register() {
	var data = utils.encode_utf8(last_status.challenge);
	key_utils.sign(key, data, function(err, sig_hex) {
		if (err) throw err;

		conn.send({
			type: 'register-referee',
			pub_json: key.pub_json,
			sig: sig_hex,
		});
	});
}

function handle_change(status) {
	last_status = status;
	if (status.status === 'welcomed') {
		if (key) {
			register();
		}
	}
	handle_change_ui(status);
}

function respond(dmsg, response) {
	response.rid = dmsg.m.rid;
	conn.send({
		to: dmsg.from,
		rid: dmsg.rid,
		m: response,
	});
}

// Handle direct messages (from clients)
function handle_dmsg(dmsg) {
	switch(dmsg.type) {
	case 'error':
		report_problem.silent_error('referee received error: ' + dmsg.message);
		break;
	default:
		respond(dmsg, {
			type: 'error',
			code: 'unsupported',
			message: 'Unsupported message type ' + JSON.stringify(dmsg.type),
		});
	}
}

function handle_msg(msg) {
	switch (msg.type) {
	case 'error':
		report_problem.silent_error('referee received error ' + JSON.stringify(msg));
		break;
	case 'referee-registered':
		conn.set_status({
			status: 'referee.registered',
		});
		break;
	case 'connected':
		conn.set_status({
			status: 'referee.connected',
			all_str: msg.all.join(','),
		});
		clients.push({
			id: msg.id,
			title: '[' + msg.id + ']',
		});
		// TODO: ask the client for more info
		render_clients(clients);
		break;
	case 'disconnected':
		utils.remove_cb(clients, function(c) {
			return c.id === msg.id;
		});
		render_clients(clients);
		if (msg.all.length > 0) {
			conn.set_status({
				status: 'referee.connected',
				all_str: msg.all.join(','),
			});
		} else {
			conn.set_status({
				status: 'referee.registered',
			});
		}
		break;
	case 'keptalive':
		/*@DEV*/
		if (! ((typeof module !== 'undefined') && (typeof require !== 'undefined'))) {
		/*/@DEV*/
		netstats.record('referee.hub.keepalive', 200, Date.now() - msg.sent);
		/*@DEV*/
		}
		/*/@DEV*/
		break;
	case 'dmsg':
		handle_dmsg(msg.m);
		break;
	case 'dmsg-unconnected':
		// TODO: display something?
		break;
	case 'welcome':
		break;
	default:
		report_problem.silent_error('referee got unhandled message ' + JSON.stringify(msg));
		conn.send_error('Unsupported message type: ' + msg.type);
	}
}

function on_settings_change(s) {
	conn.on_settings_change(true, s.settings.refmode_referee_ws_url, s.settings.network_timeout);
}

function status_str(s) {
	if (key_err) {
		return s._('refmode:keygen failed', {
			message: key_err.message,
		});
	}
	if (!key) {
		return s._('refmode:generating key');
	}

	return conn.status_str(s);
}

return {
	on_settings_change: on_settings_change,
	status_str: status_str,
};

});

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var key_utils = require('./key_utils');
	var netstats = require('./netstats');
	var refmode_conn = require('./refmode_conn');
	var report_problem = require('./report_problem');
	var utils = require('./utils');

	module.exports = refmode_referee;
}
/*/@DEV*/
