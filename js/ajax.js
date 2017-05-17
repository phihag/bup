'use strict';

var ajax = (function() {

function req(options, success_cb, fail_cb) {
	var r = new XMLHttpRequest();
	r.open(options.method, options.url, true);
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
