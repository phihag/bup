'use strict';
var eventutils = (function() {

function guess_gender(match_setup, player_id) {
	var mname = match_setup.discipline_key ? match_setup.match_name : match_setup.match_name;
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
		if (! match.presses_json) {
			return;
		}
		var scopy = calc.copy_state(state);
		var presses = JSON.parse(match.presses_json);
		calc.init_state(scopy, match.setup, presses);
		calc.state(scopy);
		var fpresses = scopy.flattened_presses;
		if (fpresses.length > 0) {
			match.network_match_start = fpresses[0].timestamp;
			match.network_last_update = fpresses[fpresses.length - 1].timestamp;
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
					report_problem.silent_error('Redundant key ' + key + ' in ' + setup.match_id);
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

return {
	guess_gender: guess_gender,
	calc_all_players: calc_all_players,
	set_metadata: set_metadata,
	annotate: annotate,
	NRW2016_RE: NRW2016_RE,
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