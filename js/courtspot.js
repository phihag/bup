var courtspot = (function() {

function _courtspot_request_xml(s, path, cb) {
	var url = s.courtspot.baseurl + path;
	$.ajax(url, {
		dataType: 'xml',
	}).done(function(doc) {
		cb(null, doc);
	});
}

var _courtspot_write_queue = [];
var _courtspot_write_running = false;
function _courtspot_write_queue_work() {
	if (_courtspot_write_running) {
		return;
	}
	// TODO handle errors and re-send
	if (_courtspot_write_queue.length == 0) {
		_courtspot_write_running = false;
		return;
	}

	_courtspot_write_running = true;
	var task = _courtspot_write_queue.shift();
	var url = task.s.courtspot.baseurl + task.path;
	$.ajax(url).done(function() {
		_courtspot_write_running = false;
		return _courtspot_write_queue_work();
	});
}
function _courtspot_write(s, path) {
	_courtspot_write_queue.push({
		s: s, path: path
	});
	_courtspot_write_queue_work();
}

function _courtspot_get_state(s) {
	
}

function _courtspot_send_init(s) {
	// Move the game to this court
	_courtspot_write(s,
		'php/dbClientEintrag.php?befehl=artSetzen' +
		'&wert=' + encodeURIComponent(s.setup.match_name) +
		'&court=' + encodeURIComponent(s.courtspot.court_name));
	_courtspot_write(s,
		'php/dbStandEintrag.php?befehl=nullnull&verein=Heim&satz=1' + 
		'&court=' + encodeURIComponent(s.courtspot.court_name) +
		'&art=' + encodeURIComponent(s.setup.match_name));

	// Switch sides if necessary
	if (! s.game.team1_left) {
		_courtspot_write(s,
			'php/dbClientEintrag.php?befehl=Seitenwechsel&wert=abc' + 
			'&court=' + encodeURIComponent(s.courtspot.court_name)
		);
	}

	// Set player positions
	if (! s.game.teams_player1_even[0]) {
		_courtspot_write(s,
			'php/dbClientEintrag.php?befehl=Spielerwechsel' + 
			'&wert=heim' +
			'&court=' + encodeURIComponent(s.courtspot.court_name)
		);
	}
	if (! s.game.teams_player1_even[1]) {
		_courtspot_write(s,
			'php/dbClientEintrag.php?befehl=Spielerwechsel' + 
			'&wert=gast' +
			'&court=' + encodeURIComponent(s.courtspot.court_name)
		);
	}

	// Set server
	_courtspot_write(s,
		'php/dbClientEintrag.php?befehl=aufgabeSetzen' + 
		'&wert=' + ((s.game.team1_serving == s.game.team1_left) ? 1 : 4) +
		'&court=' + encodeURIComponent(s.courtspot.court_name)
	);

	// Activate display
	_courtspot_write(s,
		'php/dbClientEintrag.php?befehl=anzeigeSetzen' + 
		'&wert=alles' +
		'&court=' + encodeURIComponent(s.courtspot.court_name)
	);
}

function send_press(s, press) {
	switch (press.type) {
	case 'pick_server':
		if ((s.match.finished_games.length == 0) && !s.setup.is_doubles) {
			_courtspot_send_init(s);
		}
		break;
	case 'pick_receiver':
		if ((s.match.finished_games.length == 0) && s.setup.is_doubles) {
			_courtspot_send_init(s);
		}
		break;
	}
}

function start_cs_match(s, setup) {
	setup.court_name = s.courtspot.court_name;
	start_match(s, setup);
}

function courtspot_list_matches(s, cb) {
	_courtspot_request_xml(s, 'php/dbabfrage.php', function(err, xml_doc) {
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

		function _get_score(match_node, key) {
			var score_str = _xml_get_text(match_node, key);
			return score_str ? parseInt(score_str, 10) : -1;
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

			var network_score = [];
			for (var game_idx = 1;game_idx <= 3;game_idx++) {
				var home_score = _get_score(match_node, 'HeimSatz' + game_idx);
				var away_score = _get_score(match_node, 'GastSatz' + game_idx);
				if ((home_score >= 0) && (away_score >= 0)) {
					network_score.push([home_score, away_score]);
				}
			}

			matches.push({
				setup: {
					counting: '3x21',
					is_doubles: home_team.players.length == 2,
					match_name: match_name,
					teams: [home_team, away_team],
					courtspot_match_id: match_name,
					team_competition: true,
				},
				network_score: network_score,
			});
		}
		cb(err, matches);
	});
}

function init(s, baseurl, court_name) {
	s.courtspot = {
		baseurl: baseurl,
		court_name: court_name,
		list_matches: courtspot_list_matches,
	};
}

function ui_init(s, court_name) {
	var baseurl = '../../';
	var m = window.location.pathname.match(/^(.*\/)[^\/]+\/bup(?:\/(?:bup\.html)?)?$/);
	if (m) {
		baseurl = m[1];
	}

	init(s, baseurl, court_name);
	$('.setup_network_container').show();
	show_settings();
}

return {
	ui_init: ui_init,
	send_press: send_press,
	start_cs_match: start_cs_match,
	// For testing only
	init: init,
}

})();