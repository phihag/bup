'use strict';

var refmode_referee = (function(handle_change_ui, key_storage) {
var conn = refmode_conn(handle_change, handle_msg);
var key;
var key_err;

key_storage.retrieve(function(err, k) {
	if (err) {
		key_err = err;
		throw err;
	}

	key = k;
});

function handle_change(status) {
	if (status.status === 'connected to hub') {
		// new connection
		if (key) {
			conn.send({
				type: 'register-referee',
				pub_json: key.pub_json,
				fp: key.fp,
			});
		}
	}
	handle_change_ui(status);
}

function handle_msg(msg) {
	switch (msg.type) {
	case 'referee-registered':
		conn.set_status({
			status: 'referee.registered',
		});
		break;
	default:
		console.log('referee got unhandled message', msg); // eslint-disable-line no-console
	}
}

function on_settings_change(s) {
	conn.on_settings_change(true, s.settings.refmode_referee_ws_url);
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
	var refmode_conn = require('./refmode_conn');

	module.exports = refmode_referee;
}
/*/@DEV*/
