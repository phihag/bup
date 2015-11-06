var match_storage = (function() {
'use strict';

function store(s) {
	if (! window.localStorage) {
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
		window.localStorage.setItem('bup_match_' + s.metadata.id, JSON.stringify(cleaned_s));
	} catch(e) {
		// Ignore error
	}
}

function load() {
	if (! window.localStorage) {
		return;
	}

	var res = [];
	for (var i = 0;i < window.localStorage.length;i++) {
		var k = window.localStorage.key(i);
		if (! k.match(/^bup_match_/)) {
			continue;
		}

		var m = JSON.parse(window.localStorage.getItem(k));
		res.push(m);
	}
	return res;
}

function remove(match_id) {
	window.localStorage.removeItem('bup_match_' + match_id);
}

function ui_init() {
	var matches = load();
	matches = matches.filter(function(m) {
		return (!state.metadata || m.metadata.id != state.metadata.id);
	});
	$('.setup_loadmatch_none').toggle(matches.length === 0);
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
		a.text(pronounciation.match_str(m.setup) + ', ' + utils.datetime_str(m.metadata.updated));
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
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var control = require('./control');

	module.exports = match_storage;
}
/*/@DEV*/
