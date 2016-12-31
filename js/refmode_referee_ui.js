'use strict';

var refmode_referee_ui = (function() {
var rr;

function _event_match(e) {
	var match_el = uiu.closest_class(e.target, 'referee_e_match');
	var match_id = match_el.getAttribute('data-match-id');
	var res = utils.find(state.event.matches, function(m) {
		return m.setup.match_id === match_id;
	});

	if (!res) {
		report_problem.silent_error('Could not find match ' + match_id + ' in ' + state.event.event_name);
		return;
	}
	return res;
}

function on_status_change(new_status) {
	if (!rr) {
		return;
	}

	uiu.text_qs('.refmode_referee_status', rr.status_str(state));
	if (new_status.status === 'enabled') {
		uiu.visible_qs('.refmode_referee_redir', !!new_status.local_addr);
		if (new_status.local_addr) {
			uiu.text_qs('.refmode_referee_redir_url', new_status.local_addr);
		}
	}
}

function _client_id(event) {
	return parseInt(uiu.closest_class(event.target, 'referee_c').getAttribute('data-client-id'));
}

function on_refresh_button_click(e) {
	rr.refresh(_client_id(e));
}

function on_espouse_btn_click(e) {
	var c = rr.client_by_conn_id(_client_id(e));
	if (!c) return;

	rr.espouse_event(c);
}

function on_client_match_link_click(e) {
	var c = rr.client_by_conn_id(_client_id(e));
	if (!c) return;

	hide_tmp();
	uiu.visible_qs('#game', true);
	control.start_match(state, c.setup, c.presses);
}

function on_event_match_link_click(e) {
	var m = _event_match(e);
	if (!m) return;

	hide_tmp();
	uiu.visible_qs('#game', true);
	control.start_match(state, m.setup, m.presses);
}

function on_event_match_scoresheet_click(e) {
	var m = _event_match(e);
	if (!m) return;

	hide_tmp();
	calc.init_state(state, m.setup, m.presses, false);
	calc.state(state);
	scoresheet.show();
}

function on_event_match_stats_click(e) {
	var m = _event_match(e);
	if (!m) return;

	hide_tmp();
	calc.init_state(state, m.setup, m.presses, false);
	calc.state(state);
	stats.show(state);
}

function on_client_match_change_submit(e) {
	e.preventDefault();

	var c = rr.client_by_conn_id(_client_id(e));
	if (!c) return;

	var container = uiu.closest_class(e.target, 'referee_c');
	var current_sel_match = container.querySelector('.referee_match_change_select').value;
	if (!current_sel_match) { // Nothing selected yet, ignore
		return;
	}

	rr.change_match(c.id, current_sel_match);
}

function on_client_court_change_submit(e) {
	e.preventDefault();

	var c = rr.client_by_conn_id(_client_id(e));
	if (!c) return;

	var container = uiu.closest_class(e.target, 'referee_c');
	var current_sel_court = container.querySelector('.referee_c_court_change_select').value;
	if (!current_sel_court) { // Nothing selected yet, ignore
		return;
	}

	if (c.mode === 'display') {
		rr.change_display_court(c.id, current_sel_court);
	} else {
		rr.change_court(c.id, current_sel_court);
	}
}

function on_client_dstyle_change_submit(e) {
	e.preventDefault();

	var c = rr.client_by_conn_id(_client_id(e));
	if (!c) return;

	var container = uiu.closest_class(e.target, 'referee_c');
	var new_style = container.querySelector('.referee_c_dstyle_change_select').value;
	rr.change_display_style(c.id, new_style);
}

function on_subscribe_checkbox_click(e) {
	var c = rr.client_by_conn_id(_client_id(e));
	c.subscribed = e.target.checked;
	rr.refresh(c.id);
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

function _all_courts(s, c) {
	var res = (s.event && s.event.courts) ? s.event.courts.slice() : [];
	if (c.mode !== 'display') {
		res.push({
			court_id: 'referee',
		});
	}
	return res;
}

function render_clients(clients) {
	var s = state;
	var ev = s.event;

	var kfp = rr ? rr.key_fp() : null;
	uiu.text_qs('.referee_key', kfp ? kfp : s._('refmode:referee:generating key'));

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
			rr.update_settings(c.id, {
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
				percent: Math.round(bat.level * 100),
			})
			:
			s._('refmode:referee:battery:discharging', {
				duration: (bat.dischargingTime ? (', ' + utils.duration_hours(0, bat.dischargingTime * 1000)) : ''),
				percent: Math.round(bat.level * 100),
			})
		) : s._('refmode:referee:battery:na'));
		uiu.create_el(div, 'div', {}, s._('refmode:referee:battery') + bat_text);

		if (c.mode === 'umpire') {
			var umpire_row = uiu.create_el(div, 'div', {}, s._('refmode:referee:umpire_name'));
			var umpire_name = uiu.create_el(umpire_row, 'span', {}, (c.settings ? c.settings.umpire_name : '-'));
			make_editable(umpire_name, function(new_name) {
				rr.update_settings(c.id, {
					umpire_name: new_name,
				});
			});
		}

		// Court
		var need_court = (
			(c.mode === 'umpire') ||
			((c.mode === 'display') &&
				displaymode.court_specific(c.settings.displaymode_style)
			));
		if (need_court) {
			var court_row = uiu.create_el(div, 'div', {
				class: 'referee_c_court_row',
			}, s._('refmode:referee:court'));
			var court_text = '';
			if (c.settings) {
				if (c.mode === 'display') {
					court_text = c.settings.displaymode_court_id;
				} else {
					court_text = c.settings.court_id + (c.settings.court_description ? (' (' + c.settings.court_description + ')') : '');
				}
			}
			uiu.create_el(court_row, 'span', {}, court_text);
			var court_change_form = uiu.create_el(court_row, 'form', {
				'class': 'referee_c_court_change_form',
			});
			court_change_form.addEventListener('submit', on_client_court_change_submit);
			var court_change_select = uiu.create_el(court_change_form, 'select', {
				'class': 'referee_c_court_change_select',
				size: 1,
				required: 'required',
			});
			var cur_court_id = (c.mode === 'display') ? c.settings.displaymode_court_id : c.settings.court_id;
			_all_courts(s, c).forEach(function(court) {
				var attrs = {
					value: court.court_id,
				};
				if (c.settings && (cur_court_id == court.court_id)) {
					attrs.selected = 'selected';
				}
				uiu.create_el(court_change_select, 'option', attrs, (court.description ? court.description : court.court_id));
			});
			uiu.create_el(court_change_form, 'button', {
				'role': 'submit',
			}, s._('refmode:referee:change court'));
		}

		// Match / Main configuration
		if (c.mode === 'umpire') {
			var match_row = uiu.create_el(div, 'div', {
				'class': 'referee_c_match_row',
			}, s._('refmode:referee:match'));
			if (c.setup) {
				var match_link = uiu.create_el(match_row, 'span', {
					'class': 'js_link',
				}, c.setup.match_name);
				click.on(match_link, on_client_match_link_click);

				if (c.presses) {
					var client_state = calc.remote_state(s, c.setup, c.presses);
					uiu.create_el(match_row, 'span', {
						'class': 'referee_c_match_status',
					}, calc.desc(client_state));
				}
			}
			if (c.event && ev && ev.matches && (c.event.id === ev.id)) {
				var match_change_form = uiu.create_el(match_row, 'form', {
					'class': 'referee_match_change_form',
				});
				match_change_form.addEventListener('submit', on_client_match_change_submit);

				var change_match_sel = uiu.create_el(match_change_form, 'select', {
					'class': 'referee_match_change_select',
					size: 1,
					required: 'required',
				});
				uiu.create_el(change_match_sel, 'option', {
					value: '',
					selected: 'selected',
				}, '');
				ev.matches.forEach(function(m) {
					uiu.create_el(change_match_sel, 'option', {
						value: m.setup.match_id,
					}, m.setup.match_name);
				});
				uiu.create_el(match_change_form, 'button', {
					'role': 'submit',
				}, s._('refmode:referee:change match'));
			}
		} else if (c.mode === 'display') {
			var dstyle_row = uiu.create_el(div, 'div', {
				'class': 'referee_c_dstyle',
			}, s._('displaymode:style') + ' ' + s._('displaymode:' + c.settings.displaymode_style));

			var dstyle_form = uiu.create_el(dstyle_row, 'form', {
				'class': 'referee_c_dstyle_change_form',
			});
			dstyle_form.addEventListener('submit', on_client_dstyle_change_submit);
			var change_dstyle_sel = uiu.create_el(dstyle_form, 'select', {
				'class': 'referee_c_dstyle_change_select',
				size: 1,
				required: 'required',
			});
			displaymode.ALL_STYLES.forEach(function(ds) {
				var attrs = {
					value: ds,
				};
				if (ds === c.settings.displaymode_style) {
					attrs.selected = 'selected';
				}
				uiu.create_el(change_dstyle_sel, 'option', attrs, s._('displaymode:' + ds));
			});
			uiu.create_el(dstyle_form, 'button', {
				'role': 'submit',
			}, s._('refmode:referee:change display style'));
		}

		if (c.event && (!ev || (c.event.id !== ev.id))) {
			var diff_ev = uiu.create_el(div, 'div', {
				'class': 'referee_warning',
			}, s._('refmode:referee:different_event', {
				event_name: c.event.event_name,
			}));
			var espouse_btn = uiu.create_el(diff_ev, 'button', {
				'class': 'referee_espouse_event',
			}, s._('refmode:referee:espouse event'));
			click.on(espouse_btn, on_espouse_btn_click);
		} else if (!c.event) {
			uiu.create_el(div, 'div', {
				'class': 'referee_warning',
			}, s._('refmode:referee:no event'));
		}

		var v = c.bup_version;
		if (v && (v !== 'dev') && (bup_version !== 'dev') && (v !== bup_version)) {
			uiu.create_el(div, 'div', {
				'class': 'referee_warning',
			}, s._('refmode:referee:outdated bup', {
				bup_version: c.bup_version,
			}));
		}
	});

	if (clients.length === 0) {
		var key = rr ? rr.key_fp() : null;
		var key_str = key ? key : '[...]';
		uiu.create_el(container, 'div', {
			'class': 'referee_c_tutorial',
		}, s._('refmode:referee:paired:none', {
			ref_fp: key_str,
		}));
	}
}

