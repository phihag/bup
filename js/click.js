'use strict';
var click = (function() {
var mode = calc_auto();

function on_click(node, callback) {
	uiu.addClass(node, 'click_button');

	node.addEventListener('touchstart', function(e) {
		if ((mode !== 'touchstart') && (mode !== 'touchend')) {
			return;
		}

		if (node.getAttribute('disabled')) {
			return;
		}

		uiu.addClass(node, 'click_active');
		if (mode === 'touchend') {
			return;
		}

		setTimeout(function() {
			uiu.removeClass(node, 'click_active');
		}, 250);

		callback(e);
	}, {
		passive: true,
	});
	node.addEventListener('touchend', function(e) {
		if (mode === 'touchstart') {
			e.preventDefault(); // Make sure click is not called
		}
		if (mode !== 'touchend') {
			return;
		}

		uiu.removeClass(node, 'click_active');
		e.preventDefault();
		callback(e);
	}, {
		passive: false,
	});
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

function update_mode(new_mode) {
	if (new_mode === 'auto') {
		new_mode = calc_auto();
	}
	if (new_mode === mode) {
		return;
	}
	mode = new_mode;
}

function get_mode() {
	return mode;
}

return {
	qs: on_click_qs,
	on: on_click,
	qsa: on_click_qsa,
	update_mode: update_mode,
	get_mode: get_mode,
};
})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var uiu = require('./uiu');

	module.exports = click;
}
/*/@DEV*/
