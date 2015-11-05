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
};

function load() {
	if (! window.localStorage) {
		show_error('localStorage unavailable');
		return;
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
		show_error('localStorage unavailable');
		return;
	}

	window.localStorage.setItem('bup_settings', JSON.stringify(s.settings));
}

var _network_hide_cb = null;
function show() {
	var wrapper = $('#settings_wrapper');
	if (wrapper.attr('data-settings-visible') == 'true') {
		return;
	}
	wrapper.attr('data-settings-visible', 'true');

	wrapper.show();
	if (networks.courtspot || networks.btde) {
		$('.setup_network_container').show();
		$('.setup_show_manual').show();
		$('#setup_manual_form').hide();
		_network_hide_cb = network.ui_list_matches(state);
	} else {
		$('.setup_network_container').hide();
		$('#setup_manual_form').show();
	}
	ui_esc_stack_push(function() {
		settings.hide();
	});
	ui_settings_load_list();
	$('.extended_options').toggle(state.initialized);
}

function hide(force) {
	if (!force && !state.initialized) {
		return;
	}
	if (_network_hide_cb) {
		_network_hide_cb();
		_network_hide_cb = null;
	}
	var wrapper = $('#settings_wrapper');
	if (wrapper.attr('data-settings-visible') == 'false') {
		return;
	}

	wrapper.hide();
	ui_esc_stack_pop();
	wrapper.attr('data-settings-visible', 'false');
}


return {
	load: load,
	store: store,
	show: show,
	hide: hide,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = settings;
}
/*/@DEV*/
