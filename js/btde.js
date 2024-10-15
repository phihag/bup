'use strict';
function btde(baseurl) {

function login(user, password, message_callback) {
	network.$request('btde.logout', {
		url: baseurl + 'login/logout.php',
	}).always(function() {
		network.$request('btde.login', {
			dataType: 'text',
			url: baseurl + 'login/index.php',
			method: 'POST',
			data: utils.urlencode({
				benutzername: user,
				passwort: password,
			}),
			contentType: 'application/x-www-form-urlencoded',
			timeout: state.settings.network_timeout,
		}).done(function(res) {
			var m = /<form[^>]*>\s*<p class="fehler">([^<]*)</.exec(res);
			var msg = 'Login fehlgeschlagen';
			if (m) {
				msg = m[1];
			} else if (/<div class="logout">/.exec(res)) {
				// Successful
				message_callback();
				return;
			}

			message_callback(msg);
		}).fail(function(xhr) {
			message_callback('Login fehlgeschlagen (Fehler ' + xhr.status + ')');
		});
	});
}

function _request(s, component, options, cb) {
	var netstats_cb = netstats.pre_request(component);
	var xhr = new XMLHttpRequest();
	xhr.open(options.method || 'GET', options.url, true);
	if (options.contentType) {
		xhr.setRequestHeader('Content-Type', options.contentType);
	}
	xhr.timeout = s.settings.network_timeout;
	xhr.onreadystatechange = function() {
		if (xhr.readyState !== 4) return;

		netstats_cb(xhr);
		if (xhr.status == 200) {
			var res = xhr.responseText;
			if (/<button>anmelden<\/button>/.exec(res)) {
				return cb({
					type: 'login-required',
					msg: 'Login erforderlich',
				}, res);
			}
			return cb(null, res);
		} else {
			var msg = ((xhr.status === 0) ?
				'badmintonticker nicht erreichbar' :
				('Netzwerk-Fehler (Code ' + xhr.status + ')')
			);
			return cb({
				type: 'network-error',
				status: xhr.status,
				msg: msg,
			});
		}
	};
	if (options.data) {
		xhr.send(options.data);
	} else {
		xhr.send();
	}
}

function _calc_send_data(s, netscore) {
	// badminticker requirements - show 0:0 before match start
	if (netscore.length === 0) {
		netscore = [[0, 0]];
	}

	var post_data = {
		id: s.setup.btde_match_id,
		court: s.settings.court_id,
	};
	post_data.course = netscore.map(function(score) {
		return [(score[0] || '0') + ':' + (score[1] || '0')];
	});
	return post_data;
}

var outstanding_requests = 0;
function send_score(s) {
	if (s.settings.court_id === 'referee') {
		network.errstate('btde.score', null);
		return;
	}

	var netscore = calc.netscore(s, true);
	var data = JSON.stringify(_calc_send_data(s, netscore));
	if (outstanding_requests > 0) {
		// Another request is currently underway; ours may come to late
		// Send our request anyways, but send it once again as soon as there are no more open requests
		s.remote.btde_resend = true;
	}
	outstanding_requests++;
	var match_id = s.metadata.id;

	_request(s, 'btde.score', {
		method: 'POST',
		url: baseurl + 'login/count.php',
		data: data,
		contentType: 'application/json; charset=utf-8',
	}, function(err) {
		outstanding_requests--;
		if (!s.metadata || (s.metadata.id !== match_id)) { // Match changed while the request was underway
			return;
		}

		if (!err) {
			s.remote.btde_score = netscore;
			s.remote.btde_court = s.settings.court_id;
		}
		network.errstate('btde.score', err);

		if (s.remote.btde_resend && outstanding_requests === 0) {
			s.remote.btde_resend = false;
			send_score(s);
		}
	});
}

function sync(s) {
	var netscore = calc.netscore(s, true);
	if ((s.settings.court_id != s.remote.btde_court) || !utils.deep_equal(netscore, s.remote.btde_score)) {
		send_score(s);
	}
}

/* s, press */
function send_press(s) {
	if (!s.setup.btde_match_id) {
		// Manual match while badmintonticker is active
		return;
	}
	sync(s);
}

function _parse_player(s) {
	var m = /^([^,]+),\s*([^,]+)$/.exec(s);

	if (m) {
		return {
			firstname: m[2],
			lastname: m[1],
			name: m[2] + ' ' + m[1],
		};
	} else {
		m = /^(\S+)\s(\S+)$/.exec(s);
		if (m) {
			return {
				firstname: m[1],
				lastname: m[2],
				name: m[1] + ' ' + m[2],
			};
		} else {
			return {
				name: s,
			};
		}
	}
}

function _parse_players(s) {
	var m = /^([^~/]*)(?:[~/](.*))?$/.exec(s);
	var res = [];

	if (m) {
		if (m[1]) {
			res.push(_parse_player(m[1]));
		}
		if (m[2]) {
			res.push(_parse_player(m[2]));
		}
	}
	return res;
}

function _get_league_key(liga_code) {
	return {
		'(001) 1. Bundesliga': '1BL-2020',
		'(002) 2. Bundesliga Nord': '2BLN-2020',
		'(003) 2. Bundesliga Süd': '2BLS-2020',
		'(001) Regionalliga SüdOst Ost': 'RLSOO-2017',
		'(001) Regionalliga West': 'RLW-2016',
		'(001) Regionalliga SüdOst': 'RLSO-2019',
		'(001) Regionalliga Nord': 'RLN-2016',
		'Regionalliga Nord': 'RLN-2016',
		'(007) Verbandsliga Süd 2': 'NRW-O19-S2-VL-007-2016',
		'(008) Landesliga Nord 1': 'NRW-O19-N1-LL-008-2016',
		'(015) Landesliga Süd 2': 'NRW-O19-S2-LL-015-2016',
		'NLA': 'NLA-2019',
		'NLB': 'NLA-2019',
		'NLB Ost': 'NLA-2019',
		'NLB West': 'NLA-2019',
		'1. Bundesliga': 'OBL-2024',
		'2. Bundesliga': 'OBL-2024',
	}[liga_code.trim()];
}

function _get_counting(league_key, event_data) {
	if (league_key) {
		var league_counting = eventutils.default_counting(league_key);
		if (league_counting) {
			return league_counting;
		}
	}
	return (event_data.gews == 2) ? '3x21' : '5x11_15^90';
}

function _parse_event(s, doc, now) {
	var event_data = doc;
	var home_team_name = event_data.home;
	var away_team_name = event_data.guest;

	var starttime;
	var date;
	var starttime_m;
	if (event_data.datetime && (starttime_m = /^([0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4})\s+([0-9]{1,2}:[0-9]{1,2})$/.exec(event_data.datetime))) {
		date = starttime_m[1];
		starttime = starttime_m[2];
	}

	var counting;
	var league_key;
	var team_competition = true;
	if (event_data.league === 'Turnier') {
		counting = '3x21';
		team_competition = false;
	} else {
		if (event_data.league) {
			league_key = _get_league_key(event_data.league);
			if (!league_key) {
				report_problem.silent_error('Cannot associate btde league name ' + JSON.stringify(event_data.league));
			}
		} else {
			// No league key, guess
			report_problem.silent_error('btde: league key missing');
			league_key = (doc.fixtures.length === 8) ? 'RLW-2016' : '1BL-2020';
		}
		counting = _get_counting(league_key, event_data);
		// Fallback: if everything goes wrong, go for 1BL
		if (! league_key && (counting == '5x11_15^90')) {
			league_key = '1BL-2020';
		}
	}

	var used_courts = courts_by_event(s, {team_competition: team_competition}, false);
	var matches = doc.fixtures.map(function(match) {
		var is_doubles = /HD|DD|GD/.test(match.dis);
		var teams = [{
			players: _parse_players(match.home),
		}, {
			players: _parse_players(match.guest),
		}];

		// btde always lists the woman first, but all other materials
		// (including bup algorithms) list the man first.
		// Switch them around
		if (match.dis === 'GD') {
			teams.forEach(function(team) {
				if (team.players.length === 2) {
					team.players = [team.players[1], team.players[0]];
				}
			});
		}

		var network_score = [];
		match.course.forEach(function(lst) {
			if (!lst.length) return;
			var last = lst[lst.length - 1];
			if (!last) return;
			var game_score = last.split(':').map(function(num) {return parseInt(num);});
			network_score.push(game_score);
		});

		var match_id = 'btde_' + utils.iso8601(now) + '_' + match.dis + '_' + home_team_name + '-' + away_team_name;
		if (match.court) {
			var on_court = utils.find(used_courts, function(c) {
				return c.court_id == match.court;
			});
			if (on_court) {
				on_court.match_id = match_id;
			}
		}

		var m = /^(.+?)\s*([0-9]+)$/.exec(match.dis);
		var eventsheet_id = match.dis;
		if (m) {
			eventsheet_id = m[2] + '.' + m[1];
		}

		var setup = {
			counting: counting,
			eventsheet_id: eventsheet_id,
			match_name: match.dis,
			is_doubles: is_doubles,
			teams: teams,
			btde_match_id: match.id,
			match_id: match_id,
		};
		setup.incomplete = eventutils.is_incomplete(setup);

		return {
			setup: setup,
			network_score: network_score,
		};
	});

	var location = event_data.venue;

	var report_urls = [];
	if (event_data.url && /^http/.test(event_data.url)) {
		report_urls.push(event_data.url);
	}
	// Handle invalid location
	if (/^http/.test(location)) {
		report_urls.push(location);
		location = '';
	}

	var matchday_m = /([0-9]+)\.\s*Spieltag/.exec(event_data.matchday);
	var matchday = matchday_m ? matchday_m[1]: event_data.matchday;

	return {
		starttime: starttime,
		date: date,
		team_competition: team_competition,
		team_names: [home_team_name, away_team_name],
		matches: matches,
		courts: used_courts,
		league_key: league_key,
		location: location,
		matchday: matchday,
		report_urls: report_urls,
	};
}

function list_matches(s, cb) {
	_request(s, 'btde.list', {
		url: baseurl + 'login/count.php?id=all',
	}, function(err, json) {
		if (err) {
			return cb(err);
		}

		var doc;
		try {
			doc = JSON.parse(json);
		} catch (e) {
			return cb({
				msg: 'badmintonticker-Aktualisierung fehlgeschlagen: Server-Fehler erkannt',
			});
		}
		var ev = _parse_event(s, doc, new Date());
		eventutils.annotate(state, ev);
		return cb(null, ev);
	});
}

function fetch_courts(s, callback) {
	list_matches(s, function(err, event) {
		if (err) return callback(err);

		var courts = courts_by_event(s, event, true);
		s.btde_courts = courts;
		return callback(err, courts);
	});
}

function courts(s) {
	return s.btde_courts;
}

function courts_by_event(s, event, include_referee) {
	var res;
	if (event && !event.team_competition) {
		res = [{
			court_id: '1',
			label: '1',
		}, {
			court_id: '2',
			label: '2',
		}, {
			court_id: '3',
			label: '3',
		}, {
			court_id: '4',
			label: '4',
		}, {
			court_id: '5',
			label: '5',
		}, {
			court_id: '6',
			label: '6',
		}];
	} else {
		res = [{
			court_id: '1',
			description: s._('court:left'),
		}, {
			court_id: '2',
			description: s._('court:right'),
		}];
	}

	if (include_referee) {
		res.push({
			court_id: 'referee',
			description: s._('court:referee'),
		});
	}

	return res;
}

function ui_init() {
	/* work around blocks for punkte.php
	var meta = document.createElement('meta');
	meta.name = 'referrer';
	meta.content = 'no-referrer';
	document.getElementsByTagName('head')[0].appendChild(meta);
	*/

	if (!baseurl) {
		baseurl = '/';
	}
}

function service_name() {
	return 'badmintonticker';
}

/* Paramter: s */
function editable() {
	return true;
}

function calc_btde_player_name(p) {
	var m = /^(.+)\s(.+)$/.exec(p.name);
	if (m) {
		return m[2] + ', ' + m[1];
	} else {
		return p.name;
	}
}

function calc_setup_data(event) {
	var res = {};
	event.matches.forEach(function(match, match_idx) {
		['Heim', 'Gast'].forEach(function(team_id, team_idx) {
			var players = match.setup.teams[team_idx].players;
			var pnames = players.map(calc_btde_player_name);

			if ((match.setup.match_name === 'GD') && (pnames.length === 2)) {
				// Switch around genders for btde
				pnames = [pnames[1], pnames[0]];
			}

			if (match.setup.is_doubles) {
				res[team_id + '_' + (match_idx + 1) + '_d'] = (pnames.length >= 1) ? pnames[0] : '';
				res[team_id + '_' + (match_idx + 1) + '_p'] = (pnames.length == 2) ? pnames[1] : '';
			} else {
				res[team_id + '_' + (match_idx + 1)] = (pnames.length === 1) ? pnames[0] : '';
			}
		});
	});
	return res;
}

function on_edit_event(s, cb) {
	var data = calc_setup_data(s.event);
	_request(s, 'btde.changeevent', {
		url: baseurl + 'login/start.php',
		data: utils.urlencode(data),
		contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		method: 'post',
	}, function(err) {
		if (err) {
			return cb(err);
		}

		return cb(null);
	});
}

function parse_key_players(html, key, gender) {
	var options_m = new RegExp(
		'<datalist\\s+id="' + key + '">\\s*' +
		'<select\\s+class="none">\\s*' +
		'((?:<option>[^<]*</option>)*)' +
		'\\s*</select>'
	).exec(html);
	if (!options_m) {
		return [];
	}

	var names_m = utils.match_all(/<option>([^<]+)<\/option>/g, options_m[1]);
	return names_m.map(function(m) {
		var p = _parse_player(m[1]);
		p.gender = gender;
		return p;
	});
}

function list_all_players(s, cb) {
	_request(s, 'btde.list_all_players', {
		url: baseurl + 'login/start.php',
	}, function(err, html) {
		if (err) {
			return cb(err);
		}

		var all_players = [
			parse_key_players(html, 'heimM', 'm').concat(
				parse_key_players(html, 'heimF', 'f')),
			parse_key_players(html, 'gastM', 'm').concat(
				parse_key_players(html, 'gastF', 'f'))];
		return cb(null, all_players);
	});

}

return {
	ui_init: ui_init,
	login: login,
	send_press: send_press,
	list_matches: list_matches,
	sync: sync,
	courts: courts,
	fetch_courts: fetch_courts,
	service_name: service_name,
	editable: editable,
	on_edit_event: on_edit_event,
	list_all_players: list_all_players,
	aw_proxy: 1,
	// Testing only
	/*@DEV*/
	_get_counting: _get_counting,
	_get_league_key: _get_league_key,
	_parse_event: _parse_event,
	_calc_send_data: _calc_send_data,
	/*/@DEV*/
};

}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var eventutils = require('./eventutils');
	var netstats = require('./netstats');
	var network = require('./network');
	var report_problem = require('./report_problem');
	var utils = require('./utils');

	module.exports = btde;
}
/*/@DEV*/
