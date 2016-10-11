'use strict';

var refmode_referee = (function() {

function show() {
	if (state.ui.referee_mode) {
		return;
	}

	state.ui.referee_mode = true;
	render.hide();
	displaymode.hide();
	settings.show_refereemode();
	settings.on_mode_change(state);
	control.set_current(state);

	uiu.visible_qs('.referee_layout', true);
}

function hide() {
	if (! state.ui.referee_mode) {
		return;
	}
	state.ui.referee_mode = false;
	uiu.visible_qs('.referee_layout', false);
	settings.on_mode_change(state);
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
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var control = require('./control');
	var displaymode = require('./displaymode');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');

	module.exports = refmode_referee;
}
/*/@DEV*/
