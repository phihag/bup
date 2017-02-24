'use strict';
var eventutils = (function() {

function guess_gender(match_setup, player_id) {
	var mname = match_setup.discipline_key ? match_setup.discipline_key : (match_setup.eventsheet_id ? match_setup.eventsheet_id : match_setup.match_name);
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

function set_metadata(event) {
	var umpires_set = {}; // Poor man's set

	event.matches.forEach(function(match) {
		match.md_eid = match.setup.eventsheet_id || match.setup.match_name;
		var presses;
		if (match.presses) {
			presses = match.presses;
		} else if (match.presses_json) {
			presses = JSON.parse(match.presses_json);
		} else {
			return;
		}

		var scopy = {};
		calc.init_state(scopy, match.setup, presses);
		calc.state(scopy);
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
		match.netscore = calc.netscore(scopy);
		match.network_finished = scopy.match.finished;
		match.network_team1_won = scopy.match.team1_won;
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
	if (!event.event_name && event.team_names) {
		event.event_name = event.team_names[0] + ' - ' + event.team_names[1];
	}

	var props = {
		league_key: league_key,
		tournament_name: event.tournament_name,
		event_name: event.event_name,
		team_competition: event.team_competition,
	};
	event.matches.forEach(function(m) {
		var setup = m.setup;
		for (var key in props) {
			var val = props[key];
			if (val === undefined) {
				continue;
			}

			/*@DEV*/
			if (setup[key] === val) {
				report_problem.silent_error('Redundant key ' + key + ' in ' + setup.match_id);
			}
			/*/@DEV*/

			if (! setup[key]) {
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

var NRW2016_RE = /^NRW-(O19)-(?:(?:([NS])([12]))-)?([A-Z]{2})-([0-9]{3})-2016$/;
function name_by_league(league_key) {
	if (/^1BL-(?:2015|2016)$/.test(league_key)) {
		return '1. Bundesliga';
	}
	if (/^2BLN-(?:2015|2016)$/.test(league_key)) {
		return '2. Bundesliga Nord';
	}
	if (/^2BLS-(?:2015|2016)$/.test(league_key)) {
		return '2. Bundesliga Süd';
	}
	if (league_key === 'RLN-2016') {
		return 'Regionalliga Nord';
	}
	if (league_key === 'RLM-2016') {
		return 'Regionalliga Mitte';
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
	return /^(?:1BL|2BLN|2BLS)-(?:2015|2016)$/.test(league_key);
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

function get_min_pause(league_key) {
	if (/^(?:1BL|2BLN|2BLS)-(?:2015|2016)$/.test(league_key)) {
		return 20 * 60000; // §10.1 BLO-DB
	}
	if ((league_key === 'RLW-2016') || (NRW2016_RE.test(league_key))) {
		return 30 * 60000; // §57.7 SpO
	}
	if (league_key === 'RLN-2016') {
		return 20 * 60000; // §7.7 Gruppe Nord
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

function make_empty_matches(league_key, event_id) {
	if (/^(?:1BL|2BLN|2BLS)-2016$/.test(league_key)) {
		var rawdef = [
			{name: '1.HD', is_doubles: true},
			{name: 'DD', is_doubles: true},
			{name: '2.HD', is_doubles: true},
			{name: '1.HE', is_doubles: false},
			{name: 'DE', is_doubles: false},
			{name: 'GD', is_doubles: true},
			{name: '2.HE', is_doubles: false},
		];
		var counting = '5x11_15';

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

return {
	annotate: annotate,
	calc_all_players: calc_all_players,
	set_not_before: set_not_before,
	setups_eq: setups_eq,
	guess_gender: guess_gender,
	is_incomplete: is_incomplete,
	NRW2016_RE: NRW2016_RE,
	set_incomplete: set_incomplete,
	set_metadata: set_metadata,
	is_bundesliga: is_bundesliga,
	make_empty_matches: make_empty_matches,
	// Testing only
	name_by_league: name_by_league,
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