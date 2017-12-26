'use strict';

var ajax = (function() {

/**
* options can contain (* = mandatory):
* - method:       HTTP request method (GET by default)
* - responseType: The XHR response type, see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType
* - url*:         URL to download
* - data:         The string to send.
* - contentType:  The MIME type of the request data
* - timeout:      Number of ms until the request is aborted.
* - success:      Function which gets called with the data and XMLHTTPRequest object on success.
* - error:        Function which gets called on error, with HTTP status, response text, and the XMLHTTPRequest object.
*/
function req(options) {
	var xhr = new XMLHttpRequest();
	var method = options.method || (options.data ? 'POST' : 'GET');
	xhr.open(method, options.url, true);
	if (options.timeout) xhr.timeout = options.timeout;
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
			if (options.success) {
				options.success(xhr.response, xhr);
			}
		} else {
			if (options.error) {
				options.error(xhr.status, xhr.response, xhr);
			}
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
