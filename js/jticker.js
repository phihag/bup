'use strict';
function jticker(tm_id) {
var baseurl;

function _request(s, component, options, cb) {
	options.timeout = s.settings.network_timeout;
	network.$request(component, options).done(function(res) {
		return cb(null, res);
	}).fail(function(xhr) {
		var msg = 'Netzwerk-Fehler (Code ' + xhr.status + ')';
		if (xhr.status === 0) {
			msg = 'Ticker nicht erreichbar';
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

function gen_data(s) {
	return {
		match_id: s.setup.jticker_match_id,
		score_json: JSON.stringify(calc.netscore(s, true)),
		court_id: s.settings.court_id,
		presses_json: JSON.stringify(s.presses),
	};
}

var outstanding_requests = 0;
function sync(s, force) {
	if (s.settings.court_id === 'referee') {
		network.errstate('jticker.set', null);
		return;
	}

	if (!s.remote) {
		s.remote = {};
	}

	var data = gen_data(s);
	if (!force && utils.deep_equal(data, s.remote.jticker_data) && (outstanding_requests === 0)) {
		return;
	}

	if (outstanding_requests > 0) {
		// Another request is currently underway; ours may come to late
		// Send our request anyways, but send it once again as soon as there are no more open requests
		s.remote.jticker_resend = true;
	}
	outstanding_requests++;

	var m = /csrftoken="?([a-z0-9A-Z]+)"?/.exec(document.cookie);
	if (!m) {
		network.errstate('jticker.set', {
			type: 'login-required',
			msg: 'CSRF-Token fehlt - bitte einloggen!',
		});
		return;
	}
	data.csrfmiddlewaretoken = m[1];

	var request_url = (
		baseurl + 'ticker/manage/bup/sync?' +
			'match_id=' + encodeURIComponent(data.match_id)
	);
	var match_id = s.setup.match_id;
	_request(s, 'jticker.set', {
		method: 'POST',
		data: data,
		dataType: 'text',
		url: request_url,
	}, function(err, content) {
		outstanding_requests--;

		if (!s.setup || (s.setup.match_id !== match_id)) { // Match changed while the request was underway
			return;
		}

		if (!s.remote) {
			s.remote = {};
		}

		if (!err) {
			try {
				var res = JSON.parse(content);
				if (res.status == 'ok') {
					s.remote.jticker_step = res.step;
				} else {
					err = {
						msg: 'Ticker-Aktualisierung fehlgeschlagen!',
					};
					if (res.description) {
						err.msg += '\nMeldung: ' + res.description;
					}
				}
			} catch (e) {
				err = {
					msg: 'Ticker-Aktualisierung fehlgeschlagen: Server-Fehler erkannt',
				};
			}
		}

		network.errstate('jticker.set', err);
		if (!err) {
			s.remote.jticker_data = data;
		}

		// We had multiple requests going on in parallel, and that's now over.
		// An older requests may have been delayed and been the last one.
		// Send one more request to ensure jTicker is up to date.
		if (s.remote.jticker_resend && outstanding_requests === 0) {
			s.remote.jticker_resend = false;
			sync(s, true);
		}
	});
}

function send_press(s) {
	if (!s.setup.jticker_match_id) {
		// Manual match (or from another service)
		return;
	}
	sync(s);
}

function _unify_teamname(team_name) {
	return {
		'1. BC Bischmisheim': '1.BC Sbr.-Bischmisheim',
		'1. BC Bischmisheim 2': '1.BC Sbr.-Bischmisheim 2',
		'1. BC Beuel 2': '1.BC Beuel 2',
		'1. BC Beuel 1': '1.BC Beuel',
		'1. BC Beuel': '1.BC Beuel',
		'1. BV Mülheim': '1.BV Mülheim',
		'1. BV Muelheim': '1.BV Mülheim',
		'1. BV Mülheim 2': '1.BV Mülheim 2',
		'1. BV Muelheim 2': '1.BV Mülheim 2',
		'SV Fun-Ball Dortelweil 1': 'SV Fun-Ball Dortelweil',
		'Blau-Weiss Wittorf-NMS 1': 'Blau-Weiss Wittorf-NMS',
		'TSV Freystadt': 'TSV 1906 Freystadt',
		'Union Lüdinghausen': 'SC Union Lüdinghausen',
	}[team_name] || team_name;
}

function list_all_players(s, cb) {
	list_matches(s, function(err, event) {
		if (err) return cb(err);
		cb(err, event.all_players);
	}, true);
}

function _calc_setup_spec(event) {
	var res = {};
	event.matches.forEach(function(m) {
		var setup = m.setup;

		res[setup.jticker_match_id] = setup.teams.map(function(t) {
			return t.players.map(function(p, player_id) {
				var resp = {};
				if (p.firstname && p.lastname) {
					resp.firstname = p.firstname;
					resp.lastname = p.lastname;
				} else {
					var m = /^(.+)\s+(\S+)$/.exec(p.name);
					if (m) {
						resp.firstname = m[1];
						resp.lastname = m[2];
					} else {
						resp.firstname = resp.lastname = p.name;
					}
				}

				resp.gender = p.gender ? p.gender : eventutils.guess_gender(setup, player_id);
				return resp;
			});
		});
	});
	return res;
}

function on_edit_event(s, cb) {
	var spec = _calc_setup_spec(s.event);

	var m = /csrftoken="?([a-z0-9A-Z]+)"?/.exec(document.cookie);
	if (!m) {
		return cb(new Error('CSRF-Token fehlt - bitte einloggen!'));
	}
	var data = {
		csrfmiddlewaretoken: m[1],
		players_json: JSON.stringify(spec),
	};

	_request(s, 'jticker.editevent', {
		url: baseurl + 'ticker/manage/bup/teamsetup?tm_id=' + tm_id,
		method: 'POST',
		data: data,
		dataType: 'json',
	}, function(err, response) {
		if (err) return cb(err);

		return cb((response.status === 'ok') ? null : 'Unbekannter sclive-Fehler');
	});
}

function list_matches(s, cb, all_players) {
	var options = {
		url: baseurl + 'ticker/manage/bup/list?id=' + tm_id + (all_players ? '&all=true' : ''),
		dataType: 'json',
	};
	_request(s, 'jticker.list', options, function(err, event) {
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

		event.team_names = event.team_names.map(_unify_teamname);
		if (!event.league_key) {
			event.league_key = /2/.test(event.team_names[0]) ? '2BLN-2020' : '1BL-2020';
		}

		event.matches.forEach(function(m) {
			var setup = m.setup;
			var short_name = {
				'1. Herrendoppel': '1.HD',
				'2. Herrendoppel': '2.HD',
				'Damendoppel': 'DD',
				'Dameneinzel': 'DE',
				'1. Herreneinzel': '1.HE',
				'2. Herreneinzel': '2.HE',
				'3. Herreneinzel': '3.HE',
				'Gemischtes Doppel': 'GD',
			}[setup.match_name];
			if (short_name) {
				setup.match_name = short_name;
			}
			setup.incomplete = eventutils.is_incomplete(setup);
		});
		eventutils.annotate(s, event);

		cb(err, event);
	});
}

/* Paramter (unused:) s */
function ui_init() {
	if (!baseurl) {
		baseurl = '../../../';
	}

	var m = window.location.pathname.match(/^(\/(?:.+\/)?)static\/bup\/[0-9.a-z]+\/(?:index\.html|bup\.html)?$/);
	if (m) {
		baseurl = m[1];
	}
}

/* Parameter: s */
function service_name() {
	return 'jticker';
}

/* Parameter: s */
function editable() {
	return true;
}

return {
	ui_init: ui_init,
	list_matches: list_matches,
	list_all_players: list_all_players,
	on_edit_event: on_edit_event,
	send_press: send_press,
	sync: sync,
	courts: courts,
	service_name: service_name,
	editable: editable,
	aw_proxy: 1,
};

}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var utils = require('./utils');

	module.exports = jticker;
}
/*/@DEV*/