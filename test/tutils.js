var assert = require('assert');
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
var SINGLES_TEAM_SETUP = bup.utils.deep_copy(SINGLES_SETUP);
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
var DOUBLES_TEAM_SETUP = bup.utils.deep_copy(DOUBLES_SETUP);
DOUBLES_TEAM_SETUP.teams[0].name = 'A team';
DOUBLES_TEAM_SETUP.teams[1].name = 'B team';
DOUBLES_TEAM_SETUP.team_competition = true;

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

function TextNode(ownerDocument, text) {
	this.ownerDocument = ownerDocument;
	this.text = text;
}
function Element(ownerDocument, tagName) {
	this.ownerDocument = ownerDocument;
	this.tagName = tagName;
	this.attributes = {};
	this.childNodes = [];
	Object.defineProperty(this, 'textContent', {
		get: function() {
			var res = '';
			for (var i = 0;i < this.childNodes.length;i++) {
				var node = this.childNodes[i];
				if (node instanceof TextNode) {
					res += node.text;
				}
			}
			return res;
		},
	});
}
Element.prototype.setAttribute = function(k, v) {
	this.attributes[k] = v;
};
Element.prototype.appendChild = function(node) {
	this.childNodes.push(node);
};
function Document(tagName) {
	this.documentElement = new Element(this, tagName);
}
Document.prototype.createElement = function(tagName) {
	return new Element(this, tagName);
};
Document.prototype.createElementNS = function(namespace, tagName) {
	return new Element(this, tagName);
};
Document.prototype.createTextNode = function(text) {
	return new TextNode(this, text);
};

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
	Document: Document,
	find_object: find_object,
};

})();
