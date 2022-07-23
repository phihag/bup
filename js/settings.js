'use strict';
var settings = (function() {

var default_settings = {
	fullscreen_ask: 'auto',
	show_announcements: 'all',
	umpire_name: '',
	service_judge_name: '',
	court_id: '',
	court_description: '',
	network_timeout: 10000,
	network_update_interval: 10000,
	displaymode_update_interval: 500,
	d_c0: '#50e87d',
	d_cb0: '#000000',
	d_c1: '#f76a23',
	d_cb1: '#000000',
	d_cbg: '#000000',
	d_cfg: '#ffffff',
	d_cfgdark: '#000000',
	d_cbg2: '#d9d9d9',
	d_cbg3: '#252525',
	d_cbg4: '#404040',
	d_cfg2: '#aaaaaa',
	d_cfg3: '#cccccc',
	d_cborder: '#444444',
	d_ct: '#80ff00',
	d_ctim_blue: '#0070c0',
	d_ctim_active: '#ffc000',
	d_cserv: '#fff200',
	d_cserv2: '#dba766',
	d_crecv: '#707676',
	d_scale: 100,
	d_team_colors: false,
	d_show_pause: false,
	settings_autohide: 30000,
	dads_interval: 20000,
	dads_wait: 60000,
	dads_dtime: 10000,
	dads_atime: 10000,
	dads_utime: '14:00',
	dads_mode: 'none',
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
	refmode_client_node_name: '',
	referee_service_judges: false,
	settings_style: 'default',
};

function load() {
	if (! window.localStorage) {
		return default_settings;
	}

	var json_str = window.localStorage.getItem('bup_settings');
	var res = utils.deep_copy(default_settings);
	if (json_str) {
		var new_settings = JSON.parse(json_str);
		utils.obj_update(res, new_settings);
	}
	return res;
}

function store(s) {
	if (! window.localStorage) {
		return;
	}

	try {
		window.localStorage.setItem('bup_settings', JSON.stringify(s.settings));
	} catch (e) {
		report_problem.silent_error('Failed to store settings: ' + e.stack);
	}
}

var _autohide_to;
function autohide_restart() {
	if (_autohide_to) {
		clearTimeout(_autohide_to);
	}
	_autohide_to = setTimeout(hide_displaymode, state.settings.settings_autohide || 30000);
}

function show_displaymode() {
	if (state.ui.displaymode_settings_visible) {
		return;
	}
	window.addEventListener('mousemove', autohide_restart);
	window.addEventListener('click', autohide_restart);
	state.ui.displaymode_settings_visible = true;
	uiu.show_qs('#settings_wrapper');
	bupui.esc_stack_push(hide_displaymode);
	autohide_restart();
}

function hide_displaymode() {
	if (!state.ui.displaymode_settings_visible) {
		return;
	}
	window.removeEventListener('click', autohide_restart);
	window.removeEventListener('mousemove', autohide_restart);
	if (_autohide_to) {
		clearTimeout(_autohide_to);
		_autohide_to = null;
	}
	state.ui.displaymode_settings_visible = false;
	uiu.hide_qs('#settings_wrapper');
	bupui.esc_stack_pop();
}

function toggle_displaymode() {
	if (state.ui.displaymode_settings_visible) {
		hide_displaymode();
	} else {
		show_displaymode();
	}
}

function show_refereemode() {
	uiu.$visible_qs('#settings_wrapper', true);
	uiu.$visible_qs('.ingame_options', false);
}

function hide_refereemode() {
	uiu.$visible_qs('#settings_wrapper', false);
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

	uiu.$visible_qs('#settings_wrapper', true);
	var net_enabled = network.is_enabled();
	uiu.$visible_qs('.setup_network_container', net_enabled);
	uiu.$visible_qs('.import_container', ! net_enabled);
	uiu.$visible_qs('#setup_manual_form', ! net_enabled);
	if (net_enabled) {
		uiu.$show_qs('.setup_show_manual');
		_network_hide_cb = network.ui_list_matches(state);
	}
	bupui.esc_stack_push(function() {
		hide();
	});
	match_storage.ui_init();
	uiu.$visible_qs('.ingame_options', state.initialized);
	uiu.$visible_qs('.ingame_options_refmode', state.ui.referee_mode);
}

function hide(force, skip_state) {
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
	uiu.$visible_qs('#settings_wrapper', false);
	bupui.esc_stack_pop();
	if (!skip_state) {
		control.set_current(state);
	}
}

function update_court(s) {
	var court_select = $('.settings [name="court_select"]');
	court_select.val(s.settings.court_id);
}

function update_refclient(s) {
	var settings_style = get_settings_style(s);

	var ref_ui_visible = (
		(get_mode(s) !== 'referee')
		&& s.settings.refmode_client_enabled
		&& settings_style === 'complete');
	uiu.$visible_qs(
		'.settings_refmode_client_container', ref_ui_visible);
	refmode_client_ui.on_settings_change(s);
}

var _settings_checkboxes = [
	'negative_timers',
	'shuttle_counter',
	'editmode_doubleclick',
	'refmode_client_enabled',
	'displaymode_reverse_order',
	'd_show_pause',
	'd_team_colors',
	'referee_service_judges',
];
var _settings_textfields = [
	'umpire_name',
	'service_judge_name',
	'court_id',
	'court_description',
	'refmode_client_ws_url',
	'refmode_referee_ws_url',
	'refmode_client_node_name',
	'dads_utime',

	// really color fields
	'd_c0',
	'd_c1',
	'd_cbg',
	'd_cfg',
	'd_cfgdark',
	'd_cbg2',
	'd_cbg3',
	'd_cbg4',
	'd_cfg2',
	'd_cborder',
	'd_ct',
	'd_ctim_active',
	'd_ctim_blue',
	'd_cserv',
	'd_cserv2',
	'd_crecv',
];
var _settings_numberfields = [
	'network_timeout',
	'network_update_interval',
	'displaymode_update_interval',
	'button_block_timeout',
	'd_scale',
	'dads_interval',
	'dads_utime',
	'dads_atime',
	'dads_wait',
];
var _settings_selects = [
	'fullscreen_ask',
	'show_announcements',
	'click_mode',
	'displaymode_court_id',
	'displaymode_style',
	'language',
	'wakelock',
	'dads_mode',
	'settings_style',
];

function update_court_settings(s) {
	var automatic = false;
	var manual = false;
	if (get_mode(s) === 'umpire') {
		automatic = uiu.qs('.settings select[name="court_select"]').getAttribute('data-auto-available') === 'true';
		manual = ! automatic;
	}
	uiu.$visible_qs('.settings_court_manual', manual);
	uiu.$visible_qs('.settings_court_automatic', automatic);
}

function update(s) {
	_settings_checkboxes.forEach(function(name) {
		var $box = $('.settings [name="' + name + '"]');
		$box.prop('checked', s.settings[name]);
	});

	_settings_textfields.forEach(function(name) {
		var $input = $('.settings [name="' + name + '"]');
		$input.val(s.settings[name] ? s.settings[name] : '');
	});

	_settings_numberfields.forEach(function(name) {
		var $input = $('.settings [name="' + name + '"]');
		$input.val(s.settings[name] ? s.settings[name] : '');
	});

	_settings_selects.forEach(function(name) {
		var $select = $('.settings [name="' + name + '"]');
		$select.val(s.settings[name]);
	});

	update_court(s);

	i18n.ui_update_state(s);
	render.ui_court_str(s);
	render.shuttle_counter(s);
	click.update_mode(s.settings.click_mode);
	update_refclient(s);
}

function change(s, key, value) {
	var to_change = {};
	to_change[key] = value;
	change_all(s, to_change);
}

function change_all(s, new_settings) {
	var changed = {};
	var any_changed = false;
	var skey; // let is not available in all current browsers :()
	for (skey in new_settings) {
		var val = new_settings[skey];
		if (val === s.settings[skey]) {
			continue; // No change required
		}
		s.settings[skey] = val;
		changed[skey] = true;
		any_changed = true;
	}

	if (!any_changed) {
		return;
	}

	for (skey in changed) {
		on_change(s, skey);
	}

	update(s);
	store(s);
}

function on_change(s, name) {
	if (/^dads_/.test(name)) {
		dads.on_style_change(s);
		return;
	}
	if (/^(d|displaymode)_/.test(name)) {
		displaymode.on_style_change(s);
		return;
	}

	switch (name) {
	case 'show_announcements':
	case 'negative_timers':
		render.ui_render(s);
		break;
	case 'shuttle_counter':
		render.shuttle_counter(s);
		break;
	case 'refmode_client_enabled':
		update_refclient(s);
		break;
	case 'court_id':
		update_court(s);
		render.ui_court_str(s);
		network.resync();
		break;
	case 'court_description':
		update_court(s);
		render.ui_court_str(s);
		break;
	case 'refmode_referee_ws_url':
	case 'referee_service_judges':
		refmode_referee_ui.on_settings_change(s);
		break;
	case 'language':
		i18n.ui_update_state(s);
		break;
	case 'wakelock':
		wakelock.update(s);
		break;
	case 'click_mode':
		click.update_mode(s.settings[name]);
		break;
	case 'fullscreen_ask':
		fullscreen.update_fullscreen_button();
		break;
	case 'settings_style':
		on_mode_change(s);
		break;
	}
}

function change_setting(s, name, val) {
	if (val === s.settings[name]) {
		return; // No change required
	}
	s.settings[name] = val;

	on_change(s, name);
	refmode_client_ui.on_settings_change(s);
	store(s);
}

function ui_init(s) {
	$('.settings_layout').on('click', function(e) {
		if (e.target != this) {
			return;
		}
		if (state.ui.displaymode_settings_visible) {
			hide_displaymode();
			fullscreen.start();
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
		hide();
		control.set_current(s);
		render.show();
	});

	_settings_checkboxes.forEach(function(name) {
		var box = uiu.qs('.settings [name="' + name + '"]');
		box.addEventListener('change', function() {
			change_setting(s, name, box.checked);
		});
	});

	_settings_textfields.forEach(function(name) {
		var input = $('.settings [name="' + name + '"]');
		input.on('change input', function() {
			change_setting(s, name, input.val());
		});
	});

	_settings_numberfields.forEach(function(name) {
		var input = $('.settings [name="' + name + '"]');
		input.on('change input', function() {
			change_setting(s, name, parseInt(input.val(), 10));
		});
	});

	_settings_selects.forEach(function(name) {
		var select = $('.settings [name="' + name + '"]');
		select.on('change', function() {
			change_setting(s, name, select.val());
		});
	});


	$('.setup_show_manual').on('click', function(e) {
		e.preventDefault();
		$('.setup_show_manual').hide();
		uiu.$show_qs('#setup_manual_form');
		uiu.$show_qs('.import_container');

		return false;
	});

	fullscreen.ui_init();

	update(s);
	on_mode_change(s);

	click.qs('.settings_mode_umpire', function(e) {
		e.preventDefault();
		displaymode.hide();
		refmode_referee_ui.hide();
		show();
	});
}

function get_mode(s) {
	if (!s.ui) {
		return 'umpire'; // Tests?
	}
	if (s.ui.displaymode_visible || s.ui.dads_visible) {
		return 'display';
	}
	if (s.ui.referee_mode) {
		return 'referee';
	}
	return 'umpire';
}

function get_settings_style(s) {
	var res = s.settings.settings_style;
	if (res === 'default') {
		var netw = network.get_netw();
		res = (netw && netw.limited_ui) ? 'clean' : 'complete';
	}
	return res;
}

function on_mode_change(s) {
	var mode = get_mode(s);
	uiu.qsEach('.settings_mode>a', function(a) {
		var is_active = uiu.hasClass(a, 'settings_mode_' + mode);
		uiu.setClass(a, 'settings_mode_active', is_active);
	});

	var settings_style = get_settings_style(s);
	uiu.qsEach('#settings_wrapper *[data-bup-modes]', function(el) {
		var modes = el.getAttribute('data-bup-modes');
		var visible = true;
		if (modes.indexOf(mode) < 0) {
			visible = false;
		} else {
			if (mode === 'umpire') {
				var styles = el.getAttribute('data-bup-styles');
				if (styles && (styles.indexOf(settings_style) >= 0)) {
					visible = true;
				} else {
					if (styles) {
						visible = false;
					} else if ((settings_style === 'clean') || (settings_style === 'focus')) {
						visible = false;
					} // else: complete, everything visible
				}
			}
		}
		uiu.visible(el, visible);
	});
	update_court_settings(s);

	wakelock.update(s);
	update_refclient(s);
}

function clear_manual() {
	// Empty the values of the manual match start boxes, for the next match
	var manual_form = uiu.qs('#setup_manual_form');
	['team1_player1', 'team1_player2', 'team2_player1', 'team2_player2',
	'team1_name', 'team2_name', 'match_name'].forEach(function(name) {
		uiu.qs('[name="' + name + '"]', manual_form).value = '';
	});
}

return {
	clear_manual: clear_manual,
	default_settings: default_settings,
	get_mode: get_mode,
	hide: hide,
	hide_displaymode: hide_displaymode,
	hide_refereemode: hide_refereemode,
	load: load,
	change: change,
	change_all: change_all,
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
	var bupui = require('./bupui');
	var click = require('./click');
	var control = require('./control');
	var dads = require('./dads');
	var displaymode = require('./displaymode');
	var fullscreen = require('./fullscreen');
	var i18n = require('./i18n');
	var match_storage = require('./match_storage');
	var network = require('./network');
	var refmode_client_ui = null; // break cycle, should be require('./refmode_client_ui');
	var refmode_referee_ui = null; // break cycle, should be require('./refmode_referee_ui');
	var render = require('./render');
	var report_problem = require('./report_problem');
	var scoresheet = require('./scoresheet');
	var stats = require('./stats');
	var uiu = require('./uiu');
	var utils = require('./utils');
	var wakelock = require('./wakelock');

	module.exports = settings;
}
/*/@DEV*/
