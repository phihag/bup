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
	'Beuel': '#ffed00',
	'Bischmisheim': '#1e3a8e',
	'BV Mülheim': '#ff423f',
	'BW Solingen': '#cbff81', // STC BW Solingen
	'Dortelweil': '#f9f152',
	'EBT Berlin': '#0d9aff',
	'Freystadt': '#ff161d',
	'Hohenlimburg': '#0ebbff',
	'Horner': '#ff2222', // Hamburg Horner TV
	'Lüdinghausen': '#ffffff',
	'Neuhausen': '#02c0ff',
	'Refrath': '#8bd6ff',
	'Trittau': '#ff557a',
	'Wipperfeld': '#ff2149',
	'Wittorf': '#0091ff',
};
var LOGOS = [
	'bcbeuel',
	'bcbsaarbruecken',
	'bcwipperfeld',
	'bvgifhorn',
	'bvmuelheim',
	'ebtberlin',
	'svfunballdortelweil',
	'sganspach',
	'sgschorndorf',
	'stcblauweisssolingen',
	'tsvfreystadt',
	'tsvneubibergottobrunn',
	'tsvneuhausen',
	'tsvtrittau',
	'tuswiebelskirchen',
	'tvdillingen',
	'tvemsdetten',
	'tvrefrath',
	'unionluedinghausen',
	'vfbfriedrichshafen',
	'wittorfneumuenster',
];
var LOGO_ALIASSE = {
	'TSV Neuhausen-Nymphenburg': 'tsvneuhausen',
	'1.BV Mülheim': 'bvmuelheim',
	'1.BC Sbr.-Bischmisheim': 'bcbsaarbruecken',
	'SC Union Lüdinghausen': 'unionluedinghausen',
};

function get_color(team_name) {
	for (var keyword in TEAM_COLORS) {
		if (team_name.includes(keyword)) {
			return TEAM_COLORS[keyword];
		}
	}
}

function team_logo(team_name) {
	if (LOGO_ALIASSE[team_name]) {
		team_name = LOGO_ALIASSE[team_name];
	}

	var clean_name = team_name.toLowerCase().replace(/[^a-z]/g, '');
	if (LOGOS.includes(clean_name)) {
		return 'div/logos/' + clean_name + '.svg';
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

// Returns an array if at least one logo is present
function team_logos(event) {
	if (event.team_names) {
		var logo_urls = event.team_names.map(team_logo);
		if (utils.any(logo_urls)) {
			return logo_urls;
		}
	}
	// return undefined
}

function logo_url(event) {
	if (eventutils.is_bundesliga(event.league_key)) {
		return 'div/bundesliga-logo.svg';
	}
}

return {
	abbrevs: abbrevs,
	logo_url: logo_url, // Of an event
	get_color: get_color,
	team_logos: team_logos,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = extradata;

	var eventutils = require('./eventutils');
	var utils = require('./utils');
}
/*/@DEV*/
