'use strict';
var checkevent = (function() {

/*
var EU_COUNTRIES = [
	'AUT',
	'BEL',
	'BGR',
	'CYP',
	'CZE',
	'DEU',
	'DNK',
	'ESP',
	'EST',
	'FIN',
	'FRA',
	'GBR',
	'GRC',
	'HRV',
	'HUN',
	'IRL',
	'ITA',
	'LTU',
	'LUX',
	'LVA',
	'MLT',
	'NLD',
	'POL',
	'PRT',
	'ROU',
	'SVK',
	'SVN',
	'SWE',
];*/

function check_team(/*s, ev, team_id*/) {
	// Empty for now (umpires may not need to check this after all)
}

return {
	check_team: check_team,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = checkevent;
}
/*/@DEV*/
