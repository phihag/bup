'use strict';
var setupsheet = (function() {

var BULI2016_CONFIG = {
	m: ['1.HD', '2.HD', '1.HE', '2.HE', 'GD', 'backup', 'present'],
	f: ['dark', 'dark', 'DE', 'DD', 'GD', 'backup', 'present'],
};
var CONFIGS = {
	'1BL-2016': BULI2016_CONFIG,
	'2BLN-2016': BULI2016_CONFIG,
	'2BLS-2016': BULI2016_CONFIG,
};


function ui_render(s) {
	var cfg = CONFIGS[s.event.league_key];

	if (!cfg) {
		uiu.text_qs('Unsupported league: ' + s.event.league_key);
	}


	// Determine all matches for men


	// Determine all matches for women


}

function show() {
	if (state.ui.setupsheet_visible) {
		return;
	}

	if (state.ui.referee_mode) {
		refmode_referee_ui.hide_tmp();
	} else {
		render.hide();
		settings.hide(true);
	}

	state.ui.setupsheet_visible = true;
	uiu.esc_stack_push(hide);
	control.set_current(state);

	uiu.visible_qs('.setupsheet_layout', true);
	if (state.event && state.event.matches && state.event.all_players) {
		uiu.visible_qs('.setupsheet_loading-icon', false);
		ui_render(state);
	} else {
		uiu.visible_qs('.setupsheet_loading-icon', true);
		network.load_all_players(state, function(err, ev) {
			uiu.visible_qs('.setupsheet_error', !!err);
			uiu.visible_qs('.setupsheet_loading-icon', false);
			if (err) {
				$('.setupsheet_error_message').text(err.msg);
				return;
			}
			network.update_event(state, ev);
			ui_render(state);
		});
	}
}

function hide() {
	if (! state.ui.setupsheet_visible) {
		return;
	}

	uiu.esc_stack_pop();
	state.ui.setupsheet_visible = false;
	uiu.visible_qs('.setupsheet_layout', false);
	control.set_current(state);

	if (state.ui.referee_mode) {
		refmode_referee_ui.back_to_ui();
	} else {
		settings.show();
	}
}

function ui_init() {
	click.qs('.setupsheet_link', function(e) {
		e.preventDefault();
		show();
	});
	click.qs('.setupsheet_back', function(e) {
		e.preventDefault();
		hide();
	});

	var layout = uiu.qs('.setupsheet_layout');
	click.on(layout, function(e) {
		if (e.target === layout) {
			hide();
		}
	});
}

return {
	ui_init: ui_init,
	show: show,
	hide: hide,
};


})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var control = require('./control');
	var network = require('./network');
	var refmode_referee_ui = null; // break cycle, should be require('./refmode_referee_ui');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');

	module.exports = setupsheet;
}
/*/@DEV*/