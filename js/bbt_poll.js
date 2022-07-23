'use strict';
function bbt_poll(team_shortname) {

function _bbt2bup(bbt_event) {
	var event_id = 'bbt-' + bbt_event.team_names[0] + '-' + bbt_event.team_names[1] + '-' + bbt_event.date;
	var res = {
		id: event_id,
		league_key: bbt_event.league_key,
		team_names: bbt_event.team_names,
		date: bbt_event.date,
		starttime: bbt_event.starttime,
		team_competition: bbt_event.team_competition,
		ts: bbt_event.ts,
	};

	if (bbt_event.courts) {
		res.courts = bbt_event.courts.map(function (c) {
			var court = {
				court_id: c.label,
			};
			if (c.match_id) {
				court.match_id = event_id + '-' + c.match_id;
			}
			return court;
		});
	}

	if (bbt_event.matches) {
		res.matches = bbt_event.matches.map(function (m) {
			var match = {
				network_score: m.score,
				setup: {
					match_name: m.name,
					match_id: event_id + '-' + m.name,
					is_doubles: /DD|HD|GD/.test(m.name),
					teams: [{}, {}],
				},
			};
			if (m.serving !== undefined) {
				match.network_team1_serving = m.serving === 0;
			}
			if (m.players) {
				match.setup.teams = m.players.map(function (players) {
					return {
						players: players,
					};
				});
			}
			return match;
		});
	} else {
		res.matches = [];
	}

	return res;

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
		if (xhr.status === 200) {
			var data;
			try {
				data = JSON.parse(xhr.responseText);
			} catch(e) {
				cb(e);
				return;
			}
			cb(null, data);
		} else if (xhr.status === 404) {
			cb({
				type: 'err',
				status: xhr.status,
				message: xhr.responseText,
			});
		} else {
			var msg = ((xhr.status === 0) ?
				'b.aufschlagwechsel.de nicht erreichbar' :
				('Netzwerk-Fehler (Code ' + xhr.status + ')')
			);
			cb({
				type: 'network-error',
				status: xhr.status,
				message: msg,
			});
		}
	};
	if (options.data) {
		xhr.send(options.data);
	} else {
		xhr.send();
	}
}

function ui_init() {}

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

function list_matches(s, cb) {
	_request(s, 'bbt_poll.list', {
		url: '/event?team=' + encodeURIComponent(team_shortname),
	}, function(err, data) {
		if (err) {
			return cb(err);
		}

		var event = _bbt2bup(data);
		eventutils.annotate(s, event);
		return cb(err, event);
	});
}

return {
	editable: function() {return false;},
	list_matches: list_matches,
	courts: courts,
	ui_init: ui_init,
};

}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var netstats = require('./netstats');
	var eventutils = require('./eventutils');

	module.exports = bbt_poll;
}
/*/@DEV*/
