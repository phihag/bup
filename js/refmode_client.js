'use strict';

var refmode_client = (function(s, handle_change_ui, initial_paired_refs) {
var conn = refmode_conn(handle_change, handle_msg);

var list_handlers = [];
var paired_referees = initial_paired_refs.slice();

var battery;
var subscriptions = [];

var push_netw;
var ev_hash;

function handle_change(estate) {
	switch (estate.status) {
	case 'enabled':
	case 'disabled':
		subscriptions = [];
		break;
	}
	handle_change_ui(estate);
}

function bat_status() {
	if (!battery) {
		return undefined;
	}
	return {
		charging: battery.charging,
		level: battery.level,
		chargingTime: battery.chargingTime,
		dischargingTime: battery.dischargingTime,
	};
}

function onbattery_change() {
	subscriptions.forEach(function(conn_id) {
		conn.send({
			type: 'dmsg',
			dtype: 'state',
			to: conn_id,
			battery: bat_status(),
		});
	});
}

function subscribe(conn_id) {
	if (subscriptions.indexOf(conn_id) >= 0) {
		return;
	}

	subscriptions.push(conn_id);
}

function unsubscribe(conn_id) {
	utils.remove(subscriptions, conn_id);
}

// Handle direct messages (from referee)
function handle_dmsg(msg) {
	switch(msg.dtype) {
	case 'update-settings':
		settings.change_all(s, msg.settings);
		conn.respond(msg, {
			dtype: 'update-settings-answer',
		});
		break;
	case 'get-state':
		if (msg.subscribe) {
			subscribe(msg.from);
		} else {
			unsubscribe(msg.from);
		}

		var answer = {
			dtype: 'state',
			presses: s.presses,
			setup: s.setup,
			settings: s.settings,
			node_id: s.refclient_node_id,
			netstats: netstats.all_stats,
			subscribed: (subscriptions.indexOf(msg.from) >= 0),
			battery: bat_status(),
			mode: settings.get_mode(s),
			request_ts: msg.request_ts,
			response_ts: Date.now(),
		};

		if (msg.include && (msg.include.indexOf('bup_version') >= 0) && (typeof bup_version === 'string')) {
			answer.bup_version = bup_version;
		}

		if (s.event) {
			answer.event = refmode_common.craft_event(s, match_storage);
			answer.event.last_update = s.event.last_update;
		}

		conn.respond(msg, answer);
		break;
	case 'change-match':
		var match = utils.find(s.event.matches, function(m) {
			return m.setup.match_id === msg.new_match_id;
		});

		if (!match) {
			conn.respond(msg, {
				dtype: 'error',
				message: 'Failed to change match: Could not find ' + msg.new_match_id,
			});
			return;
		}

		control.stop_match(s);
		network.enter_match(match);

		conn.respond(msg, {
			dtype: 'changed-match',
			new_match_id: msg.new_match_id,
		});
		break;
	case 'change-court':
		var all_courts = network.courts(s) || [];
		var court = utils.find(all_courts, function(c) {
			return c.id == msg.new_court_id;
		});

		if (!court) {
			court = {
				id: msg.new_court_id,
				description: '',
			};
		}

		utils.obj_update(s.settings, {
			court_id: court.id,
			court_description: court.description,
		});
		settings.update(s);
		settings.store(s);

		conn.respond(msg, {
			dtype: 'changed-court',
			new_court: court,
		});
		break;
	case 'push_start':
		if (!push_netw) {
			push_netw = refmode_push_netw(msg.event);
		}
		network.install_refmode_push(push_netw);
		break;
	case 'push_presses':
	case 'push_event':
		if (push_netw) {
			push_netw.update(msg);
		}
		break;
	case 'push_end':
		network.uninstall_refmode_push();
		push_netw = null;
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
		unsubscribe(msg.id);
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
			battery.onchargingchange = onbattery_change;
			battery.onlevelchange = onbattery_change;
		});
	}
	conn.on_settings_change(enabled, s.settings.refmode_client_ws_url, s.settings.network_timeout);
	return enabled;
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

function net_send_press(s, press) {
	subscriptions.forEach(function(conn_id) {
		conn.send({
			type: 'dmsg',
			dtype: 'state',
			to: conn_id,
			presses: s.presses,
			press: press,
			setup: s.setup,
			court_id: s.settings.court_id,
		});
	});
}

function notify_changed_settings(s) {
	subscriptions.forEach(function(conn_id) {
		conn.send({
			type: 'dmsg',
			dtype: 'changed-settings',
			to: conn_id,
			settings: s.settings,
			mode: settings.get_mode(s),
		});
	});
}

function on_event_update() {
	var ev = refmode_common.craft_event(s, match_storage);
	var ev_new = utils.hash_new(ev_hash, ev);
	if (!ev_new) {
		// No change
		return;
	}

	ev_hash = ev_new;
	ev.last_update = s.event.last_update;
	subscriptions.forEach(function(conn_id) {
		conn.send({
			type: 'dmsg',
			dtype: 'event-update',
			to: conn_id,
			event: ev,
		});
	});
}


return {
	get_paired_referees: get_paired_referees,
	on_settings_change: on_settings_change,
	net_send_press: net_send_press,
	on_event_update: on_event_update,
	status_str: status_str,
	list_referees: list_referees,
	connect_to_referee: connect_to_referee,
	disconnect_referee: disconnect_referee,
	notify_changed_settings: notify_changed_settings,
/*@DEV*/
	// Testing only
	_subscriptions: subscriptions,
/*/@DEV*/
};

});

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var control = require('./control');
	var match_storage = require('./match_storage');
	var netstats = require('./netstats');
	var network = require('./network');
	var refmode_conn = require('./refmode_conn');
	var refmode_common = require('./refmode_common');
	var refmode_push_netw = require('./refmode_push_netw');
	var report_problem = require('./report_problem');
	var settings = require('./settings');
	var utils = require('./utils');

	module.exports = refmode_client;
}
/*/@DEV*/
