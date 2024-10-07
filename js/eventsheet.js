'use strict';
var eventsheet = (function() {

var SHEETS_BY_LEAGUE = {
	'1BL-2015': ['1BL-2015', 'team-1BL-2015'],
	'2BLN-2015': ['2BLN-2015', 'team-2BL-2015'],
	'2BLS-2015': ['2BLS-2015', 'team-2BL-2015'],
	'1BL-2016': ['1BL-2016', 'BL-ballsorten-2016', 'DBV-Satzungen-2016'],
	'2BLN-2016': ['2BLN-2016', 'BL-ballsorten-2016', 'DBV-Satzungen-2016'],
	'2BLS-2016': ['2BLS-2016', 'BL-ballsorten-2016', 'DBV-Satzungen-2016'],
	'1BL-2017': ['1BL-2017_pdf', '1BL-2016', 'buli2017-minsr', 'buli2017-minv', 'receipt', 'DBV-Satzungen-2017'],
	'2BLN-2017': ['2BLN-2017_pdf', '2BLN-2016', 'buli2017-minsr', 'buli2017-minv', 'receipt', 'DBV-Satzungen-2017'],
	'2BLS-2017': ['2BLS-2017_pdf', '2BLS-2016', 'buli2017-minsr', 'buli2017-minv', 'receipt', 'DBV-Satzungen-2017'],
	'1BL-2018': ['1BL-2017_pdf', '1BL-2016', 'buli2018-minsr', 'buli2018-minv', 'receipt', 'DBV-Satzungen-2018'],
	'2BLN-2018': ['2BLN-2017_pdf', '2BLN-2016', 'buli2018-minsr', 'buli2018-minv', 'receipt', 'DBV-Satzungen-2018'],
	'2BLS-2018': ['2BLS-2017_pdf', '2BLS-2016', 'buli2018-minsr', 'buli2018-minv', 'receipt', 'DBV-Satzungen-2018'],
	'1BL-2019': ['1BL-2017_pdf', '1BL-2016', 'buli2019-minsr', 'buli2019-minv', 'receipt', 'DBV-Satzungen-2019'],
	'2BLN-2019': ['2BLN-2017_pdf', '2BLN-2016', 'buli2019-minsr', 'buli2019-minv', 'receipt', 'DBV-Satzungen-2019'],
	'2BLS-2019': ['2BLS-2017_pdf', '2BLS-2016', 'buli2019-minsr', 'buli2019-minv', 'receipt', 'DBV-Satzungen-2019'],
	'1BL-2020': ['1BL-2017_pdf', '1BL-2016', '1BL-minreqs-2020', 'receipt'],
	'2BLN-2020': ['2BLN-2017_pdf', '2BLN-2016', '2BL-minreqs-2020', 'receipt'],
	'2BLS-2020': ['2BLS-2017_pdf', '2BLS-2016', '2BL-minreqs-2020', 'receipt'],
	'NRW-2016': ['NRW-2016', 'NRW-Satzungen'],
	'RLW-2016': ['RLW-2016', 'receipt', 'NRW-Satzungen'],
	'RLN-2016': ['RLN-2016', 'receipt', 'RLN-Satzungen'],
	'RLM-2016': ['RLM-2016', 'receipt', 'RLM-SpO'],
	'OLSW-2020': ['RLM-2016'],
	'OLM-2020': ['RLM-2016'],
	'RLSOO-2017': ['RLSO-2017', 'receipt', 'RLSO-SpO'],
	'RLSOS-2017': ['RLSO-2017', 'receipt', 'RLSO-SpO'],
	'RLSO-2019': ['RLSO-2017', 'receipt', 'RLSO-SpO'],
	'NLA-2017': ['NLA-2017'],
	'NLA-2019': ['NLA-2019'],
	'OBL-2017': ['OBL-2017'],
	'OBL-2024': [],
	'bayern-2018': ['bayern-2018'],
	'international-2017': ['int'],
};

var URLS = {
	'1BL-2015': 'div/Spielberichtsbogen_1BL-2015.pdf',
	'2BLN-2015': 'div/Spielberichtsbogen_2BL-2015.pdf',
	'2BLS-2015': 'div/Spielberichtsbogen_2BL-2015.pdf',
	'1BL-2016': 'div/Spielbericht-Buli-2016-17.xlsm',
	'2BLN-2016': 'div/Spielbericht-Buli-2016-17.xlsm',
	'2BLS-2016': 'div/Spielbericht-Buli-2016-17.xlsm',
	'1BL-2017_pdf': 'div/buli2017_spielbericht.svg',
	'2BLN-2017_pdf': 'div/buli2017_spielbericht.svg',
	'2BLS-2017_pdf': 'div/buli2017_spielbericht.svg',
	'BL-ballsorten-2016': 'div/bundesliga-ballsorten-2016.pdf',
	'DBV-Satzungen-2016': 'http://www.badminton.de/fileadmin/images/spielregeln/16-dbv-druckwerk_satzung-ordnungen-spielregeln201617-website.pdf',
	'DBV-Satzungen-2017': 'http://www.badminton.de/fileadmin/user_upload/17-dbv-druckwerk_satzung-ordnungen-spielregeln201718-website.pdf.pdf',
	'DBV-Satzungen-2018': 'https://www.badminton.de/fileadmin/user_upload/18-dbv-druckwerk_satzung-ordnungen-spielregeln201819-website.pdf.pdf',
	'DBV-Satzungen-2019': 'https://aufschlagwechsel.de/2019/dbv_satzung_2019.pdf',
	'RLW-2016': 'div/Spielbericht_8x3x21.svg',
	'RLN-2016': 'div/Spielbericht_8x3x21.svg',
	'RLN-Satzungen': 'https://gruppe-nord.net/download/satzung-und-ordnungen-der-gruppe-nord/?wpdmdl=372',
	'RLM-2016': 'div/Spielbericht_8x3x21.svg',
	'RLM-SpO': 'https://www.dbv-mitte.de/wp-content/uploads/2022/04/Gruppe_Mitte_im_DBV_Ordnungen_20220409.pdf',
	'NLA-2017': 'div/eventsheet/nla_resultatblatt.svg',
	'NLA-2019': 'div/eventsheet/nla_resultatblatt-2019.svg',
	'NRW-2016': 'div/Spielbericht_8x3x21.svg',
	'NRW-Satzungen': 'https://www.badminton-nrw.de/fileadmin/gstnrw/pdf_xls_doc/Satzungswerk/2019/SatzungOrdnungen19-20_0407.pdf',
	'team-1BL-2015': 'div/Mannschaftsaufstellung_1BL-2015.pdf',
	'team-2BL-2015': 'div/Mannschaftsaufstellung_2BL-2015.pdf',
	'buli2017-minsr': 'div/buli2017_mindestanforderungen_schiedsrichter.svg',
	'buli2017-minv': 'div/buli2017_mindestanforderungen_verein.svg',
	'buli2018-minsr': 'div/eventsheet/buli2018_mindestanforderungen_schiedsrichter.svg',
	'buli2018-minv': 'div/eventsheet/buli2018_mindestanforderungen_verein.svg',
	'buli2019-minsr': 'div/eventsheet/buli2019_mindestanforderungen_schiedsrichter.svg',
	'buli2019-minv': 'div/eventsheet/buli2019_mindestanforderungen_verein.svg',
	'1BL-minreqs-2020': 'div/eventsheet/1BL-minreqs-2020.xlsx',
	'2BL-minreqs-2020': 'div/eventsheet/2BL-minreqs-2020.xlsx',
	'OBL-2017': 'div/eventsheet_obl.xlsx',
	'receipt': 'div/receipt.svg',
	'int': 'div/eventsheet_international.svg',
	'bayern-2018': 'div/eventsheet/bayern-2018.svg',
	'RLSO-SpO': 'http://www.badminton-gruppe-suedost.de/ordnungen/GrSO_SpO-2021.pdf',
	'RLSO-2017': 'div/eventsheet/rlso-2017.xlsx',
};
var DIRECT_DOWNLOAD_SHEETS = {
	'BL-ballsorten-2016': true,
};
var GENERATED_DOWNLOAD = {
	'1BL-minreqs-2020': true,
	'2BL-minreqs-2020': true,
};
var EXTERNAL_DOWNLOAD_SHEETS = {
	'DBV-Satzungen-2017': true,
	'DBV-Satzungen-2018': true,
	'DBV-Satzungen-2019': true,
	'RLN-Satzungen': true,
	'RLM-SpO': true,
	'NRW-Satzungen': true,
	'RLSO-SpO': true,
};
var NO_DIALOG = {
	'buli2017-minsr': true,
	'buli2017-minv': true,
	'buli2018-minsr': true,
	'buli2018-minv': true,
	'buli2019-minsr': true,
	'buli2019-minv': true,
	'NLA-2017': true,
	'NLA-2019': true,
};

var MIME_TYPES = {
	pdf: 'application/pdf',
	html: 'text/html',
};

var files = {};

function players2str(players, sep) {
	return players.map(function(player) {
		return player.name;
	}).join(sep || ', ');
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

function _default_extra_data(extra_data, ev) {
	['umpires', 'referee', 'location', 'date', 'matchday', 'starttime', 'protest', 'notes', 'spectators'].forEach(function(key) {
		extra_data[key] = extra_data[key] || ev[key];
	});
	['backup_players', 'present_players'].forEach(function(k) {
		var ar = ev[k];
		if (!ar) {
			return;
		}
		ar.forEach(function(players, team_id) {
			extra_data[k + team_id] = extra_data[k + team_id] || players2str(players);
		});
	});

	if (extra_data.minreqs_met === undefined) {
		extra_data.minreqs_met = ev.minreqs_met !== false;
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

function save_bundesliga(ev, es_key, ui8r, extra_data) {
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
		var netscore = m.network_score;
		var res;
		if (utils.deep_equal(netscore, [[0, 0]])) {
			res = [];
		} else {
			res = netscore.map(function(nscore) {
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

		var netscore = m.network_score;
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
	save_file(blob, filename);
}

function save_team_bl(ev, es_key, ui8r) {
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
	save_file(blob, filename);
}

function _svg_text(svg, id, val, move_y) {
	var whole_id = 'es_svg_' + id;
	var text_el = svg.getElementById(whole_id);
	if (!text_el) {
		return;
	}
	uiu.text(text_el, val);
	if (move_y) {
		var y = parseFloat(text_el.getAttribute('y'));
		text_el.setAttribute('y', y + move_y);
	}
}

// Decorator for svg-based sheets.
// The function gets called with (svg, ev, es_key, extra_data), and must return {orientation, optionally scale}.
function _svg_func(func) {
	return function(preview, ev, es_key, ui8r, extra_data, extra_files) {
		var svg = svg_utils.parse(ui8r);
		svg.setAttribute('style', 'max-width:100%;max-height:100%;');

		i18n.translate_nodes(svg, state);

		preview.appendChild(svg);
		var info = func(svg, ev, es_key, extra_data, extra_files);
		var subject = state._('eventsheet:label|' + es_key);
		var title = subject + ' ' + ev.event_name;
		info.props = {
			subject: subject,
			title: title,
			creator: 'bup (https://phihag.de/bup/)',
		};
		if (state.settings && state.settings.umpire_name) {
			info.props.author = state.settings.umpire_name;
		}
		info.filename = info.filename || (title + '.pdf');
		preview.setAttribute('data-info_json', JSON.stringify(info));

		printing.set_orientation(info.orientation);

		preview.style.width = (info.orientation === 'landscape') ? 'calc(100vw - 4em)' : '';
	};
}

var render_buli_minreq_svg = _svg_func(function(svg, ev) {
	_svg_text(svg, 'team0', ev.team_names[0]);
	_svg_text(svg, 'team1', ev.team_names[1]);
	_svg_text(svg, 'date', ev.date);

	return {
		orientation: 'portrait',
		scale: 0.228,
	};
});

var render_nla = _svg_func(function(svg, ev) {
	eventutils.set_metadata(ev);

	var sum_games = [0, 0];
	var sum_matches = [0, 0];

	ev.matches.forEach(function(match) {
		var netscore = match.network_score;
		var eid = calc_match_id(match);

		match.setup.teams.forEach(function(team, team_id) {
			team.players.forEach(function(player, player_id) {
				var key = eid + '_player' + team_id + '.' + player_id;
				_svg_text(svg, key, player.name);
			});
		});

		if (netscore) {
			netscore.forEach(function(ns, game_id) {
				ns.forEach(function(score, team_id) {
					_svg_text(svg, eid + '_score' + game_id + '_' + team_id, score);
				});
			});
		}

		if (netscore && (netscore.length > 0) && ((netscore[0][0] > 0) || (netscore[0][1] > 0))) {
			var games = calc_gamescore(match.setup.counting, netscore);
			sum_games[0] += games[0];
			sum_games[1] += games[1];
			_svg_text(svg, eid + '_games0', games[0]);
			_svg_text(svg, eid + '_games1', games[1]);

			var matches_score = calc_matchscore(match.setup.counting, netscore);
			if (matches_score[0] !== undefined) {
				sum_matches[0] += matches_score[0];
				sum_matches[1] += matches_score[1];
			}
			_svg_text(svg, eid + '_matches0', matches_score[0]);
			_svg_text(svg, eid + '_matches1', matches_score[1]);
		} else {
			_svg_text(svg, eid + '_games0', '');
			_svg_text(svg, eid + '_games1', '');
			_svg_text(svg, eid + '_matches0', '');
			_svg_text(svg, eid + '_matches1', '');
		}
	});

	var sums_active = sum_games[0] || sum_games[1];
	_svg_text(svg, 'sum_games0', sums_active ? sum_games[0] : '');
	_svg_text(svg, 'sum_games1', sums_active ? sum_games[1] : '');
	_svg_text(svg, 'sum_matches0', sums_active ? sum_matches[0] : '');
	_svg_text(svg, 'sum_matches1', sums_active ? sum_matches[1] : '');
	(ev.team_names || []).forEach(function(team_name, team_id) {
		_svg_text(svg, 'teamname' + team_id, team_name);
	});

	if (ev.date) {
		var d = ev.date.split('.');
		_svg_text(svg, 'day', d[0]);
		_svg_text(svg, 'month', d[1]);
		_svg_text(svg, 'year', d[2]);
	}

	if (ev.shuttle_count) {
		_svg_text(svg, 'shuttle_count', ev.shuttle_count);
	}

	return {
		orientation: 'landscape',
	};
});

var render_buli2017_pdf = _svg_func(function(svg, ev, es_key, extra_data) {
	eventutils.set_metadata(ev);

	var matches = ev.matches;
	var last_update = calc_last_update(matches);

	_svg_text(svg, 'x_1BL', /^1BL/.test(ev.league_key) ? 'X' : '');
	_svg_text(svg, 'x_2BLN', /^2BLN/.test(ev.league_key) ? 'X' : '');
	_svg_text(svg, 'x_2BLS', /^2BLS/.test(ev.league_key) ? 'X' : '');
	_svg_text(svg, 'umpires', extra_data.umpires);
	_svg_text(svg, 'location', extra_data.location);
	_svg_text(svg, 'date', ev.date || (last_update ? utils.date_str(last_update) : ''));
	_svg_text(svg, 'matchday', extra_data.matchday);
	_svg_text(svg, 'starttime', extra_data.starttime);
	_svg_text(svg, 'endtime', last_update ? utils.time_str(last_update) : '');

	_svg_text(svg, 'minreqs_' + ((extra_data.minreqs_met !== false) ? 'true' : 'false'), 'X');

	_svg_text(svg, 'team0', ev.team_names[0]);
	_svg_text(svg, 'team1', ev.team_names[1]);

	var match_order = get_match_order(matches);
	var total_sums = {
		p: [0, 0],
		g: [0, 0],
		m: [0, 0],
	};

	matches.forEach(function(m, match_id) {
		var match_eventsheet_id = calc_match_id(m);
		var netscore = m.network_score || [];

		var mo = match_order[match_id];
		if (mo) {
			_svg_text(svg, match_eventsheet_id + '_order', mo);
		}

		m.setup.teams.forEach(function(team, team_id){
			team.players.forEach(function(player, player_id) {
				_svg_text(svg, match_eventsheet_id + '_n_' + team_id + '_' + player_id, player.name);
			});

			netscore.forEach(function(game, game_id) {
				_svg_text(svg, match_eventsheet_id + '_p' + game_id + '_' + team_id, game[team_id]);
			});
		});

		var sums = calc_sums(m);
		if (sums.show) {
			['p', 'g', 'm'].forEach(function(key) {
				sums[key].forEach(function(val, team_id) {
					_svg_text(svg, match_eventsheet_id + '_' + key + 'sum' + team_id, val);
				});
			});

			_add_totals(total_sums, sums);
		}
	});

	if (total_sums.show) {
		['p', 'g', 'm'].forEach(function(key) {
			total_sums[key].forEach(function(val, team_id) {
				_svg_text(svg, key + 'sum' + team_id, val);
			});
		});
	}

	total_sums.m.forEach(function(mval, team_id) {
		// No draw because 7 matches
		if (mval > matches.length / 2) {
			_svg_text(svg, 'winner', ev.team_names[team_id]);
		}
	});

	_svg_text(svg, 'backup_players0', extra_data.backup_players0);
	_svg_text(svg, 'backup_players1', extra_data.backup_players1);
	_svg_text(svg, 'present_players0', extra_data.present_players0);
	_svg_text(svg, 'present_players1', extra_data.present_players1);

	_svg_text(svg, 'protest', extra_data.protest);

	var notes_el = svg.getElementById('es_svg_notes');
	var notes = extra_data.notes;
	var notes2 = '';
	uiu.text(notes_el, notes);
	while (notes_el.getComputedTextLength() > 245) {
		var notes_m = /^(.*)(\s+\S+\s*)$/.exec(notes);
		if (!notes_m) break;
		notes = notes_m[1];
		notes2 = notes_m[2] + notes2;
		uiu.text(notes_el, notes);
	}
	state.notes = notes_el;
	if (extra_data.spectators) {
		notes2 += (notes2 ? '  ' : '') + extra_data.spectators + ' Zuschauer';
	}
	_svg_text(svg, 'notes2', notes2);

	return {
		filename: state._('Event Sheet') + ' ' + ev.event_name + (last_update ? (' ' + utils.date_str(last_update)) : '') + '.pdf',
		orientation: 'landscape',
	};
});

function _international_name(match_name) {
	return {
		'HD': 'MD',
		'DD': 'WD',
		'HE': 'MS',
		'DE': 'WS',
		'GD': 'XD',
	}[match_name] || match_name;
}

var render_int = _svg_func(function(svg, ev, es_key, extra_data) {
	eventutils.set_metadata(ev);

	var matches = ev.matches;
	var last_update = calc_last_update(matches);

	_svg_text(svg, 'referee', extra_data.referee);
	_svg_text(svg, 'umpires', extra_data.umpires);
	_svg_text(svg, 'location', extra_data.location);
	_svg_text(svg, 'date', ev.date || (last_update ? utils.date_str(last_update) : ''));
	_svg_text(svg, 'starttime', extra_data.starttime);
	_svg_text(svg, 'endtime', last_update ? utils.time_str(last_update) : '');

	_svg_text(svg, 'team0', ev.team_names[0]);
	_svg_text(svg, 'team1', ev.team_names[1]);
	_svg_text(svg, 'teamh0', ev.team_names[0]);
	_svg_text(svg, 'teamh1', ev.team_names[1]);
	_svg_text(svg, 'teamster0', 'Teamster ' + ev.team_names[0]);
	_svg_text(svg, 'teamster1', 'Teamster ' + ev.team_names[1]);

	var match_order = get_match_order(matches);
	var total_sums = {
		p: [0, 0],
		g: [0, 0],
		m: [0, 0],
	};

	matches.forEach(function(m, match_num) {
		var netscore = m.network_score || [];

		var mo = match_order[match_num];
		if (mo) {
			_svg_text(svg, 'order' + match_num, mo);
		}

		_svg_text(svg, 'name' + match_num, _international_name(calc_match_id(m)));
		m.setup.teams.forEach(function(team, team_id){
			team.players.forEach(function(player, player_id) {
				_svg_text(
					svg,
					match_num + 'n' + team_id + '_' + player_id,
					player.name,
					(m.setup.is_doubles ? 0 : 2.5));
			});

			netscore.forEach(function(game, game_id) {
				_svg_text(svg, match_num + 'p' + team_id + '_' + game_id, game[team_id]);
			});
		});

		netscore.forEach(function(game, game_id) {
			_svg_text(svg, match_num + 'd' + game_id, '-');
		});

		var sums = calc_sums(m);
		if (sums.show) {
			['p', 'g', 'm'].forEach(function(key) {
				sums[key].forEach(function(val, team_id) {
					_svg_text(svg, match_num + key + 'sum' + team_id, val);
				});
			});

			_add_totals(total_sums, sums);
		}
	});

	if (total_sums.show) {
		['p', 'g', 'm'].forEach(function(key) {
			total_sums[key].forEach(function(val, team_id) {
				_svg_text(svg, key + 'sum' + team_id, val);
			});
		});
	}

	total_sums.m.forEach(function(mval, team_id) {
		// No draw because 7 matches
		if (mval > matches.length / 2) {
			_svg_text(svg, 'winner', ev.team_names[team_id]);
		}
	});

	_svg_text(svg, 'backup_players_str', extra_data.backup_players_str);
	_svg_text(svg, 'protest', extra_data.protest);
	_svg_text(svg, 'notes', extra_data.notes);

	return {
		filename: ev.event_name + (last_update ? (' ' + utils.date_str(last_update)) : '') + '.pdf',
		orientation: 'landscape',
	};
});

var render_receipt = _svg_func(function(svg, ev, es_key, extra_data, extra_files) {
	_svg_text(svg, 'event', ev.event_name);
	_svg_text(svg, 'date', ev.date || utils.date_str(Date.now()));

	for (var i = 0;i < 2;i++) {
		_svg_text(svg, 'receipt_umpire' + i, extra_data['receipt_umpire' + i]);
		_svg_text(svg, 'receipt_distance' + i, extra_data['receipt_distance' + i]);
		_svg_text(svg, 'signature' + i, extra_data['receipt_umpire' + i] || state._('setupsheet:signature'));

		var pay = eventutils.umpire_pay(ev.league_key);
		if (pay) {
			var tcost = 0;
			_svg_text(svg, 'travelcurrency' + i, pay.currency);
			_svg_text(svg, 'totalcurrency' + i, pay.currency);
			if (pay.per_km) {
				_svg_text(svg, 'perkm' + i, '(' + i18n.format_money(state.lang, pay.per_km) + pay.currency + ' / km)');

				var dist = parseFloat((extra_data['receipt_distance' + i] || '').replace(',', '.'));
				if (!isNaN(dist)) {
					tcost = dist * pay.per_km;
					_svg_text(svg, 'travelcosts' + i, i18n.format_money(state.lang, tcost));
					_svg_text(svg, 'total' + i, i18n.format_money(state.lang, tcost + pay.base));
				}
			}

			_svg_text(svg, 'basecost' + i,
				i18n.format_money(state.lang, pay.base) + pay.currency +
				' (' + eventutils.name_by_league(ev.league_key) + ')'
			);

		}
	}

	if (extra_files) {
		var logo_container = svg.getElementById('es_svg_receipt_logo');
		svg_utils.copy(logo_container, svg_utils.parse(extra_files.logo), 120, 18, 70);
	}

	return {
		filename: state._('receipt:header') + ' ' + ev.event_name + '.pdf',
	};
});

var render_bayern = _svg_func(function(svg, ev, es_key, extra_data) {
	eventutils.set_metadata(ev);
	var total_sums = {
		p: [0, 0],
		g: [0, 0],
		m: [0, 0],
	};
	var match_container = svg.getElementById('es_svg_table');
	var y = 62;
	var FONT_SIZE = 2.85;
	var TEXT_OFFSET = 3.53;
	var TEXT_STYLE = 'font-size:' + FONT_SIZE;
	ev.matches.forEach(function(m, i) {
		var sums = calc_sums(m);
		_add_totals(total_sums, sums);

		if (i > 0) {
			utils.svg_el(match_container, 'line', {
				x1: 15,
				x2: 275,
				y1: y,
				y2: y,
				style: 'stroke-width:.1',
			});
		}

		var height = m.setup.is_doubles ? 10 : 5;
		var my = (y + height / 2 - 2.5 + TEXT_OFFSET);
		utils.svg_el(match_container, 'text', {
			x: 24,
			y: my,
			'text-anchor': 'middle',
			style: TEXT_STYLE,
		}, m.setup.match_name);

		m.setup.teams.forEach(function(team, team_idx) {
			team.players.forEach(function(player, player_idx) {
				utils.svg_el(match_container, 'text', {
					x: 33 + 73 * team_idx,
					y: y + TEXT_OFFSET + 5 * player_idx,
					style: TEXT_STYLE,
				}, player.name);
			});
		});

		var netscore = m.network_score || [];
		netscore.forEach(function(game_score, game_idx) {
			utils.svg_el(match_container, 'text', {
				x: 187 + 16 * game_idx,
				y: my,
				style: TEXT_STYLE,
				'text-anchor': 'middle',
			}, game_score.join(':'));
		});

		if (sums.show) {
			utils.svg_el(match_container, 'text', {
				x: 235,
				y: my,
				style: TEXT_STYLE,
				'text-anchor': 'middle',
			}, sums.p.join(':'));
			utils.svg_el(match_container, 'text', {
				x: 251,
				y: my,
				style: TEXT_STYLE,
				'text-anchor': 'middle',
			}, sums.g.join(':'));
			utils.svg_el(match_container, 'text', {
				x: 267,
				y: my,
				style: TEXT_STYLE,
				'text-anchor': 'middle',
			}, sums.m.join(':'));
		}

		y += height;
	});

	_svg_text(svg, 'psum', total_sums.p.join(':'));
	_svg_text(svg, 'gsum', total_sums.g.join(':'));
	_svg_text(svg, 'msum', total_sums.m.join(':'));

	_svg_text(svg, 'team0', ev.team_names[0]);
	_svg_text(svg, 'team1', ev.team_names[1]);

	_svg_text(svg, 'series_name', ev.series_name);
	_svg_text(svg, 'tournament_name', ev.tournament_name);
	_svg_text(svg, 'confirmed', (
		(ev.confirmed === true) ?
		'(genehmigt)' :
		((ev.confirmed === false) ? '(noch nicht genehmigt)': '')));
	_svg_text(svg, 'dateline', ev.date + ', ' + extra_data.starttime + ' Uhr');
	_svg_text(svg, 'eventline', ev.event_name + ' - ' + total_sums.m.join(' : '));

	var last_update = calc_last_update(ev.matches) || ev.last_update;
	_svg_text(svg, 'timeline',
		'Spielbeginn: ' + extra_data.starttime + ' Uhr' +
		(last_update ? ' - Spielende: ' + utils.time_str(last_update) : ''));

	_svg_text(svg, 'notes', extra_data.notes);


	if (ev.last_update) {
		_svg_text(svg, 'last_update', 'Letzte Änderung: ' + utils.datetime_str(ev.last_update));
	}

	return {
		filename: state._('eventsheet:label|bayern-2018') + ' ' + ev.event_name + '.pdf',
		orientation: 'landscape',
	};
});

var render_basic_eventsheet = _svg_func(function(svg, ev, es_key, extra_data) {
	eventutils.set_metadata(ev);

	var match_order = ['1.HD', '2.HD', 'DD', '1.HE', '2.HE', '3.HE', 'DE', 'GD'];
	var matches = order_matches(ev, match_order);
	var last_update = calc_last_update(matches);

	var match_order_nums = get_match_order(matches);
	match_order_nums.forEach(function(mon, i) {
		_svg_text(svg, 'match' + i + '_order', mon);
	});

	var sum_points = [0, 0];
	var sum_games = [0, 0];
	var sum_matches = [0, 0];

	matches.forEach(function(match, match_id) {
		var netscore = match.network_score;

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

	if (sum_points[0] || sum_points[1]) {
		_svg_text(svg, 'sum_points0', sum_points[0]);
		_svg_text(svg, 'sum_points1', sum_points[1]);
		_svg_text(svg, 'sum_games0', sum_games[0]);
		_svg_text(svg, 'sum_games1', sum_games[1]);
		_svg_text(svg, 'sum_matches0', sum_matches[0]);
		_svg_text(svg, 'sum_matches1', sum_matches[1]);
	}

	var winner_str = event_winner_str(ev, sum_matches[0], sum_matches[1]);
	_svg_text(svg, 'winner', winner_str);

	_svg_text(svg, 'starttime', extra_data.starttime);
	_svg_text(svg, 'endtime', last_update ? utils.time_str(last_update) : '');
	_svg_text(svg, 'date', ev.date || (last_update ? utils.date_str(last_update) : ''));
	_svg_text(svg, 'matchday', extra_data.matchday);
	_svg_text(svg, 'home_team_name', ev.team_names[0]);
	_svg_text(svg, 'away_team_name', ev.team_names[1]);
	_svg_text(svg, 'tournament_name', ev.tournament_name);
	_svg_text(svg, 'location', extra_data.location);
	_svg_text(svg, 'notes', extra_data.notes);
	_svg_text(svg, 'backup_players', extra_data.backup_players_str);
	_svg_text(svg, 'protest', extra_data.protest);
	_svg_text(svg, 'umpires', extra_data.umpires);

	return {
		filename: state._('Event Sheet') + ' ' + ev.event_name + (last_update ? (' ' + utils.date_str(last_update)) : '') + '.pdf',
		orientation: 'landscape',
	};
});

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

function _add_totals(totals, add) {
	totals.show = totals.show || add.show;
	['p', 'g', 'm'].forEach(function(key) {
		totals[key][0] += add[key][0] || 0;
		totals[key][1] += add[key][1] || 0;
	});
}

// p: points, g: games, m:matches
function calc_sums(match) {
	var netscore = match.network_score || [];
	if (!netscore.length) {
		return {
			p: [],
			g: [],
			m: [],
			show: false,
		};
	}
	var res = {
		p: [0, 0],
		g: [0, 0],
		m: [],
	};
	netscore.forEach(function(ngame, game_idx) {
		res.p[0] += ngame[0];
		res.p[1] += ngame[1];

		var winner = calc.game_winner(match.setup.counting, game_idx, ngame[0], ngame[1]);
		if (winner === 'left') {
			res.g[0]++;
		} else if (winner === 'right') {
			res.g[1]++;
		}
	});

	var mwinner = calc.match_winner(match.setup.counting, netscore);
	if (mwinner === 'left') {
		res.m = [1, 0];
	} else if (mwinner === 'right') {
		res.m = [0, 1];
	}

	res.show = (res.p[0] > 0) || (res.p[1] > 0);

	return res;
}

function save_bundesliga2016(ev, es_key, ui8r, extra_data) {
	eventutils.set_metadata(ev);
	var match_order = get_match_order(ev.matches);
	var last_update = calc_last_update(ev.matches);
	var today = last_update ? last_update : Date.now();

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

						var match_eventsheet_id = calc_match_id(match);
						var col = MATCH_COLS[player.gender][match_eventsheet_id];
						if (col === undefined) {
							report_problem.silent_error('Cannot find ' + match_eventsheet_id + ' in ' + es_key + ' sheet (gender ' + player.gender + ')');
							return;
						}

						sheet.text(col + row, 'x');
						var v = x_count[player.gender][col];
						x_count[player.gender][col] = v ? (v + 1) : 1;
					});
				});

				if (ev.backup_players) {
					ev.backup_players[team_id].forEach(function(player) {
						var row = row_idx[player.gender];
						sheet.text('B' + row, player.name);
						sheet.text('J' + row, 'x');
						row_idx[player.gender]++;
					});
				}

				if (ev.present_players) {
					ev.present_players[team_id].forEach(function(player) {
						var row = row_idx[player.gender];
						sheet.text('B' + row, player.name);
						row_idx[player.gender]++;
					});
				}

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

				var incomplete = ev.matches.some(function(m) {
					return m.setup.incomplete;
				});
				sheet.val('C5', incomplete ? 0 : 1);
			});
		}

		function fill_result_sheet(cb) {
			xlsx_file.modify_sheet('5', cb, function(sheet) {
				sheet.rm_protection();

				var league_key = ev.league_key;
				var m = /^(.*)-[0-9]+$/.exec(league_key);
				if (m) {
					league_key = m[1];
				}
				var x_location = {
					'1BL': 'E4',
					'2BLN': 'E5',
					'2BLS': 'E6',
				}[league_key];
				if (x_location) {
					sheet.text(x_location, 'X');
				} else {
					report_problem.silent_error('Unsupported league ' + league_key);
				}

				sheet.val('C10', ev.team_names[0], true);
				sheet.val('F10', ev.team_names[1], true);

				sheet.text('E8', extra_data.location);
				sheet.text('W8', extra_data.matchday);
				sheet.text('W4', extra_data.umpires);
				sheet.text('AB6', extra_data.starttime);
				var all_finished = ev.matches.every(function(m) {
					return m.network_finished;
				});
				sheet.text('W6', utils.date_str(today));
				if (last_update && all_finished) {
					sheet.text('AB8', utils.time_str(last_update));
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
					var match_eventsheet_id = calc_match_id(match);
					var row = MATCH_ROWS[match_eventsheet_id];
					if (row === undefined) {
						report_problem.silent_error('Cannot find ' + match_eventsheet_id + ' in ' + es_key + ' sheet');
						return;
					}

					if (match_order[match_id]) {
						sheet.text('A' + row, match_order[match_id]);
					}

					setup.teams.forEach(function(team, team_id) {
						team.players.forEach(function(player, player_id) {
							sheet.text(xlsx.add_col('C', 3 * team_id) + (row + player_id), player.name);
						});
					});

					var netscore = match.network_score || [];
					if (utils.deep_equal(netscore, [[0, 0]])) {
						netscore = [];
					}
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
					_enter_sums('X', sums.p);
					_enter_sums('Z', sums.g);
					_enter_sums('AB', sums.m);
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

				if (ev.backup_players) {
					sheet.text('D25', players2str(ev.backup_players[0]));
					sheet.text('D26', players2str(ev.backup_players[1]));
				}
				if (ev.present_players) {
					sheet.text('U25', players2str(ev.present_players[0]));
					sheet.text('U26', players2str(ev.present_players[1]));
				}

				sheet.text('D28', extra_data.notes);
				sheet.text('D29', extra_data.spectators ? extra_data.spectators + ' Zuschauer' : '');
				sheet.text('D31', extra_data.protest);
				sheet.text(extra_data.minreqs_met ? 'V33' : 'Y33', 'X'); // Mindestanforderungen
			});
		}

		function fill_score_sheets(cb) {
			var d_count = 0;

			var thick_border_id = xlsx_file.add_border('medium');
			var thick_center_style_id = xlsx_file.add_style(function(xf) {
				uiu.attr(xf, {
					numFmtId: 0,
					borderId: thick_border_id,
					xfId: 0,
					applyBorder: 1,
					applyAlignment: 1,
				});
				uiu.ns_el(xf, xlsx.NS, 'alignment', {
					horizontal: 'center',
					vertical: 'center',
				});
			});

			xlsx_file.modify_sheet('6', cb, function(sheet) {
				function add_winner_circle(start_row, team_id) {
					var start_col = 6 + team_id * 15;

					sheet.add_drawing(function(drawings) {
						var anchor = uiu.el(drawings, 'xdr:twoCellAnchor');
						var from = uiu.el(anchor, 'xdr:from');
						uiu.el(from, 'xdr:col', {}, start_col);
						uiu.el(from, 'xdr:colOff', {}, -200000);
						uiu.el(from, 'xdr:row', {}, start_row);
						uiu.el(from, 'xdr:rowOff', {}, -120000);
						var to = uiu.el(anchor, 'xdr:to');
						uiu.el(to, 'xdr:col', {}, start_col + 9);
						uiu.el(to, 'xdr:colOff', {}, 0);
						uiu.el(to, 'xdr:row', {}, start_row + 3);
						uiu.el(to, 'xdr:rowOff', {}, 120000);

						var sp = uiu.el(anchor, 'xdr:sp');

						var nvSpPr = uiu.el(sp, 'xdr:nvSpPr');
						uiu.el(nvSpPr, 'xdr:cNvPr', {'id': 1000 + d_count, 'name': 'bup ' + d_count});
						d_count++;
						uiu.el(nvSpPr, 'xdr:cNvSpPr');

						var spPr = uiu.el(sp, 'xdr:spPr');
						uiu.el(spPr, 'a:prstGeom', {prst: 'ellipse'});
						var line = uiu.el(spPr, 'a:ln', {w: 36000});
						var line_fill = uiu.el(line, 'a:solidFill');
						uiu.el(line_fill, 'a:srgbClr', {val: '000000'});
						uiu.el(anchor, 'xdr:clientData');
					});
				}

				function gen_game_circle(start_row, c) {
					var row = start_row + 5 + 5 * c.table;
					var col = 5 + c.col;

					sheet.text(xlsx.num2col(col + 1) + (row + 2), c.score[0]);
					sheet.text(xlsx.num2col(col + 1) + (row + 3), c.score[1]);

					sheet.add_drawing(function(drawings) {
						var anchor = uiu.el(drawings, 'xdr:twoCellAnchor');
						var from = uiu.el(anchor, 'xdr:from');
						uiu.el(from, 'xdr:col', {}, col + 1);
						uiu.el(from, 'xdr:colOff', {}, -150000);
						uiu.el(from, 'xdr:row', {}, row);
						uiu.el(from, 'xdr:rowOff', {}, 20000);
						var to = uiu.el(anchor, 'xdr:to');
						uiu.el(to, 'xdr:col', {}, col + 2);
						uiu.el(to, 'xdr:colOff', {}, 150000);
						uiu.el(to, 'xdr:row', {}, row + 4);
						uiu.el(to, 'xdr:rowOff', {}, -40000);

						var sp = uiu.el(anchor, 'xdr:sp');

						var nvSpPr = uiu.el(sp, 'xdr:nvSpPr');
						uiu.el(nvSpPr, 'xdr:cNvPr', {'id': 1000 + d_count, 'name': 'bup ' + d_count});
						d_count++;
						uiu.el(nvSpPr, 'xdr:cNvSpPr');

						var spPr = uiu.el(sp, 'xdr:spPr');
						uiu.el(spPr, 'a:prstGeom', {prst: 'ellipse'});
						var line = uiu.el(spPr, 'a:ln', {w: 12000});
						var line_fill = uiu.el(line, 'a:solidFill');
						uiu.el(line_fill, 'a:srgbClr', {val: '000000'});
						uiu.el(anchor, 'xdr:clientData');
					});
				}

				function gen_vertical_text(start_row, c) {
					sheet.text(xlsx.add_col('F', c.col) + (start_row + 6 + 5 * c.table + parseInt(Math.ceil(c.row))), c.val);
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
					sheet.val('C' + (start_row + 3), xlsx.date(new Date(today)));

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

		function fill_minreq_sheet(cb) {
			xlsx_file.modify_sheet('8', cb, function(sheet) {
				sheet.val('A43', ev.team_names[0]);
				sheet.val('B43', ev.team_names[1]);
				sheet.val('B45', utils.date_str(today));
			});
		}

		utils.parallel([function(cb) {
			fill_team_sheet('2', 0, cb);
		}, function(cb) {
			fill_team_sheet('3', 1, cb);
		},
		fill_result_sheet,
		fill_score_sheets,
		fill_minreq_sheet,
		], function() {
			xlsx_file.save('Spielbericht ' + ev.event_name + '.xlsm');
		});
	});
}

function save_obl(ev, es_key, ui8r, extra_data) {
	eventutils.set_metadata(ev);
	var last_update = calc_last_update(ev.matches);
	var today = last_update ? last_update : Date.now();

	xlsx.open(ui8r, function(xlsx_file) {
		xlsx_file.modify_sheet('1', function() {
			xlsx_file.save('Spielbericht ' + ev.event_name + '.xlsx');
		}, function(sheet) {
			var team_names = ev.team_names;
			sheet.text('D3', team_names[0]);
			sheet.val('D7', team_names[0]);
			sheet.text('Q3', team_names[1]);
			sheet.val('L7', team_names[1]);
			sheet.text('C4', utils.date_str(today));
			sheet.text('J4', extra_data.location);
			sheet.text('T4', extra_data.umpires);
			sheet.text('A19', extra_data.notes);
			sheet.text('A20', extra_data.protest);

			var MATCH_ROWS = {
				'1.HE': 8,
				'2.HE': 9,
				'3.HE': 10,
				'DE': 11,
				'1.HD': 12,
				'2.HD': 13,
				'DD': 14,
				'GD': 15, // called MD in the sheet itself
			};
			var rally_sums = [0, 0];
			var game_sums = [0, 0];
			var match_sums = [0, 0];

			ev.matches.forEach(function(m) {
				var row = MATCH_ROWS[calc_match_id(m)];
				if (!row) {
					report_problem.silent_error('OBL: Cannot find row for match '  + calc_match_id(m));
					return;
				}

				var netscore = m.network_score || [];
				var counting = m.setup.counting;
				var mwinner = calc.match_winner(counting, netscore);
				var teams = m.setup.teams;
				var ID_COLS = ['B', 'J'];

				teams.forEach(function(team, team_idx) {
					var col = ID_COLS[team_idx];
					var text_ids = utils.filter_map(team.players, function(p) {
						return p.textid;
					});
					sheet.text(col + row, text_ids.join('/'));

					sheet.text(xlsx.add_col(col, 2) + row, players2str(team.players, ' / '));

					var match_rally_sum = 0;
					var match_game_sum = 0;
					netscore.forEach(function(game_score, game_idx) {
						match_rally_sum += game_score[team_idx];
						rally_sums[team_idx] += game_score[team_idx];
						var won_game = calc.game_winner(
							counting, game_idx,
							game_score[team_idx], game_score[1 - team_idx]) === 'left';
						if (won_game) {
							match_game_sum++;
							game_sums[team_idx]++;
						}
						sheet.val(
							xlsx.add_col('R', (3 * game_idx + 2 * team_idx)) + row,
							game_score[team_idx]);
						sheet.val(
							xlsx.add_col('AK', (game_idx + 4 * team_idx)) + row,
							won_game ? 1 : 0);
					});
					sheet.val(xlsx.add_col('AA', 2 * team_idx) + row, match_rally_sum);
					sheet.val(xlsx.add_col('AD', 2 * team_idx) + row, match_game_sum);
					var won = ((team_idx === 0) ? 'left' : 'right') === mwinner;
					sheet.val(xlsx.add_col('AG', 2 * team_idx) + row, won ? 1 : 0);
					if (won) {
						match_sums[team_idx]++;
					}
				});
			});

			for (var team_idx = 0;team_idx < 2;team_idx++) {
				sheet.val(xlsx.add_col('AA', team_idx * 2) + 16, rally_sums[team_idx]);
				sheet.val(xlsx.add_col('AD', team_idx * 2) + 16, game_sums[team_idx]);
				sheet.val(xlsx.add_col('AG', team_idx * 2) + 16, match_sums[team_idx]);
				sheet.val(xlsx.add_col('B', team_idx * 2) + 17, match_sums[team_idx]);
				sheet.val(xlsx.add_col('G', team_idx * 2) + 17, game_sums[team_idx]);
				sheet.val(xlsx.add_col('M', team_idx * 2) + 17, rally_sums[team_idx]);

				if ((match_sums[team_idx] > match_sums[1 - team_idx]) ||
					((match_sums[team_idx] == match_sums[1 - team_idx]) &&
						((game_sums[team_idx] > game_sums[1 - team_idx]) ||
							((game_sums[team_idx] == game_sums[1 - team_idx]) &&
								(rally_sums[team_idx] > rally_sums[1 - team_idx])
							)
						)
					)) {
					sheet.val('D16', team_names[team_idx]);
				}
			}
		});
	});
}

function save_buli2020_minreq(ev, es_key, ui8r) {
	eventutils.set_metadata(ev);
	var last_update = calc_last_update(ev.matches);
	var today = last_update ? new Date(last_update) : new Date();

	xlsx.open(ui8r, function(xlsx_file) {
		xlsx_file.modify_sheet('1', function() {
			xlsx_file.modify_sheet('2', function() {
				// Example given: '1. BL - 1. BC Bischmisheim - 1. BC Wipperfeld - 12.09.2021'
				var league_short_name = {
					'1BL': '1. BL',
					'2BLN': '2. BL Nord',
					'2BLS': '2. BL Süd',
				}[ev.league_key.split('-')[0]] || ev.league_key;
				var fn = (
					league_short_name + ' - ' + ev.event_name + ' - ' +
					utils.german_date(today) + '.xlsx');
				xlsx_file.save(fn);
			}, function(sheet) {
				sheet.val('D3', ev.team_names[0]);
				sheet.val('F3', ev.team_names[1]);
				sheet.val('H3', utils.date_str(today));
				sheet.val('D36', 'keine');
			});
		}, function(sheet) {
			sheet.val('D3', ev.team_names[0]);
			sheet.val('F3', ev.team_names[1]);
			sheet.val('H3', utils.date_str(today));
			sheet.val('D34', 'keine');
		});
	});
}

function save_rlso2017(ev, es_key, ui8r, extra_data) {
	eventutils.set_metadata(ev);
	var last_update = calc_last_update(ev.matches) || ev.last_update;

	var total_sums = {
		p: [0, 0],
		g: [0, 0],
		m: [0, 0],
	};

	xlsx.open(ui8r, function(xlsx_file) {
		xlsx_file.modify_sheet('1', function() {
			xlsx_file.save('Spielbericht ' + ev.event_name + '.xlsx');
		}, function(sheet) {
			var team_names = ev.team_names;
			sheet.text('D3', ev.tournament_name);
			sheet.text('D5', team_names[0]);
			sheet.text('D7', team_names[1]);
			sheet.text('O7', (extra_data.umpires || '').replace(',', ' /'));
			sheet.text('E30', extra_data.notes);
			sheet.text('E28', extra_data.backup_players0);
			sheet.text('I28', extra_data.backup_players1);
			sheet.text('A10', extra_data.starttime);

			if (last_update) {
				sheet.text('A26', utils.time_str(last_update));
			}

			if (ev.date) {
				sheet.text('E34', ', den ' + ev.date);
			}

			// Location
			var location_m = /^\s*[0-9]{5}\s+([^,]+),\s*(.+)$/.exec(extra_data.location);
			if (location_m) {
				sheet.text('A34', location_m[1]);
				sheet.text('O5', location_m[2]);
			} else {
				sheet.text('O5', extra_data.location);
			}

			ev.matches.forEach(function(match) {
				var eid = calc_match_id(match);
				var row = {
					'1.HD': 12,
					'HD1': 12,
					'DD': 14,
					'2.HD': 16,
					'HD2': 16,
					'1.HE': 18,
					'HE1': 18,
					'DE': 19,
					'GD': 20,
					'2.HE': 22,
					'HE2': 22,
					'3.HE': 23,
					'HE3': 23,
				}[eid];
				if (!row) {
					report_problem.silent_error('Cannot find row in RLSO-2017 sheet for ' + eid);
					return;
				}

				match.setup.teams.forEach(function(team, team_idx) {
					team.players.forEach(function(player, player_idx) {
						sheet.text((team_idx ? 'G' : 'D') + (row + player_idx), player.name);

						var p = player;
						if (!player.ranking && ev.all_players) {
							p = utils.find(ev.all_players[team_idx], function(ap) {
								return ap.name === player.name;
							}) || player;
						}
						sheet.text(
							(team_idx ? 'F' : 'C') + (row + player_idx),
							match.setup.is_doubles ? (p.ranking_d || p.ranking) : p.ranking);
					});
				});

				var netscore = match.network_score || [];
				if (netscore.length > 0) {
					netscore.forEach(function(game, game_idx) {
						game.forEach(function(score, team_idx) {
							sheet.val(xlsx.add_col('I', 3 * game_idx + 2 * team_idx) + row, score);
						});
					});

					var sums = calc_sums(match);
					if (sums.show) {
						['p', 'g', 'm'].forEach(function(key, sum_idx) {
							sheet.val(xlsx.add_col('R', 2 * sum_idx) + row, sums[key].join(' : '));
						});

						_add_totals(total_sums, sums);
					}
				}
			});

			if (total_sums.show) {
				['p', 'g', 'm'].forEach(function(key, sum_idx) {
					sheet.val(xlsx.add_col('R', 2 * sum_idx) + 25, total_sums[key].join(' : '));
				});
			}

			if ((total_sums.m[0] >= 4) || (total_sums.m[1] >= 4))  {
				sheet.val('E25', (total_sums.m[0] === 4) ? 'Unentschieden' : (total_sums.m[0] > 4 ? team_names[0] : team_names[1]));
			}
		});
	});
}


function direct_download(es_key, ui8r) {
	var ext = /\.([a-z0-9]+)$/.exec(URLS[es_key])[1];
	var filename = state._('eventsheet:label|' + es_key) + '.' + ext;
	var blob = new Blob([ui8r], {type: MIME_TYPES[ext]});
	save_file(blob, filename);
}

function es_render(ev, es_key, ui8r, extra_data, extra_files) {
	if (DIRECT_DOWNLOAD_SHEETS[es_key]) {
		return direct_download(es_key, ui8r);
	}

	switch(es_key) {
	case '1BL-2015':
	case '2BLN-2015':
	case '2BLS-2015':
		return save_bundesliga(ev, es_key, ui8r, extra_data);
	case 'team-1BL-2015':
	case 'team-2BL-2015':
		return save_team_bl(ev, es_key, ui8r);
	case '1BL-2016':
	case '2BLN-2016':
	case '2BLS-2016':
		return save_bundesliga2016(ev, es_key, ui8r, extra_data);
	case '1BL-minreqs-2020':
	case '2BL-minreqs-2020':
		return save_buli2020_minreq(ev, es_key, ui8r, extra_data);
	case 'OBL-2017':
		return save_obl(ev, es_key, ui8r, extra_data);
	case 'RLSO-2017':
		return save_rlso2017(ev, es_key, ui8r, extra_data);
	}

	// Configure preview
	state.ui.es_preview = es_key;
	delete state.ui.eventsheet;
	control.set_current(state);

	uiu.hide_qs('.eventsheet_report');
	uiu.hide_qs('.eventsheet_back');
	uiu.show_qs('.eventsheet_preview_back');
	uiu.show_qs('.eventsheet_print_button');
	uiu.show_qs('.eventsheet_pdf_button');
	uiu.hide_qs('.eventsheet_generate_button');

	var preview_el = uiu.qs('.eventsheet_preview');
	uiu.show(preview_el);
	uiu.empty(preview_el);

	render_previewable(preview_el, ev, es_key, ui8r, extra_data, extra_files);
}

function render_previewable(preview_el, ev, es_key, ui8r, extra_data, extra_files) {
	switch(es_key) {
	case 'RLW-2016':
	case 'RLN-2016':
	case 'RLM-2016':
	case 'NRW-2016':
		return render_basic_eventsheet(preview_el, ev, es_key, ui8r, extra_data);
	case '1BL-2017_pdf':
	case '2BLN-2017_pdf':
	case '2BLS-2017_pdf':
		return render_buli2017_pdf(preview_el, ev, es_key, ui8r, extra_data);
	case 'NLA-2017':
	case 'NLA-2019':
		return render_nla(preview_el, ev, es_key, ui8r);
	case 'buli2017-minsr':
	case 'buli2017-minv':
	case 'buli2018-minsr':
	case 'buli2018-minv':
	case 'buli2019-minsr':
	case 'buli2019-minv':
		return render_buli_minreq_svg(preview_el, ev, es_key, ui8r);
	case 'int':
		return render_int(preview_el, ev, es_key, ui8r, extra_data);
	case 'receipt':
		return render_receipt(preview_el, ev, es_key, ui8r, extra_data, extra_files);
	case 'bayern-2018':
		return render_bayern(preview_el, ev, es_key, ui8r, extra_data);
	default:
		throw new Error('Unsupported eventsheet key ' + es_key);
	}
}

function prepare_render(btn, es_key, extra_data) {
	var progress = uiu.el(btn, 'div', 'loading-icon');
	download(es_key, function(ui8r) {
		var event = state.event;
		download_extra(es_key, event, function(extra_files) {
			uiu.remove(progress);
			_default_extra_data(extra_data, event);
			es_render(event, es_key, ui8r, extra_data, extra_files);
		});
	});
}

function download_extra(es_key, event, callback) {
	if (es_key === 'receipt') {
		var team_logos = extradata.team_logos(event);
		if (team_logos && team_logos[0]) {
			return ajax.req({
				url: team_logos[0],
				responseType: 'arraybuffer',
				error: function() {
					callback();
				},
				success: function(ab) {
					callback({
						logo: ab,
					});
				},
			});
		}
	}

	callback();
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
	xhr.responseType = 'arraybuffer';

	xhr.onload = function() {
		var ui8r = new Uint8Array(this.response);
		files[es_key] = ui8r;
		if (callback) {
			callback(ui8r);
		}
	};
	xhr.send();
}

function render_links(s, container) {
	var league_key = s.event ? s.event.league_key : undefined;
	if (container.getAttribute('data-league-key') === league_key) {
		return;  // No need to reconfigure containers
	}
	container.setAttribute('data-league-key', league_key);

	if (typeof pdfform != 'undefined') {
		loaded('pdfform');
	}
	if (typeof JSZip != 'undefined') {
		loaded('jszip');
	}

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
		var i18n_key = 'eventsheet:label|' + es_key;
		if (EXTERNAL_DOWNLOAD_SHEETS[es_key]) {
			uiu.el(container, 'a', {
				'href': URLS[es_key],
				'download': '',
				'target': '_blank',
				'class': 'eventsheet_link',
				'data-i18n': i18n_key,
			}, s._(i18n_key));
		} else if (DIRECT_DOWNLOAD_SHEETS[es_key]) {
			var ext = /\.([a-z0-9]+)$/.exec(URLS[es_key])[1];
			var filename = state._('eventsheet:label|' + es_key) + '.' + ext;

			uiu.el(container, 'a', {
				'href': URLS[es_key],
				'download': filename,
				'class': 'eventsheet_link',
				'data-i18n': i18n_key,
			}, s._(i18n_key));
		} else {
			var link = uiu.el(container, 'a', {
				'href': '#',
				'class': 'eventsheet_link',
				'data-i18n': i18n_key,
			}, s._(i18n_key));
			click.on(link, function() {
				if (GENERATED_DOWNLOAD[es_key]) {
					prepare_render(link, es_key, {});
				} else if (NO_DIALOG[es_key]) {
					show_preview(es_key);
				} else {
					show_dialog(es_key);
				}
			});
		}
	});
}

function ui_init() {
	form_utils.onsubmit(uiu.qs('.eventsheet_form'), function(extra_data) {
		var es_key = uiu.qs('.eventsheet_container').getAttribute('data-eventsheet_key');
		if (state.event) {
			state.event._es_extra_data = utils.deep_copy(extra_data);
		}

		_default_extra_data(extra_data, state.event);

		prepare_render(uiu.qs('.eventsheet_generate_button'), es_key, extra_data);
	});

	click.qs('.eventsheet_reload', function() {
		dialog_fetch(on_fetch);
	});

	click.qs('.eventsheet_pdf_button', function() {
		var preview = uiu.qs('.eventsheet_preview');
		var svg = uiu.qs('svg', preview);
		var info = JSON.parse(preview.getAttribute('data-info_json'));
		svg2pdf.save(
			[svg],
			info.props,
			info.orientation,
			info.filename,
			info.scale
		);
	});

	click.qs('.eventsheet_print_button', function() {
		window.print();
	});

	click.qs('.eventsheet_back', function() {
		var from_bup = $('.eventsheet_container').attr('data-eventsheet_key') != 'auto-direct';
		if (from_bup) {
			hide_dialog();
		} else {
			window.history.back();
		}
	});

	click.qs('.eventsheet_preview_back', function() {
		uiu.hide_qs('.eventsheet_preview');
		var es_key = state.ui.es_preview;
		if (NO_DIALOG[es_key]) {
			hide_dialog();
		} else {
			show_dialog(state.ui.es_preview);
		}
	});
}

function on_fetch() {
	var event = state.event;
	var container = uiu.qs('.eventsheet_container');
	var KEYS = [
		'referee', 'location', 'starttime', 'matchday', 'notes', 'protest', 'spectators',
		// only from saved extra_data
		'receipt_umpire0', 'receipt_distance0', 'receipt_umpire1', 'receipt_distance1',
	];
	var saved_ed = event._es_extra_data;
	KEYS.forEach(function(k) {
		var val = (saved_ed && saved_ed[k]) || event[k];
		if (val) {
			container.querySelector('[name="' + k + '"]').value = val;
		}
	});

	eventutils.set_metadata(event);
	var umpires_str = (
		event.umpires ? event.umpires : (
			event.match_umpires ? event.match_umpires.join(', ') : ''));
	container.querySelector('[name="umpires"]').value = umpires_str;

	var backup_players_str = eventutils.calc_players_str(event, event.backup_players);
	if (backup_players_str) {
		container.querySelector('[name="backup_players_str"]').value = backup_players_str;
	}

	var extra_data = {};
	_default_extra_data(extra_data, event);

	uiu.qsEach('.eventsheet_dynamic', function(label) {
		if (!uiu.hasClass(label, 'eventsheet_dynamic_recalc')) return;
		var input = label.querySelector('input');
		var name = input.getAttribute('name');
		input.setAttribute('value', extra_data[name] || '');

		var span = label.querySelector('span');
		var team_id = parseInt(name.substr(-1));
		var key = name.substr(0, name.length - 1);
		uiu.text(span, state._('eventsheet|' + key, {
			team_name: event.team_names[team_id],
		}));
	});

	var minreqs_cb = document.querySelector('input[name="minreqs_met"]');
	if (minreqs_cb) {
		minreqs_cb.checked = event.minreqs_met !== false;
	}
}

function dialog_fetch(cb) {
	uiu.visible_qs('.eventsheet_generate_loading_icon', !state.event || !_loaded_all_libs);
	var $btn = $('.eventsheet_generate_button');
	if (state.event) {
		$btn.removeAttr('disabled');
		cb();
	} else {
		$btn.attr('disabled', 'disabled');
		network.list_matches(state, function(err, ev) {
			uiu.visible_qs('.eventsheet_generate_loading_icon', !_loaded_all_libs);
			if (err) {
				$('.eventsheet_error_message').text(err.msg);
				uiu.visible_qs('.eventsheet_error', true);
				return;
			}
			network.update_event(state, ev);

			var container = $('.eventsheet_container');
			var es_key = container.attr('data-eventsheet_key');
			es_key = resolve_key(es_key);
			container.attr('data-eventsheet_key', es_key);
			$btn.removeAttr('disabled');
			cb();
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

// cfg is a list of fields to show
function configure_report(cfg) {
	var ALL_FIELDS = [
		'matchday',
		'umpires',
		'referee',
		'notes',
		'location',
		'starttime',
		'backup_players_str',
		'protest',
		'spectators',
	];

	ALL_FIELDS.forEach(function(field_name) {
		uiu.visible_qs(
			'.eventsheet_' + field_name, utils.includes(cfg, field_name)
		);
	});

	uiu.show_qs('.eventsheet_report');
}

function show_preview(es_key) {
	state.ui.es_preview = es_key;
	if (state.ui.referee_mode) {
		refmode_referee_ui.hide_tmp();
	} else {
		settings.hide(true);
		render.hide();
	}

	uiu.hide_qs('.eventsheet_report');
	uiu.hide_qs('.eventsheet_download_link_container');

	var extra_data = {};
	uiu.show_qs('.eventsheet_container');
	dialog_fetch(function() {
		prepare_render(uiu.qs('.eventsheet_dialog'), es_key, extra_data);
	});
}

function _minreqs_cb(container) {
	var minreqs_label = uiu.el(container, 'label', 'eventsheet_dynamic');
	uiu.el(minreqs_label, 'span', {}, state._('eventsheet:minreqs'));
	minreqs_label.appendChild(document.createTextNode(' ')); // compatibility to HTML UI
	uiu.el(minreqs_label, 'input', {
		type: 'checkbox',
		name: 'minreqs_met',
		checked: 'checked',
	});
	uiu.el(minreqs_label, 'span', {}, state._('eventsheet:minreqs_met'));
}

function show_dialog(es_key) {
	delete state.ui.es_preview;
	state.ui.eventsheet = es_key;
	if (state.ui.referee_mode) {
		refmode_referee_ui.hide_tmp();
	} else {
		settings.hide(true);
		render.hide();
	}
	control.set_current(state);

	uiu.hide_qs('.eventsheet_preview_back');
	uiu.show_qs('.eventsheet_back');
	uiu.hide_qs('.eventsheet_error');

	es_key = resolve_key(es_key);
	if (es_key != 'auto-direct') {
		download(es_key);
	}

	var $container = $('.eventsheet_container');
	$container.attr('data-eventsheet_key', es_key);
	uiu.show_qs('.eventsheet_container');

	var download_link_container = uiu.qs('.eventsheet_download_link_container');
	var download_link = uiu.qs('.eventsheet_download_link');
	var preview = uiu.qs('.eventsheet_preview');
	var generate_button = uiu.qs('.eventsheet_generate_button');

	uiu.hide_qs('.eventsheet_print_button');
	uiu.hide_qs('.eventsheet_pdf_button');

	uiu.show(generate_button);
	uiu.hide(preview);

	uiu.qsEach('.eventsheet_dynamic', uiu.remove);
	var report = uiu.qs('.eventsheet_report');

	switch (es_key) {
	case '1BL-2015':
	case '2BLN-2015':
	case '2BLS-2015':
	case 'RLW-2016':
	case 'RLN-2016':
	case 'RLM-2016':
	case 'NRW-2016':
		configure_report(['umpires', 'location', 'starttime', 'matchday',  'backup_players_str', 'notes', 'protest']);
		uiu.hide(download_link_container);
		break;
	case '1BL-2016':
	case '2BLN-2016':
	case '2BLS-2016':
		configure_report(['umpires', 'location', 'starttime', 'matchday', 'notes', 'protest', 'spectators']);
		_minreqs_cb(report);
		uiu.hide(download_link_container);
		break;
	case '1BL-2017_pdf':
	case '2BLN-2017_pdf':
	case '2BLS-2017_pdf':
		configure_report(['umpires', 'location', 'starttime', 'matchday', 'notes', 'protest', 'spectators']);

		var team_names = ['team 1', 'team 2'];
		['backup_players', 'present_players'].forEach(function(key) {
			team_names.forEach(function(team_name, team_id) {
				var whole_key = key + team_id;
				var label = uiu.el(report, 'label', 'eventsheet_dynamic eventsheet_dynamic_recalc');
				uiu.el(label, 'span', {
					'data-es-i18n': 'eventsheet|' + key,
				}, state._('eventsheet|' + key, {
					team_name: team_name,
				}));
				label.appendChild(document.createTextNode(' ')); // compatibility to HTML UI
				uiu.el(label, 'input', {
					name: whole_key,
					type: 'text',
				});
			});
		});

		_minreqs_cb(report);
		uiu.hide(download_link_container);
		break;
	case 'team-1BL':
	case 'team-2BL':
		uiu.hide(report);
		// backup_players are children of _report
		download_link.setAttribute('href', URLS[es_key]);
		uiu.show(download_link_container);
		break;
	case 'NLA-2017':
		uiu.hide(report);
		uiu.hide_qs('label.eventsheet_backup_players_str');
		uiu.hide(download_link_container);
		break;
	case 'OBL-2017':
		configure_report(['umpires', 'location', 'notes']);
		uiu.hide(download_link_container);
		break;
	case 'int':
		configure_report(['referee', 'umpires', 'location', 'starttime', 'backup_players_str', 'notes', 'protest']);
		uiu.hide(download_link_container);
		break;
	case 'buli2017-minsr':
	case 'buli2017-minv':
	case 'nla':
		// NODIALOG options
		configure_report([]);
		uiu.hide(download_link_container);
		break;
	case 'receipt':
		configure_report([]);
		uiu.hide(download_link_container);

		for (var i = 0;i < 2;i++) {
			var umpire_label = uiu.el(report, 'label', 'eventsheet_dynamic', state._('receipt:umpire'));
			umpire_label.appendChild(document.createTextNode(' ')); // compatibility to HTML UI
			uiu.el(umpire_label, 'input', {
				name: 'receipt_umpire' + i,
				type: 'text',
			});

			var distance_label = uiu.el(report, 'label', 'eventsheet_dynamic', state._('receipt:distance'));
			distance_label.appendChild(document.createTextNode(' ')); // compatibility to HTML UI
			uiu.el(distance_label, 'input', {
				type: 'number',
				min: 0,
				name: 'receipt_distance' + i,
				style: 'width:3em;',
			});

			uiu.el(distance_label, 'span', {
				style: 'display:inline-block;margin-left:0.2em;',
			}, 'km');

		}
		break;
	case 'bayern-2018':
		configure_report(['starttime', 'notes']);
		uiu.hide(download_link_container);
		break;
	case 'RLSO-2017':
		configure_report(['umpires', 'location', 'notes', 'starttime']);
		['backup_players'].forEach(function(key) {
			['team 1', 'team 2'].forEach(function(team_name, team_id) {
				var whole_key = key + team_id;
				var label = uiu.el(report, 'label', 'eventsheet_dynamic eventsheet_dynamic_recalc');
				uiu.el(label, 'span', {
					'data-es-i18n': 'eventsheet|' + key,
				}, state._('eventsheet|' + key, {
					team_name: team_name,
				}));
				label.appendChild(document.createTextNode(' ')); // compatibility to HTML UI
				uiu.el(label, 'input', {
					name: whole_key,
					type: 'text',
				});
			});
		});
		uiu.hide(download_link_container);
		break;
	default:
		uiu.hide_qs('.eventsheet_spectators');
	}

	if (DIRECT_DOWNLOAD_SHEETS[es_key]) {
		uiu.visible_qs('.eventsheet_report', false);
		uiu.visible(preview, false);
		uiu.visible(download_link_container, false);
	}

	uiu.text_qs('.eventsheet_generate_button',
		state._('eventsheet:Generate', {
			sheetname: state._('eventsheet:label|' + es_key),
		}));

	dialog_fetch(on_fetch);
}

function hide() {
	if (!state.ui.eventsheet && !state.ui.es_preview) {
		return;
	}
	state.ui.eventsheet = null;
	state.ui.es_preview = null;
	uiu.hide_qs('.eventsheet_container');
}

function hide_dialog() {
	hide();
	if (state.ui.referee_mode) {
		refmode_referee_ui.back_to_ui();
	} else {
		settings.show();
	}
}

return {
	loaded: loaded,
	ui_init: ui_init,
	hide: hide,
	show_dialog: show_dialog,
	show_preview: show_preview,
	render_links: render_links,
	calc_match_id: calc_match_id,

	// Testing only
	/*@DEV*/
	_SHEETS_BY_LEAGUE: SHEETS_BY_LEAGUE,
	_calc_last_update: calc_last_update,
	/*/@DEV*/
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var ajax = require('./ajax');
	var calc = require('./calc');
	var click = require('./click');
	var control = require('./control');
	var eventutils = require('./eventutils');
	var extradata = require('./extradata');
	var form_utils = require('./form_utils');
	var i18n = require('./i18n');
	var network = require('./network');
	var printing = require('./printing');
	var refmode_referee_ui = null; // break circle, really would be require('./refmode_referee_ui');
	var render = require('./render');
	var report_problem = require('./report_problem');
	var scoresheet = require('./scoresheet');
	var settings = require('./settings');
	var svg2pdf = require('./svg2pdf');
	var uiu = require('./uiu');
	var utils = require('./utils');
	var save_file = require('./save_file');
	var svg_utils = require('./svg_utils');
	var xlsx = require('./xlsx');

	module.exports = eventsheet;
}
/*/@DEV*/