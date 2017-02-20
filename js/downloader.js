'use strict';
// Download and cache files
var downloader = function(urls) {
	var files = {};

	// Load a file. callback is optional (can be left out to precache the file)
	function load(key, callback) {
		if (key in files) {
			return callback(files[key]);
		}

		var url = urls[key];
		if (!url) {
			throw new Error('Unregistered key ' + JSON.stringify(key));
		}
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = 'text';

		xhr.onload = function() {
			files[key] = this.response;
			if (callback) {
				callback(files[key]);
			}
		};
		xhr.send();
	}

return {
	load: load,
};

};


/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = downloader;
}
/*/@DEV*/
