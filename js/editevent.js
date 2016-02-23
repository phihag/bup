var editevent = (function() {
'use strict';

function on_select_change(e) {
	var select = e.target;
	var value = select.value;
	if (value === '__add_manual') {
		var player_name = prompt(state._('editevent:enter player name'));
		if (player_name) {
			utils.create_el(select, 'option', {
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
	state.event.matches[match_id].setup.teams[team_id].players[player_id] = {
		name: select.value,
	};
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
	state.event.backup_players[team_id].push(player);
	network.on_edit_event(state);
	render_table(state);
}

function render_table(s) {
	// No let
	var team_id;
	var td;

	var table = utils.qs('.editevent_table');
	utils.empty(table);
	var thead = utils.create_el(table, 'thead');
	var top_tr = utils.create_el(thead, 'tr');
	utils.create_el(top_tr, 'td');
	utils.create_el(top_tr, 'th', {}, s.event.home_team_name);
	utils.create_el(top_tr, 'th', {}, s.event.away_team_name);

	var all_players = eventutils.calc_all_players(s.event);
	var tbody = utils.create_el(table, 'tbody');
	var all_matches = s.event.matches;
	for (var match_id = 0;match_id < all_matches.length;match_id++) {
		var match_setup = all_matches[match_id].setup;
		var tr = utils.create_el(tbody, 'tr');
		utils.create_el(tr, 'th', {}, match_setup.match_name);
		var player_count = (match_setup.is_doubles ? 2 : 1);
		for (team_id = 0;team_id < 2;team_id++) {
			td = utils.create_el(tr, 'td');
			for (var player_id = 0;player_id < player_count;player_id++) {
				var player = match_setup.teams[team_id].players[player_id];
				if (!player) {
					player = {
						name: 'N.N.',
					};
				}
				var select = utils.create_el(td, 'select', {
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
					utils.create_el(select, 'option', attrs, avp.name);
				}

				utils.create_el(select, 'option', {
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
				utils.create_el(select, 'option', nn_attrs, 'N.N.');
			}
		}
	}

	var all_backup_players = s.event.backup_players;
	if (!all_backup_players) {
		all_backup_players = [[], []];
	}
	var backup_tr = utils.create_el(tbody, 'tr', {});
	utils.create_el(backup_tr, 'th', {
		'class': 'editevent_backup_players',
	}, s._('editevent:backup players'));
	for (team_id = 0;team_id < 2;team_id++) {
		td = utils.create_el(backup_tr, 'td', {
			'class': 'editevent_backup_players',
		});
		var bps = all_backup_players[team_id];
		for (var bp_id = 0;bp_id < bps.length;bp_id++) {
			var bp = bps[bp_id];
			var div = utils.create_el(td, 'div', {
				'class': 'editevent_backup_player',
			}, bp.name);
			var del_btn = utils.create_el(div, 'button', {
				'class': 'button_delete image-button textsize-button',
				'data-bp_id': bp_id,
				'data-team_id': team_id,
			});
			utils.create_el(del_btn, 'span', {
				'data-bp_id': bp_id,
				'data-team_id': team_id,
			});
			utils.on_click(del_btn, on_bp_delbtn_click);
		}

		var add_select = utils.create_el(td, 'select', {
			'data-team_id': team_id,
		});
		utils.create_el(add_select, 'option', {
			'disabled': 'disabled',
			'value': '',
			'selected': 'selected',
		}, s._('editevent:add backup player'));
		for (var pid = 0;pid < all_players[team_id].length;pid++) {
			var bpo = all_players[team_id][pid];
			utils.create_el(add_select, 'option', {
				value: JSON.stringify(bpo),
			}, bpo.name);
		}
		utils.create_el(add_select, 'option', {
			'data-i18n': 'editevent:add manual m',
			value: '__add_manual_m',
			'class': 'editevent_option_manual',
		}, s._('editevent:add manual m'));
		utils.create_el(add_select, 'option', {
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

	utils.visible_qs('.editevent_layout', true);
	if (state.event && state.event.matches) {
		utils.visible_qs('.editevent_loading-icon', false);
		render_table(state);
	} else {
		utils.visible_qs('.editevent_loading-icon', true);
		network.list_matches(state, function(err, ev) {
			utils.visible_qs('.editevent_error', !!err);
			utils.visible_qs('.editevent_loading-icon', false);
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
	utils.visible_qs('.editevent_layout', false);
	control.set_current(state);
	settings.show();
}

function ui_init() {
	utils.on_click_qs('.editevent_link', function(e) {
		e.preventDefault();
		show();
	});
	utils.on_click_qs('.editevent_back', function(e) {
		e.preventDefault();
		hide();
	});

	var layout = utils.qs('.editevent_layout');
	utils.on_click(layout, function(e) {
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
	var control = require('./control');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = editevent;
}
/*/@DEV*/