// location.hash handling
var buphistory = (function() {
'use strict';

function load_ui_by_hash_qs(qs) {
	if (qs.scoresheet !== undefined) {
		scoresheet.show();
		return;
	} else {
		scoresheet.hide();
	}

	if (qs.settings !== undefined) {
		settings.show();
	} else {
		settings.hide(true);
	}
}

var is_loading = false;

function record(s) {
	if (is_loading) {
		return;  // Do not change hash while we are still loading the state indicated by the last hash
	}

	var orig_hval = window.location.hash.substr(1);
	var hval = orig_hval;
	hval = hval.replace(/(?:^|&)(?:m|settings|scoresheet)(?:=[^&]*)?(?=&|$)/g, '');

	if (s.initialized) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'm=' + encodeURIComponent(s.metadata.id);
	}

	if (s.ui.scoresheet_visible) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'scoresheet';
	} else if (s.ui.settings_visible) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'settings';
	}

	if (hval != orig_hval) {
		window.location.hash = '#' + hval;
	}
}

function load_by_hash() {
	var qs = utils.parse_query_string(window.location.hash.substr(1));
	if (state.metadata && (qs.m == state.metadata.id)) {
		is_loading = true;
		load_ui_by_hash_qs(qs);
		is_loading = false;
		return;
	}
	if (qs.m) {
		// Load match
		var m = match_storage.get(qs.m);
		if (m) {
			is_loading = true;
			control.resume_match(m);
			load_ui_by_hash_qs(qs);
			is_loading = false;
			return;
		}

		m = network.match_by_id(qs.m);
		if (m) {
			is_loading = true;
			network.enter_match(m);
			load_ui_by_hash_qs(qs);
			is_loading = false;
			return;
		}
	}

	// no match to load, so always no settings and no scoresheet
	if (qs.demo !== undefined) {
		control.demo_match_start();
	} else {
		settings.show();
	}
}

function ui_init() {
	window.addEventListener('hashchange', load_by_hash, false);
}

return {
	ui_init: ui_init,
	kickoff: load_by_hash,
	record: record,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var control = require('./control');
	var network = require('./network');
	var settings = require('./settings');
	var match_storage = require('./match_storage');

	module.exports = buphistory;
}
/*/@DEV*/
