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
	'Beuel': {fg: '#ffed00'},
	'Bischmisheim': {fg: '#0077d3'},
	'BV Mülheim': {fg: '#ff423f'},
	'Solingen': {fg: '#89deff'}, // STC BW Solingen
	'Dortelweil': {fg: '#f55a44'},
	'EBT Berlin': {fg: '#0d9aff'},
	'Freystadt': {fg: '#ff161d'},
	'Hohenlimburg': {fg: '#0ebbff'},
	'Horner': {fg: '#ff2222'}, // Hamburg Horner TV
	'Lüdinghausen': {fg: '#cb232a'},
	'Neuhausen': {fg: '#a6cb8b'},
	'Refrath': {fg: '#ffffff', bg: '#000b18'},
	'Sterkrade': {fg: '#fefa42'},
	'Trittau': {fg: '#9dc2fc'},
	'Geretsried': {fg: '#f0f0f0'},
	'Wesel': {fg: '#ed1a24'},
	'Wipperfeld': {fg: '#ff2149'},
	'Wittorf': {fg: '#0091ff'},
	'WG Duisburg-Essen': {fg: '#ffffff'},
	'WG Karlsruhe': {fg: '#80ff8a'},
	'WG Köln': {fg: '#5C8DD2'},
	'Peine': {fg: '#ff4444'},
	'Uni Bayreuth': {fg: '#ffffff'},
};

function get_color(team_name) {
	for (var keyword in TEAM_COLORS) {
		if (team_name.includes(keyword)) {
			return TEAM_COLORS[keyword];
		}
	}
}


var LOGOS = [
	'bcbeuel',
	'bcbsaarbruecken',
	'bchohenlimburg',
	'bcwipperfeld',
	'bspfrneusatz',
	'bvgifhorn',
	'bvmuelheim',
	'bvrwwesel',
	'ebtberlin',
	'hamburghornertv',
	'sganspach',
	'sgebtberlin',
	'sgschorndorf',
	'stcblauweisssolingen',
	'sterkrade',
	'svfischbach',
	'svfunballdortelweil',
	'svgutsmuthsjena',
	'tsvfreystadt',
	'tsvneubibergottobrunn',
	'tsvneuhausen',
	'tsvtrittau',
	'tusgeretsried',
	'tuswiebelskirchen',
	'tvdillingen',
	'tvhofheim',
	'tvemsdetten',
	'tvmarktheidenfeld',
	'tvrefrath',
	'unionluedinghausen',
	'vfbfriedrichshafen',
	'vfbscpeine',
	'wittorfneumuenster',
];
var LOGO_ALIASSE = {
	'1. BC Sbr.-Bischmisheim': 'bcbsaarbruecken',
	'1.BC Sbr.-Bischmisheim': 'bcbsaarbruecken',
	'1.BV Mülheim': 'bvmuelheim',
	'BC Bischmisheim': 'bcbsaarbruecken',
	'Blau-Weiss Wittorf-NMS': 'wittorfneumuenster',
	'SC Union Lüdinghausen': 'unionluedinghausen',
	'SG VfB/SC Peine': 'vfbscpeine',
	'Spvgg.Sterkrade-N.': 'sterkrade',
	'STC BW Solingen': 'stcblauweisssolingen',
	'TSV Neuhausen-Nymphenburg': 'tsvneuhausen',
	'Union Lüdinghausen': 'unionluedinghausen',
};
function team_logo(team_name) {
	team_name = LOGO_ALIASSE[team2club(team_name)] || team_name;

	var clean_name = team_name.toLowerCase().replace(/[^a-z]/g, '');
	if (utils.includes(LOGOS, clean_name)) {
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

	/*@DEV*/
	// Testing only
	team_logo: team_logo,
	/*/@DEV*/
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = extradata;

	var eventutils = require('./eventutils');
	var utils = require('./utils');
}
/*/@DEV*/
