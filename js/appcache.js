var appcache = (function() {
'use strict';

function ui_init() {
	if (! window.applicationCache) {
		return;
	}

	$('.appcache_update_button').on('click', function() {
		window.location.reload();
		// TODO set &updated to allow for a notification
	});
	$('.appcache_later_button').on('click', function() {
		$('.appcache_update_ingame').hide();
	});

	window.applicationCache.addEventListener('updateready', function(e) {
		if (window.applicationCache.status != window.applicationCache.UPDATEREADY) {
			return;
		}

		$('.appcache_update').show();
		$('.appcache_update_ingame').show();
	}, false);
}

return {
	ui_init: ui_init,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = appcache;
}
/*/@DEV*/