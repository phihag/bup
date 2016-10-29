'use strict';

var refmode_client = (function(s, handle_change_ui, initial_paired_refs) {
var conn = refmode_conn(handle_change, handle_msg);

var list_handlers = [];
var paired_referees = initial_paired_refs.slice();

var battery;


function handle_change(estate) {
	handle_change_ui(estate);
}

// Handle direct messages (from referee)
function handle_dmsg(msg) {
	switch(msg.dtype) {
	case 'update-settings':
		utils.obj_update(s.settings, msg.settings);
		settings.update(s);
		settings.store(s);
		conn.respond(msg, {
			dtype: 'update-settings-answer',
		});
		break;
	case 'get-state':
		var answer = {
			dtype: 'get-state-answer',
			presses: s.presses,
			setup: s.setup,
			settings: s.settings,
			node_id: s.refclient_node_id,
			netstats: netstats.all_stats,
		};
		if (battery) {
			answer.battery = {
				charging: battery.charging,
				level: battery.level,
				chargingTime: battery.chargingTime,
				dischargingTime: battery.dischargingTime,
			};
		}
		conn.respond(msg, answer);
		break;
	case 'error':
		report_problem.silent_error('refclient received error: ' + msg.message);
		break;
	default:
		conn.respond(msg, {
			dtype: 'error',
			code: 'unsupported',
			message: 'Unsupported dmsg dtype ' + JSON.stringify(msg.dtype),
		});
	}
}

// Handle messages from hub
function handle_msg(msg) {
	switch(msg.type) {
	case 'error':
		report_problem.silent_error('client received error ' + JSON.stringify(msg));
		break;
	case 'referee-list':
		list_handlers.forEach(function(lh) {
			lh(msg.referees);
		});
		break;
	case 'welcome':
		if (list_handlers.length > 0) {
			conn.send({
				type: 'subscribe-list-referees',
			});
		}
		if (paired_referees.length > 0) {
			conn.send({
				type: 'connect-to-referees',
				fps: paired_referees,
			});
		}
		break;
	case 'connected':
		conn.set_status({
			status: 'client.connected',
			fp: msg.fp,
		});
		break;
	case 'disconnected':
		conn.set_status({
			status: 'welcomed',
		});
		break;
	case 'dmsg':
		handle_dmsg(msg);
		break;
	case 'dmsg-unconnected':
		report_problem.silent_error('refclient: Message did not reach referee');
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
	default:
		report_problem.silent_error('client got unhandled message ' + JSON.stringify(msg));
		conn.send_error('Unsupported message type: ' + msg.type);
	}
}

function on_settings_change(s) {
	var enabled = s.settings.refmode_client_enabled && (!s.ui || !s.ui.referee_mode);
	// Cheat a little: do not enable if referee mode is going to be loaded soon
	if (enabled && typeof window != 'undefined') {
		var qs = utils.parse_query_string(window.location.hash.substr(1));
		if (qs.referee_mode !== undefined) {
			enabled = false;
		}
	}
	if (!battery && enabled && (typeof navigator != 'undefined') && navigator.getBattery) {
		navigator.getBattery().then(function(bat) {
			battery = bat;
		});
	}
	conn.on_settings_change(enabled, s.settings.refmode_client_ws_url, s.settings.network_timeout);
}

function status_str(s) {
	return conn.status_str(s);
}

// Returns a function to cancel the updates
function list_referees(callback) {
	list_handlers.push(callback);
	conn.send({
		type: 'subscribe-list-referees',
	});

	return function() {
		list_handlers = list_handlers.filter(function(h) {
			return h !== callback;
		});
		// TODO if list empty unsubscribe
	};
}

function connect_to_referee(fp) {
	paired_referees.push(fp);
	conn.send({
		type: 'connect-to-referees',
		fps: paired_referees,
	});
}

function disconnect_referee(fp) {
	utils.remove(paired_referees, fp);
	conn.send({
		type: 'connect-to-referees',
		fps: paired_referees,
	});
}

function get_paired_referees() {
	return paired_referees;
}

return {
	get_paired_referees: get_paired_referees,
	on_settings_change: on_settings_change,
	status_str: status_str,
	list_referees: list_referees,
	connect_to_referee: connect_to_referee,
	disconnect_referee: disconnect_referee,
};

});

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var netstats = require('./netstats');
	var refmode_conn = require('./refmode_conn');
	var report_problem = require('./report_problem');
	var settings = require('./settings');
	var utils = require('./utils');

	module.exports = refmode_client;
}
/*/@DEV*/
