'use strict';

var refmode_client = (function() {
var rc;

function update_status_str(s) {
	uiu.text_qs('.refmode_status', rc.status_str(s));
}

function handle_msg() {
	console.log('got message', arguments); // eslint-disable-line no-console
}

function handle_change(estate) {
	network.errstate('refmode.client.ws', estate);
	update_status_str(state);
}

function on_settings_change(s) {
	if (!rc) {
		rc = refmode_conn(handle_change, handle_msg);
	}
	rc.on_settings_change(s.settings.refmode_client_enabled, s.settings.refmode_client_ws_url);
	update_status_str(s);
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
	var refmode_conn = require('./refmode_conn');

	module.exports = refmode_client;
}
/*/@DEV*/
