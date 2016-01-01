function courtspot(baseurl) {
'use strict';

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

function courts(s) {
	return [{
		id: '1',
		description: s._('left'),
	}, {
		id: '2',
		description: s._('right'),
	}];
}

function prepare_match(current_settings, match) {
	if (typeof match.courtspot.heim_oben == 'boolean') {
		match.network_team1_left = match.courtspot.heim_oben == (current_settings.court_id == 1);
	}
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
	if (utils.deep_equal(data, s.remote.courtspot_data) && (_outstanding_requests === 0)) {
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

function send_press(s) {
	sync(s);
}

function list_matches(s, cb) {
	var options = {
		url: baseurl + 'php/bupabfrage.php',
		dataType: 'json',
	};
	_request(s, options, function(err, event) {
		if (err) {
			return cb(err);
		}
		if (event.status != 'ok') {
			return cb({
				msg: 'Spiel-Daten konnten nicht gelesen werden',
			});
		}

		cb(err, event);
	});
}

/* Paramter (unused:) s */
function ui_init() {
	if (!baseurl) {
		baseurl = '../';
	}

	var m = window.location.pathname.match(/^(.*\/)bup(?:\/(?:bup\.html)?)?$/);
	if (m) {
		baseurl = m[1];
	}

	$('.setup_network_container').show();
}

return {
	ui_init: ui_init,
	list_matches: list_matches,
	send_press: send_press,
	sync: sync,
	prepare_match: prepare_match,
	courts: courts,
};

}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var network = require('./network');
	var utils = require('./utils');

	module.exports = courtspot;
}
/*/@DEV*/