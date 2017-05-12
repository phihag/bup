'use strict';
function csde(mid, baseurl) {

function _request(s, component, options, cb) {
	options.timeout = s.settings.network_timeout;
	network.request(component, options).done(function(res) {
		return cb(null, res);
	}).fail(function(xhr) {
		var msg = 'Netzwerk-Fehler (Code ' + xhr.status + ')';
		if (xhr.status === 0) {
			msg = 'CourtSpot.de nicht erreichbar';
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
	return null;
}

function sync() {
	// Read-only
}

function send_press() {
	// Read-only
}

var TEAM_NAMES = {
	2: '1. BC Bischmisheim',
	3: '1. BC Düren',
	9: 'TV Refrath',
	10: 'TSV Trittau',
	14: 'TV Refrath 2',
	13: 'BV Gifhorn',
};

function parse_court(cspec, court_id, matches) {
	var res = {
		court_id: court_id,
	};

	var match_name = cspec.substr(3);
	if (!match_name) {
		return res;
	}

	var match = utils.find(matches, function(m) {
		return m.setup.match_name === match_name;
	});
	if (match) {
		res.match_id = match.setup.match_id;
	}

	var rspec = cspec.substr(0, 3);
	if (match && (rspec !== 'aus')) {
		var server_char = rspec.substr(2);
		if ((server_char === 'a') || (server_char == 'b')) {
			match.network_team1_serving = true;
		} else if ((server_char === 'c') || (server_char == 'd')) {
			match.network_team1_serving = false;
		}
	}
	return res;
}

function parse_csde_xml(doc) {
	if (doc.getElementsByTagName('STATUS')[0].textContent != 'an') {
		return {
			status: 'noshow',
		};
	}

	var matches = [];
	uiu.qsEach('NAMEN Name', function(el) {
		var match_name = el.querySelector('Art').textContent;
		var is_doubles = /DD|HD|GD/.test(match_name);
		var teams = [
			{players: []},
			{players: []},
		];

		for (var i = 0;;i++) {
			var home_p = el.querySelector('Heimspieler' + (i + 1));
			var away_p = el.querySelector('Gastspieler' + (i + 1));
			if (home_p && away_p) {
				var home_name = home_p.textContent;
				if (home_name) {
					teams[0].players.push({name: home_name});
				}
				var away_name = away_p.textContent;
				if (away_name) {
					teams[1].players.push({name: away_name});
				}
			} else {
				break;
			}
		}

		matches.push({
			setup: {
				match_id: 'csde:' + mid + '_' + match_name,
				match_name: match_name,
				teams: teams,
			},
		});
	}, doc);

	uiu.qsEach('STAENDE Stand', function(stand) {
		var match_name = stand.querySelector('Art').textContent;
		var network_score = [];
		for (var i = 0;;i++) {
			var home_pe = stand.querySelector('HS' + (i + 1));
			var away_pe = stand.querySelector('GS' + (i + 1));
			if (home_pe && away_pe) {
				var home_score = parseInt(home_pe.textContent);
				var away_score = parseInt(away_pe.textContent);
				if ((home_score < 0) || (away_score < 0)) {
					break;
				}
				network_score.push([home_score, away_score]);
			} else {
				break;
			}
		}

		matches.forEach(function(match) {
			if (match.setup.match_name !== match_name) {
				return;
			}
			match.network_score = network_score;
		});
	}, doc);

	var courts = [
		parse_court(doc.querySelector('Court1').textContent, '1', matches),
		parse_court(doc.querySelector('Court2').textContent, '2', matches),
	];
	return {
		matches: matches,
		courts: courts,
	};
}

function list_matches(s, cb) {
	var m = /^([0-9]+)-([0-9]+)$/.exec(mid);
	if (!m) {
		return cb({
			msg: 'Nicht unterstützter Wettkampf ' + JSON.stringify(mid),
		});
	}

	var options = {
		url: baseurl + 'php__Skripte/liveabfrage.php?v=' + m[1] + '&g=' + m[2] + '&n=99999&s=99999',
		dataType: 'xml',
	};
	_request(s, 'csde.list', options, function(err, csde_xml) {
		if (err) {
			return cb(err);
		}

		var event = parse_csde_xml(csde_xml);
		if (event.status === 'noshow') {
			return cb({
				msg: 'Dieses Spiel ist derzeit nicht aktiv',
			});
		}

		// Annotate statically
		event.league_key = '1BL-2016';
		event.team_names = [
			TEAM_NAMES[m[1]],
			TEAM_NAMES[m[2]],
		];

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
	return 'csde';
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
	courts: courts,
	service_name: service_name,
	editable: editable,
};

}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var utils = require('./utils');

	module.exports = csde;
}
/*/@DEV*/