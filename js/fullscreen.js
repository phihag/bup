var fullscreen = (function() {
'use strict';

function supported() {
	return !!(
		document.fullscreenEnabled ||
		document.webkitFullscreenEnabled ||
		document.mozFullScreenEnabled ||
		document.msFullscreenEnabled
	);
}

function active() {
	return !!(
		document.fullscreenElement ||
		document.webkitFullscreenElement ||
		document.mozFullScreenElement ||
		document.msFullscreenElement
	);
}

function start() {
	var doc = document.documentElement;
	if (doc.requestFullscreen) {
		doc.requestFullscreen();
	} else if (doc.webkitRequestFullscreen) {
		doc.webkitRequestFullscreen(doc.ALLOW_KEYBOARD_INPUT);
	} else if (doc.mozRequestFullScreen) {
		doc.mozRequestFullScreen();
	} else if (doc.msRequestFullscreen) {
		doc.msRequestFullscreen();
	}
}

function stop() {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	} else if (document.msExitFullscreen) {
		document.msExitFullscreen();
	}
}

function toggle() {
	if (! supported()) {
		return;
	}
	if (active()) {
		stop();
	} else {
		start();
	}
}

function update_fullscreen_button() {
	uiu.text_qs('.fullscreen_button',
		state._(active() ? 'settings:Leave Fullscreen' : 'settings:Go Fullscreen')
	);
}

function ui_init() {
	['webkitfullscreenchange', 'mozfullscreenchange', 'fullscreenchange', 'MSFullscreenChange'].forEach(function(event_name) {
		document.addEventListener(event_name, update_fullscreen_button);
	});

	if (! supported()) {
		var fullscreen_line = uiu.qs('.fullscreen_line');
		fullscreen_line.setAttribute('data-bup-modes', '');
		uiu.hide(fullscreen_line);
	}

	// Do not use click module: We need an actual click, not a touch here
	uiu.qs('.fullscreen_button').addEventListener('click', toggle);
}

function autostart() {
	if (!supported()) {
		return;
	}
	var go_fullscreen_hide = function() {
		uiu.esc_stack_pop();
		uiu.hide_qs('#go_fullscreen_wrapper');
	};

	click.qs('.go_fullscreen_normal', function() {
		go_fullscreen_hide();
	});

	// Do not use the click module: We need an actual click event
	uiu.qs('.go_fullscreen_go').addEventListener('click', function() {
		toggle();
		go_fullscreen_hide();
	});
	uiu.esc_stack_push(go_fullscreen_hide);

	uiu.show_qs('#go_fullscreen_wrapper', true);
}


return {
	autostart: autostart,
	ui_init: ui_init,
	supported: supported,
	active: active,
	start: start,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var uiu = require('./uiu');

	module.exports = fullscreen;
}
/*/@DEV*/
