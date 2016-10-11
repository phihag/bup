var timer = (function() {
'use strict';

var ui_timer = null;
function set() {
	$('.timer_restart').toggle(! state.timer.upwards);

	if (ui_timer) {
		window.clearTimeout(ui_timer);
	}

	if (update()) {
		$('.timer_container').show();
	}
}

function update() {
	if (! state.timer) {
		remove();
		return;
	}

	if (!state.timer.start) {
		// For example after resuming a game
		remove();
		return;
	}

	var timer_el = uiu.qs('.timer');
	if (state.timer.upwards) {
		var val = utils.duration_secs(state.timer.start, Date.now());
		uiu.text(timer_el, val);
		uiu.removeClass(timer_el, 'timer_exigent');
		ui_timer = window.setTimeout(update, 1000);
	} else {
		var remaining = state.timer.start + state.timer.duration - Date.now();
		var remaining_val;
		if (state.settings.negative_timers && (remaining < 0)) {
			remaining_val = '-' + utils.duration_secs(0, -remaining);
		} else {
			remaining = Math.max(0, remaining);
			remaining_val = Math.round(remaining / 1000);
			if (remaining_val >= 60) {
				remaining_val = Math.floor(remaining_val / 60) + ':' + utils.add_zeroes(remaining_val % 60);
			}
		}
		uiu.text(timer_el, remaining_val);

		var new_timer_state = (remaining <= 0) ? undefined : 'running';
		if (state.timer.exigent && (remaining <= state.timer.exigent)) {
			uiu.addClass(timer_el, 'timer_exigent');
			if (new_timer_state === 'running') {
				new_timer_state = 'exigent';
			}
		} else {
			uiu.removeClass(timer_el, 'timer_exigent');
		}

		var old_timer_state = state.timer_state;
		state.timer_state = new_timer_state;
		if (old_timer_state && (new_timer_state !== old_timer_state)) {
			render.ui_render(state); // Rerender because pronounciation may have changed
		}

		if ((remaining <= 0) && (state.settings.negative_timers)) {
			ui_timer = window.setTimeout(update, 1000);
			return true;
		}

		if (remaining <= 0) {
			remove();
			return;
		}
		var remaining_ms = Math.max(10, remaining % 1000);
		ui_timer = window.setTimeout(update, remaining_ms);
	}
	return true;
}

function remove(immediately) {
	state.timer_state = undefined;
	if (ui_timer) {
		window.clearTimeout(ui_timer);
		ui_timer = null;
		var container = $('.timer_container');
		if (immediately) {
			container.hide();
		} else {
			container.fadeOut(500);
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
