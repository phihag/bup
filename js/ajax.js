'use strict';

var ajax = (function() {

/**
* options can contain (* = mandatory):
* - method:       HTTP request method (GET by default)
* - responseType: The XHR response type, see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType
* - url*:         URL to download
* sucess_cb gets called with the data on success.
* fail_cb gets called on error, with HTTP status, response text, and the XMLHTTPRequest object.
*/
function req(options, success_cb, fail_cb) {
	var xhr = new XMLHttpRequest();
	xhr.open(options.method || 'GET', options.url, true);
	xhr.responseType = options.responseType || '';
	xhr.onreadystatechange = function () {
		if (xhr.readyState != 4) {
			return;
		}
		if (xhr.status === 200) {
			success_cb(xhr.response);
		} else {
			fail_cb(xhr.status, xhr.response, xhr);
		}
	};
	xhr.send();
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
