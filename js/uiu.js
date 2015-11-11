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

// Returns a function to cancel the dialog
function make_pick(s, label, values, on_pick, on_cancel, container) {
	if (! container) {
		container = $('.bottom-ui');
	}

	var kill_dialog = function() {
		uiu.esc_stack_pop();
		dlg_wrapper.remove();
	};
	if (s) {
		control.install_destructor(s, kill_dialog);
	}
	var cancel = function() {
		if (! on_cancel) {
			return;  // No cancelling allowed
		}
		if (s) {
			control.uninstall_destructor(s, kill_dialog);
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
		if (v.modify_button) {
			v.modify_button(btn, v);
		}
		dlg.append(btn);
	});

	if (on_cancel) {
		var cancel_btn = $('<button class="cancel-button">Abbrechen</button>');
		cancel_btn.on('click', cancel);
		cancel_btn.appendTo(dlg);
	}

	container.append(dlg_wrapper);

	return kill_dialog;
}

function make_team_pick(s, label, press_type, on_cancel, modify_button) {
	var values = [0, 1].map(function(ti) {
		return {
			label: pronounciation.teamtext_internal(s, ti),
			modify_button: modify_button,
			team_id: ti,
		};
	});

	make_pick(s, label, values, function(v) {
		control.on_press({
			type: press_type,
			team_id: v.team_id,
		});
	}, on_cancel);
}


function make_player_pick(s, label, press_type, on_cancel, modify_button) {
	var values = [];
	[0, 1].forEach(function(team_id) {
		var player_ids = s.setup.is_doubles ? [0, 1] : [0];
		player_ids.forEach(function(player_id) {
			values.push({
				label: s.setup.teams[team_id].players[player_id].name,
				modify_button: modify_button,
				team_id: team_id,
				player_id: player_id,
			});
		});
	});

	make_pick(s, label, values, function(v) {
		control.on_press({
			type: press_type,
			team_id: v.team_id,
			player_id: v.player_id,
		});
	}, on_cancel);
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

// TODO remove this function in favor of using one of the pick_* functions in the first place
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
