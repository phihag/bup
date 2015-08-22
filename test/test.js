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


function _press_score(presses, left_score, right_score) {
	while (left_score-- > 0) {
		presses.push({
			type: 'score',
			side: 'left'
		});
	}
	while (right_score-- > 0) {
		presses.push({
			type: 'score',
			side: 'right'
		});
	}
}

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
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.score[0], null);
		assert.equal(s.game.score[1], null);
		assert.equal(s.game.interval, null);
		assert.equal(s.game.gamepoint, null);
		assert.equal(s.game.matchpoint, null);
		assert.equal(s.game.game, null);
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [0, 0]);
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
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.score[0], null);
		assert.equal(s.game.score[1], null);
		assert.equal(s.game.interval, null);
		assert.equal(s.game.gamepoint, null);
		assert.equal(s.game.matchpoint, null);
		assert.equal(s.game.game, null);
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [0, 0]);
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
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);

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
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);

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

	_it('Interval', function() {
		var presses = [{
			'type': 'pick_side', // Alice picks right
			'team1_left': false,
		}, {
			'type': 'pick_server', // Bob serves
			'team_id': 1,
			'player_id': 0,
		}, {
			'type': 'love-all'
		}];
		_press_score(presses, 9, 9);
		presses.push({
			'type': 'score',
			'side': 'right'
		});
		var s = state_after(presses, SINGLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.deepEqual(s.game.score, [10, 9]);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.game.interval, false);

		presses.push({
			'type': 'score',
			'side': 'left'
		});
		presses.push({
			'type': 'score',
			'side': 'right'
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.service_over, true);
		assert.deepEqual(s.game.score, [11, 10]);
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.game.interval, true);
		assert.equal(s.game.change_sides, false);

		presses.push({
			'type': 'score',
			'side': 'left'
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.service_over, true);
		assert.deepEqual(s.game.score, [11, 11]);
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.game.interval, false);

		presses.push({
			'type': 'score',
			'side': 'left'
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.service_over, false);
		assert.deepEqual(s.game.score, [11, 12]);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.game.interval, false);
	});

	_it('Correct announcements (singles)', function() {
		var presses = [{
			'type': 'pick_side', // Alice picks left
			'team1_left': true,
		}, {
			'type': 'pick_server', // Alice serves
			'team_id': 0,
			'player_id': 0,
		}, {
			'type': 'love-all'
		}];
		_press_score(presses, 18, 19);
		presses.push({
			'type': 'score',
			'side': 'left'
		});
		var s = state_after(presses, SINGLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.deepEqual(s.game.score, [19, 19]);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);

		presses.push({
			'type': 'score',
			'side': 'left'
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.deepEqual(s.game.score, [20, 19]);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, true);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);

		var won_presses = presses.slice();
		won_presses.push({
			'type': 'score',
			'side': 'left'
		});
		s = state_after(won_presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [21, 19]);
		assert.equal(s.game.service_over, null);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, true);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, true);
		assert.equal(s.game.team1_won, true);
		assert.equal(s.game.team1_serving, null);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);

		presses.push({
			'type': 'score',
			'side': 'right'
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.deepEqual(s.game.score, [20, 20]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);

		presses.push({
			'type': 'score',
			'side': 'right'
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.deepEqual(s.game.score, [20, 21]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, false);

		won_presses = presses.slice();
		won_presses.push({
			'type': 'score',
			'side': 'right'
		});
		s = state_after(won_presses, SINGLES_SETUP);
		assert.equal(s.game.team1_serving, null);
		assert.deepEqual(s.game.score, [20, 22]);
		assert.equal(s.game.service_over, null);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, true);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, true);
		assert.equal(s.game.team1_won, false);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);

		presses.push({
			'type': 'score',
			'side': 'left'
		}); // 21-21
		presses.push({
			'type': 'score',
			'side': 'left'
		}); // 22-21
		presses.push({
			'type': 'score',
			'side': 'right'
		}); // 22-22
		presses.push({
			'type': 'score',
			'side': 'right'
		}); // 22-23
		presses.push({
			'type': 'score',
			'side': 'left'
		}); // 23-23
		presses.push({
			'type': 'score',
			'side': 'left'
		}); // 24-23
		presses.push({
			'type': 'score',
			'side': 'right'
		}); // 24-24
		presses.push({
			'type': 'score',
			'side': 'right'
		}); // 24-25
		presses.push({
			'type': 'score',
			'side': 'left'
		}); // 25-25
		presses.push({
			'type': 'score',
			'side': 'right'
		}); // 25-26
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.deepEqual(s.game.score, [25, 26]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);

		presses.push({
			'type': 'score',
			'side': 'left'
		}); // 26-26
		presses.push({
			'type': 'score',
			'side': 'right'
		}); // 26-27
		presses.push({
			'type': 'score',
			'side': 'left'
		}); // 27-27
		presses.push({
			'type': 'score',
			'side': 'right'
		}); // 27-28
		presses.push({
			'type': 'score',
			'side': 'left'
		}); // 28-28
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.deepEqual(s.game.score, [28, 28]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);

		presses.push({
			'type': 'score',
			'side': 'left'
		}); // 29-28
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.deepEqual(s.game.score, [29, 28]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, true);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, true);

		won_presses = presses.slice();
		won_presses.push({
			'type': 'score',
			'side': 'left'
		}); // 30-28
		s = state_after(won_presses, SINGLES_SETUP);
		assert.equal(s.game.team1_serving, null);
		assert.deepEqual(s.game.score, [30, 28]);
		assert.equal(s.game.service_over, null);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, true);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, true);
		assert.equal(s.game.team1_won, true);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);

		presses.push({
			'type': 'score',
			'side': 'right'
		}); // 29-29
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [29, 29]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, true);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, false);

		won_presses = presses.slice();
		won_presses.push({
			'type': 'score',
			'side': 'right'
		}); // 29-30
		s = state_after(won_presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [29, 30]);
		assert.equal(s.game.service_over, null);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, true);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, true);
		assert.equal(s.game.team1_won, false);
		assert.equal(s.game.team1_serving, null);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);

		presses.push({
			'type': 'score',
			'side': 'left'
		}); // 30-29
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [30, 29]);
		assert.equal(s.game.service_over, null);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, true);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, true);
		assert.equal(s.game.team1_won, true);
		assert.equal(s.game.team1_serving, null);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);

		presses.push({
			'type': 'postgame-confirm'
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [30, 29]);
		assert.deepEqual(s.game.score, [null, null]);
		assert.equal(s.game.service_over, null);
		assert.equal(s.game.interval, null);
		assert.equal(s.game.gamepoint, null);
		assert.equal(s.game.game, null);
		assert.equal(s.game.matchpoint, null);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);

	});
});
