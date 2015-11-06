var timer = (function() {
'use strict';

var ui_timer = null;
function set() {
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

	var remaining = state.timer.start + state.timer.duration - Date.now();
	remaining = Math.max(0, remaining);
	var remaining_val = Math.round(remaining / 1000);
	if (remaining_val >= 60) {
		remaining_val = Math.floor(remaining_val / 60) + ':' + utils.add_zeroes(remaining_val % 60);
	}
	var timer_el = $('.timer');
	timer_el.text(remaining_val);
	if (state.timer.exigent && (remaining <= state.timer.exigent)) {
		timer_el.addClass('timer_exigent');
	} else {
		timer_el.removeClass('timer_exigent');
	}
	if (remaining <= 0) {
		remove();
		return;
	}

	var remaining_ms = Math.max(10, remaining % 1000);
	ui_timer = window.setTimeout(update, remaining_ms);
	return true;
}

function remove() {
	if (ui_timer) {
		window.clearTimeout(ui_timer);
		ui_timer = null;
		$('.timer_container').fadeOut(500);
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

	module.exports = timer;
}
/*/@DEV*/
