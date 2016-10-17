'use strict';

var refmode_client = (function(handle_change_ui) {
var conn = refmode_conn(handle_change, handle_msg);

var list_handlers = [];
var paired_referees = [];

function handle_change(estate) {
	if (estate === null) {
		// New connection, resend our connstate
		if (list_handlers.length > 0) {
			conn.send({
				type: 'list-referees',
			});
		}
	}
	handle_change_ui(estate);
}

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
		if (paired_referees.length > 0) {
			conn.send({
				type: 'connect-to-referees',
				fps: paired_referees,
			});
		}
		break;
	default:
		report_problem.silent_error('client got unhandled message ' + JSON.stringify(msg));
		conn.send_error('Unsupported message type: ' + msg.type);
	}
}

function on_settings_change(s) {
	conn.on_settings_change(s.settings.refmode_client_enabled, s.settings.refmode_client_ws_url);
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

return {
	on_settings_change: on_settings_change,
	status_str: status_str,
	list_referees: list_referees,
	connect_to_referee: connect_to_referee,
};

});

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var refmode_conn = require('./refmode_conn');
	var report_problem = require('./report_problem');

	module.exports = refmode_client;
}
/*/@DEV*/
