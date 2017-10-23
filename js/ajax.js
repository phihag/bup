'use strict';

var ajax = (function() {

/**
* options can contain (* = mandatory):
* - method:       HTTP request method (GET by default)
* - responseType: The XHR response type, see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType
* - url*:         URL to download
* - data:         The string to send.
* - contentType:  The MIME response type
* sucess_cb gets called with the data on success.
* fail_cb gets called on error, with HTTP status, response text, and the XMLHTTPRequest object.
*/
function req(options, success_cb, fail_cb) {
	var xhr = new XMLHttpRequest();
	var method = options.method || (options.data ? 'POST' : 'GET');
	xhr.open(method, options.url, true);
	xhr.responseType = options.responseType || '';
	var contentType = options.contentType || (options.data && 'application/x-www-form-urlencoded');
	if (contentType) {
		xhr.setRequestHeader('Content-Type', contentType);
	}
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
	xhr.send(options.data);
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
