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

function sync(s) {
	var netscore = network.calc_score(s);

	// CourtSpot requires us to set the team currently serving.
	// Calculate that from match winner or actual game details.
	var cs_team1 = (s.match.team1_won === null) ? s.game.team1_serving : s.match.team1_won;

	var game_score = s.match.game_score;
	var server_num = (s.court.left_serving ? 1 : 3) + (s.court.serving_downwards ? 1 : 0);

	var data = {
		'Detail': 'alles',
		'Satz': netscore.length,
		'gewonnenHeim': game_score[0],
		'gewonnenGast': game_score[1],
		'team_links': (s.game.team1_left ? 'heim' : 'gast'),
		'linksheim': (state.game.teams_player1_even[0] ? 'Spieler2' : 'Spieler1'),
		'linksgast': (state.game.teams_player1_even[1] ? 'Spieler2' : 'Spieler1'),
		'aufschlag': server_num,
	};
	for (var i = 0;i < s.match.max_games;i++) {
		data['HeimSatz' + (i+1)] = (i < netscore.length) ? netscore[i][0] : -1;
		data['GastSatz' + (i+1)] = (i < netscore.length) ? netscore[i][1] : -1;
	}

	var request_url = (
		baseurl + 'php/dbStandEintrag.php?befehl=setzen' + 
			'&court=' + encodeURIComponent(s.settings.court_id) +
			'&art=' + encodeURIComponent(s.setup.match_name) +
			'&verein=' + encodeURIComponent(cs_team1 ? 'heim' : 'gast'));
	_request(s, {
		method: 'POST',
		data: data,
		url: request_url,
	}, function(err) {
		network.errstate('courtspot.set', err);
	});
}

function send_press(s, press) {
	sync(s);
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
	sync: sync,
};

}

if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var network = require('./network');
	var utils = require('./utils');

	module.exports = courtspot;
}