function render_event(s) {
	var ev = s.event;
	var matches_container = uiu.qs('.referee_matches');
	uiu.empty(matches_container);

	if (!ev) {
		uiu.text_qs('.referee_e_title', s._('refmode:referee:no event'));
		uiu.text(matches_container, s._('refmode:referee:no matches'));
		return;
	}

	if (ev.matches) {
		ev.matches.forEach(function(m) {
			var match_container = uiu.create_el(matches_container, 'div', {
				'class': 'referee_e_match',
				'data-match-id': m.setup.match_id,
			});

			var name_row = uiu.create_el(match_container, 'div');
			var match_link = uiu.create_el(name_row, 'span', {
				'class': 'js_link referee_e_match_name',
			}, m.setup.match_name);
			click.on(match_link, on_event_match_link_click);
			var client_state = calc.remote_state(s, m.setup, m.presses); // TODO calculate this at the event
			uiu.create_el(name_row, 'span', {
				'class': 'referee_e_match_status',
			}, calc.desc(client_state));

			var stats_link = uiu.create_el(name_row, 'span', {
				'class': 'js_link referee_e_link',
			}, s._('Statistics'));
			click.on(stats_link, on_event_match_stats_click);

			var scoresheet_link = uiu.create_el(name_row, 'span', {
				'class': 'js_link referee_e_link',
			}, s._('Score Sheet'));
			click.on(scoresheet_link, on_event_match_scoresheet_click);

			if (m.presses) {
				var presses_table = uiu.create_el(match_container, 'table');
				var scopy = calc.copy_state(s);
				scopy.presses = m.presses;
				scopy.setup = m.setup;
				stats.render_presses(presses_table, scopy, m.presses.length - 2);
			}
		});
	}

	// Per-event links
	var links_container = uiu.qs('.referee_e_links');
	links_container.removeAttribute('data-league-key');
	eventsheet.render_links(s, links_container);
	
	var export_link = uiu.create_el(links_container, 'a', {
		'class': 'js_link',
	}, s._('settings:Export link'));
	click.on(export_link, function() {
		importexport.ui_export_json(s);
	});
	var scoresheets_link = uiu.create_el(links_container, 'a', {
		'class': 'js_link',
	}, s._('settings:Event Scoresheets'));
	click.on(scoresheets_link, function() {
		hide_tmp();
		scoresheet.event_show();
	});
	var order_link = uiu.create_el(links_container, 'a', {
		'class': 'js_link',
	}, s._('settings:Order link'));
	click.on(order_link, function() {
		order.show();
	});

	uiu.text_qs('.referee_e_title', ev.event_name);
	document.title = ev.event_name;
}

