'use strict';

var _ = require('underscore');

var bup = require('../js/bup');

// Trivial runner
var _describe = ((typeof describe == 'undefined') ?
	function(s, f) {f();} :
	describe
);
var _it = ((typeof it == 'undefined') ?
	function(s, f) {f();} :
	it
);


var SINGLES_SETUP = {
	teams: [{
		players: [{name: 'Alice'}],
	}, {
		players: [{name: 'Bob'}],
	}],
	is_doubles: false,
	counting: '3x21'
};
var SINGLES_TEAM_SETUP = _.clone(SINGLES_SETUP);
SINGLES_TEAM_SETUP.teams[0].name = 'A team';
SINGLES_TEAM_SETUP.teams[1].name = 'B team';
SINGLES_TEAM_SETUP.team_competition = true;
var DOUBLES_SETUP = {
	teams: [{
		players: [{name: 'Andrew'}, {name: 'Alice'}],
	}, {
		players: [{name: 'Bob'}, {name: 'Birgit'}],
	}],
	is_doubles: true,
	counting: '3x21'
};
var DOUBLES_TEAM_SETUP = _.clone(DOUBLES_SETUP);
DOUBLES_TEAM_SETUP.teams[0].name = 'A team';
DOUBLES_TEAM_SETUP.teams[1].name = 'B team';
DOUBLES_TEAM_SETUP.team_competition = true;

function state_after(presses, setup) {
	var state = {};
	bup.init_state(state, setup);
	state.presses = presses;
	bup.calc_state(state);
	return state;
}

/**
* Guaranteed to switch in the form left-right-left-right-...
*/
function press_score(presses, left_score, right_score) {
	while ((left_score > 0) || (right_score > 0)) {
		if (left_score > 0) {
			presses.push({
				type: 'score',
				side: 'left'
			});
			left_score--;
		}
		if (right_score > 0) {
			presses.push({
				type: 'score',
				side: 'right'
			});
			right_score--;
		}
	}
}

module.exports = {
	bup: bup,
	_describe: _describe,
	_it: _it,
	SINGLES_SETUP: SINGLES_SETUP,
	SINGLES_TEAM_SETUP: SINGLES_TEAM_SETUP,
	DOUBLES_SETUP: DOUBLES_SETUP,
	DOUBLES_TEAM_SETUP: DOUBLES_TEAM_SETUP,
	state_after: state_after,
	press_score: press_score,
};
