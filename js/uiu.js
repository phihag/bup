// ui utils
var uiu = (function() {
'use strict';

var esc_stack = [];
function esc_stack_push(cancel) {
	esc_stack.push(cancel);
	Mousetrap.bind('escape', function() {
		cancel();
	});
}

function esc_stack_pop() {
	esc_stack.pop();
	Mousetrap.unbind('escape');
	var cancel = esc_stack[esc_stack.length - 1];
	if (esc_stack.length > 0) {
		Mousetrap.bind('escape', function() {
			cancel();
		});
	}
}

function make_pick(label, values, on_pick, on_cancel, container) {
	if (! container) {
		container = $('.bottom-ui');
	}

	var kill_dialog = function() {
		uiu.esc_stack_pop();
		dlg_wrapper.remove();
	};
	var cancel = function() {
		if (! on_cancel) {
			return;  // No cancelling allowed
		}
		kill_dialog();
		on_cancel();
	};
	uiu.esc_stack_push(cancel);

	var dlg_wrapper = $('<div class="modal-wrapper">');
	dlg_wrapper.on('click', function(e) {
		if (e.target == dlg_wrapper[0]) {
			cancel();
		}
	});
	var dlg = $('<div class="pick_dialog">');
	dlg.appendTo(dlg_wrapper);

	var label_span = $('<span>');
	label_span.text(label);
	label_span.appendTo(dlg);

	values.forEach(function(v) {
		var btn = $('<button>');
		btn.text(v.label);
		btn.on('click', function() {
			kill_dialog();
			on_pick(v);
		});
		dlg.append(btn);
	});

	if (on_cancel) {
		var cancel_btn = $('<button class="cancel-button">Abbrechen</button>');
		cancel_btn.on('click', cancel);
		cancel_btn.appendTo(dlg);
	}

	container.append(dlg_wrapper);
}

function make_team_pick(s, label, type, on_cancel, modify_button) {
	var kill_dialog = function() {
		uiu.esc_stack_pop();
		dlg_wrapper.remove();
	};
	var cancel = function() {
		kill_dialog();
		on_cancel();
	};

	uiu.esc_stack_push(cancel);
	var dlg_wrapper = $('<div class="modal-wrapper">');
	dlg_wrapper.on('click', function(e) {
		if (e.target == dlg_wrapper[0]) {
			cancel();
		}
	});
	var dlg = $('<div class="pick_dialog">');
	dlg.appendTo(dlg_wrapper);

	var label_span = $('<span>');
	label_span.text(label);
	label_span.appendTo(dlg);

	var team_indices = [0, 1];
	team_indices.forEach(function(ti) {
		var btn = add_player_pick(s, dlg, type, ti, null, kill_dialog, function() {
			return pronounciation.teamtext_internal(s, ti);
		});
		if (modify_button) {
			modify_button(btn, ti);
		}
	});

	var cancel_btn = $('<button class="cancel-button">Abbrechen</button>');
	cancel_btn.on('click', cancel);
	cancel_btn.appendTo(dlg);

	$('.bottom-ui').append(dlg_wrapper);
}


function make_player_pick(s, label, type, on_cancel, modify_button) {
	var kill_dialog = function() {
		uiu.esc_stack_pop();
		dlg_wrapper.remove();
	};
	var cancel = function() {
		kill_dialog();
		on_cancel();
	};

	uiu.esc_stack_push(cancel);
	var dlg_wrapper = $('<div class="modal-wrapper">');
	dlg_wrapper.on('click', function(e) {
		if (e.target == dlg_wrapper[0]) {
			cancel();
		}
	});
	var dlg = $('<div class="pick_dialog">');
	dlg.appendTo(dlg_wrapper);

	var label_span = $('<span>');
	label_span.text(label);
	label_span.appendTo(dlg);

	var team_indices = [0, 1];
	team_indices.forEach(function(ti) {
		var btn = add_player_pick(s, dlg, type, ti, 0, kill_dialog);
		if (modify_button) {
			modify_button(btn, ti, 0);
		}
		if (s.setup.is_doubles) {
			btn = add_player_pick(s, dlg, type, ti, 1, kill_dialog);
			if (modify_button) {
				modify_button(btn, ti, 1);
			}
		}
	});

	var cancel_btn = $('<button class="cancel-button">Abbrechen</button>');
	cancel_btn.on('click', cancel);
	cancel_btn.appendTo(dlg);

	$('.bottom-ui').append(dlg_wrapper);
}

function add_player_pick(s, container, type, team_id, player_id, on_click, namefunc) {
	if (! namefunc) {
		namefunc = function(player) {
			return player.name;
		};
	}

	var player = s.setup.teams[team_id].players[player_id];
	var btn = $('<button>');
	btn.text(namefunc(player));
	btn.on('click', function() {
		var press = {
			type: type,
			team_id: team_id,
		};
		if (player_id !== null) {
			press.player_id = player_id;
		}
		if (on_click) {
			on_click(press);
		}
		control.on_press(press);
	});
	container.append(btn);
	return btn;
}

function show_picker(obj) {
	obj.show();
	var first_button = obj.find('button:first');
	first_button.addClass('auto-focused');
	var kill_special_treatment = function() {
		first_button.removeClass('auto-focused');
		first_button.off('blur', kill_special_treatment);
	};
	first_button.on('blur', kill_special_treatment);
}

return {
	esc_stack_push: esc_stack_push,
	esc_stack_pop: esc_stack_pop,
	add_player_pick: add_player_pick,
	make_pick: make_pick,
	make_team_pick: make_team_pick,
	make_player_pick: make_player_pick,
	show_picker: show_picker,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var control = require('./control');

	module.exports = uiu;
}
/*/@DEV*/
