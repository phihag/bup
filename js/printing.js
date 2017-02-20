'use strict';
var printing = (function() {

// orientation is either landscape or portrait
function set_orientation(orientation) {
	uiu.text_qs(
		'#printing_orientation',
		'@page {size: ' + orientation + ';size: ' + orientation + ' A4;margin: 0;}'
	);
}

return {
	set_orientation: set_orientation,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var uiu = require('./uiu');

	module.exports = printing;
}
/*/@DEV*/