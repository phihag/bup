var appcache = (function() {
'use strict';

function ui_init() {
	if (! window.applicationCache) {
		return;
	}

	$('.appcache_update_button').on('click', function() {
		window.location.reload();
	});

	window.applicationCache.addEventListener('updateready', function(e) {
		if (window.applicationCache.status != window.applicationCache.UPDATEREADY) {
			return;
		}

		$('.appcache_update').show();
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