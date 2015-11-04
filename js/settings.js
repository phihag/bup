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

return {
	load: load,
	store: store,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = settings;
}
/*/@DEV*/
