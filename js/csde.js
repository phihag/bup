'use strict';
function csde(mid, baseurl) {

function _request(s, component, options, cb) {
	options.timeout = s.settings.network_timeout;
	network.$request(component, options).done(function(res) {
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

function courts(/*/ s /*/) {
	return null;
}

function sync() {
	// Read-only
}

function send_press() {
	// Read-only
}

var TEAM_NAMES = {
	'1-1': '1.BC Sbr.-Bischmisheim',
	'1-2': 'SC Union Lüdinghausen',
	'1-3': 'TV Refrath',
	'1-4': '1.BV Mülheim',
	'1-5': '1.BC Beuel',
	'1-6': '1.BC Wipperfeld',
	'1-7': 'TSV Trittau',
	'1-8': 'TSV Neuhausen-Nymphenburg',
	'1-9': 'TSV 1906 Freystadt',
	'1-10': 'SV Fun-Ball Dortelweil',
	'2-11': 'Blau-Weiss Wittorf-NMS',
	'2-12': 'TV Refrath 2',
	'2-13': 'SG EBT Berlin',
	'2-14': 'STC Blau-Weiss Solingen',
	'2-15': 'TSV Trittau 2',
	'2-16': '1.BV Mülheim 2',
	'2-17': '1.BC Beuel 2',
	'2-18': 'BC Hohenlimburg',
	'2-19': 'Hamburg Horner TV',
	'2-20': 'VfB/SC Peine',
	'3-21': 'TuS Wiebelskirchen',
	'3-22': '1.BC Sbr.-Bischmisheim 2',
	'3-23': 'TSV Neubiberg/Ottobrunn 1920',
	'3-24': 'TV Dillingen',
	'3-25': 'VfB Friedrichshafen',
	'3-26': 'SG Schorndorf',
	'3-27': 'BSpfr. Neusatz',
	'3-28': 'TV 1884 Marktheidenfeld',
	'3-29': 'SV GutsMuths Jena',
	'3-30': 'SV Fischbach',
	'4-1': 'SG EBT Berlin 2',
	'4-2': 'BV Gifhorn 1',
	'4-3': 'SG Luckau/Blankenfelde 1',
	'4-4': 'SG Vechelde/Lengede 1',
	'4-5': 'BW Wittorf Neumünster 2',
	'4-6': 'BC Eintracht Südring Berlin 1',
	'4-7': 'SG FTV/HSV/VfL 93 Hamburg 1',
	'4-8': 'SV Berliner Brauereien 1',
	'5-1': 'STC BW Solingen 2',
	'5-89': '1.CfB Köln 1',
	'5-211': 'BV RW Wesel 1',
	'5-505': 'Gladbecker FC 1',
	'5-682': 'Bottroper BG 1',
	'5-715': 'Spvgg.Sterkrade-N. 1',
	'5-810': 'BC Hohenlimburg 2',
	'5-1477': 'BC Phönix Hövelhof 1',
	'6-2': 'SC Union Lüdinghausen',
	'6-7': 'TSV Trittau',
	'7-3': 'TV Refrath',
	'7-4': '1.BV Mülheim',
	'8-9': 'TSV 1906 Freystadt',
	'8-11': 'Blau-Weiss Wittorf-NMS',
	'8-28': 'TV 1884 Marktheidenfeld',
};

var LEAGUE_IDS = {
	1: '1BL-2017',
	2: '2BLN-2017',
	3: '2BLS-2017',
	4: 'RLN-2016',
	5: 'RLW-2016',
	6: '1BL-2017',
	7: '1BL-2017',
	8: '1BL-2017',
	9: '1BL-2017',
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
				is_doubles: is_doubles,
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
	var m = /^([0-9]+)-([0-9]+)-([0-9]+)$/.exec(mid);
	if (!m) {
		return cb({
			msg: 'Nicht unterstützter Wettkampf ' + JSON.stringify(mid),
		});
	}

	var league_num = m[1];
	var options = {
		url: baseurl + 'php__Skripte/liveabfrage.php?l=' + league_num + '&v=' + m[2] + '&g=' + m[3] + '&n=99999&s=99999',
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
		event.league_key = LEAGUE_IDS[league_num];
		event.team_names = [
			TEAM_NAMES[league_num + '-' + m[2]],
			TEAM_NAMES[league_num + '-' + m[3]],
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

	var m = window.location.pathname.match(/^(.*?\/)(?:bup\/)?bup(?:\/(?:bup\.html)?)?$/);
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
	var eventutils = require('./eventutils');
	var network = require('./network');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = csde;
}
/*/@DEV*/