'use strict';
var editevent = (function() {

function on_select_change(e) {
	var select = e.target;
	var value = select.value;
	if (value === '__add_manual') {
		var player_name = prompt(state._('editevent:enter player name'));
		if (player_name) {
			uiu.create_el(select, 'option', {
				value: player_name,
				selected: 'selected',
			}, player_name);
		} else {
			player_name = 'N.N.';
		}
		select.value = player_name;
	}
	var match_id = parseInt(select.getAttribute('data-match_id'), 10);
	var team_id = parseInt(select.getAttribute('data-team_id'), 10);
	var player_id = parseInt(select.getAttribute('data-player_id'), 10);

	// TODO instead, select player out of all players if present in there
	var team_players = state.event.matches[match_id].setup.teams[team_id].players;
	var player = {
		name: select.value,
	};
	if ((team_players.length === 0) && (player_id === 1)) {
		team_players.push({
			name: 'N.N.',
		});
	}
	team_players[player_id] = player;

	network.on_edit_event(state);
	render_table(state);
}

function on_bp_delbtn_click(e) {
	var el = e.target;
	var team_id = parseInt(el.getAttribute('data-team_id'), 10);
	var player_index = parseInt(el.getAttribute('data-player_index'), 10);
	var ar_key = el.getAttribute('data-ar-key');
	state.event[ar_key + '_players'][team_id].splice(player_index, 1);
	network.on_edit_event(state);
	render_table(state);
}

function on_add_change(e) {
	var team_id = parseInt(e.target.getAttribute('data-team_id'), 10);
	var val = e.target.value;
	if (!val) {
		return;
	}
	var player;
	if ((val === '__add_manual_m') || (val === '__add_manual_f')) {
		var player_name = prompt(state._('editevent:enter player name'));
		if (!player_name) {
			e.target.value = '';
			return;
		}
		player = {
			name: player_name,
			gender: val.substr(-1),
		};
	} else {
		player = JSON.parse(val);
	}

	var key = e.target.getAttribute('data-ar-key');
	if (! state.event[key + '_players']) {
		state.event[key + '_players'] = [[], []];
	}
	state.event[key + '_players'][team_id].push(player);
	network.on_edit_event(state);
	render_table(state);
}

function calc_player_str(p) {
	var player_str = p.name;
	if (p.ranking) {
		var ranking_str = p.ranking;
		if (p.ranking_d) {
			ranking_str += '-D' + p.ranking_d;
		}
		player_str += ' (' + ranking_str + ')';
	}
	return player_str;
}

function render_player_sel(s, tbody, all_players, key) {
	var all_sel_players = s.event[key + '_players'];
	if (!all_sel_players) {
		all_sel_players = [[], []];
	}
	var sel_player_names = all_sel_players.map(function(asp) {
		var names = {};
		for (var i = 0;i < asp.length;i++) {
			names[asp[i].name] = asp[i];
		}
		return names;
	});
	var tr = uiu.create_el(tbody, 'tr', {});
	uiu.create_el(tr, 'th', {
		'class': 'editevent_' + key + '_players',
	}, s._('editevent:' + key + ' players'));
	for (var team_id = 0;team_id < 2;team_id++) {
		var td = uiu.create_el(tr, 'td', {
			'class': 'editevent_' + key + '_players',
		});
		var asp = all_sel_players[team_id];
		for (var player_index = 0;player_index < asp.length;player_index++) {
			var bp = asp[player_index];
			var div = uiu.create_el(td, 'div', {
				'class': 'editevent_' + key + '_player',
			}, calc_player_str(bp));
			var del_btn = uiu.create_el(div, 'button', {
				'class': 'button_delete image-button textsize-button',
				'data-player_index': player_index,
				'data-team_id': team_id,
				'data-ar-key': key,
			});
			uiu.create_el(del_btn, 'span', {
				'data-player_index': player_index,
				'data-team_id': team_id,
				'data-ar-key': key,
			});
			click.on(del_btn, on_bp_delbtn_click);
		}

		var add_select = uiu.create_el(td, 'select', {
			'data-team_id': team_id,
			'data-ar-key': key,
		});
		uiu.create_el(add_select, 'option', {
			'disabled': 'disabled',
			'value': '',
			'selected': 'selected',
		}, s._('editevent:add ' + key + ' player'));
		for (var pid = 0;pid < all_players[team_id].length;pid++) {
			var p = all_players[team_id][pid];
			if (sel_player_names[team_id][p.name]) {
				continue;
			}
			uiu.create_el(add_select, 'option', {
				value: JSON.stringify(p),
			}, p.name);
		}
		uiu.create_el(add_select, 'option', {
			'data-i18n': 'editevent:add manual m',
			value: '__add_manual_m',
			'class': 'editevent_option_manual',
		}, s._('editevent:add manual m'));
		uiu.create_el(add_select, 'option', {
			'data-i18n': 'editevent:add manual f',
			value: '__add_manual_f',
			'class': 'editevent_option_manual',
		}, s._('editevent:add manual f'));
		add_select.addEventListener('change', on_add_change);
	}
}

function render_table(s) {
	var table = uiu.qs('.editevent_table');
	uiu.empty(table);
	var thead = uiu.create_el(table, 'thead');
	var top_tr = uiu.create_el(thead, 'tr');
	uiu.create_el(top_tr, 'td');
	uiu.create_el(top_tr, 'th', {}, s.event.team_names[0]);
	uiu.create_el(top_tr, 'th', {}, s.event.team_names[1]);

	var all_players = eventutils.calc_all_players(s.event);
	var tbody = uiu.create_el(table, 'tbody');
	var all_matches = s.event.matches;
	for (var match_id = 0;match_id < all_matches.length;match_id++) {
		var match_setup = all_matches[match_id].setup;
		var tr = uiu.create_el(tbody, 'tr');
		uiu.create_el(tr, 'th', {}, match_setup.match_name);
		var player_count = (match_setup.is_doubles ? 2 : 1);
		for (var team_id = 0;team_id < 2;team_id++) {
			var td = uiu.create_el(tr, 'td');
			for (var player_id = 0;player_id < player_count;player_id++) {
				var player = match_setup.teams[team_id].players[player_id];
				if (!player) {
					player = {
						name: 'N.N.',
					};
				}
				var select = uiu.create_el(td, 'select', {
					name: 'editevent_player_' + match_id + '_' + team_id + '_' + player_id,
					'data-match_id': match_id,
					'data-team_id': team_id,
					'data-player_id': player_id,
					'data-gender': gender,
				});
				select.addEventListener('change', on_select_change);
				var gender = eventutils.guess_gender(match_setup, player_id);
				var av_players = all_players[team_id];
				for (var i = 0;i < av_players.length;i++) {
					var avp = av_players[i];
					if (avp.gender && (avp.gender !== gender)) {
						continue;
					}
					var attrs = {
						value: avp.name,
					};
					if (avp.name === player.name) {
						attrs.selected = 'selected';
					}
					uiu.create_el(select, 'option', attrs, calc_player_str(avp));
				}

				uiu.create_el(select, 'option', {
					'data-i18n': 'editevent:add manual ' + gender,
					value: '__add_manual',
					'class': 'editevent_option_manual',
				}, s._('editevent:add manual ' + gender));
				var nn_attrs = {
					value: 'N.N.',
					'class': 'editevent_option_nn',
				};
				if (player.name === 'N.N.') {
					nn_attrs.selected = 'selected';
				}
				uiu.create_el(select, 'option', nn_attrs, 'N.N.');
			}
		}
	}

	render_player_sel(s, tbody, all_players, 'backup');
	render_player_sel(s, tbody, all_players, 'present');
}

function show() {
	if (state.ui.editevent_visible) {
		return;
	}

	if (state.ui.referee_mode) {
		refmode_referee_ui.hide_tmp();
	} else {
		render.hide();
		settings.hide(true);
	}

	state.ui.editevent_visible = true;
	uiu.esc_stack_push(hide);
	control.set_current(state);

	uiu.visible_qs('.editevent_layout', true);
	if (state.event && state.event.matches) {
		uiu.visible_qs('.editevent_loading-icon', false);
		render_table(state);
	} else {
		uiu.visible_qs('.editevent_loading-icon', true);
		network.list_matches(state, function(err, ev) {
			uiu.visible_qs('.editevent_error', !!err);
			uiu.visible_qs('.editevent_loading-icon', false);
			if (err) {
				$('.editevent_error_message').text(err.msg);
				return;
			}
			network.update_event(state, ev);
			render_table(state);
		});
	}
}

function hide() {
	if (! state.ui.editevent_visible) {
		return;
	}

	uiu.esc_stack_pop();
	state.ui.editevent_visible = false;
	uiu.visible_qs('.editevent_layout', false);
	return true;
}

function hide_and_back() {
	if (!hide()) return;

	control.set_current(state);

	if (state.ui.referee_mode) {
		refmode_referee_ui.back_to_ui();
	} else {
		settings.show();
	}
}

function ui_init() {
	click.qs('.editevent_link', function(e) {
		e.preventDefault();
		show();
	});
	click.qs('.editevent_back', function(e) {
		e.preventDefault();
		hide_and_back();
	});

	var layout = uiu.qs('.editevent_layout');
	click.on(layout, function(e) {
		if (e.target === layout) {
			hide_and_back();
		}
	});
}

return {
	ui_init: ui_init,
	show: show,
	hide: hide,
};


})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var control = require('./control');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var refmode_referee_ui = null; // break cycle, should be require('./refmode_referee_ui');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');

	module.exports = editevent;
}
/*/@DEV*/