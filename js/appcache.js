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

	utils.on_click_qsa('.appcache_update_button', update_now);
	utils.on_click_qs('.appcache_later_button', function() {
		utils.visible_qs('.appcache_update_ingame', false);
	});

	window.applicationCache.addEventListener('updateready', function() {
		if (window.applicationCache.status != window.applicationCache.UPDATEREADY) {
			return;
		}
		if (Date.now() - bup_start_time <= AUTOUPDATE_WITHIN) {
			$('.appcache_updating_wrapper').show();
			update_now();
			return;
		}

		$('.appcache_update').show();
		$('.appcache_update_ingame').show();
	}, false);
}

function on_post_update(new_version) {
	$('.appcache_updated_version').text(new_version);
	$('.appcache_updated_wrapper').show().fadeOut(2500);

	var hash = window.location.hash;
	hash = hash.replace(/([&#])updated(?=&|$)/g, function(_, g1) {
		return (g1 == '#') ? g1 : '';
	});
	window.location.replace(hash);
}

return {
	ui_init: ui_init,
	on_post_update: on_post_update,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var utils = require('./utils');

	module.exports = appcache;
}
/*/@DEV*/