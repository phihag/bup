'use strict';

var form_utils = (function() {

function onsubmit(form, cb) {
	form.addEventListener('submit', function(e) {
		e.preventDefault();

		var fd = new FormData(form);
		var entries = Array.from(fd.entries());
		var data = {};
		entries.forEach(function(e) {
			data[e[0]] = e[1];
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
