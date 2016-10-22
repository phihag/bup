var settings = (function() {
'use strict';

var default_settings = {
	go_fullscreen: false,
	show_pronunciation: true,
	umpire_name: '',
	service_judge_name: '',
	court_id: '',
	court_description: '',
	network_timeout: 10000,
	network_update_interval: 10000,
	displaymode_update_interval: 500,
	double_click_timeout: 1000,
	button_block_timeout: 1200,
	negative_timers: false,
	shuttle_counter: true,
	language: 'auto',
	editmode_doubleclick: false,
	displaymode_style: 'top+list',
	displaymode_court_id: 1,
	wakelock: 'display',
	click_mode: 'auto',
	refmode_client_enabled: false,
	refmode_client_ws_url: 'wss://live.aufschlagwechsel.de/refmode_hub/',
	refmode_referee_ws_url: 'wss://live.aufschlagwechsel.de/refmode_hub/',
};

function load() {
	if (! window.localStorage) {
		return default_settings;
	}

	var json_str = window.localStorage.getItem('bup_settings');
	var res = $.extend({}, default_settings);
	if (json_str) {
		var new_settings = JSON.parse(json_str);
		return $.extend(res, new_settings);
	}
	return res;
}

function store(s) {
	if (! window.localStorage) {
		return;
	}

	window.localStorage.setItem('bup_settings', JSON.stringify(s.settings));
}

function show_displaymode() {
	if (state.ui.displaymode_settings_visible) {
		return;
	}
	state.ui.displaymode_settings_visible = true;
	uiu.visible_qs('#settings_wrapper', true);	
	uiu.esc_stack_push(hide_displaymode);
}

function hide_displaymode() {
	if (!state.ui.displaymode_settings_visible) {
		return;
	}
	state.ui.displaymode_settings_visible = false;
	uiu.visible_qs('#settings_wrapper', false);
	uiu.esc_stack_pop();
}

function toggle_displaymode() {
	if (state.ui.displaymode_settings_visible) {
		hide_displaymode();
	} else {
		show_displaymode();
	}
}

function show_refereemode() {
	uiu.visible_qs('#settings_wrapper', true);	
}

var _network_hide_cb = null;
function show() {
	if (state.ui.settings_visible) {
		return;
	}
	state.ui.settings_visible = true;
	control.set_current(state);
	scoresheet.hide();
	stats.hide();

	uiu.visible_qs('#settings_wrapper', true);
	if (network.is_enabled()) {
		$('.setup_network_container').show();
		$('.setup_show_manual').show();
		$('#setup_manual_form').hide();
		_network_hide_cb = network.ui_list_matches(state);
	} else {
		$('.setup_network_container').hide();
		$('#setup_manual_form').show();
	}
	uiu.esc_stack_push(function() {
		hide();
	});
	match_storage.ui_init();
	uiu.visible_qs('.ingame_options', state.initialized);
}

function hide(force) {
	if (!force && !state.initialized) {
		return;
	}
	if (! state.ui.settings_visible) {
		return;
	}
	if (_network_hide_cb) {
		_network_hide_cb();
		_network_hide_cb = null;
	}

	state.ui.settings_visible = false;
	control.set_current(state);
	uiu.visible_qs('#settings_wrapper', false);
	uiu.esc_stack_pop();
}

function update_court(s) {
	var court_select = $('.settings [name="court_select"]');
	court_select.val(s.settings.court_id);
}

function update_refclient(s) {
	uiu.visible_qs('.settings_refmode_client_container', (get_mode(s) !== 'referee') && s.settings.refmode_client_enabled);
	refmode_client_ui.on_settings_change(s);
}

var _settings_checkboxes = [
	'go_fullscreen',
	'show_pronunciation',
	'negative_timers',
	'shuttle_counter',
	'editmode_doubleclick',
	'refmode_client_enabled',
];
var _settings_textfields = ['umpire_name',
	'service_judge_name',
	'court_id',
	'court_description',
	'refmode_client_ws_url',
	'refmode_referee_ws_url',
];
var _settings_numberfields = [
	'network_timeout',
	'network_update_interval',
	'displaymode_update_interval',
	'button_block_timeout',
];
var _settings_selects = [
	'click_mode',
	'displaymode_court_id',
	'displaymode_style',
	'language',
	'wakelock',
];

function update_court_settings(s) {
	var automatic = false;
	var manual = false;
	if (get_mode(s) === 'umpire') {
		automatic = uiu.qs('.settings select[name="court_select"]').getAttribute('data-auto-available') === 'true';
		manual = ! automatic;
	}
	uiu.visible_qs('.settings_court_manual', manual);
	uiu.visible_qs('.settings_court_automatic', automatic);
}

function update(s) {
	_settings_checkboxes.forEach(function(name) {
		var box = $('.settings [name="' + name + '"]');
		box.prop('checked', s.settings[name]);
	});

	_settings_textfields.forEach(function(name) {
		var input = $('.settings [name="' + name + '"]');
		input.val(s.settings[name] ? s.settings[name] : '');
	});

	_settings_numberfields.forEach(function(name) {
		var input = $('.settings [name="' + name + '"]');
		input.val(s.settings[name] ? s.settings[name] : '');
	});

	_settings_selects.forEach(function(name) {
		var select = $('.settings [name="' + name + '"]');
		select.val(s.settings[name]);
	});

	update_court(s);

	i18n.ui_update_state(s);
	render.ui_court_str(s);
	render.shuttle_counter(s);
	click.update_mode(s.settings.click_mode);
	update_refclient(s);
}

function ui_init(s) {
	$('.settings_layout').on('click', function(e) {
		if (e.target != this) {
			return;
		}
		if (state.ui.displaymode_settings_visible) {
			hide_displaymode();
		} else {
			hide();
		}
	});

	var setup_manual_form = $('#setup_manual_form');
	setup_manual_form.find('[name="gametype"]').on('change', function() {
		var new_type = setup_manual_form.find('[name="gametype"]:checked').val();
		var is_doubles = new_type == 'doubles';
		setup_manual_form.find('.only-doubles').toggle(is_doubles);
	});

	click.qs('.backtogame_button', function() {
		control.set_current(s);
		hide();
	});

	_settings_checkboxes.forEach(function(name) {
		var box = $('.settings [name="' + name + '"]');
		box.on('change', function() {
			s.settings[name] = box.prop('checked');
			if ((name === 'show_pronunciation') || (name === 'negative_timers')) {
				render.ui_render(s);
			}
			if (name === 'shuttle_counter') {
				render.shuttle_counter(s);
			}
			if (name === 'refmode_client_enabled') {
				update_refclient(s);
			}
			store(s);
		});
	});

	_settings_textfields.forEach(function(name) {
		var input = $('.settings [name="' + name + '"]');
		input.on('change input', function(e) {
			s.settings[name] = input.val();
			if ((name === 'court_id') || (name === 'court_description')) {
				update_court(s);
				render.ui_court_str(s);
				if (e.type == 'change') {
					network.resync();
				}
			}
			if (name === 'refmode_client_ws_url') {
				refmode_client_ui.on_settings_change(s);
			}
			if (name === 'refmode_referee_ws_url') {
				refmode_referee_ui.on_settings_change(s);
			}
			store(s);
		});
	});

	_settings_numberfields.forEach(function(name) {
		var input = $('.settings [name="' + name + '"]');
		input.on('change input', function() {
			s.settings[name] = parseInt(input.val(), 10);
			store(s);
		});
	});

	_settings_selects.forEach(function(name) {
		var select = $('.settings [name="' + name + '"]');
		select.on('change', function() {
			s.settings[name] = select.val();
			store(s);
			switch (name) {
			case 'language':
				i18n.ui_update_state(s);
				break;
			case 'displaymode_style':
			case 'displaymode_court_id':
				displaymode.on_style_change(s);
				break;
			case 'wakelock':
				wakelock.update(s);
				break;
			case 'click_mode':
				click.update_mode(s.settings[name]);
				break;
			}
		});
	});


	$('.setup_show_manual').on('click', function(e) {
		e.preventDefault();
		$('.setup_show_manual').hide();
		// TODO use a CSS animation here
		$('#setup_manual_form').show(200);
		return false;
	});

	fullscreen.ui_init();

	update(s);
	on_mode_change(s);

	click.qs('.settings_mode_umpire', function(e) {
		e.preventDefault();
		displaymode.hide();
		refmode_referee_ui.hide();
		settings.show();
	});
}

function get_mode(s) {
	if (s.ui.displaymode_visible) {
		return 'display';
	}
	if (s.ui.referee_mode) {
		return 'referee';
	}
	return 'umpire';
}

function on_mode_change(s) {
	var mode = get_mode(s);
	uiu.qsEach('.settings_mode>a', function(a) {
		var is_active = $(a).hasClass('settings_mode_' + mode);
		if (is_active) {
			$(a).addClass('settings_mode_active');
		} else {
			$(a).removeClass('settings_mode_active');
		}
	});

	uiu.qsEach('#settings_wrapper [data-bup-modes]', function(el) {
		var modes = el.getAttribute('data-bup-modes');
		uiu.visible(el, modes.indexOf(mode) >= 0);
	});
	update_court_settings(s);

	wakelock.update(s);
	update_refclient(s);
}

return {
	get_mode: get_mode,
	hide: hide,
	hide_displaymode: hide_displaymode,
	load: load,
	on_mode_change: on_mode_change,
	show: show,
	show_displaymode: show_displaymode,
	show_refereemode: show_refereemode,
	store: store,
	toggle_displaymode: toggle_displaymode,
	ui_init: ui_init,
	update: update,
	update_court_settings: update_court_settings,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var control = require('./control');
	var displaymode = require('./displaymode');
	var fullscreen = require('./fullscreen');
	var i18n = require('./i18n');
	var match_storage = require('./match_storage');
	var network = require('./network');
	var refmode_client_ui = require('./refmode_client_ui');
	var refmode_referee_ui = require('./refmode_referee_ui');
	var render = require('./render');
	var scoresheet = require('./scoresheet');
	var stats = require('./stats');
	var uiu = require('./uiu');
	var wakelock = require('./wakelock');

	module.exports = settings;
}
/*/@DEV*/
