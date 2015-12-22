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
		return;
	} else {
		settings.hide(true);
	}

	if (qs.stats !== undefined) {
		stats.show();
		return;
	} else {
		stats.hide();
	}

	render.show();
}

var is_loading = false;

function record(s) {
	if (is_loading) {
		return;  // Do not change hash while we are still loading the state indicated by the last hash
	}

	var orig_hval = window.location.hash.substr(1);
	var hval = orig_hval;
	hval = hval.replace(/(?:^|&)(?:m|settings|event_scoresheets|scoresheet|eventsheet|stats)(?:=[^&]*)?(?=&|$)/g, '');
	hval = hval.replace(/^&+|&+$/g, '');

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
	} else if (s.ui.event_scoresheets_visible) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'event_scoresheets';
	} else if (s.ui.eventsheet) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'eventsheet=' + encodeURIComponent(s.ui.eventsheet);
	} else if (s.ui.settings_visible) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'settings';
	} else if (s.ui.stats_visible) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'stats';
	}

	var orig_qs = utils.parse_query_string(orig_hval);
	var new_qs = utils.parse_query_string(hval);
	if (! utils.deep_equal(orig_qs, new_qs)) {
		window.location.hash = '#' + hval;
	}
}

function load_by_hash() {
	var qs = utils.parse_query_string(window.location.hash.substr(1));

	if (qs.eventsheet) {
		eventsheet.show_dialog(qs.eventsheet);
		return;
	}

	if (typeof qs.event_scoresheets != 'undefined') {
		scoresheet.event_show();
		return;
	}

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
		is_loading = true;
		control.demo_match_start();
		load_ui_by_hash_qs(qs);
		is_loading = false;
		record(state);
	} else if (qs.empty_match !== undefined) {
		is_loading = true;
		control.empty_match_start();
		load_ui_by_hash_qs(qs);
		is_loading = false;
		record(state);
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
	var eventsheet = require('./eventsheet');
	var network = require('./network');
	var settings = require('./settings');
	var stats = require('./stats');
	var render = require('./render');
	var match_storage = require('./match_storage');

	module.exports = buphistory;
}
/*/@DEV*/
