var editevent = (function() {
'use strict';

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
	var team_id = parseInt(e.target.getAttribute('data-team_id'), 10);
	var bp_id = parseInt(e.target.getAttribute('data-bp_id'), 10);
	state.event.backup_players[team_id].splice(bp_id, 1);
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
	if (! state.event.backup_players) {
		state.event.backup_players = [[], []];
	}
	state.event.backup_players[team_id].push(player);
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

function render_table(s) {
	// No let
	var team_id;
	var td;

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
		for (team_id = 0;team_id < 2;team_id++) {
			td = uiu.create_el(tr, 'td');
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

	var all_backup_players = s.event.backup_players;
	if (!all_backup_players) {
		all_backup_players = [[], []];
	}
	var backup_player_names = all_backup_players.map(function(bps) {
		var names = {};
		for (var i = 0;i < bps.length;i++) {
			names[bps[i].name] = bps[i];
		}
		return names;
	});
	var backup_tr = uiu.create_el(tbody, 'tr', {});
	uiu.create_el(backup_tr, 'th', {
		'class': 'editevent_backup_players',
	}, s._('editevent:backup players'));
	for (team_id = 0;team_id < 2;team_id++) {
		td = uiu.create_el(backup_tr, 'td', {
			'class': 'editevent_backup_players',
		});
		var bps = all_backup_players[team_id];
		for (var bp_id = 0;bp_id < bps.length;bp_id++) {
			var bp = bps[bp_id];
			var div = uiu.create_el(td, 'div', {
				'class': 'editevent_backup_player',
			}, calc_player_str(bp));
			var del_btn = uiu.create_el(div, 'button', {
				'class': 'button_delete image-button textsize-button',
				'data-bp_id': bp_id,
				'data-team_id': team_id,
			});
			uiu.create_el(del_btn, 'span', {
				'data-bp_id': bp_id,
				'data-team_id': team_id,
			});
			click.on(del_btn, on_bp_delbtn_click);
		}

		var add_select = uiu.create_el(td, 'select', {
			'data-team_id': team_id,
		});
		uiu.create_el(add_select, 'option', {
			'disabled': 'disabled',
			'value': '',
			'selected': 'selected',
		}, s._('editevent:add backup player'));
		for (var pid = 0;pid < all_players[team_id].length;pid++) {
			var p = all_players[team_id][pid];
			if (backup_player_names[team_id][p.name]) {
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

function show() {
	if (state.ui.editevent_visible) {
		return;
	}

	render.hide();
	settings.hide(true);

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
			state.event = ev;
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
	control.set_current(state);
	settings.show();
}

function ui_init() {
	click.qs('.editevent_link', function(e) {
		e.preventDefault();
		show();
	});
	click.qs('.editevent_back', function(e) {
		e.preventDefault();
		hide();
	});

	var layout = uiu.qs('.editevent_layout');
	click.on(layout, function(e) {
		if (e.target === layout) {
			hide();
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
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');

	module.exports = editevent;
}
/*/@DEV*/