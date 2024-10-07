'use strict';
var eventutils = (function() {

function guess_gender(match_setup, player_id) {
	var mname = (match_setup.eventsheet_id ? match_setup.eventsheet_id : match_setup.match_name);
	if (/(?:HD|HE|MD|MS)/.test(mname)) {
		return 'm';
	} else if (/(?:DD|DE|WD|WS)/.test(mname)) {
		return 'f';
	} else {
		// Mixed
		return (player_id === 0) ? 'm' : 'f';
	}
}

function calc_all_players(event) {
	function _add_player(ar, p) {
		for (var i = 0;i < ar.length;i++) {
			if (ar[i].name === p.name) {
				return;
			}
		}
		ar.push(p);
	}

	var res = event.all_players ? utils.deep_copy(event.all_players) : [[], []];
	var all_matches = event.matches;
	for (var team_id = 0;team_id <= 1;team_id++) {
		for (var match_id = 0;match_id < all_matches.length;match_id++) {
			var match = all_matches[match_id];
			var team_players = match.setup.teams[team_id].players;
			for (var player_id = 0;player_id < team_players.length;player_id++) {
				var player = team_players[player_id];
				if (player.name === 'N.N.') {
					continue;
				}
				if (!player.gender) {
					player.gender = guess_gender(match.setup, player_id);
				}
				_add_player(res[team_id], player);
			}
		}

		if (event.backup_players) {
			var bps = event.backup_players[team_id];
			for (var bp_id = 0;bp_id < bps.length;bp_id++) {
				var bp = bps[bp_id];
				_add_player(res[team_id], bp);
			}
		}
	}

	return res;
}

function get_presses(match) {
	if (match.presses) {
		return match.presses;
	} else if (match.presses_json) {
		return JSON.parse(match.presses_json);
	}
	// Else: return undefined
}

function set_metadata(event) {
	var umpires_set = {}; // Poor man's set
	var shuttle_count = 0;

	event.matches.forEach(function(match) {
		match.md_eid = match.setup.eventsheet_id || match.setup.match_name;
		var presses = get_presses(match);
		if (!presses) return;

		var scopy = {};
		calc.init_state(scopy, match.setup, presses);
		calc.state(scopy);
		shuttle_count += scopy.match.shuttle_count;
		var fpresses = scopy.flattened_presses;
		if (fpresses.length > 0) {
			match.network_match_start = fpresses[0].timestamp;
			match.md_start = fpresses[0].timestamp;
			match.network_last_update = fpresses[fpresses.length - 1].timestamp;
			match.md_end = null;
			for (var i = 0;i < fpresses.length;i++) {
				if (fpresses[i].type === 'postmatch-confirm') {
					match.md_end = fpresses[i].timestamp;
				}
			}
			if (! match.md_end && scopy.match.finished) {
				match.md_end = fpresses[fpresses.length - 1].timestamp;
			}
		}
		match.network_score = calc.netscore(scopy);
		match.network_team1_serving = scopy.game.team1_serving;
		match.network_finished = scopy.match.finished;
		match.network_team1_won = scopy.match.team1_won;
		match.network_won_by_score = scopy.game.won_by_score;
		if (scopy.match.umpire_name) {
			umpires_set[scopy.match.umpire_name] = true;
		}
		if (scopy.match.service_judge_name) {
			umpires_set[scopy.match.service_judge_name] = true;
		}
		match.network_metadata = scopy.metadata;
		var first_game = scopy.match.finished_games.length ? scopy.match.finished_games[0] : scopy.game;
		match.network_start_team1_left = first_game.start_team1_left;
		match.network_real_scores = calc.all_games(scopy).filter(function(g) {
			return g.finished;
		}).map(function(g) {
			return g.score;
		});
	});

	var umps = Object.keys(umpires_set);
	umps.sort();
	event.match_umpires = umps;

	if (shuttle_count) {
		event.shuttle_count = shuttle_count;
	}
}

function annotate(s, event) {
	if (event.courts && event.courts.length === 2) {
		event.courts.forEach(function(c) {
			if (c.description) {
				return;
			}

			switch (c.court_id) {
			case '1':
				c.description = c.court_id + ' / ' + s._('court:left');
				break;
			case '2':
				c.description = c.court_id + ' / ' + s._('court:right');
				break;
			}
		});
	}

	var league_key = event.league_key;

	/*@DEV*/
	if (event.tournament_name && event.tournament_name === name_by_league(league_key)) {
		report_problem.silent_error('Redundant tournament_name in event');
	}
	/*/@DEV*/

	if (!event.tournament_name) {
		event.tournament_name = name_by_league(league_key);
	}
	/*@DEV*/
	if (event.team_names) {
		var guessed_name = event.team_names[0] + ' - ' + event.team_names[1];
		if (guessed_name === event.event_name) {
			report_problem.silent_error('Redundant event_name in event');
		}
	}
	/*/@DEV*/

	if (!event.event_name && event.team_names) {
		event.event_name = event.team_names[0] + ' - ' + event.team_names[1];
	}

	var props = {
		league_key: league_key,
		tournament_name: event.tournament_name,
		event_name: event.event_name,
		team_competition: event.team_competition,
		nation_competition: event.nation_competition,
		away_first: event.away_first,
		counting: event.counting,
		date: event.date,
	};
	if (league_key && !event.counting) {
		props.counting = default_counting(league_key);
	}
	event.matches.forEach(function(m) {
		var setup = m.setup;
		for (var key in props) {
			var val = props[key];
			if (val === undefined) {
				continue;
			}

			/*@DEV*/
			if (setup[key] === val) {
				if (key !== 'counting') { // counting is very important, and in btde it's dynamic
					report_problem.silent_error('Redundant key ' + key + ' in ' + setup.match_id);
				}
			}
			/*/@DEV*/

			if (setup[key] === undefined) {
				setup[key] = val;
			}
		}

		if (event.team_names) {
			event.team_names.forEach(function(team_name, team_idx) {
				var team = setup.teams[team_idx];

				/*@DEV*/
				if (team.name === team_name) {
					report_problem.silent_error('Redundant team_name in ' + setup.match_id);
				}
				/*/@DEV*/

				if (!team.name) {
					team.name = team_name;
				}
			});
		}
	});
}

var NRW2016_RE = /^NRW-(O19)-(?:(?:([NS])([12]))-|GW-)?([A-Z]{2})-([0-9]{3})-(?:2016|2017)$/;
function name_by_league(league_key) {
	if (is_bundesliga(league_key)) {
		if (/^1BL-/.test(league_key)) {
			return '1. Bundesliga';
		}
		if (/^2BLN-/.test(league_key)) {
			return '2. Bundesliga Nord';
		}
		if (/^2BLS-/.test(league_key)) {
			return '2. Bundesliga Süd';
		}
	}
	if (league_key === 'OBL-2017') {
		return 'ÖBV-Bundesliga'; // Österreich
	}
	if (league_key === 'RLN-2016') {
		return 'Regionalliga Nord';
	}
	if (league_key === 'RLM-2016') {
		return 'Regionalliga Mitte';
	}
	if (league_key === 'NLA-2017') {
		return 'NLA';
	}
	if (league_key === 'NLA-2019') {
		return 'NLA';
	}
	if (league_key === 'international-2017') {
		return 'International match';
	}
	if (league_key === 'RLSO-2019') {
		return 'Regionalliga SüdOst';
	}
	if (league_key === 'RLSOO-2017') {
		return 'Regionalliga SüdOst Ost';
	}
	if (league_key === 'RLSOS-2017') {
		return 'Regionalliga SüdOst Süd';
	}
	if (league_key === 'OLSW-2020') {
		return 'Oberliga Südwest';
	}
	if (league_key === 'OLM-2020') {
		return 'Oberliga Mitte';
	}

	if (league_key === 'RLW-2016') {
		league_key = 'NRW-O19-RL-001-2016';
	}

	var m = NRW2016_RE.exec(league_key);
	if (m) {
		var league_name = {
			'RL': 'Regionalliga',
			'OL': 'NRW-Oberliga',
			'VL': 'Verbandsliga',
			'LL': 'Landesliga',
			'BL': 'Bezirksliga',
			'BK': 'Bezirksklasse',
			'KL': 'Kreisliga',
			'KK': 'Kreisklasse',
		}[m[4]];

		var location_name;
		if (m[4] === 'RL') {
			location_name = 'West';
		} else if (m[4] === 'OL') {
			location_name = (m[5] === '002') ? 'Nord' : 'Süd';
		} else {
			location_name = {
				'N': 'Nord',
				'S': 'Süd',
			}[m[2]];
			if (location_name) {
				location_name += ' ' + m[3];
			} else {
				location_name = m[2] + ' ' + m[3];
			}
		}

		if (!league_name) {
			return league_key;
		}

		return league_name + ' ' + location_name + ' (' + m[5] + ')';
	}

	return league_key;
}

function is_bundesliga(league_key) {
	return /^(?:1BL|2BLN|2BLS)-/.test(league_key);
}

function is_5x1190_bundesliga(league_key) {
	return /^(?:1BL|2BLN|2BLS)-(?:2017|2018|2019|2020)$/.test(league_key);
}

function is_rlw(league_key) {
	return /^RLW-|^NRW-O19-(?:GW-)?RL/.test(league_key);
}

function is_incomplete(setup) {
	return (
		(setup.teams[0].players.length !== setup.teams[1].players.length) ||
		(setup.teams[0].players.length !== (setup.is_doubles ? 2 : 1)));
}

function set_incomplete(event) {
	event.matches.forEach(function(m) {
		var setup = m.setup;
		if (is_incomplete(setup)) {
			setup.incomplete = true;
		} else {
			delete setup.incomplete;
		}
	});
}

function setups_eq(e1, e2) {
	var IMPORTANT_KEYS = [
		'all_players',
		'backup_players',
		'event_name',
		'event_name',
		'id',
		'league_key',
		'present_players',
		'team_names',
		'tournament_name',
	];
	if (! utils.plucked_deep_equal(e1, e2, IMPORTANT_KEYS)) {
		return false;
	}

	if (e1.matches.length !== e2.matches.length) {
		return false;
	}
	for (var i = 0;i < e1.matches.length;i++) {
		if (! utils.plucked_deep_equal(e1.matches[i], e2.matches[i], ['setup'])) {
			return false;
		}
	}

	return true;
}

// I this a league with 2 MD, 3 MS, 1 WS, 1 XD, 1 WD, with the typical German regulations for doubles setup?
function is_german8(league_key) {
	return NRW2016_RE.test(league_key) || utils.includes([
		'RLW-2016', 'RLN-2016', 'RLSO-2019', 'RLSOS-2017', 'RLSOO-2017', 'bayern-2018', 'OBL-2017',
		'OLSW-2020', 'OLM-2020'], league_key);
}

function get_min_pause(league_key) {
	if (is_bundesliga(league_key)) {
		return 20 * 60000; // §10.1 BLO-DB
	}
	if ((league_key === 'RLW-2016') || (NRW2016_RE.test(league_key))) {
		return 30 * 60000; // §57.7 SpO
	}
	if (league_key === 'RLN-2016') {
		return 20 * 60000; // §7.7 Gruppe Nord
	}
	if ((league_key === 'RLM-2016') || /^(?:OLM|OLSW)-2020$/.test(league_key)) {
		return 20 * 60000; // Not specified, but chosen in practice
	}
	if (league_key === 'NLA-2017') {
		return 15 * 60000; // §2.11.1 https://www.swiss-badminton.ch/file/727622/?dl=1
	}
	if (league_key === 'NLA-2019') {
		return 15 * 60000; // §3.12.1 https://www.swiss-badminton.ch/file/847650/?dl=1
	}
	if (league_key === 'OBL-2017' || league_key === 'OBL-2024') {
		return 15 * 60000; // §6f Bundesligaordnung
	}
	if (league_key === 'bayern-2018') {
		return 20 * 60000; // §41.6 Spielordnung
	}
	if (/^RLSO[SO]-2017|RLSO-2019$/.test(league_key)) {
		return 20 * 60000; // §7.7 Spielordnung der Gruppe SüdOst (= 30 - 10 minutes)
	}
	return undefined;
}

function shares_players(setup1, setup2) {
	var player_register = {};
	var setups = [setup1, setup2];
	for (var setup_id = 0;setup_id < setups.length;setup_id++) {
		var setup = setups[setup_id];
		for (var team_id = 0;team_id < setup.teams.length;team_id++) {
			var players = setup.teams[team_id].players;
			for (var player_id = 0;player_id < players.length;player_id++) {
				var pname = players[player_id].name;
				if (player_register[pname]) {
					return true;
				}
				player_register[pname] = true;
			}
		}
	}
	return false;
}

// Decorates all match_states with properties not_before
// Values:
//   "started"   - Match has already started (or even finished)
//   "playing"   - Match depends on a match that is currently playing
//   0           - it's the first match for all players
//   Any integer - UNIX timestamp (ms) when the match can be announced (or played, if regulations only cover that).
// If the value is "playing", there will be another annotation:
// match_states_depends, an array of match_state objects that the match depends on.
function set_not_before(league_key, match_states) {
	var min_pause = get_min_pause(league_key);
	if (min_pause === undefined) {
		match_states.forEach(function(ms) {
			ms.not_before = undefined;
		});
		return;
	}

	match_states.forEach(function(ms) {
		delete ms.not_before_matches;
	});

	match_states.forEach(function(ms) {
		if (!ms.presses || (ms.presses.length === 0)) {
			if (!ms.not_before) {
				ms.not_before = 0;
			}
			return;
		}
		ms.not_before = 'started';

		match_states.forEach(function(change_ms) {
			if (ms === change_ms) return;

			if (change_ms.presses && (change_ms.presses.length > 0)) {
				return;
			}

			if (!shares_players(ms.setup, change_ms.setup)) {
				return;
			}

			if (ms.match.finished) {
				var v = change_ms.not_before;
				var earliest_call = ms.presses[ms.presses.length - 1].timestamp + min_pause;
				if (!v || ((typeof v === 'number') && (v < earliest_call))) {
					change_ms.not_before = earliest_call;
				}
			} else {
				change_ms.not_before = 'playing';
				if (! change_ms.not_before_matches) {
					change_ms.not_before_matches = [];
				}
				change_ms.not_before_matches.push(ms);
			}
		});
	});
}

function default_counting(league_key) {
	if (NRW2016_RE.test(league_key) || /^RL[MNW]-2016$/.test(league_key)) {
		return '3x21';
	}
	if (/^(?:1BL|2BLN|2BLS)-2015$/.test(league_key)) {
		return '3x21';
	}
	if (/^(?:1BL|2BLN|2BLS)-2016$/.test(league_key)) {
		return '5x11_15';
	}
	if (is_5x1190_bundesliga(league_key)) {
		return '5x11_15^90';
	}
	if (league_key === 'OBL-2024') {
		return '5x11_15^90';
	}
	if (league_key === 'OBL-2017') {
		return '3x21';
	}
	if (league_key === 'NLA-2017') {
		return '3x21';
	}
	if (league_key === 'NLA-2019') {
		return '5x11_15~NLA';
	}
	if (league_key === 'international-2017') {
		return '3x21';
	}
	if (league_key === 'bayern-2018') {
		return '3x21';
	}
	if (/^RLSO[SO]-2017|RLSO-2019$/.test(league_key)) {
		return '3x21';
	}
	if (/^(?:OLM|OLSW)-2020/.test(league_key)) {
		return '3x21';
	}
}

function umpire_pay(league_key) {
	if (is_bundesliga(league_key)) {
		return { // §3.2 BLO
			base: 50,
			per_km: .35,
			currency: '€',
		};
	}

	if (/^RLW-/.test(league_key) || NRW2016_RE.test(league_key)) {
		return { // §1.1 Anlage 8 SpO
			base: 35,
			per_km: .35,
			currency: '€',
		};
	}
	if (/^RLN-/.test(league_key)) {
		return { // §4 Finanzordnung Gruppe Nord
			base: 35,
			per_km: .3,
			currency: '€',
		};
	}
	if (/^RLM-/.test(league_key)) {
		return { // §2.23.1.2.14 SpO / §.7 Finanzordnung
			base: 35,
			per_km: .3, // §6.1c HBV FO
			currency: '€',
		};
	}
	if (/^RLSO[SO]-|^RLSO-2019/.test(league_key)) {
		return { // 10.2c SpO
			base: 25,
			per_km: .3,
			currency: '€',
		};
	}
}

function umpire_required(league_key) {
	return (is_bundesliga(league_key) || is_rlw(league_key)) ? 2 : false;
}

function make_empty_matches(league_key, event_id) {
	if (is_bundesliga(league_key)) {
		var rawdef = [
			{name: '1.HD', is_doubles: true},
			{name: 'DD', is_doubles: true},
			{name: '2.HD', is_doubles: true},
			{name: '1.HE', is_doubles: false},
			{name: 'DE', is_doubles: false},
			{name: 'GD', is_doubles: true},
			{name: '2.HE', is_doubles: false},
		];
		var counting = default_counting(league_key);

		return rawdef.map(function(rd) {
			return {
				setup: {
					match_name: rd.name,
					match_id: event_id + '_' + rd.name,
					counting: counting,
					is_doubles: rd.is_doubles,
					teams: [{players: []}, {players: []}],
				},
			};
		});
	}

	throw new Error('Cannot create matches for ' + league_key);
}

function calc_players_str(ev, players) {
	if (!players) {
		return '';
	}
	return [0, 1].map(function(team_id) {
		var res = players[team_id].map(function(player) {
			return player.name;
		}).join(', ');
		if (res) {
			res += ' (' + ev.team_names[team_id] + ')';
		}
		return res;
	}).filter(function(s) {return s;}).join(' / ');
}

function pronounce_teamname(team_name) {
	var m = /^(.*)(\s[MJ]?[0-9]+)$/.exec(team_name);
	var core_name = m ? m[1] : team_name;
	var team_num = m ? m[2] : '';
	if (/\s1$/.test(team_num)) {
		team_num = '';
	}

	var table = {
		'Spvgg.Sterkrade-N.': 'Sportvereinigung Sterkrade-Nord',
		'BV RW Wesel': 'BV Wesel Rot-Weiss',
		'STC BW Solingen': 'STC Blau-Weiss Solingen',
		'SC BW Ostenland': 'SC Blau-Weiss Ostenland',
		'Blau-Weiss Wittorf-NMS': 'Blau-Weiss Wittorf-Neumünster',
		'1.BC Sbr.-Bischmisheim': '1.BC Saarbrücken-Bischmisheim',
		'VfB GW Mülheim': 'Grün-Weiß Mülheim',
	};
	core_name = table[core_name] || core_name;
	return core_name + team_num;
}

/**
 * @returns true iff regular players cannot be backup players in the specified league.
 */
function regular_nobackup(league_key) {
	return /^(1BL|2BLN|2BLS)-(2016|2017)$/.test(league_key);
}

return {
	annotate: annotate,
	calc_all_players: calc_all_players,
	calc_players_str: calc_players_str,
	get_presses: get_presses,
	guess_gender: guess_gender,
	is_bundesliga: is_bundesliga,
	is_5x1190_bundesliga: is_5x1190_bundesliga,
	is_incomplete: is_incomplete,
	make_empty_matches: make_empty_matches,
	NRW2016_RE: NRW2016_RE,
	set_incomplete: set_incomplete,
	set_metadata: set_metadata,
	set_not_before: set_not_before,
	setups_eq: setups_eq,
	default_counting: default_counting,
	umpire_pay: umpire_pay,
	name_by_league: name_by_league,
	is_german8: is_german8,
	umpire_required: umpire_required,
	pronounce_teamname: pronounce_teamname,
	regular_nobackup: regular_nobackup,
	// Testing only
	/*@DEV*/
	get_min_pause: get_min_pause,
	/*/@DEV*/
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var utils = require('./utils');
	var report_problem = require('./report_problem');

	module.exports = eventutils;
}
/*/@DEV*/