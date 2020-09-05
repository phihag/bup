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
	hval = hval.replace(/(?:^|&)(?:m|display|settings|event_scoresheets|scoresheet|eventsheet|es_preview|stats|netstats|order|urlexport|mo|editevent|setupsheet|referee_mode|dads|court|dm_style)(?:=[^&]*)?(?=&|$)/g, '');
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
	} else if (s.ui.es_preview) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'es_preview=' + encodeURIComponent(s.ui.es_preview);
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
	} else if (s.ui.urlexport) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'urlexport';
	} else if (s.ui.mo_visible) {
		if (hval.length > 1) {
			hval += '&';
		}
		hval += 'mo';
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
		_expect_hash = hval;
		window.location.hash = '#' + hval;
	}
}

var _expect_hash;
function load_by_hash() {
	report_problem.on_hash_change();

	var hval = window.location.hash.substr(1);
	if (hval === _expect_hash) {
		// Loaded after navigating
		_expect_hash = null;
		return;
	}

	var qs = utils.parse_query_string(hval);

	var show_func;
	var hide_funcs = [];

	if (typeof qs.dads != 'undefined') {
		show_func = dads.show;
	} else {
		hide_funcs.push(dads.hide);
	}

	if (typeof qs.display != 'undefined') {
		show_func = displaymode.show;
	} else {
		hide_funcs.push(displaymode.hide);
	}

	if (typeof qs.referee_mode != 'undefined') {
		show_func = refmode_referee_ui.show;
	} else {
		hide_funcs.push(refmode_referee_ui.hide);
	}

	if (qs.eventsheet) {
		show_func = function() {
			eventsheet.show_dialog(qs.eventsheet);
		};
	} else if (qs.es_preview) {
		show_func = function() {
			eventsheet.show_preview(qs.es_preview);
		};
	} else {
		hide_funcs.push(eventsheet.hide);
	}

	if (typeof qs.event_scoresheets != 'undefined') {
		show_func = scoresheet.event_show;
	} else {
		hide_funcs.push(scoresheet.hide);
	}

	if (typeof qs.netstats != 'undefined') {
		show_func = netstats.show;
	} else {
		hide_funcs.push(netstats.hide);
	}

	if (typeof qs.mo != 'undefined') {
		show_func = order.mshow;
	} else if (typeof qs.order != 'undefined') {
		show_func = order.show;
	} else {
		hide_funcs.push(order.hide);
	}

	if (typeof qs.urlexport != 'undefined') {
		show_func = urlexport.show;
	} else {
		hide_funcs.push(urlexport.hide);
	}

	if (typeof qs.editevent != 'undefined') {
		show_func = editevent.show;
	} else {
		hide_funcs.push(editevent.hide);
	}

	if (typeof qs.setupsheet != 'undefined') {
		show_func = setupsheet.show;
	} else {
		hide_funcs.push(setupsheet.hide);
	}

	is_loading = true;
	hide_funcs.forEach(function(hf) {
		hf();
	});

	if (show_func) {
		var show_settings = (qs.nosettings === undefined) && (qs.neversettings === undefined);
		show_func({show_settings: show_settings});
		is_loading = false;
		return;
	}

	if (state.metadata && (qs.m == state.metadata.id)) {
		load_ui_by_hash_qs(qs);
		is_loading = false;
		return;
	}

	if (qs.m) {
		// Load match
		var m = match_storage.load_match(qs.m);
		if (m) {
			control.resume_match(m);
			load_ui_by_hash_qs(qs);
			is_loading = false;
			return;
		}

		m = network.match_by_id(qs.m);
		if (m) {
			network.enter_match(m);
			load_ui_by_hash_qs(qs);
			is_loading = false;
			return;
		}
	}

	// no match to load, so always no settings and no scoresheet
	if (qs.demo !== undefined) {
		control.demo_match_start();
		load_ui_by_hash_qs(qs);
		is_loading = false;
		record(state);
	} else if ((qs.empty_match !== undefined) || (qs.empty_match5 !== undefined)) {
		is_loading = true;
		control.empty_match_start((qs.empty_match5 !== undefined) ? '5x11_15' : '3x21');
		load_ui_by_hash_qs(qs);
		is_loading = false;
		record(state);
	} else {
		settings.show();
	}
	is_loading = false;
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
	var report_problem = require('./report_problem');
	var scoresheet = require('./scoresheet');
	var settings = require('./settings');
	var setupsheet = require('./setupsheet');
	var stats = require('./stats');
	var urlexport = require('./urlexport');
	var utils = require('./utils');

	module.exports = buphistory;
}
/*/@DEV*/
