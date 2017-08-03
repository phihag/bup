'use strict';
// location.hash handling
var buphistory = (function() {

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
	hval = hval.replace(/(?:^|&)(?:m|display|settings|event_scoresheets|scoresheet|eventsheet|stats|netstats|order|editevent|setupsheet|referee_mode|dads|court|dm_style)(?:=[^&]*)?(?=&|$)/g, '');
	hval = hval.replace(/^&+|&+$/g, '');

	if (s.initialized && (settings.get_mode(s) === 'umpire')) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'm=' + encodeURIComponent(s.metadata.id);
	}

	if (s.ui.displaymode_visible) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'display';
		if (s.ui.displaymode_settings_visible) {
			hval += '&settings';
		}
	} else if (s.ui.referee_mode) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'referee_mode';
	} else if (s.ui.scoresheet_visible) {
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
	} else if (s.ui.netstats_visible) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'netstats';
	} else if (s.ui.editevent_visible) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'editevent';
	} else if (s.ui.setupsheet_visible) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'setupsheet';
	} else if (s.ui.order_visible) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'order';
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
	} else if (s.ui.dads_visible) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'dads';
	}

	var orig_qs = utils.parse_query_string(orig_hval);
	var new_qs = utils.parse_query_string(hval);
	if (! utils.deep_equal(orig_qs, new_qs)) {
		// TODO use history API here to avoid changing?
		window.location.hash = '#' + hval;
	}
}

function load_by_hash() {
	var qs = utils.parse_query_string(window.location.hash.substr(1));

	// TODO hide editevent/setupsheet etc.
	/*if (!qs.editevent) {
		editevent.hide();
	}
	if (!qs.setupsheet) {
		setupsheet.hide();
	}*/

	if (typeof qs.dads != 'undefined') {
		dads.show();
		return;
	} else {
		dads.hide();
	}

	if (typeof qs.display != 'undefined') {
		displaymode.show();
		return;
	} else {
		displaymode.hide();
	}

	if (typeof qs.referee_mode != 'undefined') {
		refmode_referee_ui.show();
		return;
	} else {
		refmode_referee_ui.hide();
	}

	if (qs.eventsheet) {
		eventsheet.show_dialog(qs.eventsheet);
		return;
	}

	if (typeof qs.event_scoresheets != 'undefined') {
		scoresheet.event_show();
		return;
	}

	if (typeof qs.netstats != 'undefined') {
		netstats.show();
		return;
	}

	if (typeof qs.order != 'undefined') {
		order.show();
		return;
	}

	if (typeof qs.editevent != 'undefined') {
		editevent.show();
		return;
	}

	if (typeof qs.setupsheet != 'undefined') {
		setupsheet.show();
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
	var dads = require('./dads');
	var displaymode = require('./displaymode');
	var editevent = require('./editevent');
	var eventsheet = require('./eventsheet');
	var match_storage = require('./match_storage');
	var netstats = require('./netstats');
	var network = require('./network');
	var order = require('./order');
	var refmode_referee_ui = null; // break cycle, should be require('./refmode_referee_ui');
	var render = require('./render');
	var scoresheet = require('./scoresheet');
	var settings = require('./settings');
	var setupsheet = require('./setupsheet');
	var stats = require('./stats');
	var utils = require('./utils');

	module.exports = buphistory;
}
/*/@DEV*/
