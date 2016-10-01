function courtspot(baseurl) {
'use strict';

function _request(s, component, options, cb) {
	options.timeout = s.settings.network_timeout;
	network.request(component, options).done(function(res) {
		return cb(null, res);
	}).fail(function(xhr) {
		var msg = 'Netzwerk-Fehler (Code ' + xhr.status + ')';
		if (xhr.status === 0) {
			msg = 'CourtSpot nicht erreichbar';
		} else if ((xhr.status === 200) && (options.dataType === 'json')) {
			msg = 'Kein gültiges JSON-Dokument';
		}
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
		description: s._('court:left'),
	}, {
		id: '2',
		description: s._('court:right'),
	}, {
		id: 'referee',
		description: s._('court:referee'),
	}];
}

function prepare_match(current_settings, match) {
	if (!match.presses) {
		if (typeof match.courtspot.heim_oben == 'boolean') {
			match.network_team0_left = match.courtspot.heim_oben == (current_settings.court_id == 1);
		}
	}
}

function gen_data(s) {
	var netscore = calc.netscore(s, true);

	// CourtSpot requires us to set the team currently serving.
	// Calculate that from match winner or actual game details.
	var team1_serving = (s.game.team1_won === null) ? s.game.team1_serving : s.game.team1_won;

	var game_score = s.match.game_score;
	var side_is_determined = s.game.team1_left !== null;
	var serve_is_determined = (
		(s.game.team1_serving !== null) &&
		(s.game.teams_player1_even[0] !== null) &&
		(s.game.teams_player1_even[1] !== null));

	if (!side_is_determined) {
		netscore = [];
	}

	var data = {
		'Detail': (s.match.finish_confirmed ? 'leer' : (serve_is_determined ? 'alles' : (side_is_determined ? 'punkte' : 'leer'))),
		'Satz': Math.max(1, netscore.length),
		'gewonnenHeim': game_score[0],
		'gewonnenGast': game_score[1],
		'team_links': (s.game.team1_left ? 'heim' : 'gast'),
		'team_aufschlag': (team1_serving ? 'Heim' : 'Gast'),
		'aufschlag_score': s.game.score[team1_serving ? 0 : 1],
		'heim_spieler1_links': (s.game.teams_player1_even[0] ? 'false' : 'true'),
		'gast_spieler1_links': (s.game.teams_player1_even[1] ? 'false' : 'true'),
		'court': s.settings.court_id,
		'art': s.setup.match_name,
		'verein': (team1_serving ? 'heim' : 'gast'),
		'presses_json': JSON.stringify(s.presses),
	};
	for (var i = 0;i < s.match.max_games;i++) {
		data['HeimSatz' + (i+1)] = (i < netscore.length) ? netscore[i][0] : -1;
		data['GastSatz' + (i+1)] = (i < netscore.length) ? netscore[i][1] : -1;
	}
	return data;
}

var outstanding_requests = 0;
function sync(s, force) {
	if (s.settings.court_id === 'referee') {
		network.errstate('courtspot.set', null);
		return;
	}

	var data = gen_data(s);
	if (!force && utils.deep_equal(data, s.remote.courtspot_data) && (outstanding_requests === 0)) {
		return;
	}

	if (outstanding_requests > 0) {
		// Another request is currently underway; ours may come to late
		// Send our request anyways, but send it once again as soon as there are no more open requests
		s.remote.courtspot_resend = true;
	}
	outstanding_requests++;

	var request_url = (
		baseurl + 'php/dbStandEintrag.php?befehl=setzen' + 
			'&court=' + encodeURIComponent(data.court) +
			'&art=' + encodeURIComponent(data.art) +
			'&verein=' + encodeURIComponent(data.verein)
	);
	var match_id = s.metadata.id;
	_request(s, 'courtspot.set', {
		method: 'POST',
		data: data,
		dataType: 'text',
		url: request_url,
	}, function(err, content) {
		outstanding_requests--;

		if (!s.metadata || (s.metadata.id !== match_id)) { // Match changed while the request was underway
			return;
		}

		if (!err) {
			try {
				var res = JSON.parse(content);
				if (res.status == 'ok') {
					s.remote.courtspot_step = res.step;
				} else {
					err = {
						msg: 'CourtSpot-Aktualisierung fehlgeschlagen!',
					};
					if (res.description) {
						err.msg += '\nMeldung: ' + res.description;
					}
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

		// We had multiple requests going on in parallel, and that's now over.
		// An older requests may have been delayed and been the last one.
		// Send one more request to ensure CourtSpot is up to date.
		if (s.remote.courtspot_resend && outstanding_requests === 0) {
			s.remote.courtspot_resend = false;
			sync(s, true);
		}
	});
}

function send_press(s) {
	if (!s.setup.courtspot_match_id) {
		// Manual match while CourtSpot is active
		return;
	}
	sync(s);
}

function list_matches(s, cb) {
	var options = {
		url: baseurl + 'php/bupabfrage.php',
		dataType: 'json',
	};
	_request(s, 'courtspot.list', options, function(err, event) {
		if (err) {
			return cb(err);
		}
		if (event.status === 'error') {
			return cb({
				msg: 'Fehler beim Lesen der Spiel-Daten: ' + event.description,
			});
		} else if (event.status != 'ok') {
			return cb({
				msg: 'Spiel-Daten konnten nicht gelesen werden',
			});
		}

		eventutils.annotate(s, event);

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
}

/* Parameter: s */
function service_name() {
	return 'CourtSpot';
}

/* Parameter: s */
function editable() {
	return false;
}

return {
	ui_init: ui_init,
	list_matches: list_matches,
	send_press: send_press,
	sync: sync,
	prepare_match: prepare_match,
	courts: courts,
	service_name: service_name,
	editable: editable,
	// Testing only
	gen_data: gen_data,
};

}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var utils = require('./utils');

	module.exports = courtspot;
}
/*/@DEV*/