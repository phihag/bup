'use strict';
var timer = (function() {

var ui_timer = null;
function set() {
	uiu.visible_qs('.timer_restart', !state.timer.upwards);

	if (ui_timer) {
		window.clearTimeout(ui_timer);
	}

	if (update()) {
		uiu.show_qs('.timer_container');
	}
}

// Returns an object with keys
//  visible Is there an active timer? If true, the following are also set:
//  ms      number of ms remaining
//  str     String representation to show
//  exigent Boolean: should the timer be colored red?
//  upwards True if the timer is going up
//  next    Next tick (ms) or false if not necessary
function calc(s, now) {
	if (!s.timer || !s.timer.start) {
		return {visible: false};
	}

	if (!now) {
		now = Date.now();
	}
	if (s.timer.upwards) {
		var ms = now - s.timer.start;

		return {
			upwards: true,
			visible: true,
			ms: ms,
			str: utils.duration_secs(ms),
			exigent: false,
			next: 1000,
		};
	}

	var remaining = s.timer.start + s.timer.duration - now;
	if (!s.settings.negative_timers && (remaining <= 0)) {
		return {
			visible: false,
			str: '0',
		};
	}
	var next = (
		(remaining <= 0) ? // then s.settings.negative_timers
		1000 :
		Math.max(10, remaining % 1000)
	);

	var remaining_str;
	if (s.settings.negative_timers && (remaining < 0)) {
		remaining_str = '-' + utils.duration_secs(0, -remaining);
	} else {
		remaining = Math.max(0, remaining);
		remaining_str = Math.round(remaining / 1000);
		if (remaining_str >= 60) {
			remaining_str = Math.floor(remaining_str / 60) + ':' + utils.pad(remaining_str % 60);
		}
	}

	return {
		visible: true,
		ms: remaining,
		str: remaining_str,
		exigent: (s.timer.exigent && (remaining <= s.timer.exigent) && (remaining > 0)),
		next: next,
	};
}

function update() {
	var tv = calc(state);

	var timer_el = uiu.qs('.timer');
	if (tv.str) {
		uiu.text(timer_el, tv.str);
	}
	if (tv.visible) {
		uiu.setClass(timer_el, 'timer_exigent', tv.exigent);
		if (tv.next !== false) {
			ui_timer = window.setTimeout(update, tv.next);
		}
	} else {
		remove();
	}

	var state_id = (tv.visible ? (tv.exigent ? 'exigent' : 'running') : null);
	var old_state_id = state.timer_state;
	state.timer_state = state_id;
	if (old_state_id && (state_id !== old_state_id)) {
		render.ui_render(state); // Rerender because pronounciation may have changed
	}

	return tv.visible;
}

function remove(immediately) {
	if (ui_timer) {
		window.clearTimeout(ui_timer);
		ui_timer = null;
		var container = uiu.qs('.timer_container');
		if (immediately) {
			uiu.hide(container);
		} else {
			uiu.fadeout(container, 500);
		}
	}
}

function ui_init() {
	click.qs('.timer_restart', function() {
		control.on_press({
			type: 'timer_restart',
		});
	});
}

return {
	calc: calc,
	set: set,
	remove: remove,
	ui_init: ui_init,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var control = require('./control');
	var uiu = require('./uiu');
	var utils = require('./utils');
	var render = require('./render');

	module.exports = timer;
}
/*/@DEV*/
