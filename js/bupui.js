'use strict';
var bupui = (function() {

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

/*@DEV*/
function esc_stack_length() {
	return esc_stack.length;
}
/*/@DEV*/

// Returns a function to cancel the dialog
function make_pick(s, label, values, on_pick, on_cancel, container, select_at) {
	if (! container) {
		container = uiu.qs('.bottom-ui');
	}

	var kill_dialog = function() {
		if (s) {
			control.uninstall_destructor(s, kill_dialog);
		}

		esc_stack_pop();
		uiu.remove(dlg_wrapper);
	};
	if (s && on_cancel) {
		control.install_destructor(s, kill_dialog);
	}
	var cancel = function() {
		if (! on_cancel) {
			return;  // No cancelling allowed
		}
		kill_dialog();
		on_cancel();
	};
	esc_stack_push(cancel);

	var dlg_wrapper = uiu.el(null, 'div', 'modal-wrapper');
	dlg_wrapper.addEventListener('click', function(e) {
		if (e.target == dlg_wrapper) {
			cancel();
		}
	});
	var dlg = uiu.el(dlg_wrapper, 'div', 'pick_dialog');
	uiu.el(dlg, 'span', {}, label);

	if ((select_at !== undefined) && (values.length >= select_at)) {
		var select = uiu.el(dlg, 'select', {
			size: 1,
			'class': 'bupui_select',
		});
		values.forEach(function(v) {
			uiu.el(select, 'option', {
				value: JSON.stringify(v),
			}, v.label);
		});

		var select_btn = uiu.el(dlg, 'button', {}, state._('select pick'));
		click.on(select_btn, function() {
			var v = JSON.parse(select.value);
			kill_dialog();
			on_pick(v);
		});
	} else {
		values.forEach(function(v) {
			var btn = uiu.el(dlg, 'button', {}, v.label);
			click.on(btn, function() {
				kill_dialog();
				on_pick(v);
			});
			if (v.modify_button) {
				v.modify_button(btn, v);
			}
		});
	}

	if (on_cancel) {
		var cancel_btn = uiu.el(dlg, 'button', 'cancel-button', s._('button:Cancel'));
		click.on(cancel_btn, cancel);
	}

	container.appendChild(dlg_wrapper);

	return kill_dialog;
}

function make_team_pick(s, label, press_type, on_cancel, modify_button) {
	var values = [0, 1].map(function(ti) {
		return {
			label: pronunciation.teamtext_internal(s, ti),
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

function show_picker($obj) {
	$obj.show();
	var $first_button = $obj.find('button:first');
	$first_button.addClass('auto-focused');
	var kill_special_treatment = function() {
		$first_button.removeClass('auto-focused');
		$first_button.off('blur', kill_special_treatment);
	};
	$first_button.on('blur', kill_special_treatment);
}

// TODO remove this function in favor of using one of the pick_* functions in the first place
function add_player_pick(s, container, type, team_id, player_id, on_click, namefunc) {
	if (! namefunc) {
		namefunc = function(player) {
			return player.name;
		};
	}

	var player = s.setup.teams[team_id].players[player_id];
	var btn = uiu.el(container, 'button', 'blocking_button', namefunc(player));
	click.on(btn, function() {
		control.block_buttons();
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
}

// init_cb gets called with:
//   s - the state (passed through)
//   page - the page container (where the page should be rendered in)
// Returns the hiding function
function make_page(s, page_name, init_cb, hide_cb) {
	function hide() {
		s.ui[page_name] = false;
		uiu.remove(container);

		if (s.ui.referee_mode) {
			refmode_referee_ui.back_to_ui();
		} else {
			settings.show();
			control.set_current(s);
		}

		hide_cb();
	}

	s.ui[page_name] = true;
	if (s.ui.referee_mode) {
		refmode_referee_ui.hide_tmp();
	} else {
		render.hide();
		settings.hide(true, true);
	}
	bupui.esc_stack_push(hide);

	control.set_current(s);

	var body = uiu.qs('body');
	var container = uiu.el(body, 'div');
	var page = uiu.el(container, 'div', {
		style: (
			'position:relative;' +
			'background:white;' +
			'font-size:3vmin;' +
			'min-height:10vh;' +
			'padding:1vmin 1vmin 6vmin 2vmin;' + 
			'border-bottom-left-radius:3vmin;border-bottom-right-radius:3vmin;'
		),
	});
	var back_link = uiu.el(page, 'a', {
		style: (
			'position:absolute;bottom:2vmin;left:2vmin;'
		),
		href: '#',
	}, s._('back'));
	click.on(back_link, hide);

	if (s.event && s.event.matches) {
		init_cb(s, page);
	} else {
		var loading = uiu.el(page, 'div', 'loading-icon');
		network.list_matches(s, function(err, ev) {
			uiu.remove(loading);
			if (err) {
				uiu.el(page, 'div', 'network_error', err.msg);
				return;
			}
			network.update_event(s, ev);
			init_cb(s, page);
		});
	}

	return hide;
}

return {
	add_player_pick: add_player_pick,
	esc_stack_pop: esc_stack_pop,
	esc_stack_push: esc_stack_push,
	make_page: make_page,
	make_pick: make_pick,
	make_player_pick: make_player_pick,
	make_team_pick: make_team_pick,
	show_picker: show_picker,
	// Tests only
	/*@DEV*/
	esc_stack_length: esc_stack_length,
	/*/@DEV*/
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var control = require('./control');
	var network = require('./network');
	var pronunciation = require('./pronunciation');
	var refmode_referee_ui = require('./refmode_referee_ui');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');

	module.exports = bupui;
}
/*/@DEV*/
