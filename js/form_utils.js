'use strict';

var form_utils = (function() {

function onsubmit(form, cb) {
	form.addEventListener('submit', function(e) {
		e.preventDefault();

		var data = {};
		utils.forEach(e.target.elements, function(el) {
			if (!el.name) {
				return;
			}

			if (el.type === 'checkbox') {
				data[el.name] = el.checked;
			} else if (el.value) {
				data[el.name] = el.value;
			}
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

	var utils = require('./utils');
}
/*/@DEV*/
