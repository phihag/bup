'use strict';

var refmode_referee_ui = (function() {
var rc;

function on_status_change() {
	uiu.text_qs('.refmode_referee_status', rc.status_str(state));
}

function show() {
	if (state.ui.referee_mode) {
		return;
	}

	if (!rc) {
		rc = refmode_referee(on_status_change, key_storage);
		rc.on_settings_change(state);
	}

	state.ui.referee_mode = true;
	refmode_client_ui.on_settings_change(state);
	render.hide();
	displaymode.hide();
	settings.show_refereemode();
	settings.on_mode_change(state);
	control.set_current(state);

	uiu.visible_qs('.referee_layout', true);
}

function on_settings_change(s) {
	if (rc) {
		rc.on_settings_change(s);
	}
}

function hide() {
	if (! state.ui.referee_mode) {
		return;
	}
	state.ui.referee_mode = false;
	refmode_client_ui.on_settings_change(state);
	uiu.visible_qs('.referee_layout', false);
	settings.on_mode_change(state);
	// TODO disconnect?
	rc = null;
}

function ui_init() {
	click.qs('.settings_mode_referee', function(e) {
		e.preventDefault();
		show();
	});
}

return {
	show: show,
	hide: hide,
	ui_init: ui_init,
	on_settings_change: on_settings_change,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var control = require('./control');
	var click = require('./click');
	var displaymode = require('./displaymode');
	var key_storage = require('./key_storage');
	var refmode_client_ui = require('./refmode_client_ui');
	var refmode_referee = require('./refmode_referee');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');

	module.exports = refmode_referee_ui;
}
/*/@DEV*/
