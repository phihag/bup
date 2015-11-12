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

	$('.appcache_update_button').on('click', update_now);
	$('.appcache_later_button').on('click', function() {
		$('.appcache_update_ingame').hide();
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
	hash = hash.replace(/[#&]updated/g, '');
	window.location.replace(hash ? hash : '#');
}

return {
	ui_init: ui_init,
	on_post_update: on_post_update,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = appcache;
}
/*/@DEV*/