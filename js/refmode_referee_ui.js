'use strict';

var refmode_referee_ui = (function() {
var rc;

function on_status_change() {
	uiu.text_qs('.refmode_referee_status', rc.status_str(state));
}

function _client_id(event) {
	return parseInt(uiu.closest_class(event.target, 'referee_c').getAttribute('data-client-id'));
}

function on_refresh_button_click(e) {
	rc.refresh(_client_id(e));
}

function on_espouse_btn_click(e) {
	var c = rc.client_by_conn_id(_client_id(e));
	if (!c) return;

	rc.espouse_event(c);
}

function on_client_match_link_click(e) {
	var c = rc.client_by_conn_id(_client_id(e));
	if (!c) return;

	uiu.visible_qs('.referee_layout', false);
	uiu.visible_qs('#game', true);
	settings.hide_refereemode();
	control.start_match(state, c.setup, c.presses);
}

function on_subscribe_checkbox_click(e) {
	var c = rc.client_by_conn_id(_client_id(e));
	c.subscribed = e.target.checked;
	rc.refresh(c.id);
}

function back_to_ui() {
	settings.hide(true);
	uiu.visible_qs('.referee_layout', true);
	uiu.visible_qs('#game', false);
	settings.show_refereemode();
}

function make_editable(el, cb) {
	var edit = function() {
		var destroy = function() {
			uiu.remove(form);
			uiu.visible(el, true);
		};

		var cur_val = el.firstChild.textContent;
		var form = uiu.create_el(null, 'form', {
			'class': 'referee_editform',
		});
		var input = uiu.create_el(form, 'input', {
			type: 'text',
			value: cur_val,
			style: 'min-width: ' + el.offsetWidth + 'px',
		});
		uiu.create_el(form, 'button', {
			role: 'submit',
		}, state._('refmode:referee:set'));
		var cancel_button = uiu.create_el(form, 'button', {
			role: 'button',
		}, state._('refmode:referee:cancel'));
		input.addEventListener('keyup', function(e) {
			if (e.keyCode === 27) { // Esc
				destroy();
			}
		});
		click.on(cancel_button, destroy);
		form.addEventListener('submit', function(e) {
			e.preventDefault();
			var new_value = input.value;
			uiu.text(el, new_value);
			destroy(new_value);
			cb(new_value);
		});
		el.parentNode.insertBefore(form, el.nextSibling);

		uiu.visible(el, false);
		if (edit_btn) {
			uiu.visible(edit_btn, false);
		}
		input.setSelectionRange(0, cur_val.length);
		input.focus();
	};

	click.on(el, edit);
	var edit_btn;
	if (el.firstChild.textContent.length < 2) {
		edit_btn = uiu.create_el(null, 'button', {
			role: 'button',
		}, state._('refmode:referee:edit'));
		click.on(edit_btn, edit);
		el.parentNode.insertBefore(edit_btn, el.nextSibling);
	}
}

function render_clients(clients) {
	var s = state;
	var ev = state.event;

	var container = uiu.qs('.referee_clients');
	uiu.empty(container);

	clients.forEach(function(c) {
		var div = uiu.create_el(container, 'div', {
			'data-client-id': c.id,
			'class': 'referee_c',
		});
		var toprow = uiu.create_el(div, 'div', {
			'class': 'referee_c_toprow',
		});
		var title = uiu.create_el(toprow, 'span', {
			'class': 'referee_c_title',
		}, c.title);
		make_editable(title, function(node_name) {
			rc.update_settings(c.id, {
				refmode_client_node_name: node_name,
			});
		});
		var buttons = uiu.create_el(toprow, 'div', {
			'class': 'referee_c_buttons',
		});

		var subscribe_label = uiu.create_el(buttons, 'label', {}, s._('refmode:referee:subscribe'));
		var subscribe_checkbox = uiu.create_el(subscribe_label, 'input', {
			type: 'checkbox',
			'class': 'referee_c_subscribe',
		});
		if (c.subscribed) {
			subscribe_checkbox.setAttribute('checked', 'checked');
		}
		subscribe_checkbox.addEventListener('change', on_subscribe_checkbox_click);

		var refresh_button = uiu.create_el(buttons, 'button', {
			title: (c.last_update ? utils.timesecs_str(c.last_update) : ''),
		}, s._('refmode:referee:refresh'));
		click.on(refresh_button, on_refresh_button_click);

		var bat = c.battery;
		var bat_text = (bat ? (
			bat.charging ? s._('refmode:referee:battery:charging', {
				duration: (bat.chargingTime ? (', ' + utils.duration_hours(0, bat.chargingTime * 1000)) : ''),
				percent: (bat.level * 100),
			})
			:
			s._('refmode:referee:battery:discharging', {
				duration: (bat.dischargingTime ? (', ' + utils.duration_hours(0, bat.dischargingTime * 1000)) : ''),
				percent: (bat.level * 100),
			})
		) : s._('refmode:referee:battery:na'));
		uiu.create_el(div, 'div', {}, s._('refmode:referee:battery') + bat_text);

		var umpire_row = uiu.create_el(div, 'div', {}, s._('refmode:referee:umpire_name'));
		var umpire_name = uiu.create_el(umpire_row, 'span', {}, (c.settings ? c.settings.umpire_name : '-'));
		make_editable(umpire_name, function(new_name) {
			rc.update_settings(c.id, {
				umpire_name: new_name,
			});
		});

		var court_row = uiu.create_el(div, 'div', {}, s._('refmode:referee:court'));
		uiu.create_el(
			court_row, 'span', {},
			(c.settings ? c.settings.court_id : '') +
			((c.settings && c.settings.court_description) ? (' (' + c.settings.court_description + ')') : ''));

		var match_row = uiu.create_el(div, 'div', {}, s._('refmode:referee:match'));
		if (c.setup) {
			var match_link = uiu.create_el(match_row, 'span', {
				'class': 'js_link',
			}, c.setup.match_name);
			click.on(match_link, on_client_match_link_click);
		}

		if (c.event && (!s.event || (c.event.id !== s.event.id))) {
			var diff_ev = uiu.create_el(div, 'div', {}, s._('refmode:referee:different_event', {
				event_name: c.event.event_name,
			}));
			var espouse_btn = uiu.create_el(diff_ev, 'button', {
				'class': 'referee_espouse_event',
			}, s._('refmode:referee:espouse event'));
			click.on(espouse_btn, on_espouse_btn_click);
		}
	});

	if (clients.length === 0) {
		uiu.text(container, s._('refmode:referee:paired:none'));
	}
}

function render_event(s) {
	var ev = s.event;
	var matches_container = uiu.qs('.referee_matches');
	uiu.empty(matches_container);

	if (!ev) {
		uiu.text_qs('.referee_event_title', s._('refmode:referee:no event'));
		uiu.text(matches_container, s._('refmode:referee:no matches'));
		return;
	}

	uiu.text_qs('.referee_event_title', ev.event_name);
}

function on_settings_change(s) {
	if (rc) {
		rc.on_settings_change(s);
	}
}

function show() {
	if (state.ui.referee_mode) {
		return;
	}

	delete state.event;

	if (!rc) {
		rc = refmode_referee(on_status_change, render_clients, key_storage);
		rc.on_settings_change(state);
	}

	state.ui.referee_mode = true;
	refmode_client_ui.on_settings_change(state);
	render.hide();
	displaymode.hide();
	settings.show_refereemode();
	settings.on_mode_change(state);
	control.set_current(state);

	uiu.addClass_qs('.settings_layout', 'settings_layout_refereemode');
	uiu.visible_qs('.referee_layout', true);
	render_clients([]);
	render_event(state);
}

function hide() {
	if (! state.ui.referee_mode) {
		return;
	}
	state.ui.referee_mode = false;
	refmode_client_ui.on_settings_change(state);
	uiu.removeClass_qs('.settings_layout', 'settings_layout_refereemode');
	uiu.visible_qs('.referee_layout', false);
	settings.on_mode_change(state);
	// TODO disconnect?
	rc = null;
}

function ui_init() {
	click.qs('.settings_mode_referee', function(e) {
		e.preventDefault();
		show();
	});
	click.qs('.refmode_referee_from_settings', function() {
		back_to_ui();
	});
}

return {
	show: show,
	hide: hide,
	ui_init: ui_init,
	on_settings_change: on_settings_change,
	back_to_ui: back_to_ui,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var control = require('./control');
	var click = require('./click');
	var displaymode = require('./displaymode');
	var key_storage = require('./key_storage');
	var refmode_client_ui = require('./refmode_client_ui');
	var refmode_referee = require('./refmode_referee');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = refmode_referee_ui;
}
/*/@DEV*/
