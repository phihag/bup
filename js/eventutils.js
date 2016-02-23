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
			var player_count = match.setup.is_doubles ? 2 : 1;
			for (var player_id = 0;player_id < player_count;player_id++) {
				var player = match.setup.teams[team_id].players[player_id];
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
		scopy.presses = JSON.parse(match.presses_json);
		calc.undo(scopy);
		var fpresses = scopy.flattened_presses;
		if (fpresses.length > 0) {
			match.network_match_start = fpresses[0].timestamp;
			match.network_last_update = fpresses[fpresses.length - 1].timestamp;
		}
	});
}

return {
	guess_gender: guess_gender,
	calc_all_players: calc_all_players,
	set_metadata: set_metadata,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = eventutils;
}
/*/@DEV*/