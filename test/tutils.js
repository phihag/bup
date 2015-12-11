var _ = require('underscore');
var bup = require('../js/bup');

// Make linter happy
/*global describe:false, it:false*/

// Trivial runner
var _describe = ((typeof describe == 'undefined') ?
	function(s, f) {f();} :
	describe
);
var _it = ((typeof it == 'undefined') ?
	function(s, f) {f();} :
	it
);


(function() {
'use strict';

var SINGLES_SETUP = {
	teams: [{
		players: [{name: 'Alice'}],
	}, {
		players: [{name: 'Bob'}],
	}],
	is_doubles: false,
	counting: '3x21',
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
	counting: '3x21',
};
var DOUBLES_TEAM_SETUP = _.clone(DOUBLES_SETUP);
DOUBLES_TEAM_SETUP.teams[0].name = 'A team';
DOUBLES_TEAM_SETUP.teams[1].name = 'B team';
DOUBLES_TEAM_SETUP.team_competition = true;

var DOUBLES_SETUP_EN = _.clone(DOUBLES_SETUP);
DOUBLES_SETUP_EN.force_language = 'en';
var SINGLES_SETUP_EN = _.clone(SINGLES_SETUP);
SINGLES_SETUP_EN.force_language = 'en';

function state_after(presses, setup, settings) {
	var s = {};
	s.settings = settings;
	bup.i18n.update_state(s, (settings ? settings.language : (setup.force_language ? setup.force_language : 'de')));
	bup.calc.init_state(s, setup);
	s.presses = presses;
	bup.calc.state(s);
	return s;
}

function state_at(network_score, setup, settings) {
	if (! setup) {
		setup = DOUBLES_SETUP;
	}
	var presses = [{
		type: 'pick_side',
		team1_left: true,
	}, {
		type: 'pick_server',
		team_id: 0,
		player_id: 0,
	}, {
		type: 'pick_receiver',
		team_id: 1,
		player_id: 0,
	}, {
		type: 'love-all',
	}, {
		type: 'editmode_set-finished_games',
		scores: network_score.slice(0, network_score.length - 1),
		by_side: false,
	}, {
		type: 'editmode_set-score',
		score: network_score[network_score.length - 1],
		by_side: false,
	}];
	return state_after(presses, setup, settings);
}

/**
* Guaranteed to switch in the form left-right-left-right-...
*/
function press_score(presses, left_score, right_score) {
	while ((left_score > 0) || (right_score > 0)) {
		if (left_score > 0) {
			presses.push({
				type: 'score',
				side: 'left',
			});
			left_score--;
		}
		if (right_score > 0) {
			presses.push({
				type: 'score',
				side: 'right',
			});
			right_score--;
		}
	}
}

module.exports = {
	DOUBLES_SETUP: DOUBLES_SETUP,
	SINGLES_SETUP: SINGLES_SETUP,
	DOUBLES_TEAM_SETUP: DOUBLES_TEAM_SETUP,
	SINGLES_TEAM_SETUP: SINGLES_TEAM_SETUP,
	SINGLES_SETUP_EN: SINGLES_SETUP_EN,
	DOUBLES_SETUP_EN: DOUBLES_SETUP_EN,
	_describe: _describe,
	_it: _it,
	bup: bup,
	press_score: press_score,
	state_after: state_after,
	state_at: state_at,
};

})();
