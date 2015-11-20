var fullscreen = (function() {
'use strict';

function supported() {
	return (
		document.fullscreenEnabled ||
		document.webkitFullscreenEnabled ||
		document.mozFullScreenEnabled ||
		document.msFullscreenEnabled
	);
}

function active() {
	return (
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

function ui_init() {
	$(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function() {
		$('.fullscreen_button').text(
			state._(active() ? 'settings:Leave Fullscreen' : 'settings:Go Fullscreen')
		);
	});

	if (! supported()) {
		$('.fullscreen_button').attr({
			disabled: 'disabled',
			title: state._('fullscreen:unsupported'),
		});
	}
	$('.fullscreen_button').on('click', function() {
		toggle();
	});
}

function autostart() {
	if (!supported()) {
		return;
	}
	var go_fullscreen_hide = function() {
		uiu.esc_stack_pop();
		$('#go_fullscreen_wrapper').hide();
	};

	$('.go_fullscreen_normal').on('click', function(e) {
		e.preventDefault();
		go_fullscreen_hide();
		return false;
	});
	$('.go_fullscreen_go').on('click', function(e) {
		e.preventDefault();
		go_fullscreen_hide();
		start();
		return false;
	});
	uiu.esc_stack_push(go_fullscreen_hide);
	$('#go_fullscreen_wrapper').on('click', go_fullscreen_hide);
	$('#go_fullscreen_wrapper').show();
}


return {
	autostart: autostart,
	ui_init: ui_init,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var uiu = require('./uiu');

	module.exports = fullscreen;
}
/*/@DEV*/
