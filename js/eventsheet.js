var eventsheet = (function() {
'use strict';

var SHEETS_BY_LEAGUE = {
	'1BL-2015': ['1BL-2015', 'team-1BL-2015'],
	'2BLN-2015': ['2BLN-2015', 'team-2BL-2015'],
	'2BLS-2015': ['2BLS-2015', 'team-2BL-2015'],
	'1BL-2016': ['1BL-2016', 'BL-ballsorten-2016', 'BL-mindestanforderungen-2016', 'DBV-Satzungen-2016', 'teamlist-1BL-2016'],
	'2BLN-2016': ['2BLN-2016', 'BL-ballsorten-2016', 'BL-mindestanforderungen-2016', 'DBV-Satzungen-2016', 'teamlist-2BLN-2016'],
	'2BLS-2016': ['2BLS-2016', 'BL-ballsorten-2016', 'BL-mindestanforderungen-2016', 'DBV-Satzungen-2016', 'teamlist-2BLS-2016'],
	'NRW-2016': ['NRW-2016', 'NRW-Satzungen-2016'],
	'RLW-2016': ['RLW-2016', 'NRW-Satzungen-2016'],
	'RLN-2016': ['RLN-2016', 'RLN-Satzungen-2016'],
};

var URLS = {
	'1BL-2015': 'div/Spielberichtsbogen_1BL-2015.pdf',
	'2BLN-2015': 'div/Spielberichtsbogen_2BL-2015.pdf',
	'2BLS-2015': 'div/Spielberichtsbogen_2BL-2015.pdf',
	'1BL-2016': 'div/Spielbericht-Buli-2016-17.xlsm',
	'2BLN-2016': 'div/Spielbericht-Buli-2016-17.xlsm',
	'2BLS-2016': 'div/Spielbericht-Buli-2016-17.xlsm',
	'BL-ballsorten-2016': 'div/bundesliga-ballsorten-2016.pdf',
	'BL-mindestanforderungen-2016': 'div/bundesliga-Mindestanforderungen.pdf',
	'DBV-Satzungen-2016': 'http://www.badminton.de/fileadmin/Dateibereich/Foto-Archiv/pdf-xls/DBV/Satzung/16-DBV-Druckwerk_Satzung-Ordnungen-Spielregeln201617-Website.pdf',
	'RLW-2016': 'div/Spielbericht_8x3x21.svg',
	'RLN-2016': 'div/Spielbericht_8x3x21.svg',
	'RLN-Satzungen-2016': 'http://www.gruppe-nord.net/fileadmin/user_upload/schuch/GruppeNord/Satzung/Satzung%20und%20Ordnungen%20der%20Gruppe%20Nord%20Stand%2006-08-16.pdf',
	'NRW-2016': 'div/Spielbericht_8x3x21.svg',
	'NRW-Satzungen-2016': 'http://www.badminton-nrw.de/fileadmin/gstnrw/pdf_xls_doc/Satzungswerk/2016/SatzungOrdnungen2016.pdf',
	'team-1BL-2015': 'div/Mannschaftsaufstellung_1BL-2015.pdf',
	'team-2BL-2015': 'div/Mannschaftsaufstellung_2BL-2015.pdf',
	'teamlist-1BL-2016': 'div/teamlists/teamlist-1BL-2016.html',
	'teamlist-2BLN-2016': 'div/teamlists/teamlist-2BLN-2016.html',
	'teamlist-2BLS-2016': 'div/teamlists/teamlist-2BLS-2016.html',
};
var DIRECT_DOWNLOAD_SHEETS = {
	'BL-ballsorten-2016': true,
	'BL-mindestanforderungen-2016': true,
	'teamlist-1BL-2016': true,
	'teamlist-2BLN-2016': true,
	'teamlist-2BLS-2016': true,
};
var EXTERNAL_DOWNLOAD_SHEETS = {
	'DBV-Satzungen-2016': true,
	'RLN-Satzungen-2016': true,
	'NRW-Satzungen-2016': true,
};


var MIME_TYPES = {
	pdf: 'application/pdf',
	html: 'text/html',
};

var files = {};

var ui_current_league_key = null;

function calc_backup_players_str(ev) {
	var bp = ev.backup_players;
	if (!bp) {
		return '';
	}
	return [0, 1].map(function(team_id) {
		var res = bp[team_id].map(function(player) {
			return player.name;
		}).join(', ');
		if (res) {
			res += ' (' + ev.team_names[team_id] + ')';
		}
		return res;
	}).filter(function(s) {return s;}).join(' / ');
}


var _loaded = {
	'jszip': false,
	'pdfform': false,
};
var _loaded_all_libs = false;
function loaded(key) {
	if (_loaded_all_libs) {
		// Redundant call, but that's fine
		return;
	}
	_loaded[key] = true;
	_loaded_all_libs = utils.values(_loaded).every(function(x) {return x;});
	if (_loaded_all_libs) {
		uiu.qs('.eventsheet_generate_button').removeAttribute('disabled');
		uiu.visible_qs('.eventsheet_generate_loading_icon', !state.event);
	}
}

function _player_names(match, team_id) {
	var team = match.setup.teams[team_id];
	if (match.setup.is_doubles) {
		if (team.players.length !== 2) {
			return 'N.N. / N.N.';
		}
		return (
			team.players[0].name + ' / ' +
			team.players[1].name);
	} else {
		if (team.players.length !== 1) {
			return 'N.N.';
		}
		return team.players[0].name;
	}
}

function calc_gamescore(counting, netscore) {
	var scores = [0, 0];
	netscore.forEach(function(game_score, game_idx) {
		var winner = calc.game_winner(counting, game_idx, game_score[0], game_score[1]);
		if (winner == 'left') {
			scores[0]++;
		} else if (winner == 'right') {
			scores[1]++;
		}
	});
	return scores;
}

function calc_matchscore(counting, netscore) {
	var winner = calc.match_winner(counting, netscore);
	if (winner == 'left') {
		return [1, 0];
	} else if (winner == 'right') {
		return [0, 1];
	} else {
		return [undefined, undefined];
	}
}

function event_winner_str(ev, match_score_home, match_score_away) {
	var needed_to_win = ev.matches.length / 2;
	if (match_score_home > needed_to_win) {
		return ev.team_names[0];
	} else if (match_score_away > needed_to_win) {
		return ev.team_names[1];
	} else if ((match_score_home == needed_to_win) && (match_score_away == needed_to_win)) {
		return state._('eventsheet:draw');
	} else {
		return undefined;
	}
}

function get_match_order(matches) {
	var in_order = matches.slice();
	in_order.sort(function(m1, m2) {
		var start1 = m1.network_match_start;
		var start2 = m2.network_match_start;

		if (start1 === start2) {
			return 0;
		}

		if (! start1) {
			return 1;
		}
		if (! start2) {
			return -1;
		}

		if (start1 < start2) {
			return -1;
		} else {
			return 1;
		}
	});

	return matches.map(function(m) {
		if (!m.network_match_start) {
			return undefined;
		} else {
			return in_order.indexOf(m) + 1;
		}
	});
}

// call eventutils.set_metadata before this
function calc_last_update(matches) {
	var last_update = 0;
	matches.forEach(function(m) {
		if (m.network_last_update && m.network_last_update > last_update) {
			last_update = m.network_last_update;
		}
	});
	return last_update;
}

function calc_match_id(match) {
	var setup = match.setup;
	return setup.eventsheet_id || setup.courtspot_match_id || setup.match_name;
}

function order_matches(ev, match_order) {
	var matches = [];
	ev.matches.forEach(function(m) {
		var match_order_id = calc_match_id(m);
		var idx = match_order.indexOf(match_order_id);
		if (idx < 0) {
			report_problem.silent_error('eventsheet failed to find position of match ' + match_order_id);
			matches.push(m);
		} else {
			matches[idx] = m;
		}
	});
	return matches;
}

function render_bundesliga(ev, es_key, ui8r, extra_data) {
	var i; // "let" is not available even in modern browsers
	var match_order;
	if (es_key == '1BL-2015') {
		match_order = ['1.HD', 'DD', '1.HE', 'DE', 'GD', '2.HE'];
	} else if (es_key === '2BL-2015') {
		match_order = ['1.HD', 'DD', '2.HD', '1.HE', 'DE', 'GD', '2.HE', '3.HE'];
	} else {
		report_problem.silent_error('Unsupported eventsheet ' + es_key);
		return;
	}

	eventutils.set_metadata(ev);
	var matches = order_matches(ev, match_order);
	var last_update = calc_last_update(matches);

	var player_names = [];
	for (i = 0;i < 6;i++) {
		player_names.push(_player_names(matches[i], 0));
	}
	for (i = 0;i < 6;i++) {
		player_names.push(_player_names(matches[i], 1));
	}
	for (i = 6;i < matches.length;i++) {
		player_names.push(_player_names(matches[i], 0));
		player_names.push(_player_names(matches[i], 1));
	}

	var point_scores_arrays = matches.map(function(m) {
		var res;
		if (utils.deep_equal(m.netscore, [[0, 0]])) {
			res = [];
		} else {
			res = m.netscore.map(function(nscore) {
				return nscore[0] + '-' + nscore[1];
			});
		}
		while (res.length < 3) {
			res.push('');
		}
		return res;
	});
	var points_scores_all = [].concat.apply([], point_scores_arrays.slice(0, 6));
	for (i = 6;i < point_scores_arrays.length;i++) {
		var line = point_scores_arrays[i];
		line.reverse();
		points_scores_all.push.apply(points_scores_all, line);
	}
	
	var scores = [];
	matches.forEach(function(m) {
		var points = [undefined, undefined];
		var games = [undefined, undefined];
		var matches = [undefined, undefined];

		var netscore = m.netscore;
		if (netscore && (netscore.length > 0) && ((netscore[0][0] > 0) || (netscore[0][1] > 0))) {
			points = [0, 0];
			netscore.forEach(function(game_score) {
				points[0] += game_score[0];
				points[1] += game_score[1];
			});
			games = calc_gamescore(m.setup.counting, netscore);
			matches = calc_matchscore(m.setup.counting, netscore);
		}
		scores.push(points[0]);
		scores.push(points[1]);
		scores.push(games[0]);
		scores.push(games[1]);
		scores.push(matches[0]);
		scores.push(matches[1]);
	});

	var sums = [];
	for (var col = 0;col < 6;col++) {
		var sum = 0;
		for (i = col;i < scores.length;i += 6) {
			if (scores[i]) {
				sum += scores[i];
			}
		}
		sums.push(sum);
	}

	// Shuffle for 2BL
	scores = [].concat(
		scores.slice(0, 6 * 6),
		sums,
		utils.reverse_every(scores.slice(6 * 6), 6)
	);

	var match_score_home = sums[sums.length - 2];
	if (!match_score_home) {
		match_score_home = 0;
	}
	var match_score_away = sums[sums.length - 1];
	if (!match_score_away) {
		match_score_away = 0;
	}

	// Süd, Richtigkeit, Nord
	var checkboxes = [];
	if (es_key == '2BLN') {
		checkboxes = [false, true, true];
	} else if (es_key == '2BLS') {
		checkboxes = [true, true, false];
	}

	var fields = {
		'Textfeld1': [ev.team_names[0]],
		'Textfeld2': [ev.team_names[1]],
		'Textfeld3': [extra_data.umpires],
		'Textfeld4': [extra_data.location],
		'Textfeld5': (last_update ? [utils.date_str(last_update)] : []),
		'Textfeld6': [extra_data.starttime],
		'Textfeld7': (last_update ? [utils.time_str(last_update)] : []),
		'Textfeld8': [extra_data.matchday],
		'Textfeld9': player_names,
		'Textfeld10': points_scores_all,
		'Textfeld11': [event_winner_str(ev, match_score_home, match_score_away)],
		'Textfeld12': [extra_data.backup_players_str],
		'Textfeld13': [extra_data.notes],
		'Textfeld14': [undefined, undefined, undefined, extra_data.protest, ''],
		'NumerischesFeld1': get_match_order(matches),
		'NumerischesFeld2': scores,
		'Kontrollkästchen1': [true],
		'#field[91]': [true],
		'Optionsfeldliste': checkboxes,
	};
	var res_pdf = pdfform.transform(ui8r, fields);
	var filename = 'Spielbericht ' + ev.event_name + (last_update ? (' ' + utils.date_str(last_update * 1000)) : '') + '.pdf';
	var blob = new Blob([res_pdf], {type: MIME_TYPES.pdf});
	saveAs(blob, filename);
}

function render_team_bl(ev, es_key, ui8r) {
	// No let in modern browsers
	var team_id;

	var last_update = calc_last_update(ev.matches);
	var matches_by_player = {};
	var player_names = [
		{'m': [], 'mb': [], 'f': [], 'fb': []},
		{'m': [], 'mb': [], 'f': [], 'fb': []},
	];
	ev.matches.forEach(function(match) {
		var teams = match.setup.teams;
		for (var team_id = 0;team_id < 2;team_id++) {
			var players = teams[team_id].players;
			for (var player_id = 0;player_id < players.length;player_id++) {
				var player = players[player_id];
				var gender = player.gender ? player.gender : eventutils.guess_gender(match.setup, player_id);
				if (matches_by_player[player.name]) {
					matches_by_player[player.name].push(match);
				} else {
					matches_by_player[player.name] = [match];
					player_names[team_id][gender].push(player.name);
				}
			}
		}
	});

	// Backup players
	if (ev.backup_players) {
		for (team_id = 0;team_id < 2;team_id++) {
			var team_bp = ev.backup_players[team_id];
			for (var i = 0;i < team_bp.length;i++) {
				var player = team_bp[i];
				if (!player.gender) {
					report_problem.silent_error(
						'backup player without gender: ' + JSON.stringify(player)); // Don't know where to list
					continue;
				}
				if (! matches_by_player[player.name]) {
					matches_by_player[player.name] = [];
				}
				player_names[team_id][player.gender + 'b'].push(player.name);
			}
		}
	}

	var KEY_IDXS;
	var NAME_IDXS;
	if (es_key === 'team-2BL') {
		NAME_IDXS = [{
			'm': [10, 19, 18, 17, 16, 11, 12, 15],
			'mb': [13, 14],
			'f': [25, 24, 23, 22],
			'fb': [21, 20],
		}, {
			'm': [9, 0, 1, 2, 3, 8, 7, 4],
			'mb': [6, 5],
			'f': [31, 30, 29, 28],
			'fb': [27, 26],
		}];
		KEY_IDXS = [{
			'm1.HE': [132, 113, 101, 102, 65, 66, 90, 89],
			'mb1.HE': [77, 78],
			'm2.HE': [137, 108, 96, 107, 60, 71, 95, 84],
			'mb2.HE': [72, 83],
			'm3.HE': [136, 109, 97, 106, 61, 70, 94, 85],
			'mb3.HE': [73, 82],
			'm1.HD': [133, 112, 100, 103, 64, 67, 91, 88],
			'mb1.HD': [76, 79],
			'm2.HD': [134, 111, 99, 104, 63, 68, 92, 87],
			'mb2.HD': [75, 80],
			'mGD': [135, 110, 98, 105, 62, 69, 93, 86],
			'mbGD': [74, 81],
			'fGD': [115, 121, 119, 129],
			'fbGD': [123, 125],
			'fDD': [114, 117, 120, 130],
			'fbDD': [127, 124],
			'fDE': [116, 131, 118, 128],
			'fbDE': [122, 126],
		}, {
			'm1.HE': [5, 6, 18, 17, 54, 53, 29, 30],
			'mb1.HE': [42, 41],
			'm2.HE': [0, 11, 23, 12, 59, 48, 24, 35],
			'mb2.HE': [47, 36],
			'm3.HE': [1, 10, 22, 13, 58, 49, 25, 34],
			'mb3.HE': [46, 37],
			'm1.HD': [4, 7, 19, 16, 55, 52, 28, 31],
			'mb1.HD': [43, 40],
			'm2.HD': [3, 8, 20, 15, 56, 51, 27, 32],
			'mb2.HD': [44, 39],
			'mGD': [2, 9, 21, 14, 57, 50, 26, 33],
			'mbGD': [45, 38],
			'fGD': [139, 145, 143, 153],
			'fbGD': [147, 149],
			'fDD': [138, 141, 144, 154],
			'fbDD': [151, 148],
			'fDE': [140, 155, 142, 152],
			'fbDE': [146, 150],
		}];

	} else if (es_key === 'team-1BL') {
		NAME_IDXS = [{
			'm': [13, 14, 21, 22, 23],
			'mb': [24, 25],
			'f': [20, 19, 18, 17],
			'fb': [16, 15],
		}, {
			'm': [12, 11, 4, 3, 2],
			'mb': [1, 0],
			'f': [5, 6, 7, 8],
			'fb': [9, 10],
		}];
		KEY_IDXS = [{
			'm1.HE': [64, 88, 84, 80, 66],
			'mb1.HE': [70, 74],
			'm2.HE': [91, 85, 65, 83, 69],
			'mb2.HE': [77, 71],
			'm1.HD': [90, 86, 78, 82, 68],
			'mb1.HD': [76, 72],
			'mGD': [89, 87, 79, 81, 67],
			'mbGD': [75, 73],
			'fGD': [47, 53, 51, 61],
			'fbGD': [55, 57],
			'fDD': [46, 49, 52, 62],
			'fbDD': [59, 56],
			'fDE': [48, 63, 50, 60],
			'fbDE': [54, 58],
		}, {
			'm1.HE': [27, 3, 7, 11, 25],
			'mb1.HE': [21, 17],
			'm2.HE': [0, 6, 26, 8, 22],
			'mb2.HE': [14, 20],
			'm1.HD': [1, 5, 13, 9, 23],
			'mb1.HD': [15, 19],
			'mGD': [2, 4, 12, 10, 24],
			'mbGD': [16, 18],
			'fGD': [44, 38, 40, 30],
			'fbGD': [36, 34],
			'fDD': [45, 42, 39, 29],
			'fbDD': [32, 35],
			'fDE': [43, 28, 41, 31],
			'fbDE': [37, 33],
		}];
	} else {
		throw new Error('Unsupported es key ' + es_key);
	}

	var player_fields = [];
	var x_fields = [];
	for (team_id = 0;team_id < 2;team_id++) {
		var name_idxs = NAME_IDXS[team_id];
		var key_idxs = KEY_IDXS[team_id];
		for (var gender_id in name_idxs) {
			var gplayers = player_names[team_id][gender_id];
			var idx_list = name_idxs[gender_id];
			for (var player_idx = 0;player_idx < gplayers.length;player_idx++) {
				var gpname = gplayers[player_idx];
				player_fields[idx_list[player_idx]] = gpname;
				var player_matches = matches_by_player[gpname];
				for (var match_idx=0;match_idx < player_matches.length;match_idx++) {
					var nkey = gender_id + calc_match_id(player_matches[match_idx]);
					var match_player_idxs = key_idxs[nkey];
					if (!match_player_idxs) {
						// When a player is set up as male + female by mistake, do not cross
						continue;
					}
					x_fields[match_player_idxs[player_idx]] = '  X';
				}
			}
		}
	}

	var fields = {
		'Textfeld1': player_fields,
		'Textfeld2': x_fields,
	};
	var res_pdf = pdfform.transform(ui8r, fields);
	var filename = 'Mannschaftsaufstellung ' + ev.event_name + (last_update ? (' ' + utils.date_str(last_update * 1000)) : '') + '.pdf';
	var blob = new Blob([res_pdf], {type: MIME_TYPES.pdf});
	saveAs(blob, filename);
}

/*params: s, es_key*/
function preview_team_bl() {
	// TODO download
}

function _svg_text(svg, id, val) {
	var whole_id = 'es_svg_' + id;
	var text_el = svg.getElementById(whole_id);
	if (!text_el) {
		return;
	}
	while (text_el.firstChild) {
		text_el.removeChild(text_el.firstChild);
	}
	if (val !== undefined) {
		var text_node = svg.ownerDocument.createTextNode(val);
		text_el.appendChild(text_node);
	}
}

function render_svg(ev, es_key, ui8r, extra_data) {
	var xml_str = (new TextDecoder('utf-8')).decode(ui8r);
	var svg_doc = (new DOMParser()).parseFromString(xml_str, 'image/svg+xml');
	var svg = svg_doc.getElementsByTagName('svg')[0];

	eventutils.set_metadata(ev);

	var match_order = ['1.HD', '2.HD', 'DD', '1.HE', '2.HE', '3.HE', 'DE', 'GD'];
	var matches = order_matches(ev, match_order);
	var last_update = calc_last_update(ev.matches);

	var body = document.getElementsByTagName('body')[0];
	var container = $('<div style="position: absolute; left: -999px; top: -999px; width: 297px; height: 210px;">');
	container[0].appendChild(svg);
	body.appendChild(container[0]);

	var props = {
		title: ('Spielbericht ' + ev.event_name + (last_update ? (' ' + utils.date_str(last_update)) : '')),
		subject: state._('Event Sheet'),
		creator: 'bup (https://phihag.de/bup/)',
	};
	if (state.settings && state.settings.umpire_name) {
		props.author = state.settings.umpire_name;
	}

	var match_order_nums = get_match_order(matches);
	match_order_nums.forEach(function(mon, i) {
		_svg_text(svg, 'match' + i + '_order', mon);
	});

	var sum_points = [0, 0];
	var sum_games = [0, 0];
	var sum_matches = [0, 0];

	matches.forEach(function(match, match_id) {
		var netscore = match.netscore;

		match.setup.teams.forEach(function(team, team_id) {
			team.players.forEach(function(player, player_id) {
				var key = 'match' + match_id + '_player' + team_id + '.' + player_id;
				_svg_text(svg, key, player.name);
			});
		});

		var netscore_strs = netscore ? (netscore.map(function(nscore) {
			return nscore[0] + ' - ' + nscore[1];
		})) : [];
		while (netscore_strs.length < 3) {
			netscore_strs.push('');
		}
		netscore_strs.forEach(function(ns, i) {
			_svg_text(svg, 'match' + match_id + '_game' + i, ns);
		});

		if (netscore && (netscore.length > 0) && ((netscore[0][0] > 0) || (netscore[0][1] > 0))) {
			var points = [0, 0];
			netscore.forEach(function(game_score) {
				points[0] += game_score[0];
				points[1] += game_score[1];
			});
			sum_points[0] += points[0];
			sum_points[1] += points[1];
			_svg_text(svg, 'match' + match_id + '_points0', points[0]);
			_svg_text(svg, 'match' + match_id + '_points1', points[1]);

			var games = calc_gamescore(match.setup.counting, netscore);
			sum_games[0] += games[0];
			sum_games[1] += games[1];
			_svg_text(svg, 'match' + match_id + '_games0', games[0]);
			_svg_text(svg, 'match' + match_id + '_games1', games[1]);

			var matches_score = calc_matchscore(match.setup.counting, netscore);
			if (matches_score[0] !== undefined) {
				sum_matches[0] += matches_score[0];
				sum_matches[1] += matches_score[1];
			}
			_svg_text(svg, 'match' + match_id + '_matches0', matches_score[0]);
			_svg_text(svg, 'match' + match_id + '_matches1', matches_score[1]);
		} else {
			_svg_text(svg, 'match' + match_id + '_points0', '');
			_svg_text(svg, 'match' + match_id + '_points1', '');
			_svg_text(svg, 'match' + match_id + '_games0', '');
			_svg_text(svg, 'match' + match_id + '_games1', '');
			_svg_text(svg, 'match' + match_id + '_matches0', '');
			_svg_text(svg, 'match' + match_id + '_matches1', '');
		}
	});

	_svg_text(svg, 'sum_points0', sum_points[0]);
	_svg_text(svg, 'sum_points1', sum_points[1]);
	_svg_text(svg, 'sum_games0', sum_games[0]);
	_svg_text(svg, 'sum_games1', sum_games[1]);
	_svg_text(svg, 'sum_matches0', sum_matches[0]);
	_svg_text(svg, 'sum_matches1', sum_matches[1]);

	var winner_str = event_winner_str(ev, sum_matches[0], sum_matches[1]);
	_svg_text(svg, 'winner', winner_str);

	_svg_text(svg, 'starttime', extra_data.starttime);
	_svg_text(svg, 'date', (last_update ? utils.date_str(last_update) : ''));
	_svg_text(svg, 'matchday', extra_data.matchday);
	_svg_text(svg, 'home_team_name', ev.team_names[0]);
	_svg_text(svg, 'away_team_name', ev.team_names[1]);
	_svg_text(svg, 'tournament_name', ev.tournament_name);
	_svg_text(svg, 'location', extra_data.location);
	_svg_text(svg, 'notes', extra_data.notes);
	_svg_text(svg, 'backup_players', extra_data.backup_players_str);
	_svg_text(svg, 'protest', extra_data.protest);
	_svg_text(svg, 'umpires', extra_data.umpires);

	var filename = 'Spielbericht ' + ev.event_name + (last_update ? (' ' + utils.date_str(last_update)) : '') + '.pdf';
	svg2pdf.save([svg], props, filename);

	container.remove();
}

function calc_player_matches(ev, team_id) {
	var res = [];
	ev.matches.forEach(function(match) {
		match.setup.teams[team_id].players.forEach(function(player, player_id) {
			var pinfo = utils.find(res, function(existing_player) {
				return existing_player.name === player.name;
			});
			if (pinfo) {
				pinfo.matches.push(match);
			} else {
				var gender = player.gender ? player.gender : eventutils.guess_gender(match.setup, player_id);
				res.push({
					name: player.name,
					matches: [match],
					gender: gender,
				});
			}
		});
	});
	return res;
}

function calc_sums(match) {
	var netscore = match.netscore || match.network_score;
	if (!netscore.length) {
		return {
			points: [],
			games: [],
			matches: [],
		};
	}
	var res = {
		points: [0, 0],
		games: [0, 0],
		matches: [],
	};
	netscore.forEach(function(ngame, game_idx) {
		res.points[0] += ngame[0];
		res.points[1] += ngame[1];

		var winner = calc.game_winner(match.setup.counting, game_idx, ngame[0], ngame[1]);
		if (winner === 'left') {
			res.games[0]++;
		} else if (winner === 'right') {
			res.games[1]++;
		}
	});

	var mwinner = calc.match_winner(match.setup.counting, netscore);
	if (mwinner === 'left') {
		res.matches = [1, 0];
	} else if (mwinner === 'right') {
		res.matches = [0, 1];
	}
	return res;
}

function render_bundesliga2016(ev, es_key, ui8r, extra_data) {
	eventutils.set_metadata(ev);
	var match_order = get_match_order(ev.matches);
	var last_update = calc_last_update(ev.matches);

	xlsx.open(ui8r, function(xlsx_file) {
		function fill_team_sheet(sheet_fn, team_id, cb) {
			xlsx_file.modify_sheet(sheet_fn, cb, function(sheet) {
				sheet.text('B5', ev.team_names[team_id]);
				var players = calc_player_matches(ev, team_id);

				var row_idx = {
					m: 9,
					f: 22,
				};
				var x_count = {
					m: {},
					f: {},
				};
				players.forEach(function(player) {
					var row = row_idx[player.gender];
					sheet.text('B' + row, player.name);
					row_idx[player.gender]++;

					sheet.val('C' + row, player.matches.length);

					player.matches.forEach(function(match) {
						var MATCH_COLS = {
							m: {
								'1.HE': 'D',
								'2.HE': 'E',
								'1.HD': 'F',
								'2.HD': 'G',
								'GD': 'H',
							},
							f: {
								'DE': 'F',
								'DD': 'G',
								'GD': 'H',
							},
						};

						var col = MATCH_COLS[player.gender][calc_match_id(match)];
						sheet.text(col + row, 'x');
						var v = x_count[player.gender][col];
						x_count[player.gender][col] = v ? (v + 1) : 1;
					});
				});

				// Mark top rows green
				for (var gender in x_count) {
					var row = {
						m: 7,
						f: 20,
					}[gender];
					for (var col in x_count[gender]) {
						sheet.val(col + row, x_count[gender][col]);
					}
				}

				if (ev.backup_players) {
					var backup_row_idx = {
						m: 17,
						f: 26,
					};
					ev.backup_players[team_id].forEach(function(player) {
						var row = backup_row_idx[player.gender];
						sheet.text('B' + row, player.name);
						backup_row_idx[player.gender]++;
					});
				}

				sheet.text('B30', extra_data['teamster' + team_id]);

				var incomplete = ev.matches.some(function(m) {
					return m.setup.incomplete;
				});
				sheet.val('C5', incomplete ? 0 : 1);
			});
		}

		function fill_result_sheet(cb) {
			xlsx_file.modify_sheet('5', cb, function(sheet) {
				var league_key = ev.league_key;
				var x_location = {
					'1BL-2016': 'E4',
					'2BLN-2016': 'E5',
					'2BLS-2016': 'E6',
				}[league_key];
				if (x_location) {
					sheet.text(x_location, 'X');
				} else {
					report_problem.silent_error('Unsupported league ' + league_key);
				}

				sheet.text('E8', extra_data.location);
				sheet.text('W8', extra_data.matchday);
				sheet.text('W4', extra_data.umpires);
				sheet.text('AB6', extra_data.starttime);
				sheet.text('K32', '\xa0X');

				var all_finished = ev.matches.every(function(m) {
					return m.network_finished;
				});
				if (last_update) {
					sheet.text('W6', utils.date_str(last_update));
					if (all_finished) {
						sheet.text('AB8', utils.time_str(last_update));
					}
				}

				var col_sums = {};
				var MATCH_ROWS = {
					'1.HD': 12,
					'DD': 14,
					'2.HD': 16,
					'1.HE': 18,
					'DE': 19,
					'GD': 20, // called XD in the sheet itself
					'2.HE': 22,
				};
				ev.matches.forEach(function(match, match_id) {
					var setup = match.setup;
					var row = MATCH_ROWS[calc_match_id(match)];
					if (match_order[match_id]) {
						sheet.text('A' + row, match_order[match_id]);
					}

					setup.teams.forEach(function(team, team_id) {
						team.players.forEach(function(player, player_id) {
							sheet.val(xlsx.add_col('C', 3 * team_id) + (row + player_id), player.name);
						});
					});

					var netscore = match.netscore || match.network_score;
					netscore.forEach(function(nsGame, game_idx) {
						nsGame.forEach(function(points, team_idx) {
							var col = xlsx.add_col('I', 3 * game_idx + 2 * team_idx);
							sheet.val(col + row, points);
						});
					});

					function _enter_sums(start_col, values) {
						values.forEach(function(v, v_id) {
							var col = xlsx.add_col(start_col, v_id);
							sheet.val(col + row, v);
							if (! col_sums[col]) {
								col_sums[col] = 0;
							}
							col_sums[col] += v;
						});
					}

					var sums = calc_sums(match);
					_enter_sums('X', sums.points);
					_enter_sums('Z', sums.games);
					_enter_sums('AB', sums.matches);
				});

				for (var col in col_sums) {
					sheet.val(col + '23', col_sums[col]);
				}

				// Match winner
				if ((col_sums.AB) && (col_sums.AB > ev.matches.length / 2)) {
					sheet.val('C23', ev.team_names[0]);
				}
				if ((col_sums.AC) && (col_sums.AC > ev.matches.length / 2)) {
					sheet.val('C23', ev.team_names[1]);
				}

				sheet.val('A25', calc_backup_players_str(ev));
				sheet.text('A27', extra_data.notes);
				sheet.text('A30', extra_data.protest);

			});
		}

		function fill_score_sheets(cb) {
			var d_count = 0;

			var thick_border_id = xlsx_file.add_border('medium');
			var thick_center_style_id = xlsx_file.add_style(function(xf) {
				xf.setAttribute('fontId', 0);
				xf.setAttribute('borderId', thick_border_id);
				xf.setAttribute('xfId', 0);
				xf.setAttribute('applyBorder', 1);
				xf.setAttribute('applyAlignment', 1);
				uiu.create_el(xf, 'alignment', {
					horizontal: 'center',
					vertical: 'center',
				});
			});

			xlsx_file.modify_sheet('6', cb, function(sheet) {
				function add_winner_circle(start_row, team_id) {
					var start_col = 6 + team_id * 15;

					sheet.add_drawing(function(drawings) {
						var anchor = uiu.create_el(drawings, 'xdr:twoCellAnchor');
						var from = uiu.create_el(anchor, 'xdr:from');
						uiu.create_el(from, 'xdr:col', {}, start_col);
						uiu.create_el(from, 'xdr:colOff', {}, -200000);
						uiu.create_el(from, 'xdr:row', {}, start_row);
						uiu.create_el(from, 'xdr:rowOff', {}, -120000);
						var to = uiu.create_el(anchor, 'xdr:to');
						uiu.create_el(to, 'xdr:col', {}, start_col + 9);
						uiu.create_el(to, 'xdr:colOff', {}, 0);
						uiu.create_el(to, 'xdr:row', {}, start_row + 3);
						uiu.create_el(to, 'xdr:rowOff', {}, 120000);

						var sp = uiu.create_el(anchor, 'xdr:sp');

						var nvSpPr = uiu.create_el(sp, 'xdr:nvSpPr');
						uiu.create_el(nvSpPr, 'xdr:cNvPr', {'id': 1000 + d_count, 'name': 'bup ' + d_count});
						d_count++;
						uiu.create_el(nvSpPr, 'xdr:cNvSpPr');

						var spPr = uiu.create_el(sp, 'xdr:spPr');
						uiu.create_el(spPr, 'a:prstGeom', {prst: 'ellipse'});
						var line = uiu.create_el(spPr, 'a:ln', {w: 36000});
						var line_fill = uiu.create_el(line, 'a:solidFill');
						uiu.create_el(line_fill, 'a:srgbClr', {val: '000000'});
						uiu.create_el(anchor, 'xdr:clientData');
					});
				}

				function gen_game_circle(start_row, c) {
					var row = start_row + 5 + 5 * c.table;
					var col = 5 + c.col;

					sheet.text(xlsx.num2col(col + 1) + (row + 2), c.score[0]);
					sheet.text(xlsx.num2col(col + 1) + (row + 3), c.score[1]);

					sheet.add_drawing(function(drawings) {
						var anchor = uiu.create_el(drawings, 'xdr:twoCellAnchor');
						var from = uiu.create_el(anchor, 'xdr:from');
						uiu.create_el(from, 'xdr:col', {}, col + 1);
						uiu.create_el(from, 'xdr:colOff', {}, -150000);
						uiu.create_el(from, 'xdr:row', {}, row);
						uiu.create_el(from, 'xdr:rowOff', {}, 20000);
						var to = uiu.create_el(anchor, 'xdr:to');
						uiu.create_el(to, 'xdr:col', {}, col + 2);
						uiu.create_el(to, 'xdr:colOff', {}, 150000);
						uiu.create_el(to, 'xdr:row', {}, row + 4);
						uiu.create_el(to, 'xdr:rowOff', {}, -40000);

						var sp = uiu.create_el(anchor, 'xdr:sp');

						var nvSpPr = uiu.create_el(sp, 'xdr:nvSpPr');
						uiu.create_el(nvSpPr, 'xdr:cNvPr', {'id': 1000 + d_count, 'name': 'bup ' + d_count});
						d_count++;
						uiu.create_el(nvSpPr, 'xdr:cNvSpPr');

						var spPr = uiu.create_el(sp, 'xdr:spPr');
						uiu.create_el(spPr, 'a:prstGeom', {prst: 'ellipse'});
						var line = uiu.create_el(spPr, 'a:ln', {w: 12000});
						var line_fill = uiu.create_el(line, 'a:solidFill');
						uiu.create_el(line_fill, 'a:srgbClr', {val: '000000'});
						uiu.create_el(anchor, 'xdr:clientData');
					});
				}

				function gen_vertical_text(start_row, c) {
					sheet.text(xlsx.add_col('F', c.col) + (start_row + 6 + 5 * c.table + parseInt(Math.ceil(c.row))), c.val);

					// TODO use a shape instead
					/* XML should look like:
	    <xdr:sp>
      <xdr:nvSpPr>
        <xdr:cNvPr id="0" name="TextShape 1"/>
        <xdr:cNvSpPr txBox="1"/>
      </xdr:nvSpPr>
      <xdr:spPr>
        <a:xfrm rot="16111200">
          <a:off x="1067040" y="952200"/>
          <a:ext cx="316080" cy="180720"/>
        </a:xfrm>
        <a:prstGeom prst="rect">
          <a:avLst/>
        </a:prstGeom>
        <a:noFill/>
        <a:ln>
          <a:noFill/>
        </a:ln>
      </xdr:spPr>
      <xdr:txBody>
        <a:bodyPr lIns="0" rIns="0" tIns="0" bIns="0"/>
        <a:p>
          <a:r>
            <a:rPr b="0" lang="de-DE" sz="1200" spc="-1" strike="noStrike">
              <a:solidFill>
                <a:srgbClr val="000000"/>
              </a:solidFill>
              <a:uFill>
                <a:solidFill>
                  <a:srgbClr val="ffffff"/>
                </a:solidFill>
              </a:uFill>
              <a:latin typeface="Times New Roman"/>
            </a:rPr>
            <a:t>Text</a:t>
          </a:r>
          <a:endParaRPr b="0" lang="de-DE" sz="1200" spc="-1" strike="noStrike">
            <a:solidFill>
              <a:srgbClr val="000000"/>
            </a:solidFill>
            <a:uFill>
              <a:solidFill>
                <a:srgbClr val="ffffff"/>
              </a:solidFill>
            </a:uFill>
            <a:latin typeface="Times New Roman"/>
          </a:endParaRPr>
        </a:p>
      </xdr:txBody>
    </xdr:sp>*/

					/*
					var row = start_row + 5 + 5 * c.table;
					var col = 5 + c.col;

					sheet.add_drawing(function(drawings) {
						var anchor = uiu.create_el(drawings, 'xdr:twoCellAnchor');
						var from = uiu.create_el(anchor, 'xdr:from');
						uiu.create_el(from, 'xdr:col', {}, col + 1);
						uiu.create_el(from, 'xdr:colOff', {}, -150000);
						uiu.create_el(from, 'xdr:row', {}, row);
						uiu.create_el(from, 'xdr:rowOff', {}, 20000);
						var to = uiu.create_el(anchor, 'xdr:to');
						uiu.create_el(to, 'xdr:col', {}, col + 2);
						uiu.create_el(to, 'xdr:colOff', {}, 150000);
						uiu.create_el(to, 'xdr:row', {}, row + 4);
						uiu.create_el(to, 'xdr:rowOff', {}, -40000);

						var sp = uiu.create_el(anchor, 'xdr:sp');

						var nvSpPr = uiu.create_el(sp, 'xdr:nvSpPr');
						uiu.create_el(nvSpPr, 'xdr:cNvPr', {'id': 1000 + d_count, 'name': 'bup ' + d_count});
						d_count++;
						uiu.create_el(nvSpPr, 'xdr:cNvSpPr');

						var spPr = uiu.create_el(sp, 'xdr:spPr');
						uiu.create_el(spPr, 'a:prstGeom', {prst: 'ellipse'});
						var line = uiu.create_el(spPr, 'a:ln', {w: 12000});
						var line_fill = uiu.create_el(line, 'a:solidFill');
						uiu.create_el(line_fill, 'a:srgbClr', {val: '000000'});
						uiu.create_el(anchor, 'xdr:clientData');
					});*/
				}

				var MATCH_ROWS = {
					'1.HD': 5,
					'DD': 43,
					'2.HD': 81,
					'1.HE': 119,
					'DE': 157,
					'GD': 195, // called XD in the sheet itself
					'2.HE': 233,
				};
				var ROW_COUNT = 35;

				ev.matches.forEach(function(match, match_idx) {
					var start_row = MATCH_ROWS[calc_match_id(match)];
					var md = match.network_metadata;

					// top center header
					sheet.val('G' + (start_row + 3), ev.team_names[0]);
					sheet.val('V' + (start_row + 3), ev.team_names[1]);
					match.setup.teams.forEach(function(team, team_idx) {
						team.players.forEach(function(player, player_idx) {
							sheet.val(xlsx.add_col('G', 15 * team_idx) + (start_row + 1 + player_idx), player.name);
						});
					});
					var t1l = match.network_start_team1_left;
					if (typeof t1l === 'boolean') {
						sheet.text('F' + (start_row + 1), t1l ? 'L' : 'R', thick_center_style_id);
						sheet.text('AE' + (start_row + 1), t1l ? 'R' : 'L', thick_center_style_id);
					}
					if (match.network_real_scores) {
						match.network_real_scores.forEach(function(scores, game_idx) {
							sheet.text('R' + (start_row + game_idx), scores[0]);
							sheet.text('T' + (start_row + game_idx), scores[1]);
						});
					}
					if (typeof match.network_team1_won === 'boolean') {
						add_winner_circle(start_row, match.network_team1_won ? 0 : 1);
					}

					// left header
					if (match_order[match_idx]) {
						sheet.val('C' + start_row, match_order[match_idx]);
					}
					if (match.setup.court_id) {
						sheet.text('C' + (start_row + 2), match.setup.court_id);
					}
					var today = last_update ? (new Date(last_update)) : (new Date());
					sheet.val('C' + (start_row + 3), xlsx.date(today));

					// right header
					if (match.setup.umpire_name) {
						sheet.text('AJ' + start_row, match.setup.umpire_name);
					}
					if (match.setup.service_judge_name) {
						sheet.text('AJ' + (start_row + 1), match.setup.service_judge_name);
					}
					if (md) {
						if (md.start) {
							sheet.text('AI' + (start_row + 2), utils.time_str(md.start));
						}
						if (md.end) {
							sheet.text('AM' + (start_row + 2), utils.time_str(md.end));
						}
						if (md.start && md.end) {
							sheet.text('AI' + (start_row + 3), utils.duration_mins(md.start, md.end));
						}
					}

					// Player names in main body
					for (var game = 0;game < 5;game++) {
						match.setup.teams.forEach(function(team, team_idx) {
							team.players.forEach(function(player, player_idx) {
								sheet.val('B' + (start_row + 6 + 5 * game + 2 * team_idx + player_idx), player.name);
							});
						});
					}

					// Main body
					if (!match.presses_json) {
						// No details about presses, skip
						return;
					}
					var scopy = calc.copy_state(state);
					var presses = JSON.parse(match.presses_json);
					calc.init_state(scopy, match.setup, presses);
					var cells = scoresheet.parse_match(scopy, ROW_COUNT);
					
					cells.forEach(function(c) {
						switch (c.type) {
						case 'score':
						case 'text':
						case 'longtext':
							var cell_id = xlsx.add_col('F', c.col) + (start_row + 6 + 5 * c.table + c.row);
							var snode = sheet.get_style_node(cell_id);
							snode.setAttribute('applyAlignment', 1);
							var alignment = snode.querySelector('alignment');
							if (!alignment) {
								alignment = snode.ownerDocument.createElement('alignment');
								snode.insertBefore(alignment, snode.firstChild);
							}
							alignment.setAttribute('horizontal', 'center');
							alignment.setAttribute('vertical', 'center');
							sheet.text(cell_id, c.val);
							break;
						case 'note':
							var col = 'F';
							if (c.table >= 5) {
								c.table -= 5;
								col = 'AR';
							}
							var row = (start_row + 6 + 5 * c.table + c.row);
							if (col === 'F') {
								sheet.merge_cells(col + row + ':' + xlsx.add_col(col, ROW_COUNT) + row);
							}
							sheet.text(col + row, c.val);
							break;
						case 'circle':
							gen_game_circle(start_row, c);
							break;
						case 'vertical-text':
							gen_vertical_text(start_row, c);
							break;
						// Ignore other types (like editmode changes)
						}
					});
				});
			});
		}

		utils.parallel([function(cb) {
			fill_team_sheet('2', 0, cb);
		}, function(cb) {
			fill_team_sheet('3', 1, cb);
		},
		fill_result_sheet,
		fill_score_sheets,
		], function() {
			xlsx_file.save('Spielbericht ' + ev.event_name + '.xlsm');
		});
	});
}

function direct_download(es_key, ui8r) {
	var ext = /\.([a-z0-9]+)$/.exec(URLS[es_key])[1];
	var filename = state._('eventsheet:label:' + es_key) + '.' + ext;
	var blob = new Blob([ui8r], {type: MIME_TYPES[ext]});
	saveAs(blob, filename);
}

function es_render(ev, es_key, ui8r, extra_data) {
	if (DIRECT_DOWNLOAD_SHEETS[es_key]) {
		return direct_download(es_key, ui8r);
	}

	switch(es_key) {
	case '1BL-2015':
	case '2BLN-2015':
	case '2BLS-2015':
		return render_bundesliga(ev, es_key, ui8r, extra_data);
	case 'team-1BL-2015':
	case 'team-2BL-2015':
		return render_team_bl(ev, es_key, ui8r);
	case 'RLW-2016':
	case 'RLN-2016':
	case 'NRW-2016':
		return render_svg(ev, es_key, ui8r, extra_data);
	case '1BL-2016':
	case '2BLN-2016':
	case '2BLS-2016':
		return render_bundesliga2016(ev, es_key, ui8r, extra_data);
	default:
	throw new Error('Unsupported eventsheet key ' + es_key);
	}
}

function prepare_render(btn, es_key, extra_data) {
	var progress = $('<div class="loading-icon" />');
	btn.append(progress);
	download(es_key, function(ui8r) {
		progress.remove();
		es_render(state.event, es_key, ui8r, extra_data);
	});
}

function download(es_key, callback) {
	if (files[es_key]) {
		if (!callback) {
			return;
		}
		return callback(files[es_key]);
	}

	var url = URLS[es_key];
	if (!url) {
		throw new Error('Invalid eventsheet key ' + es_key);
	}

	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	var is_binary = true;
	xhr.responseType = is_binary ? 'arraybuffer' : 'text';

	xhr.onload = function() {
		var ui8r = new Uint8Array(this.response);
		files[es_key] = ui8r;
		if (callback) {
			callback(ui8r);
		}
	};
	xhr.send();
}

function render_links(s) {
	var league_key = s.event ? s.event.league_key : undefined;
	if (utils.deep_equal(ui_current_league_key, league_key)) {
		return;  // No need to reconfigure containers
	}
	ui_current_league_key = league_key;

	if (typeof pdfform != 'undefined') {
		loaded('pdfform');
	}
	if (typeof JSZip != 'undefined') {
		loaded('jszip');
	}

	var container = uiu.qs('.setup_eventsheets');
	uiu.empty(container);
	if (! league_key) {
		return;
	}

	if (eventutils.NRW2016_RE.test(league_key)) {
		league_key = 'NRW-2016';
	}
	var eventsheets = SHEETS_BY_LEAGUE[league_key];
	if (!eventsheets) { // Unsupported league
		report_problem.silent_error('Unsupported league ' + league_key);
		eventsheets = [];
	}
	eventsheets.forEach(function(es_key) {
		var i18n_key = 'eventsheet:label:' + es_key;
		if (EXTERNAL_DOWNLOAD_SHEETS[es_key]) {
			uiu.create_el(container, 'a', {
				'href': URLS[es_key],
				'download': '',
				'target': '_blank',
				'class': 'eventsheet_link',
				'data-i18n': i18n_key,
			}, s._(i18n_key));
		} else if (DIRECT_DOWNLOAD_SHEETS[es_key]) {
			var ext = /\.([a-z0-9]+)$/.exec(URLS[es_key])[1];
			var filename = state._('eventsheet:label:' + es_key) + '.' + ext;

			uiu.create_el(container, 'a', {
				'href': URLS[es_key],
				'download': filename,
				'class': 'eventsheet_link',
				'data-i18n': i18n_key,
			}, s._(i18n_key));
		} else {
			var link = uiu.create_el(container, 'a', {
				'href': '#',
				'class': 'eventsheet_link',
				'data-i18n': i18n_key,
			}, s._(i18n_key));
			click.on(link, function(e) {
				e.preventDefault();
				show_dialog(es_key);
			});
		}
	});
}

function ui_init() {
	var form = $('.eventsheet_form');
	form.on('submit', function(e) {
		e.preventDefault();
		var es_key = $('.eventsheet_container').attr('data-eventsheet_key');
		var fields = ['umpires', 'location', 'matchday', 'starttime', 'notes', 'backup_players_str', 'protest', 'teamster0', 'teamster1'];
		var extra_data = utils.map_dict(fields, function(field) {
			return form.find('[name="' + field + '"]').val();
		});

		prepare_render($('.eventsheet_generate_button'), es_key, extra_data);
		return false;
	});

	click.qs('.eventsheet_reload', function() {
		dialog_fetch();
	});

	$('.eventsheet_back').on('click', function(e) {
		e.preventDefault();
		var from_bup = $('.eventsheet_container').attr('data-eventsheet_key') != 'auto-direct';
		if (from_bup) {
			hide_dialog();
		} else {
			window.history.back();
		}
		return false;
	});

	if (window.localStorage) {
		var location_field = $('.eventsheet_form [name="location"]');
		try {
			var location = window.localStorage.getItem('bup_eventsheet_location');
			location_field.val(location);
		} catch(e) {
			// Ignore error
		}

		location_field.on('input change', function() {
			var location = $(this).val();
			try {
				window.localStorage.setItem('bup_eventsheet_location', location);
			} catch(e) {
				// Ignore error
			}
		});
	}
}

function on_fetch() {
	var event = state.event;
	var container = uiu.qs('.eventsheet_container');
	var KEYS = ['location', 'starttime', 'matchday', 'notes', 'protest'];
	KEYS.forEach(function(k) {
		if (event[k]) {
			container.querySelector('[name="' + k + '"]').value = event[k];
		}
	});

	eventutils.set_metadata(event);
	var umpires_str = (
		event.umpires ? event.umpires : (
			event.match_umpires ? event.match_umpires.join(', ') : ''));
	container.querySelector('[name="umpires"]').value = umpires_str;

	if (event.teamsters) {
		event.teamsters.forEach(function(teamster, idx) {
			if (teamster) {
				container.querySelector('[name="teamster' + idx + '"]').value = teamster;
			}
		});
	}

	var backup_players_str = calc_backup_players_str(state.event);
	if (backup_players_str) {
		container.querySelector('[name="backup_players_str"]').value = backup_players_str;
	}
}

function dialog_fetch() {
	uiu.visible_qs('.eventsheet_generate_loading_icon', !state.event || !_loaded_all_libs);
	var btn = $('.eventsheet_generate_button');
	if (state.event) {
		btn.removeAttr('disabled');
		on_fetch();
	} else {
		btn.attr('disabled', 'disabled');
		network.list_matches(state, function(err, ev) {
			uiu.visible_qs('.eventsheet_generate_loading_icon', !_loaded_all_libs);
			if (err) {
				$('.eventsheet_error_message').text(err.msg);
				uiu.visible_qs('.eventsheet_error', true);
				return;
			}
			state.event = ev;

			var container = $('.eventsheet_container');
			var es_key = container.attr('data-eventsheet_key');
			es_key = resolve_key(es_key);
			container.attr('data-eventsheet_key', es_key);
			btn.removeAttr('disabled');
			on_fetch();
		});
	}
}

function resolve_key(es_key) {
	var ev = state.event;

	if (es_key != 'auto-direct') {
		return es_key;
	}

	if (!ev) {
		return es_key; // Need to resolve again later
	}

	return ev.eventsheets[0].key;
}

function show_dialog(es_key) {
	state.ui.eventsheet = es_key;
	settings.hide(true);
	render.hide();

	es_key = resolve_key(es_key);
	if (es_key != 'auto-direct') {
		download(es_key);
	}

	var container = $('.eventsheet_container');
	container.attr('data-eventsheet_key', es_key);
	uiu.visible_qs('.eventsheet_container', true);

	var download_link = uiu.qs('.eventsheet_download_link');
	var download_link_container = uiu.qs('.eventsheet_download_link_container');
	var preview = uiu.qs('.eventsheet_preview');
	switch (es_key) {
	case '1BL-2015':
	case '2BLN-2015':
	case '2BLS-2015':
	case 'RLW-2016':
	case 'RLN-2016':
	case 'NRW-2016':
		uiu.visible_qs('.eventsheet_report', true);
		uiu.visible_qs('label.eventsheet_backup_players_str', true);
		uiu.visible_qsa('label.eventsheet_teamster', false);
		uiu.visible(preview, false);
		uiu.visible(download_link_container, false);
		break;
	case '1BL-2016':
	case '2BLN-2016':
	case '2BLS-2016':
		uiu.visible_qs('.eventsheet_report', true);
		uiu.visible_qs('label.eventsheet_backup_players_str', false);
		uiu.visible_qsa('label.eventsheet_teamster', true);
		uiu.visible(preview, false);
		uiu.visible(download_link_container, false);
		break;
	case 'team-1BL':
	case 'team-2BL':
		uiu.visible_qs('.eventsheet_report', false);
		// backup_players and teamsters are children of _report
		uiu.visible(preview, true);
		preview_team_bl(state, es_key);
		download_link.setAttribute('href', URLS[es_key]);
		uiu.visible(download_link_container, true);
		break;
	}
	if (DIRECT_DOWNLOAD_SHEETS[es_key]) {
		uiu.visible_qs('.eventsheet_report', false);
		uiu.visible(preview, false);
		uiu.visible(download_link_container, false);
	}

	uiu.text_qs('.eventsheet_generate_button',
		state._('eventsheet:Generate', {
			sheetname: state._('eventsheet:label:' + es_key),
		}));

	dialog_fetch();
}

function hide_dialog() {
	state.ui.eventsheet = null;
	uiu.visible_qs('.eventsheet_container', false);
	settings.show();
}

return {
	loaded: loaded,
	ui_init: ui_init,
	show_dialog: show_dialog,
	render_links: render_links,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var click = require('./click');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var render = require('./render');
	var report_problem = require('./report_problem');
	var scoresheet = require('./scoresheet');
	var settings = require('./settings');
	var svg2pdf = require('./svg2pdf');
	var uiu = require('./uiu');
	var utils = require('./utils');
	var xlsx = require('./xlsx');

	module.exports = eventsheet;
}
/*/@DEV*/