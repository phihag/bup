'use strict';
var displaymode = (function() {

var ALL_STYLES = [
	'oncourt',
	'international',
	'teamcourt',
	'teamcourt_pause',
	'stripes',
	'2court',
	'top+list',
	'tim',
	'onlyplayers',
	'clubplayers',
	'clubplayerslr',
	'onlyscore',
	'castall',
	'tournament_overview',
	'andre',
];
var ALL_COLORS = ['c0', 'c1', 'cbg', 'cfg', 'cbg2', 'cbg3', 'cbg4', 'cfg2', 'cfg3', 'ct', 'cserv', 'cserv2', 'crecv', 'cborder', 'ctim_blue', 'ctim_active'];

var _hide_cursor_timeout;

function show_cursor() {
	if (_hide_cursor_timeout) {
		clearTimeout(_hide_cursor_timeout);
	} else {
		var d_container = uiu.qs('.displaymode_layout');
		var ads_container = uiu.qs('.d_ads');
		d_container.style.cursor = 'default';
		ads_container.style.cursor = 'default';
	}
	_hide_cursor_timeout = setTimeout(hide_cursor, 5000);
}

function hide_cursor() {
	_hide_cursor_timeout = null;
	var d_container = uiu.qs('.displaymode_layout');
	var ads_container = uiu.qs('.d_ads');
	d_container.style.cursor = 'none';
	ads_container.style.cursor = 'none';
}

function _setup_autosize(el, right_node, determine_height) {
	autosize.maintain(el, function() {
		var parent_node = el.parentNode;
		var w = parent_node.offsetWidth;
		if (right_node) {
			var prect = parent_node.getBoundingClientRect();
			var rrect = right_node.getBoundingClientRect();
			w = Math.max(10, Math.min(w, rrect.left - prect.left));
		}

		var h;
		if (determine_height) {
			h = determine_height(parent_node);
		} else {
			h = parent_node.offsetHeight / 1.1;
		}

		return {
			width: w,
			height: h,
		};
	});
}

function _calc_matchscore(matches) {
	var res = [0, 0];
	matches.forEach(function(m) {
		var winner = calc.match_winner(m.setup.counting, m.network_score || []);
		if (winner === 'left') {
			res[0] += 1;
		} else if (winner === 'right') {
			res[1] += 1;
		}
	});
	return res;
}

function _doubles_name(player) {
	if (player.firstname && player.lastname) {
		return player.firstname[0] + '.\xa0' + player.lastname;
	}
	
	var m = /^(.).*?\s+(\S+)$/.exec(player.name);
	if (!m) {
		return player.name;
	}
	return m[1] + '.\xa0' + m[2];
}

function _lastname(player) {
	if (player.lastname) {
		return player.lastname;
	}

	var m = /^(.).*?\s+(\S+)$/.exec(player.name);
	if (!m) {
		return player.name;
	}
	return m[2];
}

function _list_render_player_names(container, players, winning) {
	var names_str;
	if (players.length === 0) {
		names_str = 'TBA';
	} else if (players.length === 1) {
		names_str = players[0].name;
	} else {
		names_str = _doubles_name(players[0]) + ' / ' + _doubles_name(players[1]);
	}
	var div = uiu.el(
		container, 'div', {
			'class': 'display_list_player_names_wrapper',
		}
	);
	var span = uiu.el(
		div, 'span', {
			'class': (winning ? 'display_list_winning' : ''),
		}, names_str
	);
	_setup_autosize(span);
}

function _list_render_team_name(tr, team_name) {
	var th = uiu.el(tr, 'th', {
		'class': 'display_list_teamname',
	});
	var div = uiu.el(th, 'div');
	var span = uiu.el(div, 'span', {}, team_name);
	return span;
}

function _calc_max_games(event) {
	var res = 0;
	event.matches.forEach(function(match) {
		res = Math.max(res, calc.max_game_count(match.setup.counting));
	});
	return res;
}

function hash(settings, event) {
	return {
		style: settings.displaymode_style,
		colors: calc_colors(settings, event),
		scale: settings.d_scale,
		court_id: settings.displaymode_court_id,
		reverse_order: settings.displaymode_reverse_order,
		courts: utils.deep_copy(event.courts),
		matches: utils.deep_copy(event.matches),
	};
}

function determine_server(match, current_score) {
	var team_id;
	if (typeof match.network_team1_serving === 'boolean') {
		team_id = match.network_team1_serving ? 0 : 1;
	}
	if (!match.network_teams_player1_even) {
		return {
			team_id: team_id,
		}; // This ensures that server.player_id is undefined
	}

	var player_id = 0;
	if (match.setup.is_doubles) {
		player_id = (match.network_teams_player1_even[team_id] == (current_score[team_id] % 2 == 0)) ? 0 : 1;
	}

	return {
		team_id: team_id,
		player_id: player_id,
	};
}

function _match_by_court(event, court) {
	return court.match_id ? utils.find(event.matches, function(m) {
		return court.match_id === m.setup.match_id;
	}) : null;
}

function _render_court_display(container, event, court, top_team_idx) {
	var match = _match_by_court(event, court);
	if (top_team_idx === undefined) {
		top_team_idx = 0;
		if (match && court.chair) {
			var team0_left = network.calc_team0_left(match);
			if (typeof team0_left == 'boolean') {
				top_team_idx = (team0_left == (court.chair === 'west')) ? 0 : 1;
			}
		}
	}
	var bottom_team_idx = 1 - top_team_idx;

	var team_names = event.team_names || [];
	var nscore = (match && match.network_score) ? match.network_score : [];
	var match_setup = match ? match.setup : {
		teams: [{
			name: team_names[0],
			players: [],
		}, {
			name: team_names[1],
			players: [],
		}],
	};
	var prev_scores = nscore.slice(0, -1);
	var current_score = (nscore.length > 0) ? nscore[nscore.length - 1] : ['', ''];

	var top_current_score = uiu.el(container, 'div', {
		'class': 'dcs_current_score_top',
	}, current_score[top_team_idx]);
	var bottom_current_score = uiu.el(container, 'div', {
		'class': 'dcs_current_score_bottom',
	}, current_score[bottom_team_idx]);

	var top_team = match_setup.teams[top_team_idx];

	var player_container = uiu.el(container, 'div', {
		'class': (match_setup.is_doubles ? 'dcs_player_names_doubles' : 'dcs_player_names_singles'),
	});
	var server = match ? determine_server(match, current_score) : {};
	for (var player_id = 0;player_id < top_team.players.length;player_id++) {
		var top_is_serving = (top_team_idx === server.team_id) && (player_id === server.player_id);
		var top_player_name_container = uiu.el(player_container, 'div', {
			'class': 'dcs_player_name' + (top_is_serving ? ' dcs_player_serving' : ''),
		});
		var top_player_name_span = uiu.el(
			top_player_name_container, 'span', {}, top_team.players[player_id].name);
		_setup_autosize(top_player_name_span, top_current_score);
	}

	var top_row = uiu.el(container, 'div', {
		'class': 'dcs_team_row dcs_team_row_top',
	});
	var top_prev_scores_container = uiu.el(top_row, 'div', {
		'class': 'dcs_prev_scores_top',
	});
	prev_scores.forEach(function(ps) {
		uiu.el(top_prev_scores_container, 'div', {
			'class': ((ps[top_team_idx] > ps[bottom_team_idx]) ? 'dcs_prev_score_won' : 'dcs_prev_score_lost'),
		}, ps[top_team_idx]);
	});
	var top_team_el = uiu.el(top_row, 'div', {
		'class': 'dcs_team_name',
	});
	var top_team_span = uiu.el(top_team_el, 'span', {}, top_team.name);

	var bottom_row = uiu.el(container, 'div', {
		'class': 'dcs_team_row dcs_team_row_bottom',
	});
	var bottom_prev_scores_container = uiu.el(bottom_row, 'div', {
		'class': 'dcs_prev_scores_bottom',
	});
	prev_scores.forEach(function(ps) {
		uiu.el(bottom_prev_scores_container, 'div', {
			'class': ((ps[bottom_team_idx] > ps[top_team_idx]) ? 'dcs_prev_score_won' : 'dcs_prev_score_lost'),
		}, ps[bottom_team_idx]);
	});
	var bottom_team = match_setup.teams[bottom_team_idx];
	var bottom_team_el = uiu.el(bottom_row, 'div', {
		'class': 'dcs_team_name',
	});
	var bottom_team_span = uiu.el(bottom_team_el, 'span', {}, bottom_team.name);

	player_container = uiu.el(container, 'div', {
		'class': (match_setup.is_doubles ? 'dcs_player_names_doubles' : 'dcs_player_names_singles'),
	});
	for (player_id = 0;player_id < bottom_team.players.length;player_id++) {
		var bottom_is_serving = (bottom_team_idx === server.team_id) && (player_id === server.player_id);
		var bottom_player_name_container = uiu.el(player_container, 'div', {
			'class': 'dcs_player_name' + (bottom_is_serving ? ' dcs_player_serving' : ''),
		});
		var bottom_player_name_span = uiu.el(
			bottom_player_name_container, 'span', {}, bottom_team.players[player_id].name);
		_setup_autosize(bottom_player_name_span, bottom_current_score);
	}

	_setup_autosize(top_team_span);
	_setup_autosize(bottom_team_span);
}

function render_top(s, container, event) {
	if (! event.courts) {
		return;
	}

	var courts_container = uiu.el(container, 'div', {
		'class': 'display_courts_container',
	});
	var court_count = event.courts.length;
	var court_width = Math.floor((100.0 - (4 * (court_count - 1))) / court_count);
	for (var court_idx = 0;court_idx < court_count;court_idx++) {
		if (court_idx > 0) {
			uiu.el(courts_container, 'div', {
				'class': 'display_courts_separator',
			});
		}

		var court_container = uiu.el(courts_container, 'div', {
			'class': 'display_courts_court',
			'style': ('width: ' + court_width + '%;'),
		});

		var real_court_idx = s.settings.displaymode_reverse_order ? (court_count - 1 - court_idx) : court_idx;
		var court = event.courts[real_court_idx];
		_render_court_display(court_container, event, court);
	}
}

function namestr(players) {
	if (players.length === 0) {
		return '(Wird ermittelt)';
	} else if (players.length === 1) {
		return players[0].name;
	} else {
		return _doubles_name(players[0]) + ' / ' + _doubles_name(players[1]);
	}
}

function _match_name(setup) {
	var res = '';
	if (setup.event_name) {
		res += setup.event_name;
	}
	if (setup.match_name) {
		if (res) {
			res += ' ';
		}
		res += setup.match_name;
	}
	return res;
}

function _tournament_overview_render_players(tr, players) {
	var td = uiu.el(tr, 'td', 'd_to_team');
	uiu.el(td, 'span', {}, namestr(players));
}

function render_tournament_overview(s, container, event) {
	var max_game_count = _calc_max_games(event);
	var colors = calc_colors(s.settings, event);

	var table = uiu.el(container, 'table', 'd_to_table');
	var tbody = uiu.el(table, 'tbody');

	event.courts.forEach(function(court, idx) {
		var match = _match_by_court(event, court);
		var nscore = (match ? match.network_score : 0) || [];

		var tr = uiu.el(tbody, 'tr', {
			style: (
				'background:' + ((idx % 2 === 0) ? colors.bg : colors.bg3) + ';' +
				'color:' + colors.fg + ';'
			),
		});
		uiu.el(tr, 'td', 'd_to_court', court.label || compat.courtnum(court.id));
		if (match) {
			var setup = match.setup;
			uiu.el(tr, 'td', {
				'class': 'd_to_matchname',
				style: (
					'color:' + colors.fg2 + ';'
				),
			}, _match_name(setup));
			_tournament_overview_render_players(tr, setup.teams[0].players);
			_tournament_overview_render_players(tr, setup.teams[1].players);
		} else {
			uiu.el(tr, 'td', {
				colspan: 3,
			});
		}
		for (var game_idx = 0;game_idx < max_game_count;game_idx++) {
			var score_td = uiu.el(tr, 'td', {
				'class': 'd_to_score',
				style: 'border-color:' + colors.border,
			});

			var n = nscore[game_idx];
			if (match && n) {
				var gwinner = calc.game_winner(match.setup.counting, game_idx, n[0], n[1]);
				uiu.el(score_td, 'span', {
					'class': ((gwinner === 'left') ? 'd_to_winning' : ''),
				}, n[0]);
				uiu.el(score_td, 'span', {
					'class': 't_to_vs',
				}, ':');
				uiu.el(score_td, 'span', {
					'class': ((gwinner === 'right') ? 'd_to_winning' : ''),
				}, n[1]);
			}
		}
	});
}

function render_castall(s, container, event, colors) {
	if (! event.courts) {
		uiu.el(container, 'div', 'error', s._('displaymode:no courts'));
		return;
	}
	var scale = s.settings.d_scale / 100;

	uiu.el(container, 'div', {
		'class': 'd_castall_bg',
		'style': ('background: ' + colors.t),
	});

	var abbrevs = extradata.abbrevs(event);
	var logo_url = extradata.logo_url(event);
	var court_count = event.courts.length;
	for (var court_idx = 0;court_idx < court_count;court_idx++) {
		var real_court_idx = s.settings.displaymode_reverse_order ? (court_count - 1 - court_idx) : court_idx;
		var court = event.courts[real_court_idx];
		var match = _match_by_court(event, court);
		var counting = match ? match.setup.counting : eventutils.default_counting(event.league_key);
		var max_games = counting ? calc.max_game_count(counting) : 0;
		var nscore = (match ? match.network_score : 0) || [];

		var match_container = uiu.el(container, 'div', {
			'class': 'd_castall_match',
			'style': (
				((court_idx === 0) ? 'left' : 'right') + ':3%;' +
				'background:' + colors.bg + ';' +
				'width:' + ((85 + (max_games * 41) + (logo_url ? 90 : 0)) * scale) + 'px;' +
				'height:' + (60 * scale) + 'px;' +
				'border-radius:' + (6 * scale) + 'px'),
		});

		var mname_container = uiu.el(match_container, 'div', {
			'class': 'd_castall_mname',
			'style': ('margin:0 ' + (3 * scale) + 'px;font-size:' + (15 * scale) + 'px;width:' + (15 * scale) + 'px'),
		});
		var mname = match ? match.setup.match_name.split(/(?=[^.])/) : '';
		for (var i = 0;i < mname.length;i++) {
			uiu.el(mname_container, 'span', {}, mname[i] || '');
		}

		var teams_container = uiu.el(match_container, 'div', 'd_castall_teams');
		abbrevs.forEach(function(abbrev, team_id) {
			var team_block = uiu.el(teams_container, 'div', {
				'class': 'd_castall_team',
				style: (
					'height:' + (28.5 * scale) + 'px;' +
					'padding-top:' + (1 * scale) + 'px;' +
					((team_id === 1) ? 'padding-bottom:' + (1 * scale) + 'px': '')
				),
			});
			var fg_color = utils.contrast_color(colors[team_id], colors.bg, colors.fg);
			var team_name_container = uiu.el(team_block, 'div', {
				style: (
					'font-family: monospace;' +
					'background:' + colors[team_id] + ';' +
					'color:' + fg_color + ';' +
					'width:' + (45 * scale) + 'px;' +
					'height: 100%;' +
					'display: flex;' +
					'justify-content: center;' +
					'align-items: center;' +
					'font-size:' + (22 * scale) + 'px;'),
			});
			uiu.el(team_name_container, 'span', {}, abbrev);

			uiu.el(team_block, 'div', {
				style: (
					'height: 100%;' +
					'background:' + ((match && (match.network_team1_serving == (team_id === 0))) ? colors.serv : colors.recv) + ';' +	
					'margin:0 ' + (1 * scale) + 'px;' +
					'width:' + (10 * scale) + 'px;'),
			});

			for (var game_idx = 0;game_idx < max_games;game_idx++) {
				var score_container = uiu.el(team_block, 'div', {
					style: (
						'background:' + colors.bg2 + ';' +
						'color:' + colors.bg + ';' +
						'width:' + (40 * scale) + 'px;' +
						'margin-right: ' + (1 * scale) + 'px;' +
						'height: 100%;' +
						'display: flex;' +
						'justify-content: center;' +
						'align-items: center;' +
						'font-size:' + (22 * scale) + 'px;'),
				});
				uiu.el(score_container, 'span', {}, nscore[game_idx] ? nscore[game_idx][team_id] : '');
			}
		});

		if (logo_url) {
			uiu.el(match_container, 'div', {
				style: (
					'height:' + (50 * scale) + 'px;' +
					'margin:' + (5 * scale) + 'px 0;' +
					'width:' + (90 * scale) + 'px;' +
					'float: left;' +
					'background: no-repeat center/contain url("' + logo_url + '");'
				),
			});
		}
	}

	// Bottom display
	var match_score = _calc_matchscore(event.matches);
	var bottom_container = uiu.el(container, 'div', 'd_castall_bottom');
	var bottom_block = uiu.el(bottom_container, 'div', {
		'class': 'd_castall_bottom_block',
		'style': (
			'background:' + colors.bg + ';' +
			'width:' + (670 * scale) + 'px;' +
			'height:' + (55 * scale) + 'px;' + 
			'border-radius:' + (12 * scale) + 'px'),
	});
	var team_names = event.team_names || [];
	for (var team_id = 0;team_id < team_names.length;team_id++) {
		var team_block = uiu.el(bottom_block, 'div', {
			'class': 'd_castall_bottom_team' + team_id,
			'style': (
				'width:' + (262 * scale) + 'px;' +
				'font-size:' + (32 * scale) + 'px;' +
				((team_id === 0) ? 'margin-left' : 'margin-right') + ':' + (8 * scale) + 'px'
			),
		});
		var team_name_span = uiu.el(team_block, 'span', {
			'class': 'd_castall_bottom_team_name',
			'style': 'color: ' + colors.fg,
		}, team_names[team_id]);
		_setup_autosize(team_name_span);

		var bottom_fg_color = utils.contrast_color(colors[team_id], colors.bg, colors.fg);
		uiu.el(bottom_block, 'div', {
			'class': 'd_castall_score' + team_id,
			'style': (
				'height:' + (54 * scale) + 'px;' +
				'margin-bottom:' + (1 * scale) + 'px;' +
				'color:' + bottom_fg_color + ';' +
				'background: ' + colors[team_id] + ';' +
				'width:' + (65 * scale) + 'px;' +
				'font-size:' + (60 * scale) + 'px'),
		}, match_score[team_id]);
	}

	var colon_container = uiu.el(bottom_container, 'div', {
		'class': 'd_castall_bcolon',
	});
	uiu.el(colon_container, 'div', {
		'style': 'font-size:' + (50 * scale) + 'px; margin-top: -0.1em;',
	}, ':');

	if (logo_url) {
		var logo_row = uiu.el(bottom_block, 'div', {
			style: (
				'position: absolute;' +
				'left: 0;' +
				'width: 100%;' +
				'top:-' + (55 * scale) + 'px;' +
				'height:' + (55 * scale) + 'px;' +
				'display: flex;' +
				'justify-content:center;'
			),
		});
		uiu.el(logo_row, 'div', {
			style: (
				'width: 0; height: 0;' +
				'border-top:' + (53.5 * scale) + 'px solid transparent;' +
				'border-right:' + (20 * scale) + 'px solid ' + colors.bg + ';' +
				'margin-top:' + (1.5 * scale) + 'px;' +
				'margin-right:' + (-1 * scale) + 'px;'
			),
		});
		var logo_mid = uiu.el(logo_row, 'div', {
			style: (
				'background:' + colors.bg + ';' +
				'border-top-left-radius:' + (5 * scale) + 'px;' +
				'border-top-right-radius:' + (5 * scale) + 'px;' +
				'height:' + (55 * scale) + 'px;' +
				'width:' + (90 * scale) + 'px;'
			),
		});
		uiu.el(logo_mid, 'div', {
			style: (
				'height:' + (45 * scale) + 'px;' +
				'margin-top: ' + (5 * scale) + 'px;' +
				'margin-bottom: ' + (5 * scale) + 'px;' +
				'width:' + (90 * scale) + 'px;' +
				'background: no-repeat center/contain url("' + logo_url + '");'
			),
		});
		uiu.el(logo_row, 'div', {
			style: (
				'width: 0; height: 0;' +
				'border-top:' + (53.5 * scale) + 'px solid transparent;' +
				'border-left:' + (20 * scale) + 'px solid ' + colors.bg + ';' +
				'margin-top:' + (1.5 * scale) + 'px;' +
				'margin-left:' + (-1 * scale) + 'px;'
			),
		});
	}
}

function render_list(container, event) {
	render_html_list(container, event); // TODO switch to svg
}

function render_html_list(container, event) {
	var max_games = _calc_max_games(event);
	var match_score = _calc_matchscore(event.matches);
	var home_winning = match_score[0] > (event.matches.length / 2);
	var away_winning = match_score[1] > (event.matches.length / 2);
	if ((match_score[0] === event.matches.length / 2) && (match_score[0] === event.matches.length / 2)) {
		// draw
		home_winning = true;
		away_winning = true;
	}
	var match_list = uiu.el(container, 'table', {
		'class': 'display_list_container',
	});
	var match_list_head = uiu.el(match_list, 'tr', {
		'class': 'display_list_thead',
	});
	uiu.el(match_list_head, 'th', {
		'class': 'display_list_match_name',
	}, '');
	var team_names = event.team_names || [];
	var home_span = _list_render_team_name(match_list_head, team_names[0]);
	var away_span = _list_render_team_name(match_list_head, team_names[1]);
	var match_score_el = uiu.el(match_list_head, 'th', {
		'class': 'display_list_matchscore',
		'colspan': max_games,
	});
	uiu.el(match_score_el, 'span', {
		'class': (home_winning ? 'display_list_winning' : ''),
	}, match_score[0]);
	uiu.el(match_score_el, 'span', {'class': 'display_list_vs'}, ' : ');
	uiu.el(match_score_el, 'span', {
		'class': (away_winning ? 'display_list_winning' : ''),
	}, match_score[1]);

	// Now that we're done with initializing the first row, actually call autosizing
	_setup_autosize(home_span);
	_setup_autosize(away_span);

	event.matches.forEach(function(m) {
		var netscore = m.network_score || [];
		var mwinner = calc.match_winner(m.setup.counting, netscore);

		var row = uiu.el(match_list, 'tr');
		uiu.el(row, 'td', {
			'class': 'display_list_match_name',
		}, m.setup.short_name || m.setup.match_name);
		var home_td = uiu.el(row, 'td', {
			'class': 'display_list_player_names' + ((mwinner === 'left') ? ' display_list_winning_players' : ''),
		});
		_list_render_player_names(home_td, m.setup.teams[0].players, (mwinner === 'left'));
		var away_td = uiu.el(row, 'td', {
			'class': 'display_list_player_names' + ((mwinner === 'right') ? ' display_list_winning_players' : ''),
		});
		_list_render_player_names(away_td, m.setup.teams[1].players, (mwinner === 'right'));

		for (var game_idx = 0;game_idx < max_games;game_idx++) {
			var score_td = uiu.el(row, 'td', {
				'class': 'display_list_game_score',
			});

			if (game_idx >= netscore.length) {
				continue;
			}
			var nscore = netscore[game_idx];
			var gwinner = calc.game_winner(m.setup.counting, game_idx, nscore[0], nscore[1]);
			uiu.el(score_td, 'span', {
				'class': ((gwinner === 'left') ? 'display_list_winning' : ''),
			}, nscore[0]);
			uiu.el(score_td, 'span', {
				'class': 'display_list_vs',
			}, ':');
			uiu.el(score_td, 'span', {
				'class': ((gwinner === 'right') ? 'display_list_winning' : ''),
			}, nscore[1]);
		}
	});
}

function render_oncourt(s, container, event, court, match, colors) {
	var nscore = extract_netscore(match);
	var current_score = (nscore.length > 0) ? nscore[nscore.length - 1] : ['', ''];
	var server = determine_server(match, current_score);
	var team_names = event.team_names || [];
	var setup = match.setup;
	var prev_scores = nscore.slice(0, -1);
	var autosizes = [];

	var outer_container = uiu.el(container, 'div', {
		style: (
			'background:' + colors.bg + ';' +
			'color:' + colors.fg + ';' +
			'width: 100%;height:100%;' +
			'display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;'
		),
	});
	var oncourt_container = uiu.el(outer_container, 'div', {
		style: 'position:relative;',
	});

	function _render_team(team_id) {
		var team = setup.teams[team_id];

		var pnames = _player_names(team, setup.is_doubles);
		var player_container = uiu.el(oncourt_container, 'div', {
			'style': (
				'height:30vh;' +
				(setup.is_doubles ?
					'' :
					'display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;'
				)
			),
		});
		pnames.forEach(function(pname, player_id) {
			var is_serving = (team_id === server.team_id) && (player_id === server.player_id);
			var player_name_container = uiu.el(player_container, 'div', {
				'style': (
					'height: 15vmin;font-size:12vmin;' +
					'white-space:pre;' +
					(is_serving ? 'color:' + colors.cserv2 + ';' : '')
				),
			});
			var player_name_span = uiu.el(
				player_name_container, 'span', {}, pname);
			autosizes.push({el: player_name_span, right_node: score_els[team_id]});
		});
	}

	var top_current_score = uiu.el(oncourt_container, 'div', {
		'style': (
			'position:absolute;right:0;top:0;' +
			'font-size: 32vmin;line-height: 32vmin;'
		),
	}, current_score[0]);
	var bottom_current_score = uiu.el(oncourt_container, 'div', {
		'style': (
			'position:absolute;right:0;bottom:0;' +
			'font-size: 32vmin;line-height: 32vmin;'
		),
	}, current_score[1]);
	var score_els = [top_current_score, bottom_current_score];

	_render_team(0);

	var middle_table = uiu.el(oncourt_container, 'table', {
		style: 'table-layout:fixed;width:100%;',
	});
	team_names.forEach(function(team_name, team_id) {
		var tr = uiu.el(middle_table, 'tr', {
			style: 'height:11vmin;',
		});
		var name_td = uiu.el(tr, 'td', {
			style: (
				'color:' + colors.fg3 + ';' +
				'font-size:10vmin;'
			),
		});
		var team_span = uiu.el(name_td, 'span', {}, team_name);
		autosizes.push({el: team_span});

		prev_scores.forEach(function(ps) {
			uiu.el(tr, 'td', {
				'style': (
					((ps[team_id] > ps[1 - team_id]) ? 'color:' + colors.serv2 + ';' : '') +
					'font-size:10vmin;text-align:right;width:3ch;'
				),
			}, ps[team_id]);
		});
	});

	_render_team(1);

	autosizes.forEach(function(aus) {
		_setup_autosize(aus.el, aus.right_node);
	});
}

function _gamescore_from_netscore(netscore, setup) {
	var gscores = [0, 0];
	netscore.forEach(function(gs, game_idx) {
		var winner = calc.game_winner(setup.counting, game_idx, gs[0], gs[1]);
		if (winner == 'left') {
			gscores[0]++;
		} else if (winner == 'right') {
			gscores[1]++;
		}
	});
	return gscores;
}

function extract_netscore(match) {
	var res = utils.deep_copy(match.network_score) || [];

	if (res.length === 0) {
		return [[0, 0]];
	}

	var counting = match.setup.counting;
	var last_game = res[res.length - 1];
	var last_winner = calc.game_winner(counting, res.length - 1, last_game[0], last_game[1]);
	if ((last_winner === 'left') || (last_winner === 'right')) {
		var mwinner = calc.match_winner(counting, res);
		if ((mwinner !== 'left') && (mwinner !== 'right')) {
			res.push([0, 0]);
		}
	}
	return res;
}

function render_andre(s, container, event, court, match, colors) {
	var nscore = extract_netscore(match);
	var gscore = _gamescore_from_netscore(nscore, match.setup);
	var is_doubles = match.setup.is_doubles;
	var pcount = is_doubles ? 2 : 1;
	var current_score = nscore[nscore.length - 1] || [];
	var server = determine_server(match, current_score);

	match.setup.teams.forEach(function(team, team_id) {
		var gwinner = calc.game_winner(match.setup.counting, nscore.length - 1, current_score[0], current_score[1]);
		var team_serving = (
			(gwinner === 'left') ? (team_id === 0) : (
			(gwinner === 'right') ? (team_id === 1) : (
			(server.team_id === team_id))));
		var points = current_score[team_id];

		var player_names = team.players.map(function(player) {
			return player.name;
		});
		while (player_names.length < pcount) {
			player_names.push('');
		}

		var team_container = uiu.el(container, 'div', {
			'class': 'd_andre_team',
			style: (
				'background:' + colors.bg + ';' +
				'color:' + colors.fg + ';'
			),
		});

		if (! compat.supports_flexbox()) { // Samsung TVs at DM O35 2017
			var table = uiu.el(team_container, 'table', {
				style: 'height: 45vh; width: 100vw; min-width: 95vw;',
			});
			var tbody = uiu.el(table, 'tbody');

			var tr1 = uiu.el(tbody, 'tr');
			var tr2 = uiu.el(tbody, 'tr');
			var trs = [tr1, tr2];

			uiu.el(tr1, 'td', {
				rowspan: 2,
				style: 'font-size: 10vh; vertical-align: middle;',
			}, gscore[team_id]);

			var is_singles = (player_names.length < 2);
			player_names.forEach(function(pn, name_idx) {
				var ptd = uiu.el(trs[name_idx], 'td', {
					rowspan: (is_singles ? 2 : 1),
					style: 'vertical-align: middle; font-size: 80px;',
				});
				uiu.el(ptd, 'span', {}, pn);
			});

			uiu.el(tr1, 'td', {
				rowspan: 2,
				style: (
					'width: 50vh;' +
					'background:' + (team_serving ? colors.fg : colors.bg) + ';' +
					'color:' + (team_serving ? colors.bg : colors.fg) + ';' +
					'text-align: center;' +
					'font-size: 40vh;'
				),
			}, points);

			if (team_id === 0) {
				uiu.el(container, 'div', {
					'class': 'd_andre_mid',
					'style': (
						'color:' + colors.fg2 + ';'
					),
				}, _match_name(match.setup));
			}
			return;
		}
		uiu.el(team_container, 'div', 'd_andre_gscore', gscore[team_id]);

		var players_container = uiu.el(team_container, 'div', 'd_andre_players');
		var player_spans = player_names.map(function(pname, player_id) {
			var pel = uiu.el(players_container, 'div', {
				'class': 'd_andre_player',
				style: (
					'height:' + (is_doubles ? '50%' : '100%') + ';'
				),
			});
			if (server && server.team_id === team_id && server.player_id === player_id) {
				uiu.el(pel, 'div', 'd_shuttle');
			}
			return uiu.el(pel, 'span', {}, pname);
		});

		var score_el = uiu.el(team_container, 'div', {
			'class': 'd_andre_score',
			style: (
				'background:' + (team_serving ? colors.fg : colors.bg) + ';' +
				'color:' + (team_serving ? colors.bg : colors.fg) + ';' +
				((team_id === 0) ? 'top' : 'bottom') + ': 0;'
			),
		}, points);

		if (team_id === 0) {
			uiu.el(container, 'div', {
				'class': 'd_andre_mid',
				'style': (
					'color:' + colors.fg2 + ';'
				),
			}, _match_name(match.setup));
		}

		player_spans.forEach(function(ps) {
			_setup_autosize(ps, score_el, function(parent_node) {
				return parent_node.offsetHeight * 0.6;
			});
		});
	});
}

function render_international(s, container, event, court, match, colors) {
	var nscore = extract_netscore(match);
	var gscore = _gamescore_from_netscore(nscore, match.setup);
	var is_doubles = match.setup.is_doubles;
	var pcount = is_doubles ? 2 : 1;
	var current_score = nscore[nscore.length - 1] || [];
	var server = determine_server(match, current_score);
	var first_game = (nscore.length < 2);
	var mwinner = calc.match_winner(match.setup.counting, nscore);
	var match_over = (mwinner === 'left') || (mwinner === 'right');

	match.setup.teams.forEach(function(team, team_id) {
		var col = colors[team_id];
		var gwinner = calc.game_winner(match.setup.counting, nscore.length - 1, current_score[0], current_score[1]);
		var team_serving = (
			(gwinner === 'left') ? (team_id === 0) : (
			(gwinner === 'right') ? (team_id === 1) : (
			(server.team_id === team_id))));

		var player_names = team.players.map(function(player) {
			return player.name;
		});
		while (player_names.length < pcount) {
			player_names.push('');
		}

		var team_container = uiu.el(container, 'div', 'd_international_team');
		var player_spans = player_names.map(function(pname, player_id) {
			var is_server = (!match_over) && team_serving && (server.player_id === player_id);
			var style = (
				'background: ' + (is_server ? col : colors.bg) + ';' +
				'color: ' + (is_server ? colors.bg : col) + ';' +
				'height: ' + (is_doubles ? '100%' : '50%') + ';'
			);

			var player_container = uiu.el(team_container, 'div', {
				'style': 'height: ' + (is_doubles ? '50%' : '100%') + ';',
				'class': 'd_international_player_container',
			});
			var pel = uiu.el(player_container, 'div', {
				style: style,
				'class': 'd_international_player',
			});
			return uiu.el(pel, 'div', {}, pname);
		});

		var right_border;
		if (! first_game) {
			right_border = uiu.el(team_container, 'div', {
				'class': 'd_international_gscore',
				style: 'background: ' + colors.bg + '; color: ' + colors.fg + ';',
			}, gscore[team_id]);
		}

		var points = current_score[team_id];
		var points_el = uiu.el(team_container, 'div', {
			'class': 'd_international_score' + ((points >= 10) ? ' d_international_score_dd' : ''),
			style: 'background: ' + (team_serving ? col : colors.bg) + '; color: ' + (team_serving ? colors.bg : col),
		}, points);
		if (!right_border) {
			right_border = points_el;
		}

		player_spans.forEach(function(ps) {
			_setup_autosize(ps, right_border, function(parent_node) {
				return parent_node.offsetHeight * 0.5;
			});
		});
	});
}

function render_tim(s, container, event, colors) {
	var max_game_count = _calc_max_games(event);
	var match_score = _calc_matchscore(event.matches);
	var team_names = event.team_names || ['', ''];
	var active_match_ids = [];
	if (event.courts) {
		active_match_ids = event.courts.map(function(c) {
			return c.match_id;
		});
	}

	var table = uiu.el(container, 'table', {
		'class': 'd_tim_table',
		'style': (
			'color:' + colors.fg + ';' +
			'border-color:' + colors.fg + ';'
		),
	});
	var thead = uiu.el(table, 'thead', {
		style: (
			'background-color:' + colors.tim_blue + ';'
		),
	});
	var top_tr = uiu.el(thead, 'tr', {
		style: 'height:20vh;',
	});
	uiu.el(top_tr, 'td');
	team_names.forEach(function(team_name) {
		uiu.el(top_tr, 'td', {
			'style': (
				'font-size:5vmin;width:26vw;'
			),
		}, team_name);
	});
	uiu.el(top_tr, 'td', {
		style: (
			'color:' + colors.tim_active + ';' +
			'font-size:12vmin'
		),
		colspan: max_game_count,
	}, match_score[0] + ' : ' + match_score[1]);

	var tbody = uiu.el(table, 'tbody');
	var match_count = event.matches.length;
	event.matches.forEach(function(match, match_num) {
		var setup = match.setup;
		var is_active = active_match_ids.includes(setup.match_id);
		var nscore = extract_netscore(match);
		if (!is_active && utils.deep_equal(nscore, [[0, 0]])) {
			// Do not list matches that have not yet been started
			nscore = [];
		}

		var tr = uiu.el(tbody, 'tr', {
			style: (
				'height:' + ((80 - 0.1 * match_count) / match_count) + 'vh;' +
				'background-color:' + ((match_num % 2 === 0) ? colors.bg : colors.tim_blue) + ';'
			),
		});
		uiu.el(tr, 'td', {}, setup.match_name);
		setup.teams.forEach(function(team) {
			uiu.el(
				tr, 'td', {
					style: (
						(is_active ? ('color:' + colors.tim_active) : '')
					),
				},
				team.players.map(_lastname).join(' - '));
		});
		for (var game_idx = 0;game_idx < max_game_count;game_idx++) {
			var gscore = nscore[game_idx];
			uiu.el(tr, 'td', {
				'style': (
					'min-width:3em;'
				),
			},
				gscore ? (gscore[0] + ' : ' + gscore[1]) : ''
			);
		}
	});
}

function render_teamcourt(s, container, event, court, match, colors) {
	var nscore = extract_netscore(match);
	var gscore = _gamescore_from_netscore(nscore, match.setup);
	var is_doubles = match.setup.is_doubles;
	var pcount = is_doubles ? 2 : 1;
	var current_score = nscore[nscore.length - 1] || [];
	var server = determine_server(match, current_score);
	var first_game = (nscore.length < 2);
	var mwinner = calc.match_winner(match.setup.counting, nscore);
	var match_over = (mwinner === 'left') || (mwinner === 'right');

	var match_name_container = uiu.el(container, 'div', {
		style: (
			'z-index:1;' +
			'position:absolute;' +
			'right: 55vh;' +
			'top:42vh;' +
			'bottom:42vh;' +
			'display:flex;align-items:center;' +
			'font-size:10vh;' +
			'color:' + colors.fg2
		),
	});
	if (s.settings.displaymode_style === 'teamcourt_pause') {
		var timer_state = _extract_timer_state(s, match);
		if (timer_state) {
			create_timer(timer_state, match_name_container, {
				style: 'margin-right:1ch',
			});
		}
	}
	uiu.el(match_name_container, 'div', {}, match.setup.match_name);

	match.setup.teams.forEach(function(team, team_id) {
		var col = colors[team_id];
		var gwinner = calc.game_winner(match.setup.counting, nscore.length - 1, current_score[0], current_score[1]);
		var team_serving = (
			(gwinner === 'left') ? (team_id === 0) : (
			(gwinner === 'right') ? (team_id === 1) : (
			(server.team_id === team_id))));

		var player_names = team.players.map(function(player) {
			return player.name;
		});
		while (player_names.length < pcount) {
			player_names.push('');
		}

		var team_container = uiu.el(container, 'div', 'd_international_team');

		var team_name_container = uiu.el(team_container, 'div', {
			style: (
				((team_id === 0) ? 'position:absolute; bottom: 0;' : '') +
				'width:100%;height:20%;' +
				'color:' + col + ';' +
				'font-size: 10vh;' +
				'display: flex;align-items: center;'
			),
		});
		var team_name_el = uiu.el(team_name_container, 'div', {}, team.name);

		var player_spans = player_names.map(function(pname, player_id) {
			var is_server = (!match_over) && team_serving && (server.player_id === player_id);
			var player_container = uiu.el(team_container, 'div', {
				'style': 'height: ' + (is_doubles ? '40%' : '80%') + ';',
				'class': 'd_international_player_container',
			});
			var pel = uiu.el(player_container, 'div', {
				style: (
					'background: ' + (is_server ? col : colors.bg) + ';' +
					'color: ' + (is_server ? colors.bg : col) + ';' +
					'height: ' + (is_doubles ? '100%' : '50%') + ';'
				),
				'class': 'd_international_player',
			});
			return uiu.el(pel, 'div', {}, pname);
		});

		var right_border;
		if (! first_game) {
			right_border = uiu.el(team_container, 'div', {
				'class': 'd_international_gscore',
				style: 'background: ' + colors.bg + '; color: ' + colors.fg + ';',
			}, gscore[team_id]);
		}

		var points = current_score[team_id];
		var points_el = uiu.el(team_container, 'div', {
			'class': 'd_international_score' + ((points >= 10) ? ' d_international_score_dd' : ''),
			style: 'background: ' + (team_serving ? col : colors.bg) + '; color: ' + (team_serving ? colors.bg : col),
		}, points);
		if (!right_border) {
			right_border = points_el;
		}

		player_spans.forEach(function(ps) {
			_setup_autosize(ps, right_border, function(parent_node) {
				return parent_node.offsetHeight * 0.65;
			});
		});
		_setup_autosize(team_name_el, right_border, function(parent_node) {
			return parent_node.offsetHeight * 0.75;
		});
	});
}

function render_stripes(s, container, event, court, match, colors) {
	var nscore = extract_netscore(match);
	var setup = match.setup;
	var max_game_count = calc.max_game_count(setup.counting);
	var team_names = event.team_names || ['', ''];
	var current_score = nscore[nscore.length - 1];
	var server = determine_server(match, current_score);
	var match_score = _calc_matchscore(event.matches);

	function _render_team(team_id) {
		var tr = uiu.el(table, 'tr');
		uiu.el(tr, 'td', {
			style: (
				'background:' + colors[team_id] + ';'
			),
		}, team_names[team_id] + ' (' + match_score[team_id] + ')');
	}

	function _render_players(team_id) {
		var tr = uiu.el(table, 'tr');
		var td = uiu.el(tr, 'td', {});
		var player_names = _player_names(setup.teams[team_id], setup.is_doubles, true);
		player_names.forEach(function(pname, player_id) {
			if (player_id !== 0) {
				uiu.el(td, 'span', {}, ' / ');
			}
			var is_serving = ((server.team_id === team_id) && (server.player_id === player_id));
			uiu.el(td, 'span', (is_serving ? {
				style: (
					'color:' + colors.serv + ';'
				),
			} : {}), pname);
		});
	}

	var table = uiu.el(container, 'table', {
		'class': 'd_stripes_table',
		'style': (
			'color:' + colors.fg + ';' +
			'background:' + colors.bg + ';'
		),
	});

	_render_team(0);
	_render_players(0);

	var score_tr = uiu.el(table, 'tr');
	var score_td = uiu.el(score_tr, 'td');

	var inner_table = uiu.el(score_td, 'table', {
		style: 'border-collapse:collapse;table-layout:fixed;width:100%;',
	});
	var border = 1;
	var width_str = ((100 - border * (max_game_count + 2)) / (max_game_count + 1) - 10) + 'vw';
	var border_str = border + 'vw';
	for (var team_id = 0;team_id < 2;team_id++) {
		var tr = uiu.el(inner_table, 'tr');
		if (team_id === 0) {
			var match_name_td = uiu.el(tr, 'td', {
				rowspan: 2,
				style: (
					'background:' + colors.bg4 + ';' +
					'word-wrap:break-word;' +
					'font-size:15vmin;' +
					'min-width:' + width_str + ';' +
					'max-width:' + width_str + ';' +
					'border-left:' + border_str + ' solid ' + colors.bg + ';' +
					'border-right:' + border_str + ' solid ' + colors.bg + ';'
				),
			});
			(setup.match_name || '').split(/(\.)/).forEach(function(part) {
				uiu.el(match_name_td, 'span', {
					style: 'display:inline-block;',
				}, part);
			});
		}

		for (var game_id = 0;game_id < max_game_count;game_id++) {
			var cur_serve = (team_id === server.team_id) && (nscore.length - 1 === game_id);
			uiu.el(tr, 'td', {
				style: (
					((team_id === 0) ? 'border-bottom' : 'border-top') + ':2vh solid ' + colors.bg + ';' +
					'background:' + colors.bg4 + ';' +
					'border-right:' + border_str + ' solid ' + colors.bg + ';' +
					'font-size:20vmin;font-weight:bold;' +
					'min-width:' + width_str + ';' +
					'max-width:' + width_str + ';' +
					(cur_serve ? 'color:' + colors.serv + ';' : '')
				),
			}, nscore[game_id] ? nscore[game_id][team_id] : '');
		}
	}
	// TODO highlight serving team
	// TODO check all colors work

	_render_players(1);
	_render_team(1);
}


function _render_court(s, container, event) {
	if (!event.courts) {
		uiu.el(container, 'div', {
			'class': 'display_error',
		}, 'Court information missing');
		return;
	}

	var cid = s.settings.displaymode_court_id;
	var court;
	for (var i = 0;i < event.courts.length;i++) {
		var c = event.courts[i];
		if (c.court_id == cid) {
			court = c;
			break;
		}
	}
	if (!court) {
		uiu.el(container, 'div', {
			'class': 'display_error',
		}, 'Court ' + JSON.stringify(cid) + ' not found');
		return;
	}

	return court;
}

function _player_names(team, is_doubles, short_doubles) {
	var pcount = is_doubles ? 2 : 1;
	var player_names = team.players.map(function(player) {
		return (short_doubles && is_doubles) ? _lastname(player) : player.name;
	});
	while (player_names.length < pcount) {
		player_names.push('');
	}
	return player_names;
}

function render_onlyplayers(s, container, event, court, match, colors) {
	var nscore = extract_netscore(match);
	var is_doubles = match.setup.is_doubles;
	var current_score = nscore[nscore.length - 1] || [];
	var server = determine_server(match, current_score);
	var mwinner = calc.match_winner(match.setup.counting, nscore);
	var match_over = (mwinner === 'left') || (mwinner === 'right');
	var logo_urls = extradata.team_logos(event);

	match.setup.teams.forEach(function(team, team_id) {
		var col = colors[team_id];
		var gwinner = calc.game_winner(match.setup.counting, nscore.length - 1, current_score[0], current_score[1]);
		var team_serving = (
			(gwinner === 'left') ? (team_id === 0) : (
			(gwinner === 'right') ? (team_id === 1) : (
			(server.team_id === team_id))));

		var pnames = _player_names(team, is_doubles);

		var team_container = uiu.el(container, 'div', {
			'class': 'd_half',
			style: (
				'background:' + colors.bg + ';'
			),
		});

		if (logo_urls) {
			uiu.el(team_container, 'div', {
				style: (
					'width:20%;height:100%;float:left;margin-right:5%;' +
					(logo_urls[team_id] ?
					'background: no-repeat url("' + logo_urls[team_id] + '") center center;' :
					''
					)
				),
			});
		}

		var player_spans = pnames.map(function(pname, player_id) {
			var is_server = (!match_over) && team_serving && (server.player_id === player_id);
			var player_container = uiu.el(team_container, 'div', {
				'style': (
					'height: ' + (is_doubles ? '50%' : '100%') + ';' +
					'width:' + (logo_urls ? 70 : 95) + '%'
				),
				'class': 'd_onlyplayers_player_container',
			});
			var pel = uiu.el(player_container, 'div', {
				style: (
					'background: ' + colors.bg + ';' +
					'color: ' + col + ';' +
					'height: 100%;'
				),
				'class': 'd_onlyplayers_player',
			});
			if (is_server) {
				uiu.el(pel, 'div', 'd_shuttle');
			}
			return uiu.el(pel, 'div', {}, pname);
		});

		player_spans.forEach(function(ps) {
			_setup_autosize(ps, null, function(parent_node) {
				return parent_node.offsetHeight * 0.7 * (is_doubles ? 1 : 0.5);
			});
		});
	});
}

function render_clubplayers(s, container, event, court, match, colors) {
	function _render_team_name(team_container, team, team_id) {
		var div = uiu.el(team_container, 'div', {
			style: (
				'background: ' + colors.bg + ';' +
				'color: ' + colors[team_id] + ';' +
				'height: 20%;' +
				'margin-left: 5%'
			),
		});
		var span = uiu.el(div, 'span', {}, team.name);
		_setup_autosize(span);
	}

	var nscore = extract_netscore(match);
	var is_doubles = match.setup.is_doubles;
	var current_score = nscore[nscore.length - 1] || [];
	var server = determine_server(match, current_score);
	var mwinner = calc.match_winner(match.setup.counting, nscore);
	var match_over = (mwinner === 'left') || (mwinner === 'right');

	match.setup.teams.forEach(function(team, team_id) {
		var col = colors[team_id];
		var gwinner = calc.game_winner(match.setup.counting, nscore.length - 1, current_score[0], current_score[1]);
		var team_serving = (
			(gwinner === 'left') ? (team_id === 0) : (
			(gwinner === 'right') ? (team_id === 1) : (
			(server.team_id === team_id))));

		var pnames = _player_names(team, is_doubles);

		var team_container = uiu.el(container, 'div', {
			'class': 'd_half',
			style: 'background:' + colors.bg + ';',
		});

		if (team_id === 1) {
			_render_team_name(team_container, team, team_id);
		}

		var player_spans = pnames.map(function(pname, player_id) {
			var is_server = (!match_over) && team_serving && (server.player_id === player_id);

			var player_container = uiu.el(team_container, 'div', {
				'style': 'height: ' + (is_doubles ? '40%' : '80%') + ';',
				'class': 'd_onlyplayers_player_container',
			});
			var pel = uiu.el(player_container, 'div', {
				style: (
					'background: ' + colors.bg + ';' +
					'color: ' + col + ';' +
					'height: 75%;'
				),
				'class': 'd_onlyplayers_player',
			});
			if (is_server) {
				uiu.el(pel, 'div', 'd_shuttle');
			}
			return uiu.el(pel, 'div', {}, pname);
		});

		if (team_id === 0) {
			_render_team_name(team_container, team, team_id);
		}

		player_spans.forEach(function(ps) {
			_setup_autosize(ps, null, function(parent_node) {
				return parent_node.offsetHeight * (is_doubles ? 1 : 0.5);
			});
		});
	});
}

function render_clubplayerslr(s, container, event, court, match, colors) {
	function _render_team_name(team_container, team, team_id) {
		var div = uiu.el(team_container, 'div', {
			style: (
				'background: ' + colors.bg + ';' +
				'color: ' + colors[team_id] + ';' +
				'height: 20%;' +
				'margin: 0 5%;'
			),
		});
		var span = uiu.el(div, 'span', {}, team.name);
		_setup_autosize(span);
	}

	var nscore = extract_netscore(match);
	var is_doubles = match.setup.is_doubles;
	var current_score = nscore[nscore.length - 1] || [];
	var server = determine_server(match, current_score);
	var mwinner = calc.match_winner(match.setup.counting, nscore);
	var match_over = (mwinner === 'left') || (mwinner === 'right');

	match.setup.teams.forEach(function(team, team_id) {
		var col = colors[team_id];
		var gwinner = calc.game_winner(match.setup.counting, nscore.length - 1, current_score[0], current_score[1]);
		var team_serving = (
			(gwinner === 'left') ? (team_id === 0) : (
			(gwinner === 'right') ? (team_id === 1) : (
			(server.team_id === team_id))));

		var pnames = _player_names(team, is_doubles);

		var is_team0 = team_id === 0;
		var team_container = uiu.el(container, 'div', {
			'class': 'd_half',
			style: (
				'background:' + colors.bg + ';' +
				(is_team0 ? '' : 'text-align: right;')
			),
		});

		if (!is_team0) {
			_render_team_name(team_container, team, team_id);
		}

		var player_spans = pnames.map(function(pname, player_id) {
			var is_server = (!match_over) && team_serving && (server.player_id === player_id);

			var player_container = uiu.el(team_container, 'div', {
				'style': (
					'height: ' + (is_doubles ? '40%' : '80%') + ';'
				),
				'class': 'd_clubplayerslr_player_container',
			});
			var pel = uiu.el(player_container, 'div', {
				style: (
					'background: ' + colors.bg + ';' +
					'color: ' + col + ';' +
					'height: 75%;' +
					(is_team0 ? '' : 'justify-content: flex-end;')
				),
				'class': 'd_onlyplayers_player',
			});
			if (is_server) {
				uiu.el(pel, 'div', is_team0 ? 'd_shuttle' : 'd_shuttle_after');
			}
			return uiu.el(pel, 'div', {}, pname);
		});

		if (is_team0) {
			_render_team_name(team_container, team, team_id);
		}

		player_spans.forEach(function(ps) {
			_setup_autosize(ps, null, function(parent_node) {
				return parent_node.offsetHeight * (is_doubles ? 1 : 0.5);
			});
		});
	});
}


function render_onlyscore(s, container, event, court, match, colors) {
	var nscore = extract_netscore(match);
	var current_score = nscore[nscore.length - 1] || [];
	var server = determine_server(match, current_score);
	var max_game_count = calc.max_game_count(match.setup.counting);

	match.setup.teams.forEach(function(team, team_id) {
		var team_container = uiu.el(container, 'div', 'd_onlyscore_half');
		for (var game_idx = 0;game_idx < max_game_count;game_idx++) {
			var team_serving = false;
			var current_score = nscore[game_idx];
			if (current_score) {
				var gwinner = calc.game_winner(match.setup.counting, nscore.length - 1, current_score[0], current_score[1]);
				team_serving = (
								(gwinner === 'left') ? (team_id === 0) : (
								(gwinner === 'right') ? (team_id === 1) : (
								(server.team_id === team_id))));
			}

			var score_container = uiu.el(team_container, 'div', {
				'class': 'd_onlyscore_score',
				style: (
					'width:' + (99 / max_game_count) + 'vw;' +
					'background:' + (team_serving ? colors[team_id] : colors.bg) + ';' +
					'color:' + (team_serving ? colors.bg : colors[team_id]) + ';' +
					'border-right:' + (1 / max_game_count) + 'vw solid ' + colors.bg + ';'
				),
			});

			var points_str = (current_score ? '' + current_score[team_id] : '');

			if (points_str.length < 2) {
				uiu.el(score_container, 'span', {}, points_str);
			} else {
				// Two digits, layout manually since we're extremely tight on space
				utils.forEach(points_str, function(digit, digit_idx) {
					uiu.el(score_container, 'div', 'd_onlyscore_digit' + digit_idx, digit);
				});
			}
		}
	});
}


function calc_team_colors(event, settings) {
	if (event.team_colors) {
		return event.team_colors;
	}
	if (event.team_names) {
		return event.team_names.map(function(tn, team_idx) {
			return extradata.get_color(tn) || settings['d_c' + team_idx];
		});
	}
	return [
		settings.d_c0,
		settings.d_c1,
	];
}

function calc_colors(cur_settings) {
	var res = {};
	ALL_COLORS.forEach(function(k) {
		var ek = 'd_' + k;
		res[k.substr(1)] = cur_settings[ek] || settings.default_settings[ek];
	});
	return res;
}

function _extract_timer_state(s, match) {
	if (!['2court', 'teamcourt_pause'].includes(s.settings.displaymode_style)) {
		return; // No timer required
	}

	var presses = eventutils.get_presses(match);
	var rs = calc.remote_state(s, match.setup, presses);
	return rs;
}

var active_timers = [];
function create_timer(timer_state, parent, props) {
	var tv = timer.calc(timer_state);
	if (!tv.visible || tv.upwards) {
		return;
	}
	var el = uiu.el(parent, 'div', props, tv.str);
	var tobj = {};
	active_timers.push(tobj);

	var update = function() {
		var tv = timer.calc(timer_state);
		var visible = tv.visible && !tv.upwards;
		uiu.text(el, tv.str);
		if (visible && tv.next) {
			tobj.timeout = setTimeout(update, tv.next);
		} else {
			tobj.timeout = null;
		}
		if (!visible) {
			uiu.remove(el);
		}
	};
	update();
}

function abort_timers() {
	active_timers.forEach(function(tobj) {
		if (tobj.timeout) {
			clearTimeout(tobj.timeout);
		}
	});
}

function render_2court(s, container, event, colors) {
	if (!event.courts) {
		uiu.el(container, 'div', {
			'class': 'display_error',
		}, 'Court information missing');
		return;
	}

	uiu.el(container, 'div', {
		'class': 'd_2court_divider',
		'style': 'background: ' + colors.bg2,
	});
	var team_names = event.team_names || [];
	team_names.forEach(function(team_name, team_idx) {
		var teamname_container = uiu.el(container, 'div', {
			'class': 'd_2court_teamname' + team_idx,
			style: 'background: ' + colors.bg + '; color: ' + colors[team_idx] + ';',
		});
		var teamname_span = uiu.el(teamname_container, 'span', {}, team_name);
		_setup_autosize(teamname_span);
	});

	for (var court_idx = 0;court_idx < 2;court_idx++) {
		var court_container = uiu.el(container, 'div', 'd_2court_side' + court_idx);

		var real_court_idx = s.settings.displaymode_reverse_order ? (1 - court_idx) : court_idx;
		var court = event.courts[real_court_idx];
		var match = _match_by_court(event, court);

		if (!match) {
			// TODO: test and improve handling when no match is on court
			continue;
		}
		var nscore = extract_netscore(match);
		var gscore = _gamescore_from_netscore(nscore, match.setup);
		var current_score = nscore[nscore.length - 1] || [];
		var server = determine_server(match, current_score);
		var gwinner = calc.game_winner(match.setup.counting, nscore.length - 1, current_score[0], current_score[1]);

		match.setup.teams.forEach(function(team, team_id) {
			var team_container = uiu.el(court_container, 'div', 'd_2court_team' + team_id);

			var col = colors[team_id];
			var team_serving = (
				(gwinner === 'left') ? (team_id === 0) : (
				(gwinner === 'right') ? (team_id === 1) : (
				(server.team_id === team_id))));

			var points = (current_score[team_id] === undefined) ? '' : ('' + current_score[team_id]);
			var score_el = uiu.el(team_container, 'div', {
				'class': 'd_2court_score',
				style: 'background: ' + (team_serving ? col : colors.bg) + '; color: ' + (team_serving ? colors.bg : col),
			});
			if (points.length < 2) {
				uiu.text(score_el, points);
			} else {
				// Two digits, layout manually since we're extremely tight on space
				utils.forEach(points, function(digit, digit_idx) {
					uiu.el(score_el, 'div', 'd_2court_score_digit' + digit_idx, digit);
				});
			}

			uiu.el(team_container, 'div', {
				'class': 'd_2court_gscore',
				style: 'background: ' + colors.bg + '; color: ' + colors.fg + ';',
			}, gscore[team_id]);
		});

		uiu.el(court_container, 'div', 'd_2court_info', match.setup.match_name);

		var timer_state = _extract_timer_state(s, match);
		if (timer_state) {
			create_timer(timer_state, court_container, {
				'class': 'd_2court_timer',
				style: 'background: ' + colors.bg + '; color: ' + colors.fg + ';',
			});
		}
	}
}

function on_color_select(e) {
	var el = e.target;
	var new_settings = {};
	new_settings['d_' + el.getAttribute('data-name')] = el.value;
	settings.change_all(state, new_settings);
}

var _last_painted_hash = null;
var _last_settings_hash = null;
var _last_err;
function update(err, s, event) {
	_last_err = err;
	var container = uiu.qs('.displaymode_layout');
	uiu.remove_qsa('.display_loading,.display_error', container);

	var style = s.settings.displaymode_style;
	if (err && (err.errtype === 'loading')) {
		uiu.el(container, 'div', 'display_loading');
		return;
	}

	if (err) {
		uiu.el(container, 'div', {
			'class': 'display_error',
		}, err.msg);
		return;
	}

	// Also update general state
	network.update_event(s, event);

	// If nothing has changed we can skip painting
	var cur_event_hash = hash(s.settings, event);
	if (utils.deep_equal(cur_event_hash, _last_painted_hash)) {
		return;
	}

	var ads_container = uiu.qs('.d_ads');
	var changed_courts = (
		!_last_painted_hash || !utils.deep_equal(cur_event_hash.courts, _last_painted_hash.courts));
	_last_painted_hash = cur_event_hash;

	var new_settings_hash = utils.hash_new(_last_settings_hash, s.settings);
	if (new_settings_hash) {
		_last_settings_hash = new_settings_hash;
		dads.d_onconfchange();
	}

	var court_select = uiu.qs('[name="displaymode_court_id"]');
	uiu.visible_qs('.settings_display_court_id', option_applies(style, 'court_id'));
	uiu.visible_qs('.settings_display_reverse_order', option_applies(style, 'reverse_order'));
	uiu.visible_qs('.settings_d_scale', option_applies(style, 'scale'));
	uiu.visible_qs('.settings_d_team_colors',
		option_applies(style, 'c0') &&
		!utils.deep_equal(
			calc_team_colors(event, s.settings),
			[s.settings.d_c0, s.settings.d_c1]));

	if (event.courts && changed_courts) {
		uiu.empty(court_select);
		event.courts.forEach(function(c) {
			var attrs = {
				value: c.court_id,
			};
			if (s.settings.displaymode_court_id == c.court_id) {
				attrs['selected'] = 'selected';
			}
			uiu.el(court_select, 'option', attrs, c.label || c.description || c.court_id);
		});
	}

	var used_colors = active_colors(style);
	uiu.visible_qs('.settings_d_colors', used_colors.length > 0);
	var color_inputs = uiu.qs('.settings_d_colors_inputs');
	var ui_colors_state_json = color_inputs.getAttribute('data-json');
	var ui_colors_state = ui_colors_state_json ? JSON.parse(ui_colors_state_json) : '<no info>';
	if (!utils.deep_equal(ui_colors_state, used_colors)) {
		uiu.empty(color_inputs);
		used_colors.forEach(function(uc) {
			var color_input = uiu.el(color_inputs, 'input', {
				type: 'color',
				'data-name': uc, // Not name to prevent it being found by general attaching of event handlers
				title: uc,
				value: s.settings['d_' + uc],
			});
			color_input.addEventListener('change', on_color_select);
		});
		color_inputs.setAttribute('data-json', JSON.stringify(used_colors));
	}

	// Redraw everything
	abort_timers();
	autosize.unmaintain_all(container);
	uiu.empty(container);

	ALL_STYLES.forEach(function(astyle) {
		((astyle === style) ? uiu.addClass : uiu.removeClass)(container, 'd_layout_' + astyle);
	});

	if (! event.courts) {
		uiu.el(container, 'div', 'error', s._('displaymode:no courts'));
		return;
	}

	var xfunc = {
		andre: render_andre,
		clubplayers: render_clubplayers,
		clubplayerslr: render_clubplayerslr,
		international: render_international,
		oncourt: render_oncourt,
		onlyplayers: render_onlyplayers,
		onlyscore: render_onlyscore,
		stripes: render_stripes,
		teamcourt: render_teamcourt,
		teamcourt_pause: render_teamcourt,
	}[style];
	if (xfunc) {
		var court = _render_court(s, container, event);
		if (!court) {
			dads.d_onmatchchange(s, ads_container, false);
			return;
		}

		var colors = calc_colors(s.settings, event);
		var match = _match_by_court(event, court);

		dads.d_onmatchchange(s, ads_container, match);

		if (!match) {
			var nomatch_el = uiu.el(container, 'div', {
				'class': 'd_nomatch',
				style: (
					'color:' + colors.fg2
				),
			});
			var tname = event.team_competition ? event.event_name : event.tournament_name;
			if (tname) {
				uiu.el(nomatch_el, 'div', {
					style: (
						'font-size:' + (event.team_competition ? '7vmin' : '18vmin') + ';'
					),
				}, tname);
			}
			uiu.el(nomatch_el, 'div', {
				style: (
					'font-size:' + (event.team_competition ? '10vmin' : '18vmin') + ';'
				),
			}, s._('Court') + ' ' + (court.label || court.num || court.court_id));
			return;
		}

		xfunc(s, container, event, court, match, colors);
		return;
	}

	dads.d_onmatchchange(s, ads_container, false);

	var ofunc = {
		'2court': render_2court,
		castall: render_castall,
		tournament_overview: render_tournament_overview,
		tim: render_tim,
	}[style];
	if (ofunc) {
		var o_colors = calc_colors(s.settings, event);
		ofunc(s, container, event, o_colors);
		return;
	}

	// Default: top+list
	render_top(s, container, event);
	render_list(container, event);
}

function on_style_change(s) {
	if (s.ui && s.ui.displaymode_visible) {
		update(_last_err, s, s.event);
	}
}

var _cancel_updates = null;
function show() {
	if (state.ui.displaymode_visible) {
		return;
	}

	state.ui.displaymode_visible = true;
	refmode_referee_ui.hide();
	render.hide();
	settings.hide(true, true);
	settings.on_mode_change(state);
	settings.show_displaymode();

	control.set_current(state);
	uiu.show_qs('.displaymode_layout');
	dads.d_onconfchange();
	uiu.addClass_qs('.settings_layout', 'settings_layout_displaymode');

	update({
		errtype: 'loading',
	}, state);

	_cancel_updates = network.subscribe(state, update, function(s) {
		return s.settings.displaymode_update_interval;
	});
}

function hide() {
	if (! state.ui.displaymode_visible) {
		return;
	}

	settings.hide_displaymode();
	if (_cancel_updates) {
		_cancel_updates();
	}

	var container = uiu.qs('.displaymode_layout');
	autosize.unmaintain_all(container);
	uiu.empty(container);
	uiu.hide(container);
	dads.d_hide(uiu.qs('.d_ads'));
	_last_painted_hash = null;

	uiu.removeClass_qs('.settings_layout', 'settings_layout_displaymode');
	state.ui.displaymode_visible = false;
	settings.on_mode_change(state);
}

function advance_style(s, direction) {
	if (!state.ui.displaymode_visible) {
		return;
	}
	var idx = ALL_STYLES.indexOf(s.settings.displaymode_style) + direction;
	var len = ALL_STYLES.length;
	if (idx >= len) {
		idx -= len;
	}
	if (idx < 0) {
		idx += len;
	}
	s.settings.displaymode_style = ALL_STYLES[idx];
	settings.update(s);
	on_style_change(s);
	settings.store(s);
}

function ui_init(s, hash_query) {
	if (hash_query.dm_style !== undefined) {
		s.settings.displaymode_style = hash_query.dm_style;
		settings.update(s);
	}

	var cur_style = s.settings.displaymode_style;
	uiu.qsEach('select[name="displaymode_style"]', function(select) {
		ALL_STYLES.forEach(function(style_id) {
			var i18n_id = 'displaymode|' + style_id;
			var attrs = {
				'data-i18n': i18n_id,
				value: style_id,
			};
			if (style_id === cur_style) {
				attrs.selected = 'selected';
			}
			uiu.el(select, 'option', attrs, s._(i18n_id));
		});
	});

	Mousetrap.bind('left', function() {
		advance_style(s, -1);
	});
	Mousetrap.bind('right', function() {
		advance_style(s, 1);
	});

	click.qs('.displaymode_layout', function() {
		settings.show_displaymode();
	});
	click.qs('.d_ads', function() {
		settings.show_displaymode();
	});
	click.qs('.settings_mode_display', function(e) {
		e.preventDefault();
		show();
	});
	click.qs('.settings_d_team_colors', function() {
		var tc = calc_team_colors(state.event, state.settings);
		settings.change_all(state, {
			d_c0: tc[0],
			d_c1: tc[1],
		});
	});

	var d_container = uiu.qs('.displaymode_layout');
	d_container.addEventListener('mousemove', show_cursor);
	var ads_container = uiu.qs('.d_ads');
	ads_container.addEventListener('mousemove', show_cursor);
}

function active_colors(style_id) {
	var res = [];
	ALL_COLORS.forEach(function(col) {
		if (option_applies(style_id, col)) {
			res.push(col);
		}
	});
	return res;
}

function option_applies(style_id, option_name) {
	var BY_STYLE = {
		'2court': ['c0', 'c1', 'cfg', 'cbg', 'reverse_order'],
		'top+list': ['reverse_order'],
		andre: ['court_id', 'cfg', 'cbg', 'cfg2'],
		castall: ['c0', 'c1', 'cfg', 'cbg', 'cbg2', 'ct', 'cserv', 'crecv', 'reverse_order', 'scale'],
		clubplayers: ['court_id', 'c0', 'c1', 'cbg'],
		clubplayerslr: ['court_id', 'c0', 'c1', 'cbg'],
		international: ['court_id', 'c0', 'c1', 'cfg', 'cbg'],
		oncourt: ['court_id', 'cfg', 'cfg3', 'cbg', 'cserv2'],
		onlyplayers: ['court_id', 'c0', 'c1', 'cbg'],
		onlyscore: ['court_id', 'c0', 'c1', 'cbg'],
		teamcourt: ['court_id', 'c0', 'c1', 'cfg', 'cfg2', 'cbg'],
		teamcourt_pause: ['court_id', 'c0', 'c1', 'cfg', 'cfg2', 'cbg'],
		tim: ['cbg', 'cfg', 'ctim_blue', 'ctim_active'],
		tournament_overview: ['cfg', 'cbg', 'cbg3', 'cborder', 'cfg2'],
		stripes: ['court_id', 'cbg', 'c0', 'c1', 'cfg', 'cbg4', 'cserv'],
	};
	var bs = BY_STYLE[style_id];
	if (bs) {
		return utils.includes(bs, option_name);
	}
}

return {
	show: show,
	hide: hide,
	ui_init: ui_init,
	on_style_change: on_style_change,
	option_applies: option_applies,
	ALL_STYLES: ALL_STYLES,
	ALL_COLORS: ALL_COLORS,
	calc_team_colors: calc_team_colors,
	// Testing only
	render_castall: render_castall,
	extract_netscore: extract_netscore,
	calc_colors: calc_colors,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var autosize = require('./autosize');
	var calc = require('./calc');
	var click = require('./click');
	var control = require('./control');
	var compat = require('./compat');
	var dads = null; // break cycle, should be require('./dads');
	var eventutils = require('./eventutils');
	var extradata = require('./extradata');
	var network = require('./network');
	var render = require('./render');
	var refmode_referee_ui = null; // break cycle, should be require('./refmode_referee_ui');
	var settings = require('./settings');
	var timer = require('./timer');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = displaymode;
}
/*/@DEV*/
