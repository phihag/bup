'use strict';
// Data that may not be present in the event spec (but hardcoded here, or downloaded from somewhere else)
var extradata = (function() {

var ABBREVS = {
	'TV Refrath': 'TVR',
	'SC Union Lüdinghausen': 'SCU',
	'1.BV Mülheim': 'BVM',
	'BV Mülheim': 'BVM',
	'BC Hohenlimburg': 'BCH',
	'STC Blau-Weiss Solingen': 'STC',
	'SG Ddorf-Unterrath': 'SGU',
};
var TEAM_COLORS = {
	'Refrath': '#8bd6ff',
	'Trittau': '#fd77b2',
	'Bischmisheim': '#1e3a8e',
	'Düren': '#c81f1a',
};

function get_color(team_name) {
	for (var keyword in TEAM_COLORS) {
		if (team_name.includes(keyword)) {
			return TEAM_COLORS[keyword];
		}
	}
}

function team2club(team_name) {
	return team_name.replace(/[\s0-9]+$/, '');
}

function calc_abbrev(team_name) {
	var club_name = team2club(team_name);
	if (ABBREVS[club_name]) {
		return ABBREVS[club_name];
	}

	var longest = '';
	team_name.split(/\s+/).forEach(function(part) {
		if (part.length > longest.length) {
			longest = part;
		}
	});
	return longest.substring(0, 3).toUpperCase();
}

function abbrevs(event) {
	if (event.team_abbrevs) {
		return event.team_abbrevs;
	}

	if (! event.team_names) {
		return ['', ''];
	}

	return event.team_names.map(calc_abbrev);
}

function logo_url(event) {
	if (eventutils.is_bundesliga(event.league_key)) {
		return 'div/bundesliga-logo.svg';
	}
}

return {
	abbrevs: abbrevs,
	logo_url: logo_url,
	get_color: get_color,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = extradata;

	var eventutils = require('./eventutils');
}
/*/@DEV*/
