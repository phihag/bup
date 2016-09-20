var eventutils = (function() {
'use strict';

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
		match.network_metadata = scopy.metadata;
		var first_game = scopy.match.finished_games.length ? scopy.match.finished_games[0] : scopy.game;
		match.network_start_team1_left = first_game.start_team1_left;
		match.network_real_scores = calc.all_games(scopy).filter(function(g) {
			return g.finished;
		}).map(function(g) {
			return g.score;
		});
	});
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

	var props = {
		league_key: network.league_key(event),
		event_name: event.event_name,
		tournament_name: event.tournament_name,
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
				report_problem.silent_error('Duplicate key ' + key + ' in ' + setup.match_id);
			}
			/*/@DEV*/

			if (! setup[key]) {
				setup[key] = val;
			}
		}

		if (event.team_names) {
			event.team_names.forEach(function(team_name, team_idx) {
				if (!setup.teams[team_idx].name) {
					setup.teams[team_idx].name = team_name;
				}
			});
		}
	});
}

return {
	guess_gender: guess_gender,
	calc_all_players: calc_all_players,
	set_metadata: set_metadata,
	annotate: annotate,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var utils = require('./utils');
	var network = require('./network');
	var report_problem = require('./report_problem');

	module.exports = eventutils;
}
/*/@DEV*/