'use strict';
var match_storage = (function() {

function store(s) {
	if (typeof localStorage == 'undefined') {
		return;
	}

	var presses = s.presses;
	if (presses && presses[presses.length - 1].type == 'postmatch-confirm') {
		presses = presses.slice(0, presses.length - 1);
	}
	var cleaned_s = {
		metadata: s.metadata,
		setup: s.setup,
		presses: presses,
	};
	try {
		localStorage.setItem('bup_match_' + s.metadata.id, JSON.stringify(cleaned_s));
	} catch(e) {
		// Ignore error
	}
}

function load() {
	if (typeof localStorage == 'undefined') {
		return;
	}

	var res = [];
	for (var i = 0;i < localStorage.length;i++) {
		var k = localStorage.key(i);
		if (! k.match(/^bup_match_/)) {
			continue;
		}

		var m = JSON.parse(localStorage.getItem(k));
		res.push(m);
	}
	return res;
}

function load_match(match_id) {
	if (typeof localStorage == 'undefined') {
		return;
	}
	var k = 'bup_match_' + match_id;

	try {
		return JSON.parse(localStorage.getItem(k));
	} catch(e) {
		// Ignore
	}
}

function remove(match_id) {
	window.localStorage.removeItem('bup_match_' + match_id);
}

function ui_init() {
	var matches = load();
	matches = matches.filter(function(m) {
		return (!state.metadata || m.metadata.id != state.metadata.id);
	});
	uiu.$visible_qs('.setup_loadmatch_none', matches.length === 0);
	var match_list = $('.setup_loadmatch_list');
	match_list.empty();
	match_list.toggle(matches.length > 0);
	matches.sort(function(m1, m2) {
		var time1 = m1.metadata.updated;
		var time2 = m2.metadata.updated;
		if (time1 > time2) {
			return -1;
		} else if (time1 < time2) {
			return 1;
		} else {
			return 0;
		}
	});
	matches.forEach(function(m) {
		var li = $('<li>');
		var a = $('<span class="load_match_link">');
		a.text(pronunciation.match_str(m.setup) + ', ' + utils.datetime_str(m.metadata.updated));
		a.on('click', function(e) {
			e.preventDefault();
			control.resume_match(m);
			settings.hide(true);
		});
		li.append(a);
		var del_btn = $('<button class="button_delete image-button textsize-button"><span></span></button>');
		del_btn.on('click', function() {
			remove(m.metadata.id);
			li.remove();
		});
		li.append(del_btn);
		match_list.append(li);
	});
}

return {
	ui_init: ui_init,
	store: store,
	remove: remove,
	load_match: load_match,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var control = require('./control');
	var pronunciation = require('./pronunciation');
	var settings = null; // avoid cyclic imports
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = match_storage;
}
/*/@DEV*/
