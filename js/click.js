'use strict';

var click = (function() {
function on_click(node, callback) {
	node.addEventListener('click', callback, false);
	uiu.addClass(node, 'click_button');
}

function on_click_qs(selector, callback) {
	on_click(uiu.qs(selector), callback);
}

function on_click_qsa(selector, callback) {
	uiu.qsEach(selector, function(node) {
		on_click(node, callback);
	});
}

return {
	qs: on_click_qs,
	on: on_click,
	qsa: on_click_qsa,
}
})();


/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var uiu = require('./uiu');

	module.exports = click;
}
/*/@DEV*/
