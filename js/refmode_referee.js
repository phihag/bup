'use strict';

var refmode_referee = (function(handle_change_ui) {
var conn = refmode_conn(handle_change, handle_msg);
var key = 'refkey-4242';

function handle_change(status) {
	if (status === null) {
		// new connection
		conn.send({
			type: 'register-referee',
			key: key,
		});
	}
	handle_change_ui(status);
}

function handle_msg(msg) {
	console.log('referee got message', msg); // eslint-disable-line no-console
}

function on_settings_change(s) {
	conn.on_settings_change(true, s.settings.refmode_referee_ws_url);
}

function status_str(s) {
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
