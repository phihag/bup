'use strict';
var fullscreen = (function() {

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
	var is_active = active();
	uiu.text_qs('.fullscreen_button',
		state._(is_active ? /*i18n-term:*/'settings:Leave Fullscreen' : 'settings:Go Fullscreen')
	);
	var all_active = ((window.innerHeight === screen.height) || is_active);
	var ask_setting = state.settings.fullscreen_ask;
	var show_button;
	if (ask_setting === 'always') {
		show_button = !all_active;
	} else if (ask_setting === 'never') {
		show_button = false;
	} else {
		// Automatic
		show_button = /mobi|android/i.test(navigator.userAgent) && !all_active;
	}
	try {
		uiu.visible_qs('.fullscreen_top', show_button);
	} catch (e) {
		report_problem.silent_error('Cannot find .fullscreen_top');
	}
}

function ui_init() {
	['webkitfullscreenchange', 'mozfullscreenchange', 'fullscreenchange', 'MSFullscreenChange'].forEach(function(event_name) {
		document.addEventListener(event_name, update_fullscreen_button);
	});
	window.addEventListener('resize', update_fullscreen_button);

	if (! supported()) {
		var fullscreen_line = uiu.qs('.fullscreen_line');
		fullscreen_line.setAttribute('data-bup-modes', '');
		uiu.hide(fullscreen_line);
	}

	// Do not use click module: We need an actual click, not a touch here
	uiu.qs('.fullscreen_button').addEventListener('click', toggle);
	try {
		uiu.qs('.fullscreen_top_button').addEventListener('click', toggle);
	} catch (e) {
		report_problem.silent_error('Cannot find .fullscreen_top_button');
	}
}

function autostart() {
	if (!supported()) {
		return;
	}

	if (window.innerHeight === screen.height) {
		return; // Already in fullscreen, for instance from command line
	}

	var go_fullscreen_hide = function() {
		bupui.esc_stack_pop();
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
	bupui.esc_stack_push(go_fullscreen_hide);

	uiu.show_qs('#go_fullscreen_wrapper');
}


return {
	autostart: autostart,
	ui_init: ui_init,
	supported: supported,
	active: active,
	start: start,
	update_fullscreen_button: update_fullscreen_button,
	toggle: toggle,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var bupui = require('./bupui');
	var click = require('./click');
	var report_problem = require('./report_problem');
	var uiu = require('./uiu');

	module.exports = fullscreen;
}
/*/@DEV*/
