'use strict';

var ajax = (function() {

/**
* options can contain (* = mandatory):
* - method: The HTTP method (GET by default)
* - url*:   The URL to download
* sucess_cb gets called with the data on success.
* fail_cb gets called on error, with HTTP status, response text, and the XMLHTTPRequest object.
*/
function req(options, success_cb, fail_cb) {
	var r = new XMLHttpRequest();
	r.open(options.method || 'GET', options.url, true);
	r.onreadystatechange = function () {
		if (r.readyState != 4) {
			return;
		}
		if (r.status === 200) {
			success_cb(r.responseText);
		} else {
			fail_cb(r.status, r.responseText, r);
		}
	};
	r.send();
}

return {
	req: req,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = ajax;
}
/*/@DEV*/
