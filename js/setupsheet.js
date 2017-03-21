'use strict';
var setupsheet = (function() {

var BULI2016_CONFIG = {
	m: ['1.HD', '2.HD', '1.HE', '2.HE', 'GD', 'backup', 'present'],
	f: ['dark', 'dark', 'DE', 'DD', 'GD', 'backup', 'present'],
};
var DE_CONFIG = {
	m: ['1.HD', '2.HD', '1.HE', '2.HE', '3.HE', 'GD', 'backup'],
	f: ['dark', 'dark', 'dark', 'DE', 'DD', 'GD', 'backup'],
};
var CONFIGS = {
	'1BL-2016': BULI2016_CONFIG,
	'2BLN-2016': BULI2016_CONFIG,
	'2BLS-2016': BULI2016_CONFIG,
	'RLW-2016': DE_CONFIG,
	'RLN-2016': DE_CONFIG,
	'RLM-2016': DE_CONFIG,
};

var URLS = {
	'bundesliga-2016': 'div/setupsheet_bundesliga-2016.svg',
	'default': 'div/setupsheet_default.svg',
};
var dl;

var GENDERS = ['m', 'f'];
var LIMITS = {
	m: {
		'1.HD': 2,
		'2.HD': 2,
		'1.HE': 1,
		'2.HE': 1,
		'3.HE': 1,
		'GD': 1,
	}, 
	f: {
		'DD': 2,
		'DE': 1,
		'GD': 1,
	},
};
var MIN_LENGTHS = {
	'bundesliga-2016': {
		m: 7,
		f: 4,
	},
	'default': {
		m: 8,
		f: 4,
	},
};

// Current state
var listed; // Array of teams -> dict of genders -> array of players
var cur_players; // dict of col -> array of teams -> array of players (with gender)
var cfg;

function calc_cur_players(cfg, event) {
	var res = {};
	GENDERS.forEach(function(gender) {
		cfg[gender].forEach(function(match_key) {
			event.matches.forEach(function(m) {
				if (eventsheet.calc_match_id(m) === match_key) {
					res[match_key] = m.setup.teams.map(function(team) {
						return team.players.map(function(orig_p, player_id) {
							if (orig_p.gender) {
								return orig_p;
							}

							var p = utils.deep_copy(orig_p);
							if (!p.gender) {
								p.gender = eventutils.guess_gender(m.setup, player_id);
							}
							return p;
						});
					});
				}
			});
		});
	});

	res['backup'] = event.backup_players ? event.backup_players : [[], []];
	res['present'] = event.present_players ? event.present_players : [[], []];
	return res;
}

function cur_plays_in(col, team_id, p) {
	return !! cur_players[col][team_id].some(function(cp) {
		return cp.name === p.name;
	});
}

function calc_listed(event) {
	var res = [];
	for (var team_id = 0;team_id < 2;team_id++) {
		var team_res = {
			m: [],
			f: [],
		};
		res.push(team_res);

		var _add = function(p) {
			var g_players = team_res[p.gender];

			if (!g_players.some(function(added_p) {
				return added_p.name === p.name;
			})) {
				g_players.push(p);
			}
		};

		event.matches.forEach(function(match) {
			var setup = match.setup;
			setup.teams[team_id].players.forEach(function(p, player_id) {
				if (!p.gender) {
					p = utils.deep_copy(p);
					p.gender = eventutils.guess_gender(setup, player_id);
				}
				_add(p);
			});
		});
		if (event.backup_players) {
			event.backup_players[team_id].forEach(_add);
		}
		if (event.present_players) {
			event.present_players[team_id].forEach(_add);
		}

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

function calc_config(league_key) {
	if (eventutils.NRW2016_RE.test(league_key)) {
		return DE_CONFIG;
	}
	return CONFIGS[league_key];
}

function _get_player(cell) {
	var player_json = cell.getAttribute('data-player_json');
	var res = JSON.parse(player_json);
	if (!res.gender) {
		res.gender = cell.getAttribute('data-gender');
	}
	return res;
}

function on_cell_click(e) {
	var cell = uiu.closest_class(e.target, 'setupsheet_x_cell');
	var player = _get_player(cell);
	var player_name = player.name;
	var gender = player.gender;
	var team_id = parseInt(cell.getAttribute('data-team_id'));
	var col = cell.getAttribute('data-col');

	var cps = cur_players[col][team_id];
	var cur_in = cps.some(function(cp) {
		return cp.name === player_name;
	});

	if (cur_in) {
		// Remove
		cur_players[col][team_id] = cps.filter(function(cp) {
			return cp.name !== player_name;
		});
	} else {
		// Add player
		var limit = LIMITS[gender][col];
		var cur_count = utils.sum(cps.map(function(cp) {
			return (cp.gender === gender) ? 1 : 0;
		}));
		if (limit && (cur_count >= limit)) {
			cps = cps.filter(function(cp) {
				return cp.gender !== gender;
			});
			cur_players[col][team_id] = cps;
		}
		cps.push(player);
	}

	rerender(state);
}

function on_delete_click(e) {
	var btn = uiu.closest_class(e.target, 'setupsheet_delete_button');
	var player = _get_player(btn);
	var team_id = parseInt(btn.getAttribute('data-team_id'));

	function is_player(p) {
		return p.name === player.name;
	}

	utils.remove_cb(listed[team_id][player.gender], is_player);
	Object.values(cur_players).forEach(function(teams) {
		teams.forEach(function(players) {
			utils.remove_cb(players, is_player);
		});
	});
	rerender(state);
}

function on_new_form_submit(e) {
	e.preventDefault();
	var form = uiu.closest_class(e.target, 'setupsheet_new_form');
	var gender = form.getAttribute('data-gender');
	var team_id = parseInt(form.getAttribute('data-team_id'));
	var select = uiu.qs('.setupsheet_newselect_' + team_id + '_' + gender);
	var player_name = select.value;

	if (!player_name || (player_name === '__add_manual')) {
		return;
	}

	listed[team_id][gender].push({
		name: player_name,
		gender: gender,
	});
	rerender(state);
}

function on_add_change(e) {
	var select = e.target;
	var val = select.value;
	if (!val) {
		return;
	}
	if ((val === '__add_manual')) {
		var player_name = prompt(state._('editevent:enter player name'));
		if (!player_name) {
			select.value = '';
			return;
		}
		uiu.create_el(select, 'option', {
			value: player_name,
			selected: 'selected',
		}, player_name);
	}
}

function save(s, cb) {
	var event = s.event;
	event.listed_players = utils.deep_copy(listed);
	event.matches.forEach(function(match) {
		var match_id = eventsheet.calc_match_id(match);
		for (var team_id = 0;team_id < 2;team_id++) {
			var new_players = cur_players[match_id][team_id].slice();
			if ((new_players.length === 2) && (new_players[0].gender === 'f') && (new_players[1].gender === 'm')) {
				new_players = [new_players[1], new_players[0]];
			}
			match.setup.teams[team_id].players = new_players;
		}
	});
	if (cur_players.backup) {
		event.backup_players = utils.deep_copy(cur_players.backup);
	}
	if (cur_players.present) {
		event.present_players = utils.deep_copy(cur_players.present);
	}
	network.on_edit_event(s, cb);
}

function pdf() {
	var svg_container = uiu.qs('.setupsheet_svg_container');
	var svgs = svg_container.querySelectorAll('svg');
	var filename = state._('setupsheet:filename', {
		event_name: state.event.event_name,
	});
	svg_container.setAttribute('style', 'display: block; position: absolute; top: -9999px;');
	for (var i = 0;i < svgs.length;i++) {
		svgs[i].setAttribute('style', 'width: 2970px; height: 2100px;');
	}
	svg2pdf.save(svgs, {}, 'portrait', filename);
	for (i = 0;i < svgs.length;i++) {
		svgs[i].removeAttribute('style');
	}
	svg_container.removeAttribute('style');
}

function ui_render_init(s) {
	var err_display = uiu.qs('.setupsheet_error');
	uiu.hide(err_display);
	uiu.text(err_display);
	cfg = calc_config(s.event.league_key);
	if (!cfg) {
		uiu.show(err_display);
		uiu.text(err_display, 'Unsupported league: ' + s.event.league_key);
		return;
	}
	listed = calc_listed(s.event);
	cur_players = calc_cur_players(cfg, s.event);
	rerender(s);
}

function rerender(s) {
	listed.forEach(function(team, team_id) {
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

			var listed_g_players = team[gender];
			listed_g_players.forEach(function(p) {
				var tr = uiu.create_el(tbody, 'tr');
				var first_cell = uiu.create_el(tr, 'td', 'setupsheet_player_name', p.name);
				var btn = uiu.create_el(first_cell, 'button', {
					'class': 'setupsheet_delete_button image-button textsize-button',
					'data-team_id': team_id,
					'data-player_json': JSON.stringify(p),
					'data-gender': gender,
				});
				click.on(btn, on_delete_click);
				uiu.create_el(btn, 'span');
				cfg[gender].forEach(function(col) {
					if (col === 'dark') {
						uiu.create_el(tr, 'td', 'setupsheet_dark');
					} else {
						var plays_in = cur_plays_in(col, team_id, p);
						var td = uiu.create_el(tr, 'td', {
							'data-col': col,
							'data-gender': gender,
							'data-team_id': team_id,
							'data-player_json': JSON.stringify(p),
							'class': 'setupsheet_x_cell' + (plays_in ? ' setupsheet_x_marked' : ''),
						}, (plays_in ? 'x' : ''));
						click.on(td, on_cell_click);
					}
				});
			});

			var new_tr = uiu.create_el(tbody, 'tr');
			var new_td = uiu.create_el(new_tr, 'td', {
				colspan: (1 + cfg[gender].length),
				'class': 'setupsheet_new',
			});
			var new_form = uiu.create_el(new_td, 'form', {
				'class': 'inline-form setupsheet_new_form',
				'data-team_id': team_id,
				'data-gender': gender,
			});
			new_form.addEventListener('submit', on_new_form_submit);
			var new_select = uiu.create_el(new_form, 'select', {
				'class': 'setupsheet_newselect_' + team_id + '_' + gender,
				required: 'required',
			});
			var avp = available_players(s, listed_g_players, team_id, gender);
			avp.forEach(function(ap) {
				uiu.create_el(new_select, 'option', {
					value: ap.name,
				}, ap.name);
			});
			if (avp.length === 0) {
				uiu.create_el(new_select, 'option', {
					value: '',
					disabled: 'disabled',
					selected: 'selected',
				}, '');
			}
			uiu.create_el(new_select, 'option', {
				value: '__add_manual',
				'class': 'setupsheet_option_manual',
			}, s._('setupsheet:new player|' + gender));
			new_select.addEventListener('change', on_add_change);

			uiu.create_el(new_form, 'button', {
				'data-i18n': 'setupsheet:add',
				'role': 'submit',
			}, s._('setupsheet:add'));
		});
	});

	render_svg(s);
}

function render_svg(s) {
	var sheet_name = eventutils.is_bundesliga(s.event.league_key) ? 'bundesliga-2016' : 'default';
	if (!dl) {
		dl = downloader(URLS);
	}
	dl.load(sheet_name, function(xml_str) {
		var svg_container = uiu.qs('.setupsheet_svg_container');
		uiu.empty(svg_container);
		for (var team_id = 0;team_id < 2;team_id++) {
			var svg_doc = (new DOMParser()).parseFromString(xml_str, 'text/xml');
			var svg_root = svg_doc.documentElement;

			fill_svg(s, svg_root, sheet_name, team_id);
			svg_container.appendChild(svg_root);
		}
	});
}

function change_yoffset(container, yoffset) {
	uiu.qsEach('text,rect', function(text) {
		var y = parseFloat(text.getAttribute('y'));
		text.setAttribute('y', y + yoffset);
	}, container);
	uiu.qsEach('line', function(line) {
		var y1 = parseFloat(line.getAttribute('y1'));
		line.setAttribute('y1', y1 + yoffset);
		var y2 = parseFloat(line.getAttribute('y2'));
		line.setAttribute('y2', y2 + yoffset);
	}, container);
}

function fill_text(container, fill_id, text) {
	var el = uiu.qs('text[data-fill-id="' + fill_id + '"]', container);
	uiu.text(el, text);
}

function fill_svg(s, svg_root, sheet_name, team_id)  {
	fill_text(svg_root, 'tournament_name', s.event.tournament_name);
	fill_text(svg_root, 'event_name', s.event.event_name);
	fill_text(svg_root, 'setup_desc', s._('setupsheet:setup|' + team_id));
	fill_text(svg_root, 'team_name', s.event.team_names[team_id]);

	var yoffset = 0;
	GENDERS.forEach(function(gender) {
		var num_lines = Math.max(MIN_LENGTHS[sheet_name][gender], listed[team_id][gender].length);
		var g_cfg = cfg[gender];

		var template = uiu.qs('g[data-fill-id="template_' + gender + '"]', svg_root);
		var height = parseFloat(template.getAttribute('data-fill-height'));
		template.parentNode.removeChild(template);

		for (var i = 0;i < num_lines;i++) {
			var g = template.cloneNode(true);

			fill_text(g, 'idx', i + 1);

			var listed_player = listed[team_id][gender][i];
			if (listed_player) {
				fill_text(g, 'name', listed_player.name);

				g_cfg.forEach(function(col, col_id) {
					if (col === 'dark') {
						return;
					}

					if (cur_plays_in(col, team_id, listed_player)) {
						fill_text(g, 'x_' + col_id, 'x');
					}
				});
			}

			change_yoffset(g, yoffset + i * height);

			if (i === num_lines - 1) {
				uiu.qsEach('line[data-fill-id="bottom_line"]', function(bl) {
					uiu.removeClass(bl, 'thin');
					uiu.addClass(bl, 'thick');
				}, g);
			}
			svg_root.appendChild(g);
		}

		var vlines = uiu.qs('g[data-fill-id="vlines_' + gender + '"]', svg_root);
		change_yoffset(vlines, yoffset);
		uiu.qsEach('line', function(vline) {
			var y2 = parseFloat(vline.getAttribute('y2'));
			vline.setAttribute('y2', y2 + height * (num_lines - 1));
		}, vlines);
		uiu.qsEach('rect', function(vline) {
			var h = parseFloat(vline.getAttribute('height'));
			vline.setAttribute('height', h + height * (num_lines - 1));
		}, vlines);

		var fixed = uiu.qs('g[data-fill-id="fixed_' + gender + '"]', svg_root);
		change_yoffset(fixed, yoffset);
		fill_text(fixed, 'header', s._('setupsheet:header|' + gender));
		g_cfg.forEach(function(col, col_id) {
			if (col === 'dark') {
				return;
			}
			var col_text = (
				(col === 'backup') ? s._('setupsheet:header:backup') :
				((col === 'present') ? s._('setupsheet:header:present') :
				col
			));
			fill_text(fixed, 'd-' + col_id, col_text);
		});

		if (g_cfg.indexOf('backup') >= 0) {
			fill_text(svg_root, 'label_backup_' + gender, s._('setupsheet:longlabel:backup'));
		}
		if (g_cfg.indexOf('present') >= 0) {
			fill_text(svg_root, 'label_present_' + gender, s._('setupsheet:longlabel:present'));
		}

		yoffset += height * (num_lines - 1);
	});

	var lower = uiu.qs('g[data-fill-id="lower"]', svg_root);
	change_yoffset(lower, yoffset);
	fill_text(lower, 'teamster_label', s._('setupsheet:teamster'));
	fill_text(lower, 'signature', s._('setupsheet:signature'));

}

function show() {
	if (state.ui.setupsheet_visible) {
		return;
	}

	printing.set_orientation('portrait');

	if (typeof jsPDF !== 'undefined') {
		jspdf_loaded();
	}

	if (state.ui.referee_mode) {
		refmode_referee_ui.hide_tmp();
	} else {
		render.hide();
		settings.hide(true);
	}

	state.ui.setupsheet_visible = true;
	uiu.esc_stack_push(ask_hide_and_back);
	control.set_current(state);

	uiu.visible_qs('.setupsheet_layout', true);
	if (state.event && state.event.matches && state.event.all_players) {
		uiu.visible_qs('.setupsheet_loading-icon', false);
		ui_render_init(state);
	} else {
		uiu.visible_qs('.setupsheet_loading-icon', true);
		network.list_full_event(state, function(err) {
			uiu.visible_qs('.setupsheet_error', !!err);
			uiu.visible_qs('.setupsheet_loading-icon', false);
			if (err) {
				uiu.text_qs('.setupsheet_error_message', err.msg);
				return;
			}
			ui_render_init(state);
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

function ask_hide_and_back() {
	var old_cur_players = calc_cur_players(cfg, state.event);
	var old_listed = calc_listed(state.event);

	var is_changed = !utils.deep_equal(old_cur_players, cur_players) || !utils.deep_equal(old_listed, listed);
	if (is_changed) {
		if (!window.confirm(state._('setupsheet:confirm cancel'))) {
			return;
		}
	}
	hide_and_back();
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

function jspdf_loaded() {
	uiu.qs('.setupsheet_pdf').removeAttribute('disabled');
}

function ui_init() {
	click.qs('.setupsheet_link', function(e) {
		e.preventDefault();
		show();
	});
	click.qs('.setupsheet_cancel', ask_hide_and_back);
	click.qs('.setupsheet_save', function() {
		save(state, function(err) {
			uiu.visible_qs('.setupsheet_error', err);
			if (err) {
				uiu.text_qs('.setupsheet_error', err.msg);
			} else {
				hide_and_back();
			}
		});
	});
	click.qs('.setupsheet_print', function() {
		window.print();
	});
	click.qs('.setupsheet_pdf', pdf);
}

return {
	ui_init: ui_init,
	show: show,
	hide: hide,
	jspdf_loaded: jspdf_loaded,
};


})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var control = require('./control');
	var downloader = require('./downloader');
	var eventsheet = require('./eventsheet');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var printing = require('./printing');
	var refmode_referee_ui = null; // break cycle, should be require('./refmode_referee_ui');
	var render = require('./render');
	var settings = require('./settings');
	var svg2pdf = require('./svg2pdf');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = setupsheet;
}
/*/@DEV*/