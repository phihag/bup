var settings = (function() {
'use strict';

var default_settings = {
	save_finished_matches: true,
	go_fullscreen: false,
	show_pronounciation: true,
	umpire_name: '',
	court_id: '',
	court_description: '',
	network_timeout: 10000,
	network_update_interval: 10000,
	double_click_timeout: 1000,
	negative_timers: false,
	shuttle_counter: true,
	lang: 'de',
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

var _network_hide_cb = null;
function show() {
	if (state.ui.settings_visible) {
		return;
	}
	state.ui.settings_visible = true;
	control.set_current(state);
	scoresheet.hide();

	$('#settings_wrapper').show();
	if (networks.courtspot || networks.btde) {
		$('.setup_network_container').show();
		$('.setup_show_manual').show();
		$('#setup_manual_form').hide();
		_network_hide_cb = network.ui_list_matches(state);
	} else {
		$('.setup_network_container').hide();
		$('#setup_manual_form').show();
	}
	uiu.esc_stack_push(function() {
		settings.hide();
	});
	match_storage.ui_init();
	$('.ingame_options').toggle(state.initialized);
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
	$('#settings_wrapper').hide();
	uiu.esc_stack_pop();
}

var _settings_checkboxes = ['save_finished_matches', 'go_fullscreen', 'show_pronounciation', 'negative_timers', 'shuttle_counter'];
var _settings_textfields = ['umpire_name', 'court_id', 'court_description'];
var _settings_numberfields = ['network_timeout', 'network_update_interval'];
var _settings_selects = ['language'];

function update() {
	_settings_checkboxes.forEach(function(name) {
		var box = $('.settings [name="' + name + '"]');
		box.prop('checked', state.settings[name]);
	});

	_settings_textfields.forEach(function(name) {
		var input = $('.settings [name="' + name + '"]');
		input.val(state.settings[name] ? state.settings[name] : '');
	});

	_settings_numberfields.forEach(function(name) {
		var input = $('.settings [name="' + name + '"]');
		input.val(state.settings[name] ? state.settings[name] : '');
	});

	_settings_selects.forEach(function(name) {
		var select = $('.settings [name="' + name + '"]');
		select.val(state.settings[name]);
	});

	i18n.ui_update_state(state);
	render.ui_court_str(state);
	render.shuttle_counter(state);
}


function ui_init() {
	$('#setup_manual_form [name="gametype"]').on('change', function() {
		var new_type = $('#setup_manual_form [name="gametype"]:checked').val();
		var is_doubles = new_type == 'doubles';
		$('#setup_manual_form .only-doubles').toggle(is_doubles);
	});

	$('.backtogame_button').on('click', function() {
		control.set_current(state);
		hide();
	});

	_settings_checkboxes.forEach(function(name) {
		var box = $('.settings [name="' + name + '"]');
		box.on('change', function() {
			state.settings[name] = box.prop('checked');
			if ((name === 'show_pronounciation') && (state.initialized)) {
				render.ui_render(state);
			}
			if (name === 'shuttle_counter') {
				render.shuttle_counter(state);
			}
			settings.store(state);
		});
	});

	_settings_textfields.forEach(function(name) {
		var input = $('.settings [name="' + name + '"]');
		input.on('change input', function(e) {
			state.settings[name] = input.val();
			if ((name === 'court_id') || (name === 'court_description')) {
				render.ui_court_str(state);
				if (e.type == 'change') {
					network.resync();
				}
			}
			settings.store(state);
		});
	});

	_settings_numberfields.forEach(function(name) {
		var input = $('.settings [name="' + name + '"]');
		input.on('change input', function() {
			state.settings[name] = parseInt(input.val(), 10);
			settings.store(state);
		});
	});

	_settings_selects.forEach(function(name) {
		var select = $('.settings [name="' + name + '"]');
		select.on('change', function() {
			state.settings[name] = select.val();
			settings.store(state);
			if (name == 'language') {
				i18n.ui_update_state(state);
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

	update();
}

return {
	load: load,
	store: store,
	update: update,
	show: show,
	hide: hide,
	ui_init: ui_init,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var fullscreen = require('./fullscreen');
	var render = require('./render');
	var uiu = require('./uiu');
	var match_storage = require('./match_storage');
	var i18n = require('./i18n');
	var control = require('./control');

	module.exports = settings;
}
/*/@DEV*/
