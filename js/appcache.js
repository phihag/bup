var appcache = (function() {
'use strict';

var AUTOUPDATE_WITHIN = 1000;
var bup_start_time = Date.now();

function update_now() {
	var hash = window.location.hash;
	hash = hash.replace(/[#&]updated/g, '');
	hash += hash ? '&' : '#';
	hash += 'updated';
	window.location.replace(hash);
	window.location.reload();
}

function ui_init() {
	if (! window.applicationCache) {
		return;
	}

	click.qsa('.appcache_update_button', update_now);
	click.qs('.appcache_later_button', function() {
		uiu.visible_qs('.appcache_update_ingame', false);
	});

	window.applicationCache.addEventListener('updateready', function() {
		if (window.applicationCache.status != window.applicationCache.UPDATEREADY) {
			return;
		}
		if (Date.now() - bup_start_time <= AUTOUPDATE_WITHIN) {
			uiu.visible_qs('.appcache_updating_wrapper', true);
			update_now();
			return;
		}

		uiu.visible_qs('.appcache_update', true);
		uiu.visible_qs('.appcache_update_ingame', true);
	}, false);
}

function on_post_update(new_version) {
	uiu.text_qs('.appcache_updated_version', new_version);
	var updated_wrapper = uiu.qs('.appcache_updated_wrapper');
	uiu.visible(updated_wrapper, true);
	$(updated_wrapper).fadeOut(2500);

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