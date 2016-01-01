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

	var timer_el = $('.timer');
	if (state.timer.upwards) {
		var val = utils.duration_secs(state.timer.start, Date.now());
		timer_el.text(val);
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
		timer_el.text(remaining_val);

		if (state.timer.exigent && (remaining <= state.timer.exigent)) {
			timer_el.addClass('timer_exigent');
		} else {
			timer_el.removeClass('timer_exigent');
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
	$('.timer_restart').click(function() {
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
	var control = require('./control');
	var utils = require('./utils');

	module.exports = timer;
}
/*/@DEV*/
