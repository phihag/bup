var settings = (function() {
'use strict';

var default_settings = {
	save_finished_matches: true,
	go_fullscreen: false,
	show_pronounciation: true,
	umpire_name: '',
	service_judge_name: '',
	court_id: '',
	court_description: '',
	network_timeout: 10000,
	network_update_interval: 10000,
	double_click_timeout: 1000,
	button_block_timeout: 1200,
	negative_timers: false,
	shuttle_counter: true,
	language: 'auto',
	editmode_doubleclick: false,
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
	stats.hide();

	$('#settings_wrapper').show();
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

function update_court(s) {
	var court_select = $('.settings [name="court_select"]');
	court_select.val(s.settings.court_id);
}

var _settings_checkboxes = ['save_finished_matches', 'go_fullscreen', 'show_pronounciation', 'negative_timers', 'shuttle_counter', 'editmode_doubleclick'];
var _settings_textfields = ['umpire_name', 'service_judge_name', 'court_id', 'court_description'];
var _settings_numberfields = ['network_timeout', 'network_update_interval', 'button_block_timeout'];
var _settings_selects = ['language'];

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
}

function ui_init(s) {
	var setup_manual_form = $('#setup_manual_form');
	setup_manual_form.find('[name="gametype"]').on('change', function() {
		var new_type = setup_manual_form.find('[name="gametype"]:checked').val();
		var is_doubles = new_type == 'doubles';
		setup_manual_form.find('.only-doubles').toggle(is_doubles);
	});

	$('.backtogame_button').on('click', function() {
		control.set_current(s);
		hide();
	});

	_settings_checkboxes.forEach(function(name) {
		var box = $('.settings [name="' + name + '"]');
		box.on('change', function() {
			s.settings[name] = box.prop('checked');
			if ((name === 'show_pronounciation') || (name === 'negative_timers')) {
				render.ui_render(s);
			}
			if (name === 'shuttle_counter') {
				render.shuttle_counter(s);
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
			if (name == 'language') {
				i18n.ui_update_state(s);
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
	var control = require('./control');
	var fullscreen = require('./fullscreen');
	var i18n = require('./i18n');
	var match_storage = require('./match_storage');
	var network = require('./network');
	var render = require('./render');
	var scoresheet = require('./scoresheet');
	var stats = require('./stats');
	var uiu = require('./uiu');

	module.exports = settings;
}
/*/@DEV*/
