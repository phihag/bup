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
		return cb(null, res);
	}).fail(function(xhr) {
		var msg = ((xhr.status === 0) ?
			'CourtSpot nicht erreichbar' :
			('Netzwerk-Fehler (Code ' + xhr.status + ')')
		);
		return cb({
			type: 'network-error',
			status: xhr.status,
			msg: msg,
		});
	});
}


function _parse_score(match_node) {
	function _get_score(match_node, key) {
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

var _outstanding_requests = 0;
function sync(s) {
	var netscore = network.calc_score(s);

	// CourtSpot requires us to set the team currently serving.
	// Calculate that from match winner or actual game details.
	var cs_team1 = (s.match.team1_won === null) ? s.game.team1_serving : s.match.team1_won;

	var game_score = s.match.game_score;
	var serve_is_determined = (
		(s.game.team1_serving !== null) &&
		(state.game.teams_player1_even[0] !== null) &&
		(state.game.teams_player1_even[1] !== null));

	var data = {
		'Detail': (serve_is_determined ? 'alles' : 'punkte'),
		'Satz': netscore.length,
		'gewonnenHeim': game_score[0],
		'gewonnenGast': game_score[1],
		'team_links': (s.game.team1_left ? 'heim' : 'gast'),
		'team_aufschlag': (s.game.team1_serving ? 'Heim' : 'Gast'),
		'aufschlag_score': s.game.score[s.game.team1_serving ? 0 : 1],
		'heim_spieler1_links': (s.game.teams_player1_even[0] ? 'false' : 'true'),
		'gast_spieler1_links': (s.game.teams_player1_even[1] ? 'false' : 'true'),
		'court': s.settings.court_id,
		'art': s.setup.match_name,
		'verein': (cs_team1 ? 'heim' : 'gast'),
	};
	for (var i = 0;i < s.match.max_games;i++) {
		data['HeimSatz' + (i+1)] = (i < netscore.length) ? netscore[i][0] : -1;
		data['GastSatz' + (i+1)] = (i < netscore.length) ? netscore[i][1] : -1;
	}
	if (utils.deep_equal(data, s.remote.courtspot_data) && (_outstanding_requests == 0)) {
		return;
	}
	_outstanding_requests++;

	var request_url = (
		baseurl + 'php/dbStandEintrag.php?befehl=setzen' + 
			'&court=' + encodeURIComponent(data.court) +
			'&art=' + encodeURIComponent(data.art) +
			'&verein=' + encodeURIComponent(data.verein)
	);
	_request(s, {
		method: 'POST',
		data: data,
		dataType: 'text',
		url: request_url,
	}, function(err, content) {
		_outstanding_requests--;

		if (!err) {
			try {
				var res = JSON.parse(content);
				if (res.status != 'ok') {
					err = {
						msg: 'CourtSpot-Aktualisierung fehlgeschlagen!',
					};
				}
			} catch (e) {
				err = {
					msg: 'CourtSpot-Aktualisierung fehlgeschlagen: Server-Fehler erkannt',
				};
			}
		}

		network.errstate('courtspot.set', err);
		if (!err) {
			s.remote.courtspot_data = data;
		}
	});
}

function send_press(s, press) {
	sync(s);
}

function list_matches(s, cb) {
	var options = {
		url: baseurl + 'php/dbabfrage.php?lfdnum=-1',
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

			var match_id = 'courtspot_' + utils.iso8601(new Date()) + '_' + match_name + '_' + home_team.name + '-' + away_team.name;
			matches.push({
				setup: {
					counting: '3x21',
					match_name: match_name,
					is_doubles: home_team.players.length == 2,
					teams: [home_team, away_team],
					match_id: match_id,
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
	sync: sync,
};

}

if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var network = require('./network');
	var utils = require('./utils');

	module.exports = courtspot;
}