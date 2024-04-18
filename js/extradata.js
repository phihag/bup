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
	'SG Lengede/Vechelde': 'L/V',
};
var TEAM_COLORS = {
	'Beuel': {fg: '#ffed00'},
	'Bischmisheim': {fg: '#0077d3'},
	'BV Mülheim': {fg: '#ee0000'},
	'GW Mülheim': {fg: '#56cf6a'},
	'Solingen': {fg: '#b6bf57'}, // STC BW Solingen
	'Dortelweil': {fg: '#f55a44'},
	'EBT Berlin': {fg: '#0d9aff'},
	'Friedrichsdorf': {bg: '#008131', fg: '#ffffff'},
	'Freystadt': {fg: '#ff161d'},
	'Gladbecker FC': {fg: '#ea3f3d', bg: '#052844'},
	'Hofheim': {fg: '#82dcff'},
	'Hohenlimburg': {fg: '#0ebbff'},
	'Horner': {fg: '#ff2222'}, // Hamburg Horner TV
	'Hövelhof': {fg: '#ff0000'},
	'CfB Köln': {fg: '#ddc75a', bg: '#000000'},
	'Lüdinghausen': {fg: '#ff0000'},
	'Neuhausen': {fg: '#ff6600'},
	'Refrath': {fg: '#ffffff', bg: '#000b18'},
	'Remagen': {fg: '#ffffff', bg: '#0f1731'},
	'Sterkrade': {fg: '#ffffff'},
	'Trittau': {fg: '#9dc2fc'},
	'Geretsried': {fg: '#f0f0f0'},
	'Offenburg': {fg: '#d6172b'},
	'Vechelde': {fd: '#00ff00', bg: '#132650'},
	'Wesel': {fg: '#ed1a24'},
	'Wipperfeld': {fg: '#ff2d2d'},
	'Wittorf': {fg: '#0091ff'},
	'WG Duisburg-Essen': {fg: '#ffffff'},
	'WG Karlsruhe': {fg: '#80ff8a'},
	'WG Köln': {fg: '#5C8DD2'},
	'Peine': {fg: '#ffffff', bg: '#640809'},
	'Uni Bayreuth': {fg: '#ffffff'},
};

function get_color(team_name) {
	for (var keyword in TEAM_COLORS) {
		if (team_name.includes(keyword)) {
			var res = TEAM_COLORS[keyword];
			if (!res.bg) {
				res.bg = '#000000';
			}
			return res;
		}
	}
}


var LOGOS = [
	'bcbeuel',
	'bcbsaarbruecken',
	'bchohenlimburg',
	'bcoffenburg',
	'bcremagen',
	'bcwipperfeld',
	'berlinerbrauereien',
	'bspfrneusatz',
	'bsveggensteinleopoldshafen',
	'bvgifhorn',
	'bvmaintal',
	'bvmuelheim',
	'bvrwwesel',
	'cfbkoeln',
	'djkteutsttnis',
	'ebtberlin',
	'fclangenfeld',
	'hamburghornertv',
	'harkenbleck',
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
	'tusschwanheim',
	'tuswiebelskirchen',
	'tvdillingen',
	'tvemsdetten',
	'tvhofheim',
	'tvmarktheidenfeld',
	'tvrefrath',
	'unionluedinghausen',
	'vfbfriedrichshafen',
	'vfbscpeine',
	'vfbgwmuelheim',
	'wittorfneumuenster',
];
var LOGO_ALIASSE = {
	'1. BC Sbr.-Bischmisheim': 'bcbsaarbruecken',
	'1.BC Sbr.-Bischmisheim': 'bcbsaarbruecken',
	'1.BV Mülheim': 'bvmuelheim',
	'1.CfB Köln': 'cfbkoeln',
	'1. CfB Köln': 'cfbkoeln',
	'BC Bischmisheim': 'bcbsaarbruecken',
	'Blau-Weiss Wittorf-NMS': 'wittorfneumuenster',
	'Blau-Weiss Wittorf': 'wittorfneumuenster',
	'Blau-Weiss Wittorf NMS': 'wittorfneumuenster',
	'SC Union Lüdinghausen': 'unionluedinghausen',
	'SV Harkenbleck': 'harkenbleck',
	'SC Union 08 Lüdinghausen': 'unionluedinghausen',
	'SG VfB/SC Peine': 'vfbscpeine',
	'Spvgg.Sterkrade-N.': 'sterkrade',
	'STC BW Solingen': 'stcblauweisssolingen',
	'SV Berliner Brauereien': 'berlinerbrauereien',
	'TSV Neuhausen-Nymphenburg': 'tsvneuhausen',
	'VfB GW Mülheim': 'vfbgwmuelheim',
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
