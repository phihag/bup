'use strict';

var assert = require('assert');
var fs = require('fs');

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


var SINGLES_SETUP = {
	teams: [{
		players: [{name: 'Alice'}],
	}, {
		players: [{name: 'Bob'}],
	}],
	is_doubles: false,
	counting: '3x21',
};
var SINGLES_TEAM_SETUP = bup.utils.deep_copy(SINGLES_SETUP);
SINGLES_TEAM_SETUP.teams[0].name = 'A team';
SINGLES_TEAM_SETUP.teams[1].name = 'B team';
SINGLES_TEAM_SETUP.team_competition = true;
var SINGLES_TEAM_SETUP_NEUTRALGROUND = bup.utils.deep_copy(SINGLES_TEAM_SETUP);
SINGLES_TEAM_SETUP_NEUTRALGROUND.neutral_ground = true;

var DOUBLES_SETUP = {
	teams: [{
		players: [{name: 'Andrew'}, {name: 'Alice'}],
	}, {
		players: [{name: 'Bob'}, {name: 'Birgit'}],
	}],
	is_doubles: true,
	counting: '3x21',
};
var DOUBLES_TEAM_SETUP = bup.utils.deep_copy(DOUBLES_SETUP);
DOUBLES_TEAM_SETUP.teams[0].name = 'A team';
DOUBLES_TEAM_SETUP.teams[1].name = 'B team';
DOUBLES_TEAM_SETUP.team_competition = true;
var DOUBLES_TEAM_SETUP_NEUTRALGROUND = bup.utils.deep_copy(DOUBLES_TEAM_SETUP);
DOUBLES_TEAM_SETUP_NEUTRALGROUND.neutral_ground = true;


var DOUBLES_SETUP_EN = bup.utils.deep_copy(DOUBLES_SETUP);
DOUBLES_SETUP_EN.force_language = 'en';
var SINGLES_SETUP_EN = bup.utils.deep_copy(SINGLES_SETUP);
SINGLES_SETUP_EN.force_language = 'en';

function state_after(presses, setup, settings) {
	var s = {};
	s.settings = settings;
	var lang = ((settings && settings.language) ? settings.language : (setup.force_language ? setup.force_language : 'de'));
	bup.i18n.update_state(s, lang);
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


function _find_object_check(el, search) {
	for (var key in search) {
		var value = search[key];

		if (typeof value === 'object') {
			if (typeof el[key] !== 'object') {
				return false;
			}
			if (! _find_object_check(el[key], value)) {
				return false;
			}
		} else {
			if (el[key] !== value) {
				return false;
			}
		}
	}
	return true;
}

function find_object(ar, search) {
	for (var i = 0;i < ar.length;i++) {
		var el = ar[i];
		if (_find_object_check(el, search)) {
			return el;
		}
	}
	assert.ok(false, 'Could not find object ' + JSON.stringify(search));
}

function assert_u8r_eq(r, lst) {
	assert(r instanceof Uint8Array);
	assert(lst instanceof Array);
	lst.forEach(function(el) {
		assert.equal(typeof el, 'number');
	});

	assert.strictEqual(r.length, lst.length, 'Expected an Uint8Array of length ' + lst.length + ', but length is ' + r.length);
	var ints = [];
	for (var i = 0;i < r.length;i++) {
		ints.push(r[i]);
	}
	assert.deepStrictEqual(ints, lst);
}

function load_event(fn, cb) {
	fs.readFile(fn, {encoding: 'utf-8'}, function(err, fcontents) {
		if (err) return cb(err);

		var s = state_after([], SINGLES_SETUP);
		var data = JSON.parse(fcontents);
		var loaded = bup.importexport.load_data(s, data);
		assert(loaded && loaded.event);

		return cb(null, loaded.event);
	});
}

module.exports = {
	DOUBLES_SETUP: DOUBLES_SETUP,
	SINGLES_SETUP: SINGLES_SETUP,
	DOUBLES_TEAM_SETUP: DOUBLES_TEAM_SETUP,
	DOUBLES_TEAM_SETUP_NEUTRALGROUND: DOUBLES_TEAM_SETUP_NEUTRALGROUND,
	SINGLES_TEAM_SETUP: SINGLES_TEAM_SETUP,
	SINGLES_TEAM_SETUP_NEUTRALGROUND: SINGLES_TEAM_SETUP_NEUTRALGROUND,
	SINGLES_SETUP_EN: SINGLES_SETUP_EN,
	DOUBLES_SETUP_EN: DOUBLES_SETUP_EN,
	_describe: _describe,
	_it: _it,
	bup: bup,

	assert_u8r_eq: assert_u8r_eq,
	press_score: press_score,
	load_event: load_event,
	state_after: state_after,
	state_at: state_at,
	find_object: find_object,
};
