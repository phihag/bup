'use strict';
// miniticker for BV Mülheim

function mt(baseurl) {

function _request(s, component, options, cb) {
	options.dataType = 'text';
	options.timeout = s.settings.network_timeout;
	network.request(component, options).done(function(res) {
		return cb(null, res);
	}).fail(function(xhr) {
		var msg = ((xhr.status === 0) ?
			'miniticker nicht erreichbar' :
			('Netzwerk-Fehler (Code ' + xhr.status + ')')
		);
		return cb({
			type: 'network-error',
			status: xhr.status,
			msg: msg,
		});
	});
}

var outstanding_requests = 0;
function send_score(s) {
	if (s.settings.court_id === 'referee') {
		network.errstate('mt.score', null);
		return;
	}

	var netscore = calc.netscore(s, true);

	var post_data = {
		match_id: s.setup.match_id,
		court_id: s.settings.court_id,
		network_score: netscore,
		presses_json: JSON.stringify(s.presses),
	};

	if (outstanding_requests > 0) {
		// Another request is currently underway; ours may come to late
		// Send our request anyways, but send it once again as soon as there are no more open requests
		s.remote.mt_resend = true;
	}
	outstanding_requests++;
	var match_id = s.metadata.id;

	_request(s, 'mt.score', {
		method: 'POST',
		url: baseurl + 'set_score',
		data: JSON.stringify(post_data),
		contentType: 'application/json; charset=utf-8',
	}, function(err) {
		outstanding_requests--;
		if (!s.metadata || (s.metadata.id !== match_id)) { // Match changed while the request was underway
			return;
		}

		if (!err) {
			s.remote.mt_score = netscore;
			s.remote.mt_court = s.settings.court_id;
		}
		network.errstate('mt.score', err);

		if (s.remote.mt_resend && outstanding_requests === 0) {
			s.remote.mt_resend = false;
			send_score(s);
		}
	});
}

function sync(s) {
	var netscore = calc.netscore(s, true);
	if ((s.settings.court_id != s.remote.mt_court) || !utils.deep_equal(netscore, s.remote.mt_score)) {
		send_score(s);
	}
}

/* s, press */
function send_press(s) {
	if (! /^mt_/.test(s.setup.match_id)) {
		return;
	}
	sync(s);
}

function list_matches(s, cb) {
	_request(s, 'mt.list', {
		url: baseurl + 'get_event',
	}, function(err, json) {
		if (err) {
			return cb(err);
		}

		var ev;
		try {
			ev = JSON.parse(json);
		} catch (e) {
			return cb({
				msg: 'miniticker-Aktualisierung fehlgeschlagen: Server-Fehler erkannt',
			});
		}
		eventutils.annotate(state, ev);
		eventutils.set_incomplete(ev);

		return cb(null, ev);
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

function ui_init() {
	if (!baseurl) {
		baseurl = '../';
	}
	var m = window.location.pathname.match(/^(.*\/)bup\/(?:bup\.html|index\.html)?$/);
	if (m) {
		baseurl = m[1];
	}
}

function service_name() {
	return 'miniticker';
}

/* Paramter: s */
function editable() {
	return true;
}

function on_edit_event(s, cb) {
	var teams_by_match = {};
	s.event.matches.forEach(function(m) {
		teams_by_match[m.setup.match_id] = m.setup.teams;
	});

	var data = {
		teams_by_match: teams_by_match,
		backup_players: s.event.backup_players,
		present_players: s.event.present_players,
	};
	_request(s, 'mt.set_players', {
		url: baseurl + 'set_players',
		data: {json: JSON.stringify(data)},
		method: 'post',
	}, function(err) {
		if (err) {
			return cb(err);
		}

		return cb(null);
	});
}

function list_all_players(s, cb) {
	_request(s, 'mt.list_all_players', {
		url: baseurl + 'get_event',
	}, function(err, json) {
		if (err) {
			return cb(err);
		}

		var ev;
		try {
			ev = JSON.parse(json);
		} catch (e) {
			return cb({
				msg: 'miniticker-Aktualisierung fehlgeschlagen: Server-Fehler erkannt',
			});
		}
		return cb(null, ev.all_players);
	});
}

function list_events(s, cb) {
	_request(s, 'mt.list_events', {
		url: baseurl + 'data/cur.json',
	}, function(err, json) {
		if (err) {
			return cb(err);
		}

		var events = JSON.parse(json);
		return cb(null, events);
	});
}

function select_event(s, evdef, cb) {
	evdef.matches = eventutils.make_empty_matches(evdef.league_key, evdef.id);
	evdef.present_players = [[], []];
	evdef.backup_players = [[], []];
	evdef.notes = '';
	evdef.protest = '';
	evdef.team_competition = true;
	evdef.courts = [{
		court_id: '1',
	}, {
		court_id: '2',
	}];
	_request(s, 'mt.select_event', {
		url: baseurl + 'select_event',
		data: {event_json: JSON.stringify(evdef)},
		method: 'POST',
	}, function(err) {
		if (err) {
			return cb(err);
		}

		return cb(null);
	});
}

return {
	ui_init: ui_init,
	send_press: send_press,
	list_matches: list_matches,
	sync: sync,
	courts: courts,
	service_name: service_name,
	editable: editable,
	on_edit_event: on_edit_event,
	list_all_players: list_all_players,
	list_events: list_events,
	select_event: select_event,
};

}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var utils = require('./utils');

	module.exports = mt;
}
/*/@DEV*/
