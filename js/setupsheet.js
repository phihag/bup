'use strict';
var setupsheet = (function() {

var URLS = {
	'bundesliga-2016': 'div/setupsheet_bundesliga-2016.svg',
	'default': 'div/setupsheet_default.svg',
	'international': 'div/setupsheet_international.svg',
	'nla': 'div/setupsheet_nla.svg',
};
var dl;

var GENDERS = ['m', 'f'];
var MIN_LENGTHS = {
	'bundesliga-2016': {
		m: 7,
		f: 4,
	},
	'default': {
		m: 8,
		f: 4,
	},
	international: {
		m: 4,
		f: 4,
	},
	nla: {
		m: 8,
		f: 4,
	},
};
var MAX_LENGTH = 23;
var EXTRA_LINES = {
	'bundesliga-2016': 2,
	'default': 2,
	international: 0,
	nla: 2,
};
var EU_COUNTRIES = [
	'AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN',
	'FRA', 'DEU', 'GRC', 'HUN', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX',
	'MLT', 'NLD', 'POL', 'PRT', 'ROU', 'SVK', 'SVN', 'ESP', 'SWE', 'GBR'];

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

function _ranking_str(p) {
	return (p.ranking ? p.ranking + (p.ranking_d ? '-D' + p.ranking_d : '') : '');
}

function _ranking_name(p) {
	return (p.ranking ? p.ranking + (p.ranking_d ? '-D' + p.ranking_d : '') + ' ' : '') + p.name;
}

function _cmp_players(p1, p2) {
	if (p1.ranking || p2.ranking) {
		if (!p1.ranking) return 1;
		if (!p2.ranking) return -1;

		if (p1.ranking < p2.ranking) return -1;
		if (p1.ranking > p2.ranking) return 1;
	}

	return utils.cmp(p1.name, p2.name);
}

function calc_listed(event) {
	var _add = function(p) {
		var g_players = team_res[p.gender];

		if (!g_players.some(function(added_p) {
			return added_p.name === p.name;
		})) {
			g_players.push(p);
		}
	};

	var res = [];
	var team_res;
	for (var team_id = 0;team_id < 2;team_id++) {
		team_res = {
			m: [],
			f: [],
		};
		res.push(team_res);

		event.matches.forEach(function(match) {
			var setup = match.setup;
			setup.teams[team_id].players.forEach(function(p, player_id) {
				if (event.all_players) {
					p = utils.find(event.all_players[team_id], function(ap) {
						return ap.name === p.name;
					}) || p;
				}

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

		team_res.m.sort(_cmp_players);
		team_res.f.sort(_cmp_players);
	}

	if (event.all_players && !res[0].m.length && !res[0].f.length && !res[1].m.length && !res[1].f.length) {
		var sheet_name = sheet_name_for(event.league_key);

		res = event.all_players.map(function(aps) {
			team_res = {
				m: [],
				f: [],
			};
			if (aps.length <= MAX_LENGTH) {
				aps.forEach(_add);
				team_res.m.sort(_cmp_players);
				team_res.f.sort(_cmp_players);
			} else if (aps.every(function(p) {
				return p.ranking;
			})) {
				aps.forEach(_add);
				team_res.m.sort(_cmp_players);
				team_res.f.sort(_cmp_players);

				var ROW_COUNT = 18;

				var desired_player_counts = MIN_LENGTHS[sheet_name];
				var total_count = desired_player_counts.f + desired_player_counts.m;
				var count_m = parseInt(Math.ceil(ROW_COUNT * desired_player_counts.m / total_count));
				var count_f = parseInt(Math.ceil(ROW_COUNT * desired_player_counts.f / total_count));

				team_res.m = team_res.m.slice(0, count_m);
				team_res.f = team_res.f.slice(0, count_f);
			}
			return team_res;
		});
	}
	return res;
}

function available_players(s, listed, team_id, gender) {
	var listed_by_name = {};
	listed.forEach(function(lp) {
		listed_by_name[lp.name] = lp;
	});

	if (! s.event.all_players) {
		return [];
	}
	var res = [];
	s.event.all_players[team_id].forEach(function(p) {
		if (p.gender !== gender) return;
		if (! listed_by_name[p.name]) {
			res.push(p);
		}
	});

	res.sort(_cmp_players);

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

function calc_config(ev) {
	// Guess
	var known_matches = {
		m: [],
		f: [],
	};
	ev.matches.forEach(function(match) {
		var setup = match.setup;
		var p1gender = eventutils.guess_gender(setup, 0);
		var match_key = (setup.eventsheet_id || setup.match_name);
		var mnum_m = /^([0-9]+)\./.exec(match_key);
		var mnum = mnum_m ? parseInt(mnum_m[0]) : 0;
		if (setup.is_doubles) {
			var p2gender = eventutils.guess_gender(setup, 1);
			if (p1gender === p2gender) {
				// Level doubles
				known_matches[p1gender].push({
					key: match_key,
					limit: 2,
					order: 1000 + mnum,
				});
			} else {
				// Mixed
				var match_info = {
					limit: 1,
					key: match_key,
					order: 3000 + mnum,
				};
				known_matches[p1gender].push(match_info);
				known_matches[p2gender].push(match_info);
			}
		} else {
			// Singles
			known_matches[p1gender].push({
				limit: 1,
				key: match_key,
				order: 2000 + mnum,
			});
		}
	});

	function _calc_limits(ar) {
		var res = {};
		ar.forEach(function(km) {
			res[km.key] = km.limit;
		});
		return res;
	}

	function _get_res(ar) {
		ar.sort(utils.cmp_key('order'));
		var res = ar.map(function(km) {
			return km.key;
		});
		res.push('backup');
		if (eventutils.is_bundesliga(ev.league_key)) {
			res.push('present');
		}
		return res;
	}

	var res = {
		m: _get_res(known_matches.m),
		f: _get_res(known_matches.f),
		limits: {
			m: _calc_limits(known_matches.m),
			f: _calc_limits(known_matches.f),
		},
	};
	function _extend_dark(small, large) {
		while (small.length < large.length) {
			small.splice(0, 0, 'dark');
		}
	}
	_extend_dark(res.m, res.f);
	_extend_dark(res.f, res.m);
	return res;
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
		var limit = cfg.limits[gender][col];
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

	var player;
	if (player_name[0] === '{') {
		player = JSON.parse(player_name);
	} else {
		player = {
			name: player_name,
			gender: gender,
		};
		var m = /^(?:[0-9]+-)?([0-9]+)(?:-D([0-9]+))?\s+(.+)$/.exec(player_name);
		if (m) {
			player.ranking = parseInt(m[1]);
			if (m[2]) {
				player.ranking_d = parseInt(m[2]);
			}
			player.name = m[3];
		}
	}
	listed[team_id][gender].push(player);

	rerender(state);
}

function on_add_change(e) {
	var select = e.target;
	var val = select.value;
	if (!val) {
		return;
	}
	if ((val === '__add_manual')) {
		var player_name = prompt(state._('setupsheet:enter player name'));
		if (!player_name) {
			select.value = '';
			return;
		}
		uiu.el(select, 'option', {
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
	cfg = calc_config(s.event);
	if (!cfg) {
		uiu.show(err_display);
		uiu.text(err_display, 'Unsupported league: ' + s.event.league_key);
		return;
	}
	listed = calc_listed(s.event);
	cur_players = calc_cur_players(cfg, s.event);
	rerender(s);
}

function _find_player(all_players, p) {
	return utils.find(all_players, function(ap) {
		return ap.name === p.name;
	});
}

function _find_noneu(cur_players, team, team_id) {
	var noneu = [];
	for (var match_name in cur_players) {
		cur_players[match_name][team_id].forEach(function(p) {
			p = _find_player(team.m, p) || _find_player(team.f, p) || p;
			if (p.nationality &&
					!utils.includes(EU_COUNTRIES, p.nationality) &&
					!noneu.includes(p.name)) {
				noneu.push(p.name);
			}
		});
	}
	return noneu;
}

function check_setup(s, team, team_id, cur_players) {
	var noneu;
	var res = [];

	var match_str = function(match_id, players, rankings) {
		return match_id + ': ' + players.map(function(p, p_id) {
			return p.name + ' #' + rankings[p_id];
		}).join(' / ');
	};

	var check = function check(match0_id, match1_id, is_doubles) {
		var calc_rankings = function(players) {
			return utils.filter_map(players, function(p) {
				p = _find_player(team.m, p) || _find_player(team.f, p) || p;

				return is_doubles ? (p.ranking_d || p.ranking) : p.ranking;
			});
		};

		var match0 = cur_players[match0_id];
		var match1 = cur_players[match1_id];

		if (!match0) {
			report_problem.silent_error('setupsheet: Could not find match ' + match0_id);
			return;
		}
		if (!match1) {
			report_problem.silent_error('setupsheet: Could not find match ' + match1_id);
			return;
		}

		var match0_players = match0[team_id];
		var match1_players = match1[team_id];

		var match0_rankings = calc_rankings(match0_players);
		var match1_rankings = calc_rankings(match1_players);

		var pcount = is_doubles ? 2 : 1;
		if ((match0_rankings.length < pcount) || (match1_rankings.length < pcount)) {
			return; // Incomplete player count or ranking information
		}

		var sum0 = utils.sum(match0_rankings);
		var sum1 = utils.sum(match1_rankings);
		if ((sum0 > sum1) || ((sum0 === sum1) && (utils.min(match0_rankings) > utils.min(match1_rankings)))) {
			res.push(s._('setupsheet:rank warning', {
				m0: match_str(match0_id, match0_players, match0_rankings),
				m1: match_str(match1_id, match1_players, match1_rankings),
			}));
		}
	};

	var _by_players = function(filterp) {
		var ret = {};
		for (var match_name in cur_players) {
			if ((match_name === 'backup') || (match_name === 'present')) {
				continue;
			}
			cur_players[match_name][team_id].forEach(function(p) {
				if (!filterp(p)) return;

				var matches = ret[p.name];
				if (!matches) {
					ret[p.name] = matches = [];
				}
				matches.push(match_name);
			});
		}

		return ret;
	};

	var _match_type = function(match_name) {
		return match_name.replace(/[^a-zA-Z]/g, '');
	};

	var league_key = s.event.league_key;
	var backup_counts = GENDERS.map(function(gender) {
		var backups = cur_players.backup;
		if (!backups) return 0;
		return backups[team_id].filter(function(p) {
			return p.gender === gender;
		}).length;
	});
	var matches_by_pname = _by_players(function() {return true;});

	for (var pname in matches_by_pname) {
		var pmatches = matches_by_pname[pname];
		var count = pmatches.length;
		if (count > 2) {
			res.push(s._('setupsheet:3 matches', {
				pname: pname,
				count: count,
				matches: pmatches.join(', '),
			}));
		}

		pmatches.forEach(function(pm, pm_idx) {
			for (var i = pm_idx + 1;i < pmatches.length;i++) {
				if (_match_type(pmatches[i]) === _match_type(pm)) {
					res.push(s._('setupsheet:discipline twice', {
						pname: pname,
						m0: pm,
						m1: pmatches[i],
					}));
				}
			}
		});
	}

	if (eventutils.is_bundesliga(league_key)) {
		check('1.HE', '2.HE', false);
		check('1.HD', '2.HD', true);

		// §9.6 BLO-DB
		if ((backup_counts[0] > 2) || (backup_counts[1] > 2)) {
			res.push(s._('setupsheet:buli backup'));
		}

		// §9.2 BLO-DB
		var player_counts_by_gender = GENDERS.map(function(gender) {
			var mbp = _by_players(function(p) {
				p = _find_player(team.m, p) || _find_player(team.f, p) || p;
				return p.gender === gender;
			});
			return Object.keys(mbp).length;
		});
		if (((player_counts_by_gender[0] >= 7) && (backup_counts[0] > 0)) || ((player_counts_by_gender[1] >= 4) && (backup_counts[1] > 0))) {
			res.push(s._('setupsheet:buli backup7'));
		}

		// §5.1 BLO-DB
		noneu = _find_noneu(cur_players, team, team_id);
		if (noneu.length > 1) {
			res.push(s._('setupsheet:buli non-eu', {names: noneu.join(', ')}));
		}
	} else if (eventutils.is_german8(league_key)) {
		check('1.HE', '2.HE', false);
		check('2.HE', '3.HE', false);
		check('1.HD', '2.HD', true);
		if ((backup_counts[0] > 1) || (backup_counts[1] > 1)) {
			res.push(s._('setupsheet:too many backups'));
		}
	} else if (league_key === 'RLM-2016') {
		check('1.HE', '2.HE', false);
		check('2.HE', '3.HE', false);
		check('1.HD', '2.HD', true);
		if ((backup_counts[0] > 1) || (backup_counts[1] > 1)) {
			res.push(s._('setupsheet:too many backups'));
		}
		// §2.12.9.5.2: non-EU players
		noneu = _find_noneu(cur_players, team, team_id);
		if (noneu.length > 1) {
			res.push(s._('setupsheet:rlm non-eu', {names: noneu.join(', ')}));
		}
	} else if (!utils.includes(['NLA-2017', 'NLA-2019', 'international-2017'], league_key)) {
		// NLA: crazy separate system
		// international: no checks necessary, every discipline once

		report_problem.silent_error('Unsupported league for checks: ' + league_key);
	}

	return res;
}

function rerender(s) {
	var regular_nobackup = eventutils.regular_nobackup(s.event.league_key);

	listed.forEach(function(team, team_id) {
		var table = uiu.qs('#setupsheet_table_team' + team_id);
		uiu.empty(table);
		var thead = uiu.el(table, 'thead');
		var thead_tr = uiu.el(thead, 'tr');
		uiu.el(thead_tr, 'th', {
			'class': 'setupsheet_team_name',
			'colspan': (1 + cfg.m.length),
		}, s.event.team_names[team_id]);
		var tbody = uiu.el(table, 'tbody');
		GENDERS.forEach(function(gender) {
			var header_tr = uiu.el(tbody, 'tr');
			uiu.el(header_tr, 'th', 'setupsheet_header', s._('setupsheet:header|' + gender));
			cfg[gender].forEach(function(col) {
				if (col === 'dark') {
					uiu.el(header_tr, 'th', 'setupsheet_dark');
				} else {
					uiu.el(header_tr, 'th', {}, col_text(s, col));
				}
			});

			var listed_g_players = team[gender];
			listed_g_players.forEach(function(p) {
				var tr = uiu.el(tbody, 'tr');
				var first_cell = uiu.el(tr, 'td', 'setupsheet_player_name');
				if (p.ranking) {
					uiu.el(first_cell, 'span', 'setupsheet_ranking', _ranking_str(p));
				}
				uiu.el(first_cell, 'span', {}, p.name);
				var btn = uiu.el(first_cell, 'button', {
					'class': 'setupsheet_delete_button image-button textsize-button',
					'data-team_id': team_id,
					'data-player_json': JSON.stringify(p),
					'data-gender': gender,
				});
				click.on(btn, on_delete_click);
				uiu.el(btn, 'span');
				cfg[gender].forEach(function(col) {
					if ((col === 'dark') || (regular_nobackup && (col === 'backup') && p.regular)) {
						uiu.el(tr, 'td', 'setupsheet_dark');
					} else {
						var plays_in = cur_plays_in(col, team_id, p);
						var td = uiu.el(tr, 'td', {
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

			var new_tr = uiu.el(tbody, 'tr');
			var new_td = uiu.el(new_tr, 'td', {
				colspan: (1 + cfg[gender].length),
				'class': 'setupsheet_new',
			});
			var new_form = uiu.el(new_td, 'form', {
				'class': 'inline-form setupsheet_new_form',
				'data-team_id': team_id,
				'data-gender': gender,
			});
			new_form.addEventListener('submit', on_new_form_submit);

			var avp = available_players(s, listed_g_players, team_id, gender);
			if (avp.length === 0) {
				uiu.el(new_form, 'input', {
					'class': 'setupsheet_newselect_' + team_id + '_' + gender,
					required: 'required',
					placeholder: s._('setupsheet:new player|' + gender),
				});
			} else {
				var new_select = uiu.el(new_form, 'select', {
					'class': 'setupsheet_newselect_' + team_id + '_' + gender,
					required: 'required',
				});
				avp.forEach(function(ap) {
					uiu.el(new_select, 'option', {
						value: JSON.stringify(ap),
					}, _ranking_name(ap));
				});
				uiu.el(new_select, 'option', {
					value: '__add_manual',
					'class': 'setupsheet_option_manual',
				}, s._('setupsheet:new player|' + gender));
				new_select.addEventListener('change', on_add_change);
			}

			uiu.el(new_form, 'button', {
				'data-i18n': 'setupsheet:add',
				'role': 'submit',
			}, s._('setupsheet:add'));
		});

		check_setup(s, team, team_id, cur_players).forEach(function(errmsg) {
			var tr = uiu.el(tbody, 'tr');
			uiu.el(tr, 'td', {
				'class': 'setupsheet_warning',
				colspan: (1 + cfg.m.length),
			}, errmsg);
		});
	});

	render_svg(s);
}

function sheet_name_for(league_key) {
	return (
		eventutils.is_bundesliga(league_key) ? 'bundesliga-2016' :
		(((league_key === 'NLA-2017') || (league_key === 'NLA-2019')) ? 'nla' :
		((league_key === 'international-2017') ? 'international' :
		'default'
	)));
}

function render_svg(s) {
	var league_key = s.event.league_key;
	var sheet_name = sheet_name_for(league_key);
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

function calc_linecounts(player_counts, minlens, maxlen, empty_lines) {
	var res = {};
	GENDERS.forEach(function(gender) {
		res[gender] = Math.max(player_counts[gender], minlens[gender]);
	});
	var changed = true;
	while (changed) {
		changed = false;
		GENDERS.forEach(function(gender) {
			if ((res.m + res.f < maxlen) && (res[gender] < player_counts[gender] + empty_lines)) {
				res[gender]++;
				changed = true;
			}
		});
	}
	return res;
}

function fill_svg(s, svg_root, sheet_name, team_id)  {
	var event = s.event;
	var regular_nobackup = eventutils.regular_nobackup(event.league_key);
	fill_text(svg_root, 'tournament_name', event.tournament_name || '');
	fill_text(svg_root, 'event_name', event.event_name);
	fill_text(svg_root, 'setup_desc', s._('setupsheet:setup|' + team_id));
	fill_text(svg_root, 'team_name', event.team_names[team_id]);
	fill_text(svg_root, 'date', event.date);

	var yoffset = 0;
	var line_counts = calc_linecounts({
		m: listed[team_id].m.length,
		f: listed[team_id].f.length,
	}, MIN_LENGTHS[sheet_name], MAX_LENGTH, EXTRA_LINES[sheet_name]);

	GENDERS.forEach(function(gender) {
		var num_lines = line_counts[gender];
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

					if (regular_nobackup && (col === 'backup') && listed_player.regular) {
						var darkbackup_rect = uiu.qs('rect[data-fill-id="darkbackup"]', g);
						darkbackup_rect.removeAttribute('visibility');
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
		uiu.qsEach('rect', function(rect) {
			if (rect.getAttribute('data-fill-id') === 'darkbackup') {
				return;
			}
			var h = parseFloat(rect.getAttribute('height'));
			rect.setAttribute('height', h + height * (num_lines - 1));
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
	bupui.esc_stack_push(ask_hide_and_back);
	control.set_current(state);

	uiu.show_qs('.setupsheet_layout');
	if (state.event && state.event.matches && state.event.all_players) {
		uiu.hide_qs('.setupsheet_loading-icon');
		ui_render_init(state);
	} else {
		uiu.show_qs('.setupsheet_loading-icon');
		network.list_full_event(state, function(err) {
			uiu.visible_qs('.setupsheet_error', !!err);
			uiu.hide_qs('.setupsheet_loading-icon');
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

	bupui.esc_stack_pop();
	state.ui.setupsheet_visible = false;
	uiu.hide_qs('.setupsheet_layout');
	return true;
}

function ask_hide_and_back() {
	if (!cfg) {
		return hide_and_back();
	}

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
	// Tests only
	/*@DEV*/
	available_players: available_players,
	calc_config: calc_config,
	calc_linecounts: calc_linecounts,
	check_setup: check_setup,
	/*/@DEV*/
};


})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var bupui = require('./bupui');
	var click = require('./click');
	var control = require('./control');
	var downloader = require('./downloader');
	var eventsheet = require('./eventsheet');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var printing = require('./printing');
	var refmode_referee_ui = null; // break cycle, should be require('./refmode_referee_ui');
	var report_problem = null; // break cycle, should be require('./report_problem');
	var render = require('./render');
	var settings = require('./settings');
	var svg2pdf = require('./svg2pdf');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = setupsheet;
}
/*/@DEV*/