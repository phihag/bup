var appcache = (function() {
'use strict';

function ui_init() {
	if (! window.applicationCache) {
		return;
	}

	$('.appcache_update_button').on('click', function() {
		var hash = window.location.hash;
		hash = hash.replace(/[#&]updated/g, '');
		hash += hash ? '&' : '#';
		hash += 'updated';
		window.location.replace(hash);
		window.location.reload();
	});
	$('.appcache_later_button').on('click', function() {
		$('.appcache_update_ingame').hide();
	});

	window.applicationCache.addEventListener('updateready', function() {
		if (window.applicationCache.status != window.applicationCache.UPDATEREADY) {
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