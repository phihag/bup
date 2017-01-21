'use strict';
var setupsheet = (function() {

var BULI2016_CONFIG = {
	m: ['1.HD', '2.HD', '1.HE', '2.HE', 'GD', 'backup', 'present'],
	f: ['dark', 'dark', 'DE', 'DD', 'GD', 'backup', 'present'],
};
var CONFIGS = {
	'1BL-2016': BULI2016_CONFIG,
	'2BLN-2016': BULI2016_CONFIG,
	'2BLS-2016': BULI2016_CONFIG,
};
var GENDERS = ['m', 'f'];

function calc_listed(event, team_id, gender) {
	if (event.listed_players) {
		return event.listed_players[team_id][gender];
	}

	var res = [];
	function _add(p, p_gender) {
		if (typeof p_gender != 'string') {
			p_gender = p.gender;
		}
		if (p_gender !== gender) {
			return;
		}

		if (!res.some(function(added_p) {
			return added_p.name === p.name;
		})) {
			res.push(p);
		}
	}

	event.matches.forEach(function(match) {
		var setup = match.setup;
		setup.teams[team_id].players.forEach(function(p, player_id) {
			_add(p, p.gender || eventutils.guess_gender(setup, player_id));
		});
	});
	if (event.backup_players) {
		event.backup_players[team_id].forEach(_add);
	}
	if (event.present_players) {
		event.present_players[team_id].forEach(_add);
	}
	return res;
}

function available_players(s, listed, team_id, gender) {
	var listed_by_name = {};
	listed.forEach(function(lp) {
		listed_by_name[lp.name] = lp;
	});

	var res = [];
	s.event.all_players[team_id].forEach(function(p) {
		if (p.gender !== gender) return;
		if (! listed_by_name[p.name]) {
			res.push(p);
		}
	});

	return res;
}

function col_text(s, col) {
	switch (col) {
	case 'dark':
		return '';
	case 'backup':
		return s._('setupsheet:header:backup');
	case 'present':
		return s._('setupsheet:header:present');
	}
	return col;
}

function ui_render(s) {
	var cfg = CONFIGS[s.event.league_key];

	if (!cfg) {
		var err_display = uiu.qs('.setupsheet_error');
		uiu.visible(err_display, true);
		uiu.text(err_display, 'Unsupported league: ' + s.event.league_key);
	}

	var matches_by_id = {};
	GENDERS.forEach(function(gender) {
		cfg[gender].forEach(function(match_key) {
			s.event.matches.forEach(function(m) {
				if (eventsheet.calc_match_id(m) === match_key) {
					matches_by_id[match_key] = m;
				}
			});
		});
	});

	for (var team_id = 0;team_id <= 1;team_id++) {
		var table = uiu.qs('#setupsheet_table_team' + team_id);
		uiu.empty(table);
		var thead = uiu.create_el(table, 'thead');
		var thead_tr = uiu.create_el(thead, 'tr');
		uiu.create_el(thead_tr, 'th', {
			'class': 'setupsheet_team_name',
			'colspan': (1 + cfg.m.length),
		}, s.event.team_names[team_id]);
		var tbody = uiu.create_el(table, 'tbody');
		GENDERS.forEach(function(gender) {
			var header_tr = uiu.create_el(tbody, 'tr');
			uiu.create_el(header_tr, 'th', 'setupsheet_header', s._('setupsheet:header|' + gender));
			cfg[gender].forEach(function(col) {
				if (col === 'dark') {
					uiu.create_el(header_tr, 'th', 'setupsheet_dark');
				} else {
					uiu.create_el(header_tr, 'th', {}, col_text(s, col));
				}
			});

			var listed_g_players = calc_listed(s.event, team_id, gender);
			listed_g_players.forEach(function(p) {
				var tr = uiu.create_el(tbody, 'tr');
				uiu.create_el(tr, 'td', 'setupsheet_player_name', p.name);
				cfg[gender].forEach(function(col) {
					if (col === 'dark') {
						uiu.create_el(tr, 'td', 'setupsheet_dark');
					} else {
						var candidate_players;
						if (col === 'backup') {
							candidate_players = s.event.backup_players[team_id];
						} else if (col === 'present') {
							candidate_players = s.event.present_players[team_id];
						} else {
							var match = matches_by_id[col];
							if (!match) {
								throw new Error('Cannot find match ' + col);
							}
							candidate_players = match.setup.teams[team_id].players;
						}
						var plays_in = candidate_players && candidate_players.some(function(cp) {
							return cp.name === p.name;
						});
						var td = uiu.create_el(tr, 'td', {
							'data-col': col,
							'class': 'setupsheet_x_cell' + (plays_in ? ' setupsheet_x_marked' : ''),
						});
						uiu.create_el(td, 'span', 'setupsheet_match_name_hint', col_text(s, col));
						uiu.create_el(
							td, 'span',
							'setupsheet_x', plays_in ? 'x' : '');
					}
				});
			});

			var new_tr = uiu.create_el(tbody, 'tr');
			var new_td = uiu.create_el(new_tr, 'td', {
				colspan: (1 + cfg[gender].length),
				'class': 'setupsheet_new',
			});
			var new_select = uiu.create_el(new_td, 'select');
			available_players(s, listed_g_players, team_id, gender).forEach(function(ap) {
				uiu.create_el(new_select, 'option', {}, ap.name);
			});
		});

	}
}

function show() {
	if (state.ui.setupsheet_visible) {
		return;
	}

	if (state.ui.referee_mode) {
		refmode_referee_ui.hide_tmp();
	} else {
		render.hide();
		settings.hide(true);
	}

	state.ui.setupsheet_visible = true;
	uiu.esc_stack_push(hide);
	control.set_current(state);

	uiu.visible_qs('.setupsheet_layout', true);
	if (state.event && state.event.matches && state.event.all_players) {
		uiu.visible_qs('.setupsheet_loading-icon', false);
		ui_render(state);
	} else {
		uiu.visible_qs('.setupsheet_loading-icon', true);
		network.list_full_event(state, function(err) {
			uiu.visible_qs('.setupsheet_error', !!err);
			uiu.visible_qs('.setupsheet_loading-icon', false);
			if (err) {
				uiu.text_qs('.setupsheet_error_message', err.msg);
				return;
			}
			ui_render(state);
		});
	}
}

function hide() {
	if (! state.ui.setupsheet_visible) {
		return;
	}

	uiu.esc_stack_pop();
	state.ui.setupsheet_visible = false;
	uiu.visible_qs('.setupsheet_layout', false);
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
	click.qs('.setupsheet_link', function(e) {
		e.preventDefault();
		show();
	});
	click.qs('.setupsheet_back', function(e) {
		e.preventDefault();
		hide_and_back();
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
	var eventsheet = require('./eventsheet');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var refmode_referee_ui = null; // break cycle, should be require('./refmode_referee_ui');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');

	module.exports = setupsheet;
}
/*/@DEV*/