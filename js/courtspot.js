function courtspot(baseurl) {
'use strict';

function _request(s, component, options, cb) {
	options.timeout = s.settings.network_timeout;
	network.$request(component, options).done(function(res) {
		return cb(null, res);
	}).fail(function(xhr) {
		var message = 'Netzwerk-Fehler (Code ' + xhr.status + ')';
		if (xhr.status === 0) {
			message = 'CourtSpot nicht erreichbar';
		} else if ((xhr.status === 200) && (options.dataType === 'json')) {
			message = 'Kein gültiges JSON-Dokument';
		}
		return cb({
			type: 'network-error',
			status: xhr.status,
			msg: message, // deprecated
			message: message,
		});
	});
}

function courts(s) {
	return [{
		court_id: '1',
		description: s._('court:left'),
	}, {
		court_id: '2',
		description: s._('court:right'),
	}, {
		court_id: 'referee',
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

function courtspot_boolean(value, true_str, false_str) {
	if (value === true) {
		return true_str;
	} else if (value === false) {
		return false_str;
	} else {
		return '';
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

	if (!side_is_determined && !s.match.finished) {
		netscore = [];
	}

	var data = {
		'Detail': (s.match.finish_confirmed ? 'leer' : (serve_is_determined ? 'alles' : (side_is_determined ? 'punkte' : 'leer'))),
		'Satz': Math.max(1, netscore.length),
		'gewonnenHeim': game_score[0],
		'gewonnenGast': game_score[1],
		'team_links': courtspot_boolean(s.game.team1_left, 'heim', 'gast'),
		'team_aufschlag': courtspot_boolean(team1_serving, 'Heim', 'Gast'),
		'aufschlag_score': s.game.score[team1_serving ? 0 : 1],
		'heim_spieler1_links': courtspot_boolean(s.game.teams_player1_even[0], 'false', 'true'),
		'gast_spieler1_links': courtspot_boolean(s.game.teams_player1_even[1], 'false', 'true'),
		'court': s.settings.court_id,
		'art': s.setup.match_name,
		'verein': courtspot_boolean(team1_serving, 'heim', 'gast'),
		'presses_json': JSON.stringify(s.presses),
	};
	for (var i = 0;i < s.match.max_games;i++) {
		data['HeimSatz' + (i+1)] = (i < netscore.length) ? netscore[i][0] : -1;
		data['GastSatz' + (i+1)] = (i < netscore.length) ? netscore[i][1] : -1;
	}

	// Always report -1 for 5 games
	for (i = s.match.max_games;i < 5;i++) {
		data['HeimSatz' + (i+1)] = -1;
		data['GastSatz' + (i+1)] = -1;
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

function _list(s, suffix, cb) {
	var options = {
		url: baseurl + 'bup/div/courtspot/bupabfrage.php' + suffix,
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

		cb(err, event);
	});

}

function list_matches(s, cb) {
	_list(s, '', function(err, event) {
		if (err) {
			return cb(err);
		}

		eventutils.annotate(s, event);

		// CourtSpot sometimes set the fourth game to 0 for 3x21. Clamp network_score
		event.matches.forEach(function(m) {
			var max_game_count = calc.max_game_count(m.setup.counting);
			if (m.network_score.length > max_game_count) {
				m.network_score = m.network_score.slice(0, max_game_count);
			}
		});

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
	return true;
}

function _calc_setup_data(event) {
	var res = {
		by_match: {},
	};
	event.matches.forEach(function(match) {
		var setup = match.setup;
		res.by_match[setup.courtspot_match_id] = setup.teams.map(function(team) {
			return team.players.map(function(player) {
				if (player.firstname && player.lastname) {
					return player;
				}
				var m = /^(.*)\s+(\S+)$/.exec(player.name);
				if (m) {
					return {
						firstname: m[1],
						lastname: m[2],
					};
				}
				return {
					firstname: '',
					lastname: player.name,
				};
			});
		});
	});
	return res;
}

function on_edit_event(s, cb) {
	var data = _calc_setup_data(s.event);
	_request(s, 'courtspot.editevent', {
		url: baseurl + 'bup/div/courtspot/bupaufstellung.php',
		data: JSON.stringify(data),
		method: 'post',
		dataType: 'text',
	}, function(err, content) {
		if (err) {
			return cb(err);
		}

		try {
			var res = JSON.parse(content);
			if (res.status !== 'ok') {
				err = {
					msg: 'CourtSpot-Aufstellungs-Update fehlgeschlagen!',
				};
				if (res.description) {
					err.msg += '\nMeldung: ' + res.description;
				}
			}
		} catch (e) {
			err = {
				msg: 'CourtSpot-Aufstellungs-Update fehlgeschlagen: Server-Fehler erkannt',
			};
		}

		return cb(err);
	});
}

function list_all_players(s, cb) {
	_list(s, '?all_players=1', function(err, event) {
		if (err) return cb(err);

		if (!event.all_players) {
			return cb({
				msg: 'Alte CourtSpot-Version: Bitte bupabfrage.php aktualisieren',
			});
		}
		return cb(err, event && event.all_players);
	});
}

function save_order(s, matches, cb) {
	var order_list = matches.map(function(m) {
		return m.setup.courtspot_match_id;
	});

	_request(s, 'order', {
		url: baseurl + 'bup/div/courtspot/bupreihenfolge.php',
		data: JSON.stringify(order_list),
		method: 'post',
		dataType: 'text',
	}, function(err) {
		if (err && err.status === 404) {
			return cb({
				message: 'Ändern fehlgeschlagen: Alte CourtSpot-Version. Bitte updaten!',
			});
		}
		return cb(err);
	});
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
	on_edit_event: on_edit_event,
	list_all_players: list_all_players,
	save_order: save_order,
	// Testing only
	/*@DEV*/
	gen_data: gen_data,
	/*/@DEV*/
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