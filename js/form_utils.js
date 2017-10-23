'use strict';

var form_utils = (function() {

function onsubmit(form, cb) {
	form.addEventListener('submit', function(e) {
		e.preventDefault();

		var fd = new FormData(form);
		var data = {};
		fd.keys().forEach(function(k) {
			data[k] = fd.get(k);
		});
		cb(data);
	});

}

return {
	onsubmit: onsubmit,
};

})();


/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = form_utils;
}
/*/@DEV*/
