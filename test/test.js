"use strict";

var assert = require('assert');
var jsdom = require('jsdom');

var jQuery = require('../libs/jquery.min.js');
var bup = require('../bup.js');

// Trivial runner
var _describe = ((typeof describe == 'undefined') ?
	function(s, f) {f();} :
	describe
);
var _it = ((typeof it == 'undefined') ?
	function(s, f) {f();} :
	it
);


_describe('calc_state', function() {
	var SINGLES_SETUP = {
		teams: [{
			players: [{name: 'Alice'}]
		}, {
			players: [{name: 'Bob'}]
		}],
		is_doubles: false,
		counting: '3x21'
	};
	var DOUBLES_SETUP = {
		teams: [{
			players: [{name: 'Andrew'}, {name: 'Alice'}]
		}, {
			players: [{name: 'Bob'}, {name: 'Birgit'}]
		}],
		is_doubles: true,
		counting: '3x21'
	};
	function state_after(presses, setup) {
		var state = {};
		bup.init_state(state, setup);
		state.presses = presses;
		bup.calc_state(state);
		return state;
	}

	_it('Initial properties', function() {
		var s = state_after([], DOUBLES_SETUP);
		assert.equal(s.setup.is_doubles, true);
		assert.equal(s.game.start_team1_left, null);
		assert.equal(s.game.team1_left, null);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.score[0], null);
		assert.equal(s.game.score[1], null);
		assert.equal(s.match.finished, false);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);

		s = state_after([], SINGLES_SETUP);
		assert.equal(s.setup.is_doubles, false);
		assert.equal(s.game.start_team1_left, null);
		assert.equal(s.game.team1_left, null);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.score[0], null);
		assert.equal(s.game.score[1], null);
		assert.equal(s.match.finished, false);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);
	});

	_it('Choosing sides (singles)', function() {
		var s = state_after([{
			'type': 'pick_side',
			'team1_left': true,
		}], SINGLES_SETUP);
		assert.equal(s.game.team1_serving, null);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);

		s = state_after([{
			'type': 'pick_side',
			'team1_left': false, // Alice picks right
		}, {
			'type': 'pick_server', // Bob serves
			'team_id': 1,
			'player_id': 0
		}], SINGLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);

		s = state_after([{
			'type': 'pick_side',
			'team1_left': false, // Alice picks right
		}, {
			'type': 'pick_server', // Alice serves
			'team_id': 0,
			'player_id': 0
		}], SINGLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);

		s = state_after([{
			'type': 'pick_side',
			'team1_left': true, // Alice picks left
		}, {
			'type': 'pick_server', // Alice serves
			'team_id': 0,
			'player_id': 0
		}], SINGLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);

		s = state_after([{
			'type': 'pick_side',
			'team1_left': true, // Alice picks left
		}, {
			'type': 'pick_server', // Bob serves
			'team_id': 1,
			'player_id': 0
		}], SINGLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);
	});

	_it('Choosing sides (doubles)', function() {
		var s = state_after([{
			'type': 'pick_side',
			'team1_left': true,
		}], DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, null);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);

		s = state_after([{
			'type': 'pick_side',
			'team1_left': false, // Andrew&Alice pick right
		}, {
			'type': 'pick_server', // Bob serves
			'team_id': 1,
			'player_id': 0
		}], DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.player_left_odd.name, 'Birgit');
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);

		s = state_after([{
			'type': 'pick_side',
			'team1_left': false, // Andrew&Alice pick right
		}, {
			'type': 'pick_server', // Birgit serves
			'team_id': 1,
			'player_id': 1
		}, {
			'type': 'pick_receiver', // Andrew receives
			'team_id': 0,
			'player_id': 0,
		}], DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.teams_player1_even[0], true);
		assert.equal(s.game.teams_player1_even[1], false);
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_left_even.name, 'Birgit');
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_right_even.name, 'Andrew');
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);

		s = state_after([{
			'type': 'pick_side',
			'team1_left': false, // Andrew&Alice pick right
		}, {
			'type': 'pick_server', // Alice serves
			'team_id': 0,
			'player_id': 1
		}, {
			'type': 'pick_receiver', // Birgit receives
			'team_id': 1,
			'player_id': 1,
		}], DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.teams_player1_even[0], false);
		assert.equal(s.game.teams_player1_even[1], false);
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_left_even.name, 'Birgit');
		assert.equal(s.court.player_right_odd.name, 'Andrew');
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);

		s = state_after([{
			'type': 'pick_side',
			'team1_left': false, // Andrew&Alice pick right
		}, {
			'type': 'pick_server', // Andrew serves
			'team_id': 0,
			'player_id': 0
		}, {
			'type': 'pick_receiver', // Birgit receives
			'team_id': 1,
			'player_id': 1,
		}], DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.teams_player1_even[0], true);
		assert.equal(s.game.teams_player1_even[1], false);
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_left_even.name, 'Birgit');
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_right_even.name, 'Andrew');
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);

		s = state_after([{
			'type': 'pick_side',
			'team1_left': false, // Andrew&Alice pick right
		}, {
			'type': 'pick_server', // Bob serves
			'team_id': 1,
			'player_id': 0
		}, {
			'type': 'pick_receiver', // Andrew receives
			'team_id': 0,
			'player_id': 0,
		}], DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.teams_player1_even[0], true);
		assert.equal(s.game.teams_player1_even[1], true);
		assert.equal(s.court.player_left_odd.name, 'Birgit');
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_right_even.name, 'Andrew');
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);

		s = state_after([{
			'type': 'pick_side',
			'team1_left': true, // Andrew&Alice pick left
		}, {
			'type': 'pick_server', // Birgit serves
			'team_id': 1,
			'player_id': 1
		}, {
			'type': 'pick_receiver', // Alice receives
			'team_id': 0,
			'player_id': 1,
		}], DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.player_left_odd.name, 'Andrew');
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_right_odd.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Birgit');
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);

		s = state_after([{
			'type': 'pick_side',
			'team1_left': true, // Andrew&Alice pick left
		}, {
			'type': 'pick_server', // Andrew serves
			'team_id': 0,
			'player_id': 0
		}, {
			'type': 'pick_receiver', // Birgit receives
			'team_id': 1,
			'player_id': 1,
		}], DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.teams_player1_even[0], true);
		assert.equal(s.game.teams_player1_even[1], false);
		assert.equal(s.court.player_left_odd.name, 'Alice');
		assert.equal(s.court.player_left_even.name, 'Andrew');
		assert.equal(s.court.player_right_odd.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Birgit');
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
	});

	_it('Game start and basic counting (singles)', function() {
		var s = state_after([{
			'type': 'pick_side', // Alice picks right
			'team1_left': false,
		}, {
			'type': 'pick_server', // Alice serves
			'team_id': 0,
			'player_id': 0,
		}, {
			'type': 'love-all'
		}], SINGLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.service_over, false);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);

		s = state_after([{
			'type': 'pick_side', // Alice picks right
			'team1_left': false,
		}, {
			'type': 'pick_server', // Alice serves
			'team_id': 0,
			'player_id': 0,
		}, {
			'type': 'love-all'
		}, {
			'type': 'score',
			'side': 'left'
		}, {
			'type': 'score',
			'side': 'left'
		}, {
			'type': 'score',
			'side': 'right'
		}, {
			'type': 'score',
			'side': 'right'
		}, {
			'type': 'score',
			'side': 'left'
		}], SINGLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.deepEqual(s.game.score, [2, 3]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, true);

		s = state_after([{
			'type': 'pick_side', // Alice picks left
			'team1_left': true,
		}, {
			'type': 'pick_server', // Bob serves
			'team_id': 1,
			'player_id': 0,
		}, {
			'type': 'love-all'
		}, {
			'type': 'score',
			'side': 'left'
		}, {
			'type': 'score',
			'side': 'left'
		}, {
			'type': 'score',
			'side': 'left'
		}], SINGLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.deepEqual(s.game.score, [3, 0]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.court.player_left_odd.name, 'Alice');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd.name, 'Bob');
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, true);

		s = state_after([{
			'type': 'pick_side', // Alice picks left
			'team1_left': true,
		}, {
			'type': 'pick_server', // Alice serves
			'team_id': 0,
			'player_id': 0,
		}, {
			'type': 'love-all'
		}, {
			'type': 'score',
			'side': 'right'
		}, {
			'type': 'score',
			'side': 'left'
		}], SINGLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.deepEqual(s.game.score, [1, 1]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.teams_player1_even[0], false);
		assert.equal(s.game.teams_player1_even[1], false);
		assert.equal(s.court.player_left_odd.name, 'Alice');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd.name, 'Bob');
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, true);
	});

	_it('Game start and basic counting (doubles)', function() {
		var s = state_after([{
			'type': 'pick_side', // Andrew&Alice pick right
			'team1_left': false,
		}, {
			'type': 'pick_server', // Alice serves
			'team_id': 0,
			'player_id': 1,
		}, {
			'type': 'pick_receiver', // Bob receives
			'team_id': 1,
			'player_id': 0,
		}, {
			'type': 'love-all'
		}], DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.service_over, false);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.court.player_left_odd.name, 'Birgit');
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd.name, 'Andrew');
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);

		var s = state_after([{
			'type': 'pick_side', // Andrew&Alice pick right
			'team1_left': false,
		}, {
			'type': 'pick_server', // Andrew serves
			'team_id': 0,
			'player_id': 0,
		}, {
			'type': 'pick_receiver', // Bob receives
			'team_id': 1,
			'player_id': 0,
		}, {
			'type': 'love-all'
		}, {
			'type': 'score',
			'side': 'left'
		}, {
			'type': 'score',
			'side': 'left'
		}, {
			'type': 'score',
			'side': 'right'
		}, {
			'type': 'score',
			'side': 'right'
		}, {
			'type': 'score',
			'side': 'left'
		}], DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.service_over, true);
		assert.deepEqual(s.game.score, [2, 3]);
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_left_even.name, 'Birgit');
		assert.equal(s.court.player_right_odd.name, 'Andrew');
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, true);
	});
});
