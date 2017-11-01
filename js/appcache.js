'use strict';
var appcache = (function() {

var AUTOUPDATE_WITHIN = 2000;
var bup_start_time = Date.now();

function update_now() {
	var hash = window.location.hash;
	hash = hash.replace(/[#&]updated/g, '');
	hash += hash ? '&' : '#';
	hash += 'updated';
	window.location.replace(hash);
	window.location.reload(true);
}

function ui_init() {
	if (! window.applicationCache) {
		return;
	}

	click.qsa('.appcache_update_button', update_now);
	click.qs('.appcache_later_button', function() {
		uiu.hide_qs('.appcache_update_ingame');
	});

	window.applicationCache.addEventListener('updateready', function() {
		if (window.applicationCache.status != window.applicationCache.UPDATEREADY) {
			return;
		}
		if (Date.now() - bup_start_time <= AUTOUPDATE_WITHIN) {
			uiu.show_qs('.appcache_updating_wrapper');
			update_now();
			return;
		}

		uiu.show_qs('.appcache_update');
		uiu.show_qs('.appcache_update_ingame');
	}, false);
}

function on_post_update(new_version) {
	uiu.text_qs('.appcache_updated_version', new_version);
	var updated_wrapper = uiu.qs('.appcache_updated_wrapper');
	uiu.show(updated_wrapper);
	uiu.fadeout(updated_wrapper, 2500);

	var hash = window.location.hash;
	hash = hash.replace(/([&#])updated(?=&|$)/g, function(_, g1) {
		return (g1 == '#') ? g1 : '';
	});
	window.location.replace(hash);
}

return {
	ui_init: ui_init,
	on_post_update: on_post_update,
	// Debugging only
	update_now: update_now,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var uiu = require('./uiu');

	module.exports = appcache;
}
/*/@DEV*/