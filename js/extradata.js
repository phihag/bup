'use strict';
// Data that may not be present in the event spec (but hardcoded here, or downloaded from somewhere else)
var extradata = (function() {

var ABBREVS = {
	'TV Refrath': 'TVR',
	'SC Union Lüdinghausen': 'SCU',
	'1.BV Mülheim': 'BVM',
	'BV Mülheim': 'BVM',
	'BC Hohenlimburg': 'BCH',
};


function calc_abbrev(team_name) {
	var atn = team_name.replace(/[\s0-9]+$/, '');
	if (ABBREVS[atn]) {
		return ABBREVS[atn];
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

return {
	abbrevs: abbrevs,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = extradata;
}
/*/@DEV*/
