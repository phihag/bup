function register_sworker() {
	'use strict';

	var ENABLE_WIP = false;
	if (! ENABLE_WIP) {
		return;
	}

	if (!window.navigator.serviceWorker) {
		return;
	}

	var url = 'cachesw.js';
	var scope;
	var m = window.location.pathname.match(/^(.*\/bup\/)(?:bup\.html|index\.html)?$/);
	if (m) {
		scope = m[1];
	}

	window.navigator.serviceWorker.register(url, {scope: scope}).then(function() {
		// TODO: Do we need to do anything upon registration?
	});
}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = register_sworker;
}
/*/@DEV*/