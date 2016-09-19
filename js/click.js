'use strict';
var click = (function() {
var mode = 'auto';
var is_android = (typeof navigator != 'undefined') && (/[Aa]ndroid/.test(navigator.userAgent));

function on_click(node, callback) {
	uiu.addClass(node, 'click_button');

	if (is_android && false) {
		// On android devices, click will not be fired for a strong touch
		node.addEventListener('touchstart', function(e) {
			e.preventDefault();
			if (node.getAttribute('disabled')) {
				return;
			}
			callback(e);
		}, false);
	}
	node.addEventListener('click', function(e) {
		//console.log('click', node);
		e.preventDefault();
		callback(e);
	}, false);
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
};
})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var compat = require('./compat');
	var uiu = require('./uiu');

	module.exports = click;
}
/*/@DEV*/
