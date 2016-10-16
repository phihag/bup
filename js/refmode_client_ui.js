'use strict';

var refmode_client_ui = (function() {
var rc;

function update_status_str(s) {
	uiu.text_qs('.refmode_status', rc.status_str(s));
}

function handle_change(estate) {
	network.errstate('refmode.client.ws', ((estate.status === 'error') ? estate : null));
	update_status_str(state);
}

function on_settings_change(s) {
	if (!rc) {
		rc = refmode_client(handle_change);
	}
	rc.on_settings_change(s);
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
	var refmode_client = require('./refmode_client');

	module.exports = refmode_client_ui;
}
/*/@DEV*/
