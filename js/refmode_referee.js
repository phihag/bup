'use strict';

var refmode_referee = (function(s, handle_change_ui, render_clients, render_event, key_storage) {
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
	render_clients(clients);
});

function key_fp() {
	return key ? key.fp : null;
}

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
	if (status.status === 'enabled') {
		clients = [];
		render_clients(clients);
	}
	handle_change_ui(status);
}

function client_by_conn_id(conn_id) {
	return utils.find(clients, function(c) {
		return c.id === conn_id;
	});
}

function calc_client_title(c) {
	c.title = ((c.settings && c.settings.refmode_client_node_name) ? c.settings.refmode_client_node_name : (c.node_id ? c.node_id : '[' + c.id + ']'));
}

function change_match(conn_id, new_match_id) {
	conn.send({
		type: 'dmsg',
		dtype: 'change-match',
		to: conn_id,
		new_match_id: new_match_id,
	});
}

function change_court(conn_id, new_court_id) {
	conn.send({
		type: 'dmsg',
		dtype: 'change-court',
		to: conn_id,
		new_court_id: new_court_id,
	});
}

function change_display_style(conn_id, new_style) {
	conn.send({
		type: 'dmsg',
		dtype: 'update-settings',
		to: conn_id,
		settings: {
			displaymode_style: new_style,
		},
	});
}

function change_display_court(conn_id, new_court) {
	conn.send({
		type: 'dmsg',
		dtype: 'update-settings',
		to: conn_id,
		settings: {
			displaymode_court_id: new_court,
		},
	});
}

function update_match(s, msg) {
	if (!Array.isArray(msg.presses) || !msg.setup) {
		return; // Incomplete update request
	}
	if (!s.event) {
		return;
	}

	var match = utils.find(s.event.matches, function(m) {
		return m.setup.match_id === msg.setup.match_id;
	});
	if (!match) {
		return; // Match from another event!?
	}

	if (msg.presses.length === 0) {
		// Just entered the match, do not overwrite
		return;
	}

	match.presses = msg.presses;

	render_event(s);
}

// Handle direct messages (from clients)
function handle_dmsg(msg) {
	if (msg.dtype === 'error') {
		report_problem.silent_error('referee received error: ' + msg.message);
		return;
	}

	var c = client_by_conn_id(msg.from);
	if (!c) {
		// Client disconnected in between
		return;
	}

	switch(msg.dtype) {
	case 'changed-match':
	case 'changed-court':
	case 'update-settings-answer':
		// TODO: only needed when not subscribed
		refresh(msg.from);
		break;
	case 'changed-settings':
	case 'event-update':
	case 'state':
		['event', 'presses', 'setup', 'settings', 'node_id', 'battery', 'bup_version', 'mode'].forEach(function(k) {
			if (msg.hasOwnProperty(k)) {
				c[k] = msg[k];
			}
		});
		c.last_update = Date.now();
		if (msg.hasOwnProperty('rid')) {
			c.last_state_rid = msg.rid;
		}
		calc_client_title(c);

		if (msg.event) {
			if (s.event) {
				var ignore = (msg.setup && msg.presses) ? msg.setup.match_id : null; // Will be updated later
				var changed = false;
				c.event.matches.forEach(function(m) {
					if (m.setup.match_id === ignore) {
						return;
					}
					var local_m = utils.find(s.event.matches, function(lm) {
						return lm.setup.match_id === m.setup.match_id;
					});
					if (!local_m) {
						return;
					}
					if (local_m.presses) {
						return;
					}

					_adopt_match(m);
					if (!m.presses) {
						return;
					}

					local_m.presses = m.presses;
					changed = true;
				});
				if (changed) {
					render_event(s);
				}
			} else {
				espouse_event(c);
			}
		}

		update_match(s, msg);

		render_clients(clients);
		break;
	default:
		conn.respond(msg, {
			dtype: 'error',
			code: 'unsupported',
			message: 'Unsupported dmsg dtype ' + JSON.stringify(msg.dtype),
		});
	}
}

function refresh(conn_id) {
	var c = client_by_conn_id(conn_id);
	if (!c) {
		// Client disconnected in between
		return;
	}

	var rid = conn.gen_rid();
	var include = [];
	if (! c.bup_version) {
		include.push('bup_version');
	}
	var req = {
		type: 'dmsg',
		dtype: 'get-state',
		to: conn_id,
		subscribe: c.subscribed,
		include: include,
		rid: rid,
	};
	conn.send(req);
	return rid;
}

function update_settings(conn_id, new_settings) {
	conn.send({
		type: 'dmsg',
		dtype: 'update-settings',
		to: conn_id,
		settings: new_settings,
	});
}

function kill(conn_id) {
	update_settings(conn_id, {
		refmode_client_enabled: false,
	});
}

function handle_msg(msg) {
	switch (msg.type) {
	case 'error':
		var is_dev = false;
		/*@DEV*/
		console.error('referee received error: ' + JSON.stringify(msg.message)); // eslint-disable-line no-console
		is_dev = true;
		/*/@DEV*/
		if (!is_dev) {
			report_problem.silent_error('referee received error ' + JSON.stringify(msg));
		}
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
		var client = {
			id: msg.id,
			subscribed: true,
		};
		calc_client_title(client);
		clients.push(client);
		refresh(msg.id);
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
		handle_dmsg(msg);
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

function on_settings_change() {
	conn.on_settings_change(true, s.settings.refmode_referee_ws_url, s.settings.network_timeout);
}

function status_str() {
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

function _adopt_match(m) {
	if (m.presses_json) {
		m.presses = JSON.parse(m.presses_json);
		delete m.presses_json;
	}
	return m;
}

function espouse_event(c) {
	var ev = utils.deep_copy(c.event);
	ev.matches.forEach(_adopt_match);
	s.event = ev;
	render_event(s);
	render_clients(clients);
}

return {
	key_fp: key_fp,
	change_match: change_match,
	change_court: change_court,
	change_display_style: change_display_style,
	change_display_court: change_display_court,
	client_by_conn_id: client_by_conn_id,
	espouse_event: espouse_event,
	kill: kill,
	on_settings_change: on_settings_change,
	refresh: refresh,
	status_str: status_str,
	update_settings: update_settings,
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
