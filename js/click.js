'use strict';
var click = (function() {
var mode = calc_auto();

function on_click(node, callback) {
	uiu.addClass(node, 'click_button');

	node.addEventListener('touchstart', function(e) {
		if (mode !== 'touchstart_disabled') {
			return;
		}
		e.preventDefault();
		if (node.getAttribute('disabled')) {
			return;
		}
		callback(e);
	}, false);
	node.addEventListener('click', function(e) {
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

function calc_auto() {
	var is_android = (typeof navigator != 'undefined') && (/[Aa]ndroid/.test(navigator.userAgent));
	// On android devices, click will not be fired for a strong touch
	if (is_android) {
		return 'touchstart';
	}
	return 'click'; // very conservative for now
}

function on_mode_change(new_mode) {
	if (new_mode === 'auto') {
		new_mode = calc_auto();
	}
	if (new_mode === mode) {
		return;
	}
	mode = new_mode;
}

return {
	qs: on_click_qs,
	on: on_click,
	qsa: on_click_qsa,
	on_mode_change: on_mode_change,
};
})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var uiu = require('./uiu');

	module.exports = click;
}
/*/@DEV*/
