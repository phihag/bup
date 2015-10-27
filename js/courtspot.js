function courtspot(baseurl) {
'use strict';

function _xml_get_text(node, element_name) {
	var els = node.getElementsByTagName(element_name);
	if ((els.length > 0) && (els[0].childNodes.length > 0)) {
		return els[0].childNodes[0].nodeValue;
	}
	return null;
}

function _request(s, options, cb) {
	options.timeout = s.settings.network_timeout;
	$.ajax(options).done(function(res) {
		network.on_success();
		return cb(null, res);
	}).fail(function(xhr) {
		var msg = ((xhr.status === 0) ?
			'badmintonticker nicht erreichbar' :
			('Netzwerk-Fehler (Code ' + xhr.status + ')')
		);
		return cb({
			type: 'network-error',
			status: xhr.status,
			msg: msg,
		});
	});
}

function fetch_state(s, cb) {
	var data_url = (baseurl +
		'php/dbClientAbfrage.php?' +
		'court=' + encodeURIComponent(s.settings.court_id) +
		'&art=' + encodeURIComponent(s.setup.match_name)
	);
	_request(s, {
		url: data_url,
		dataType: 'xml',
	}, function(err, response) {
		if (err) {
			return cb(err);
		}
		var match_node = response.getElementsByTagName('COURT')[0];

		var cs_state = {
			score: _parse_score(match_node),
		};
		cb(err, cs_state);
	});
}

function calc_actions(s, remote_state) {
	var local_score = network.calc_score(s, true);
	var remote_score = remote_state.score;
	if (remote_score.length == 0) {
		remote_score = [[0, 0]];
	}

	if (local_score.length < remote_score.length) {
		return ['reset'];
	}

	// Look for historical games that don't match
	var game_idx;
	for (game_idx = 0;game_idx < remote_score.length - 1;game_idx++) {
		if (
				(remote_score[game_idx][0] != local_score[game_idx][0]) ||
				(remote_score[game_idx][1] != local_score[game_idx][1])) {
			return ['reset'];
		}
	}

	// Undo the newest remote game if needed
	var diff1 = remote_score[remote_score.length - 1][0] - local_score[remote_score.length - 1][0];
	var diff2 = remote_score[remote_score.length - 1][1] - local_score[remote_score.length - 1][1];
	var undos = Math.max(0, diff1) + Math.max(0, diff2);
	if (undos > 0) {
		return utils.repeat('undo', undos);
	}

	// At this point, our local score >= remote score
	var actions = [];
	for (game_idx = remote_score.length - 1;game_idx < local_score.length;game_idx++) {
		var rscore = (game_idx < remote_score.length) ? remote_score[game_idx] : [0, 0];
		var lscore = local_score[game_idx];
		while ((rscore[0] < lscore[0]) && (rscore[0] < 20)) {
			actions.push('+1-home');
			rscore[0]++;
		}
		while ((rscore[1] < lscore[1]) && (rscore[1] < 20)) {
			actions.push('+1-away');
			rscore[1]++;
		}

		while ((rscore[0] < lscore[0]) || (rscore[1] < lscore[1])) {
			if (rscore[0] < lscore[0]) {
				actions.push('+1-home');
				rscore[0]++;
			}
			if (rscore[1] < lscore[1]) {
				actions.push('+1-away');
				rscore[1]++;
			}
		}
	}
	return actions;
}

function request_action(action) {
	switch (action) {
	case 'undo':
		var TODO = (baseurl +
			'php/dbStandEintrag.php?befehl=minusEins' +
			'&court=' + encodeURIComponent(s.settings.court_id) +
			'&art=' + encodeURIComponent(s.setup.match_name)
		);
		break;
	default:
		throw new Error('Invalid CourtSpot action ' + action);
	}
}

function sync(s) {
	if (!s.remote.initialized) {
		return _courtspot_send_init(s);
	}

	fetch_state(s, function(err, remote_state) {
		if (err) {
			return network.on_error(err);
		}
		console.log('remote_state:', remote_state);
		var actions = calc_actions(s, remote_state);
		console.log('actions:', actions);
		// TODO compare with local state
		// TODO if actions.length > 0  resync afterwards
	});
}

// Move the game to this court and reset score
function _courtspot_send_init(s) {
	if (s.remote.initializing) {
		return;  // Do not send requests twice
	}

	s.remote.initializing = true;
	var init1_url = (baseurl +
		'php/dbClientEintrag.php?befehl=artSetzen' +
		'&wert=' + encodeURIComponent(s.setup.match_name) +
		'&court=' + encodeURIComponent(s.settings.court_id));
	_request(s, {url: init1_url}, function(err) {
		if (err) {
			s.remote.initializing = false;
			return network.on_error(err);
		}

		var init2_url = (baseurl +
			'php/dbStandEintrag.php?befehl=nullnull&verein=Heim&satz=1' + 
			'&court=' + encodeURIComponent(s.settings.court_id) +
			'&art=' + encodeURIComponent(s.setup.match_name));
		_request(s, {url: init2_url}, function(err) {
			if (err) {
				s.remote.initializing = false;
				return network.on_error(err);
			}

			var init3_url = (baseurl +
				'php/dbClientEintrag.php?befehl=anzeigeSetzen&wert=alles' +
				'&court=' + encodeURIComponent(s.settings.court_id));
			_request(s, {url: init3_url}, function(err) {
				if (err) {
					s.remote.initializing = false;
					return network.on_error(err);
				}
				s.remote.initializing = false;
				s.remote.initialized = true;
			});
		});
	});
}

/*
	// Switch sides if necessary
	if (! s.game.team1_left) {
		_courtspot_write(s,
			'php/dbClientEintrag.php?befehl=Seitenwechsel&wert=abc' + 
			'&court=' + encodeURIComponent(s.remote.court_name)
		);
	}

	// Set player positions
	if (! s.game.teams_player1_even[0]) {
		_courtspot_write(s,
			'php/dbClientEintrag.php?befehl=Spielerwechsel' + 
			'&wert=heim' +
			'&court=' + encodeURIComponent(s.remote.court_name)
		);
	}
	if (! s.game.teams_player1_even[1]) {
		_courtspot_write(s,
			'php/dbClientEintrag.php?befehl=Spielerwechsel' + 
			'&wert=gast' +
			'&court=' + encodeURIComponent(s.remote.court_name)
		);
	}

	// Set server
	_courtspot_write(s,
		'php/dbClientEintrag.php?befehl=aufgabeSetzen' + 
		'&wert=' + ((s.game.team1_serving == s.game.team1_left) ? 1 : 4) +
		'&court=' + encodeURIComponent(s.remote.court_name)
	);

	// Activate display
	_courtspot_write(s,
		'php/dbClientEintrag.php?befehl=anzeigeSetzen' + 
		'&wert=alles' +
		'&court=' + encodeURIComponent(s.remote.court_name)
	);
}
*/

function send_press(s, press) {
	return sync(s);
}

function _parse_score(match_node) {
	function _get_score(key) {
		var score_str = _xml_get_text(match_node, key);
		return score_str ? parseInt(score_str, 10) : -1;
	}

	var res = [];
	for (var game_idx = 1;game_idx <= 3;game_idx++) {
		var home_score = _get_score(match_node, 'HeimSatz' + game_idx);
		var away_score = _get_score(match_node, 'GastSatz' + game_idx);
		if ((home_score >= 0) && (away_score >= 0)) {
			res.push([home_score, away_score]);
		}
	}
	return res;
}

function list_matches(s, cb) {
	var options = {
		url: baseurl + 'php/dbabfrage.php',
		dataType: 'xml',
	};
	_request(s, options, function(err, xml_doc) {
		if (err) {
			return cb(err);
		}

		function _get_player(match_node, key) {
			var res = {
				firstname: _xml_get_text(match_node, key + 'VN'),
				lastname: _xml_get_text(match_node, key + 'NN'),
			};
			if (res.firstname) {
				if (res.lastname) {
					res.name = res.firstname + ' ' + res.lastname;
				} else {
					res.name = res.firstname;
				}
			} else {
				if (res.lastname) {
					res.name = res.lastname;
				} else {
					return null;
				}
			}
			return res;
		}

		function _get_team(match_node, v_node, key) {
			var player1 = _get_player(match_node, key + 'spieler1');
			var players = [];
			if (player1) {
				players.push(player1);
				var player2 = _get_player(match_node, key + 'spieler2');
				if (player2) {
					players.push(player2);
				}
			}
			return {
				name: v_node ? _xml_get_text(v_node, key) : null,
				players: players,
			};
		}

		var matches = [];
		var v_node = xml_doc.getElementsByTagName('VERWALTUNG')[0];
		var match_nodes = xml_doc.getElementsByTagName('Spiel');
		for (var i = 0;i < match_nodes.length;i++) {
			var match_node = match_nodes[i];
			var home_team = _get_team(match_node, v_node, 'Heim');
			var away_team = _get_team(match_node, v_node, 'Gast');

			var match_name = _xml_get_text(match_node, 'Art');

			if (!match_name || (home_team.players.length < 1) || (away_team.players.length < 1)) {
				continue;
			}

			var network_score = _parse_score(match_node);

			var match_id = 'btde_' + utils.iso8601(new Date()) + '_' + match_name + '_' + home_team.name + '-' + away_team.name;
			matches.push({
				setup: {
					counting: '3x21',
					match_name: match_name,
					is_doubles: home_team.players.length == 2,
					teams: [home_team, away_team],
					courtspot_match_id: match_name,
					team_competition: true,
				},
				network_score: network_score,
			});
		}

		var event = {
			event_name: home_team.name + ' - ' + away_team.name,
			matches: matches,
		};
		cb(err, event);
	});
}

function ui_init(s) {
	if (!baseurl) {
		baseurl = '../../';
	}

	var m = window.location.pathname.match(/^(.*\/)html\/bup(?:\/(?:bup\.html)?)?$/);
	if (m) {
		baseurl = m[1];
	}

	$('.setup_network_container').show();
	show_settings();
}

return {
	ui_init: ui_init,
	list_matches: list_matches,
	send_press: send_press,
	calc_actions: calc_actions,
};

}

if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var network = require('./network');
	var utils = require('./utils');

	module.exports = courtspot;
}