function on_settings_change() {
	if (rr) {
		rr.on_settings_change();
	}
}

function show() {
	if (state.ui.referee_mode) {
		return;
	}

	delete state.event;

	if (!rr) {
		rr = refmode_referee(state, on_status_change, render_clients, render_event, key_storage);
		rr.on_settings_change();
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
	rr = null;
}

function hide_tmp() {
	uiu.visible_qs('.referee_layout', false);
	settings.hide_refereemode();
}

function back_to_ui() {
	settings.hide(true);
	uiu.visible_qs('.referee_layout', true);
	uiu.visible_qs('#game', false);
	settings.show_refereemode();
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
	hide_tmp: hide_tmp,
	back_to_ui: back_to_ui,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var control = require('./control');
	var click = require('./click');
	var displaymode = require('./displaymode');
	var eventsheet = require('./eventsheet');
	var key_storage = require('./key_storage');
	var importexport = require('./importexport');
	var order = require('./order');
	var refmode_client_ui = null; // break cycle, should be require('./refmode_client_ui');
	var refmode_referee = require('./refmode_referee');
	var render = require('./render');
	var report_problem = require('./report_problem');
	var scoresheet = require('./scoresheet');
	var settings = require('./settings');
	var stats = require('./stats');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = refmode_referee_ui;
}
/*/@DEV*/
