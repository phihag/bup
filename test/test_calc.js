var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var DOUBLES_SETUP = tutils.DOUBLES_SETUP;
var SINGLES_SETUP = tutils.SINGLES_SETUP;
var press_score = tutils.press_score;
var state_after = tutils.state_after;
var bup = tutils.bup;

(function() {
'use strict';

_describe('calc_state', function() {
	_it('Initial properties', function() {
		var s = state_after([], DOUBLES_SETUP);
		assert.equal(s.setup.is_doubles, true);
		assert.equal(s.game.start_team1_left, null);
		assert.equal(s.game.team1_left, null);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.score[0], 0);
		assert.equal(s.game.score[1], 0);
		assert.equal(s.game.started, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.strictEqual(s.game.won_by_score, null);
		assert.equal(s.match.finished, false);
		assert.strictEqual(s.match.suspended, false);
		assert.strictEqual(s.match.just_unsuspended, false);
		assert.strictEqual(s.match.team1_won, null);
		assert.deepEqual(s.match.pending_red_cards, []);
		assert.equal(s.match.finish_confirmed, false);
		assert.deepEqual(s.match.game_score, [0, 0]);
		assert.equal(s.match.announce_pregame, false);
		assert.strictEqual(s.court.player_left_odd, null);
		assert.strictEqual(s.court.player_left_even, null);
		assert.strictEqual(s.court.player_right_odd, null);
		assert.strictEqual(s.court.player_right_even, null);
		assert.strictEqual(s.court.left_serving, null);
		assert.strictEqual(s.court.serving_downwards, null);

		s = state_after([], SINGLES_SETUP);
		assert.equal(s.setup.is_doubles, false);
		assert.equal(s.game.start_team1_left, null);
		assert.equal(s.game.team1_left, null);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.score[0], 0);
		assert.equal(s.game.score[1], 0);
		assert.equal(s.game.started, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.strictEqual(s.game.won_by_score, null);
		assert.strictEqual(s.match.suspended, false);
		assert.strictEqual(s.match.just_unsuspended, false);
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.pending_red_cards, []);
		assert.strictEqual(s.match.team1_won, null);
		assert.equal(s.match.finish_confirmed, false);
		assert.deepEqual(s.match.game_score, [0, 0]);
		assert.equal(s.match.announce_pregame, false);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);
	});

	_it('Choosing sides (singles)', function() {
		var s = state_after([{
			type: 'pick_side',
			team1_left: true,
		}], SINGLES_SETUP);
		assert.equal(s.game.team1_serving, null);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);

		s = state_after([{
			type: 'pick_side',
			team1_left: false, // Alice picks right
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}], SINGLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);

		s = state_after([{
			type: 'pick_side',
			team1_left: false, // Alice picks right
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 0,
		}], SINGLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);

		s = state_after([{
			type: 'pick_side',
			team1_left: true, // Alice picks left
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 0,
		}], SINGLES_SETUP);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);

		s = state_after([{
			type: 'pick_side',
			team1_left: true, // Alice picks left
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
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
			type: 'pick_side',
			team1_left: true,
		}], DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, null);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);

		s = state_after([{
			type: 'pick_side',
			team1_left: false, // Andrew&Alice pick right
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}], DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.player_left_odd.name, 'Birgit');
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);

		s = state_after([{
			type: 'pick_side',
			team1_left: false, // Andrew&Alice pick right
		}, {
			type: 'pick_server', // Birgit serves
			team_id: 1,
			player_id: 1,
		}, {
			type: 'pick_receiver', // Andrew receives
			team_id: 0,
			player_id: 0,
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
			type: 'pick_side',
			team1_left: false, // Andrew&Alice pick right
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		}, {
			type: 'pick_receiver', // Birgit receives
			team_id: 1,
			player_id: 1,
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
			type: 'pick_side',
			team1_left: false, // Andrew&Alice pick right
		}, {
			type: 'pick_server', // Andrew serves
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver', // Birgit receives
			team_id: 1,
			player_id: 1,
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
			type: 'pick_side',
			team1_left: false, // Andrew&Alice pick right
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}, {
			type: 'pick_receiver', // Andrew receives
			team_id: 0,
			player_id: 0,
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
			type: 'pick_side',
			team1_left: true, // Andrew&Alice pick left
		}, {
			type: 'pick_server', // Birgit serves
			team_id: 1,
			player_id: 1,
		}, {
			type: 'pick_receiver', // Alice receives
			team_id: 0,
			player_id: 1,
		}], DOUBLES_SETUP);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.player_left_odd.name, 'Andrew');
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_right_odd.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Birgit');
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);

		s = state_after([{
			type: 'pick_side',
			team1_left: true, // Andrew&Alice pick left
		}, {
			type: 'pick_server', // Andrew serves
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver', // Birgit receives
			team_id: 1,
			player_id: 1,
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
			type: 'pick_side', // Alice picks right
			team1_left: false,
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
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
			type: 'pick_side', // Alice picks right
			team1_left: false,
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}, {
			type: 'score',
			side: 'left',
		}, {
			type: 'score',
			side: 'left',
		}, {
			type: 'score',
			side: 'right',
		}, {
			type: 'score',
			side: 'right',
		}, {
			type: 'score',
			side: 'left',
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
			type: 'pick_side', // Alice picks left
			team1_left: true,
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}, {
			type: 'score',
			side: 'left',
		}, {
			type: 'score',
			side: 'left',
		}, {
			type: 'score',
			side: 'left',
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
			type: 'pick_side', // Alice picks left
			team1_left: true,
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}, {
			type: 'score',
			side: 'right',
		}, {
			type: 'score',
			side: 'left',
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
			type: 'pick_side', // Andrew&Alice pick right
			team1_left: false,
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		}, {
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
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

		s = state_after([{
			type: 'pick_side', // Andrew&Alice pick right
			team1_left: false,
		}, {
			type: 'pick_server', // Andrew serves
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}, {
			type: 'score',
			side: 'left',
		}, {
			type: 'score',
			side: 'left',
		}, {
			type: 'score',
			side: 'right',
		}, {
			type: 'score',
			side: 'right',
		}, {
			type: 'score',
			side: 'left',
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
			type: 'pick_side', // Alice picks right
			team1_left: false,
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 9, 9);
		presses.push({
			type: 'score',
			side: 'right',
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
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'right',
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
			type: 'score',
			side: 'left',
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
			type: 'score',
			side: 'left',
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
			type: 'pick_side', // Alice picks left
			team1_left: true,
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 18, 19);
		presses.push({
			type: 'score',
			side: 'left',
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
			type: 'score',
			side: 'left',
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
			type: 'score',
			side: 'left',
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
			type: 'score',
			side: 'right',
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
			type: 'score',
			side: 'right',
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
			type: 'score',
			side: 'right',
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
			type: 'score',
			side: 'left',
		}); // 21-21
		presses.push({
			type: 'score',
			side: 'left',
		}); // 22-21
		presses.push({
			type: 'score',
			side: 'right',
		}); // 22-22
		presses.push({
			type: 'score',
			side: 'right',
		}); // 22-23
		presses.push({
			type: 'score',
			side: 'left',
		}); // 23-23
		presses.push({
			type: 'score',
			side: 'left',
		}); // 24-23
		presses.push({
			type: 'score',
			side: 'right',
		}); // 24-24
		presses.push({
			type: 'score',
			side: 'right',
		}); // 24-25
		presses.push({
			type: 'score',
			side: 'left',
		}); // 25-25
		presses.push({
			type: 'score',
			side: 'right',
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
			type: 'score',
			side: 'left',
		}); // 26-26
		presses.push({
			type: 'score',
			side: 'right',
		}); // 26-27
		presses.push({
			type: 'score',
			side: 'left',
		}); // 27-27
		presses.push({
			type: 'score',
			side: 'right',
		}); // 27-28
		presses.push({
			type: 'score',
			side: 'left',
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
			type: 'score',
			side: 'left',
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
			type: 'score',
			side: 'left',
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
		assert.strictEqual(s.game.won_by_score, true);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);

		presses.push({
			type: 'score',
			side: 'right',
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
		assert.strictEqual(s.game.won_by_score, null);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, false);


		won_presses = presses.slice();
		won_presses.push({
			type: 'score',
			side: 'right',
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
		assert.equal(s.game.team1_left, true);
		assert.strictEqual(s.game.won_by_score, true);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);
		assert.equal(s.court.player_left_odd.name, 'Alice');
		assert.equal(s.court.player_right_odd.name, 'Bob');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_even, null);

		presses.push({
			type: 'score',
			side: 'left',
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
		assert.equal(s.game.team1_left, true);
		assert.strictEqual(s.game.won_by_score, true);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);
		assert.equal(s.court.player_left_odd.name, 'Alice');
		assert.equal(s.court.player_right_odd.name, 'Bob');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_even, null);

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [30, 29]);
		assert.strictEqual(s.match.finished_games[0].won_by_score, true);
		assert.deepEqual(s.match.game_score, [1, 0]);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.started, 0);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.started, true);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Alice');

		press_score(presses, 9, 9);
		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [11, 10]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, true);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_right_even, null);

		press_score(presses, 9, 7);
		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [19, 20]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, true);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Alice');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [20, 20]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even.name, 'Alice');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [21, 20]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_right_even, null);

		presses.push({
			type: 'score',
			side: 'left',
		});
		press_score(presses, 6, 6);
		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [29, 28]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, true);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_right_even, null);

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [29, 29]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, true);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_right_even, null);

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [29, 30]);
		assert.equal(s.game.service_over, null);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, true);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, true);
		assert.equal(s.game.team1_won, false);
		assert.equal(s.game.team1_serving, null);
		assert.strictEqual(s.game.won_by_score, true);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [30, 29]);
		assert.deepEqual(s.match.finished_games[1].score, [29, 30]);
		assert.strictEqual(s.match.finished_games[1].won_by_score, true);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.started, false);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [30, 29]);
		assert.deepEqual(s.match.finished_games[1].score, [29, 30]);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.started, true);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_right_odd, null);

		press_score(presses, 9, 9);
		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [11, 9]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, true);
		assert.equal(s.game.change_sides, true);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_even, null);

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [11, 10]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_right_odd, null);

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [12, 9]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_right_odd, null);

		press_score(presses, 10, 6);
		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [20, 19]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, true);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_right_odd, null);

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.game.score, [20, 20]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_right_odd, null);

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.deepEqual(s.game.score, [20, 21]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_even, null);

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [30, 29]);
		assert.deepEqual(s.match.finished_games[1].score, [29, 30]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.game.score, [20, 22]);
		assert.deepEqual(s.match.game_score, [1, 2]);
		assert.equal(s.game.service_over, null);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.game, true);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, true);
		assert.equal(s.game.team1_won, false);
		assert.equal(s.game.team1_serving, null);
		assert.strictEqual(s.game.won_by_score, true);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.match.finished, true);
		assert.strictEqual(s.match.team1_won, false);
		assert.strictEqual(s.match.finish_confirmed, false);

		presses.push({
			type: 'postmatch-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(s.game.won_by_score, true);
		assert.deepEqual(s.match.finished_games[0].score, [30, 29]);
		assert.deepEqual(s.match.finished_games[1].score, [29, 30]);
		assert.deepEqual(s.match.finished_games[2].score, [20, 22]);
		assert.equal(s.match.finished_games.length, 3);
		assert.deepEqual(s.match.game_score, [1, 2]);
		assert.equal(s.match.finished, true);
		assert.strictEqual(s.match.finish_confirmed, true);
	});

	_it('Correct announcements (doubles)', function() {
		var presses = [{
			type: 'pick_side', // Andrew&Alice pick right
			team1_left: false,
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		}, {
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 18, 18);
		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		var s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.match.finished, false);
		assert.equal(s.match.finished_games.length, 0);
		assert.deepEqual(s.match.game_score, [0, 0]);
		assert.deepEqual(s.game.score, [19, 19]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_left_odd.name, 'Birgit');
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.player_right_odd.name, 'Andrew');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.match.finished, false);
		assert.equal(s.match.finished_games.length, 0);
		assert.deepEqual(s.match.game_score, [0, 0]);
		assert.deepEqual(s.game.score, [20, 19]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, true);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_left_odd.name, 'Birgit');
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_right_even.name, 'Andrew');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [21, 19]);
		assert.equal(s.game.service_over, null);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, true);
		assert.equal(s.game.game, true);
		assert.equal(s.game.team1_won, true);
		assert.equal(s.game.team1_serving, null);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_left_odd.name, 'Birgit');
		assert.equal(s.court.player_right_odd.name, 'Alice');
		assert.equal(s.court.player_right_even.name, 'Andrew');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 0]);
		assert.equal(s.match.finished_games.length, 0);

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.started, false);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 0]);
		assert.equal(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0, // Andrew serves
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.started, false);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Andrew');
		assert.equal(s.court.player_left_odd.name, 'Alice');
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 0]);
		assert.equal(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);

		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0, // Bob receives
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.started, false);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Andrew');
		assert.equal(s.court.player_left_odd.name, 'Alice');
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.player_right_odd.name, 'Birgit');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 0]);
		assert.equal(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.started, true);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Andrew');
		assert.equal(s.court.player_left_odd.name, 'Alice');
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.player_right_odd.name, 'Birgit');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 0]);
		assert.equal(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);

		presses.push({
			type: 'score',
			side: 'right',
		});
		press_score(presses, 17, 17);
		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [18, 18]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Andrew');
		assert.equal(s.court.player_left_odd.name, 'Alice');
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.player_right_odd.name, 'Birgit');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 0]);
		assert.equal(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);

		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [19, 20]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, true);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_left_odd.name, 'Andrew');
		assert.equal(s.court.player_right_even.name, 'Birgit');
		assert.equal(s.court.player_right_odd.name, 'Bob');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 0]);
		assert.equal(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [20, 20]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_left_odd.name, 'Andrew');
		assert.equal(s.court.player_right_even.name, 'Birgit');
		assert.equal(s.court.player_right_odd.name, 'Bob');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 0]);
		assert.equal(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);

		alt_presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [21, 20]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_even.name, 'Andrew');
		assert.equal(s.court.player_left_odd.name, 'Alice');
		assert.equal(s.court.player_right_even.name, 'Birgit');
		assert.equal(s.court.player_right_odd.name, 'Bob');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 0]);
		assert.equal(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);

		alt_presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [22, 20]);
		assert.equal(s.game.service_over, null);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, true);
		assert.equal(s.game.finished, true);
		assert.equal(s.game.team1_won, true);
		assert.equal(s.game.team1_serving, null);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);
		assert.equal(s.court.player_left_even.name, 'Andrew');
		assert.equal(s.court.player_left_odd.name, 'Alice');
		assert.equal(s.court.player_right_even.name, 'Birgit');
		assert.equal(s.court.player_right_odd.name, 'Bob');
		assert.equal(s.match.finished, true);
		assert.strictEqual(s.match.team1_won, true);
		assert.deepEqual(s.match.game_score, [2, 0]);
		assert.equal(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.equal(s.match.finish_confirmed, false);

		alt_presses.push({
			type: 'postmatch-confirm',
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(s.match.finished, true);
		assert.strictEqual(s.match.team1_won, true);
		assert.equal(s.match.finish_confirmed, true);
		assert.deepEqual(s.match.game_score, [2, 0]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [22, 20]);

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [19, 21]);
		assert.equal(s.game.service_over, null);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, true);
		assert.equal(s.game.finished, true);
		assert.equal(s.game.team1_won, false);
		assert.equal(s.game.team1_serving, null);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_left_odd.name, 'Andrew');
		assert.equal(s.court.player_right_even.name, 'Birgit');
		assert.equal(s.court.player_right_odd.name, 'Bob');
		assert.equal(s.match.finished, false);
		assert.strictEqual(s.match.team1_won, null);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.equal(s.match.finished_games.length, 1);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.started, false);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even, null);
		assert.equal(s.court.player_left_odd, null);
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [19, 21]);

		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 1, // Birgit serves
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.started, false);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Birgit');
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_right_even, null);
		assert.equal(s.court.player_right_odd, null);
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [19, 21]);

		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 1, // Alice receives
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.started, false);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Birgit');
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.player_right_odd.name, 'Andrew');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [19, 21]);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Birgit');
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.player_right_odd.name, 'Andrew');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [19, 21]);

		presses.push({
			type: 'score',
			side: 'right',
		});
		press_score(presses, 8, 8);
		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [9, 9]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_even.name, 'Birgit');
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.player_right_odd.name, 'Andrew');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [19, 21]);

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [9, 10]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_left_odd.name, 'Birgit');
		assert.equal(s.court.player_right_even.name, 'Alice');
		assert.equal(s.court.player_right_odd.name, 'Andrew');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [19, 21]);

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [9, 11]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, true);
		assert.equal(s.game.change_sides, true);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_left_odd.name, 'Andrew');
		assert.equal(s.court.player_right_even.name, 'Birgit');
		assert.equal(s.court.player_right_odd.name, 'Bob');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [19, 21]);

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [9, 12]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_left_odd.name, 'Andrew');
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.player_right_odd.name, 'Birgit');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [19, 21]);

		press_score(presses, 7, 7);
		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [17, 19]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_left_odd.name, 'Andrew');
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.player_right_odd.name, 'Birgit');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [19, 21]);

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [17, 20]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, true);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_left_odd.name, 'Andrew');
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.player_right_odd.name, 'Birgit');
		assert.equal(s.match.finished, false);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [19, 21]);

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [18, 20]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_left_odd.name, 'Andrew');
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.player_right_odd.name, 'Birgit');
		assert.equal(s.match.finished, false);
		assert.strictEqual(s.match.team1_won, null);
		assert.deepEqual(s.match.game_score, [1, 1]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [19, 21]);

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.match.finish_confirmed, false);
		assert.deepEqual(s.game.score, [18, 21]);
		assert.equal(s.game.service_over, null);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.game, true);
		assert.equal(s.game.finished, true);
		assert.equal(s.game.team1_won, false);
		assert.equal(s.game.team1_serving, null);
		assert.equal(s.game.team1_left, true);
		assert.equal(s.court.left_serving, null);
		assert.equal(s.court.serving_downwards, null);
		assert.equal(s.court.player_left_even.name, 'Alice');
		assert.equal(s.court.player_left_odd.name, 'Andrew');
		assert.equal(s.court.player_right_even.name, 'Bob');
		assert.equal(s.court.player_right_odd.name, 'Birgit');
		assert.equal(s.match.finished, true);
		assert.equal(s.match.team1_won, false);
		assert.deepEqual(s.match.game_score, [1, 2]);
		assert.equal(s.match.finished_games.length, 2);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [19, 21]);

		presses.push({
			type: 'postmatch-confirm',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.match.finished, true);
		assert.equal(s.match.finish_confirmed, true);
		assert.deepEqual(s.match.game_score, [1, 2]);
		assert.equal(s.match.team1_won, false);
		assert.equal(s.match.finished_games.length, 3);
		assert.deepEqual(s.match.finished_games[0].score, [21, 19]);
		assert.deepEqual(s.match.finished_games[1].score, [19, 21]);
		assert.deepEqual(s.match.finished_games[2].score, [18, 21]);
	});

	_it('Undo', function() {
		var s = state_after([], DOUBLES_SETUP);
		assert.equal(s.undo_possible, false);
		assert.equal(s.redo_possible, false);

		var presses = [{
			type: 'pick_side', // Andrew&Alice pick right
			team1_left: false,
		}];
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.undo_possible, true);
		assert.equal(s.redo_possible, false);

		var presses_test = presses.slice();
		presses_test.push({
			type: 'undo',
		});
		s = state_after(presses_test, DOUBLES_SETUP);
		assert.equal(s.undo_possible, false);
		assert.equal(s.redo_possible, true);
		assert.deepEqual(s.flattened_presses, []);

		presses_test.push({
			type: 'redo',
		});
		s = state_after(presses_test, DOUBLES_SETUP);
		assert.equal(s.undo_possible, true);
		assert.equal(s.redo_possible, false);
		assert.deepEqual(s.flattened_presses, presses);

		presses.push({
			type: 'pick_server', // Birgit serves
			team_id: 1,
			player_id: 1,
		});
		presses.push({
			type: 'pick_receiver', // Andrew receives
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		var presses_backup = presses.slice();
		presses.push({
			type: 'score',
			side: 'left',
		});
		var presses_backup2 = presses.slice();
		presses.push({
			type: 'score',
			side: 'left',
		});
		var presses_backup3 = presses.slice();
		presses.push({
			type: 'undo',
		});
		presses.push({
			type: 'undo',
		});

		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.undo_possible, true);
		assert.equal(s.redo_possible, true);
		assert.deepEqual(s.flattened_presses, presses_backup);
		assert.equal(s.match.finished, false);
		assert.equal(s.match.finished_games.length, 0);
		assert.deepEqual(s.match.game_score, [0, 0]);
		assert.deepEqual(s.game.score, [1, 0]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Birgit');
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Andrew');
		assert.equal(s.court.player_right_odd.name, 'Alice');

		presses.push({
			type: 'redo',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.undo_possible, true);
		assert.equal(s.redo_possible, true);
		assert.deepEqual(s.flattened_presses, presses_backup2);
		assert.equal(s.match.finished, false);
		assert.equal(s.match.finished_games.length, 0);
		assert.deepEqual(s.match.game_score, [0, 0]);
		assert.deepEqual(s.game.score, [1, 1]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_even.name, 'Birgit');
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Andrew');
		assert.equal(s.court.player_right_odd.name, 'Alice');

		presses.push({
			type: 'undo',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.undo_possible, true);
		assert.equal(s.redo_possible, true);
		assert.deepEqual(s.flattened_presses, presses_backup);
		assert.equal(s.match.finished, false);
		assert.equal(s.match.finished_games.length, 0);
		assert.deepEqual(s.match.game_score, [0, 0]);
		assert.deepEqual(s.game.score, [1, 0]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, true);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, false);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Birgit');
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Andrew');
		assert.equal(s.court.player_right_odd.name, 'Alice');

		presses.push({
			type: 'redo',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.undo_possible, true);
		assert.equal(s.redo_possible, true);
		assert.deepEqual(s.flattened_presses, presses_backup2);
		assert.equal(s.match.finished, false);
		assert.equal(s.match.finished_games.length, 0);
		assert.deepEqual(s.match.game_score, [0, 0]);
		assert.deepEqual(s.game.score, [1, 1]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, true);
		assert.equal(s.court.player_left_even.name, 'Birgit');
		assert.equal(s.court.player_left_odd.name, 'Bob');
		assert.equal(s.court.player_right_even.name, 'Andrew');
		assert.equal(s.court.player_right_odd.name, 'Alice');

		presses.push({
			type: 'redo',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(s.undo_possible, true);
		assert.equal(s.redo_possible, false);
		assert.deepEqual(s.flattened_presses, presses_backup3);
		assert.equal(s.match.finished, false);
		assert.equal(s.match.finished_games.length, 0);
		assert.deepEqual(s.match.game_score, [0, 0]);
		assert.deepEqual(s.game.score, [1, 2]);
		assert.equal(s.game.service_over, false);
		assert.equal(s.game.interval, false);
		assert.equal(s.game.change_sides, false);
		assert.equal(s.game.gamepoint, false);
		assert.equal(s.game.matchpoint, false);
		assert.equal(s.game.finished, false);
		assert.equal(s.game.game, false);
		assert.equal(s.game.team1_won, null);
		assert.equal(s.game.team1_serving, false);
		assert.equal(s.game.team1_left, false);
		assert.equal(s.court.left_serving, true);
		assert.equal(s.court.serving_downwards, false);
		assert.equal(s.court.player_left_even.name, 'Bob');
		assert.equal(s.court.player_left_odd.name, 'Birgit');
		assert.equal(s.court.player_right_even.name, 'Andrew');
		assert.equal(s.court.player_right_odd.name, 'Alice');
	});

	_it('Retiring', function() {
		var presses = [{
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		}];
		presses.push({
			type: 'pick_server', // Andrew serves
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'left',
		});

		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [2, 1]);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.match.team1_won, null);

		var presses_retired = presses.slice();
		presses_retired.push({
			type: 'retired',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses_retired, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.match.team1_won, true);
		assert.deepEqual(s.game.score, [2, 1]);
		assert.strictEqual(s.game.won_by_score, false);

		presses_retired = presses.slice();
		presses_retired.push({
			type: 'retired',
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses_retired, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.match.team1_won, true);
		assert.deepEqual(s.game.score, [2, 1]);
		assert.strictEqual(s.game.won_by_score, false);

		presses_retired = presses.slice();
		presses_retired.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses_retired, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.match.team1_won, false);
		assert.deepEqual(s.game.score, [2, 1]);
		assert.strictEqual(s.game.won_by_score, false);

		presses_retired = presses.slice();
		presses_retired.push({
			type: 'retired',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses_retired, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.match.team1_won, false);
		assert.deepEqual(s.game.score, [2, 1]);
		assert.strictEqual(s.game.won_by_score, false);
	});

	_it('Disqualification', function() {
		var presses = [{
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		}];
		presses.push({
			type: 'pick_server', // Andrew serves
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 3, 1);

		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [3, 1]);
		assert.strictEqual(s.match.finished, false);
		assert.strictEqual(s.match.team1_won, null);

		var presses_disqualified = presses.slice();
		presses_disqualified.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses_disqualified, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.match.team1_won, true);
		assert.deepEqual(s.game.score, [3, 1]);
		assert.strictEqual(s.game.won_by_score, false);

		presses_disqualified = presses.slice();
		presses_disqualified.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses_disqualified, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.match.team1_won, true);
		assert.deepEqual(s.game.score, [3, 1]);
		assert.strictEqual(s.game.won_by_score, false);

		presses_disqualified = presses.slice();
		presses_disqualified.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses_disqualified, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.match.team1_won, false);
		assert.deepEqual(s.game.score, [3, 1]);
		assert.strictEqual(s.game.won_by_score, false);

		presses_disqualified = presses.slice();
		presses_disqualified.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses_disqualified, DOUBLES_SETUP);
		assert.strictEqual(s.match.finished, true);
		assert.strictEqual(s.match.team1_won, false);
		assert.deepEqual(s.game.score, [3, 1]);
		assert.strictEqual(s.game.won_by_score, false);
	});

	_it('timer should continue after red card at 11', function() {
		var presses = [{
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		}];
		presses.push({
			type: 'pick_server', // Andrew serves
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 1, 0);
		var s = state_after(presses, DOUBLES_SETUP);
		assert(!s.timer);

		press_score(presses, 9, 5);
		press_score(presses, 1, 0);
		s = state_after(presses, DOUBLES_SETUP);
		assert(s.timer);

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert(s.timer);

		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert(s.timer);

		press_score(presses, 0, 1);
		s = state_after(presses, DOUBLES_SETUP);
		assert(! s.timer);
	});

	_it('delete marks correctly', function() {
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
		}];
		press_score(presses, 10, 5);
		var referee = {
			type: 'referee',
		};
		presses.push(referee);
		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.marks, [
			referee,
		]);

		var sav_presses = presses.slice();
		press_score(presses, 1, 0);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.marks, []);

		presses = sav_presses.slice();
		var red_card = {
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		};
		presses.push(red_card);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.marks, [
			referee,
			red_card,
		]);

		press_score(presses, 10, 5);
		presses.push(referee);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.marks, [
			referee,
		]);

		sav_presses = presses.slice();
		press_score(presses, 1, 0);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.marks, []);

		presses = sav_presses.slice();
		var red_card2 = {
			type: 'red-card',
			team_id: 1,
			player_id: 0,
			timestamp: 99,
		};
		presses.push(red_card2);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.marks, [
			referee,
			red_card2,
		]);
	});

	_it('suspending match in interval', function() {
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
		}];
		press_score(presses, 10, 2);
		press_score(presses, 0, 1);
		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 1000,
		});

		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [11, 3]);
		assert.strictEqual(s.match.suspended, false);
		assert.strictEqual(s.match.just_unsuspended, false);
		assert.ok(!s.timer.upwards);
		assert.strictEqual(s.timer.start, 1000);
		assert.strictEqual(s.timer.duration, 60000);

		presses.push({
			type: 'suspension',
			timestamp: 1010,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.suspended, true);
		assert.strictEqual(s.match.just_unsuspended, false);
		assert.deepEqual(s.timer, {
			start: 1010,
			upwards: true,
		});

		presses.push({
			type: 'resume',
			timestamp: 1020,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.suspended, false);
		assert.strictEqual(s.match.just_unsuspended, true);
		assert.strictEqual(s.timer.start, 1000);
		assert.strictEqual(s.timer.duration, 60000);

		press_score(presses, 1, 0);
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.suspended, false);
		assert.strictEqual(s.match.just_unsuspended, false);
		assert.strictEqual(s.timer, false);
	});

	_it('injury', function() {
		var presses = [{
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		}];
		presses.push({
			type: 'pick_server', // Andrew serves
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
			timestamp: 5000,
		});

		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 7000,
		});
		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [1, 0]);
		assert.strictEqual(s.timer, false);
		assert.strictEqual(s.match.injuries, false);

		var st = bup.stats.calc_stats(s);
		assert.deepStrictEqual(
			st.cols[0].rally_lengths, [2000]);
		assert.strictEqual(st.cols[0].avg_rally_length, '0:02');

		// 1 simple injury
		var injury1 = {
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 10000,
		};
		presses.push(injury1);
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.timer.upwards, true);
		assert.strictEqual(s.timer.start, 10000);
		assert.deepStrictEqual(s.match.injuries, [injury1]);

		// Healed quickly
		presses.push({
			type: 'injury-resume',
			team_id: 0,
			player_id: 0,
			timestamp: 14000,
		});
		st = bup.stats.calc_stats(s);
		assert.deepStrictEqual(
			st.cols[0].rally_lengths, [2000]);
		assert.strictEqual(st.cols[0].avg_rally_length, '0:02');

		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 20000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [2, 0]);
		assert.strictEqual(s.timer, false);
		assert.strictEqual(s.match.injuries, false);

		st = bup.stats.calc_stats(s);
		assert.deepStrictEqual(
			st.cols[0].rally_lengths, [2000, 6000]);
		assert.strictEqual(st.cols[0].avg_rally_length, '0:04');

		// Injury again
		var injury2 = {
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 30000,
		};
		presses.push(injury2);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [2, 0]);
		assert.deepStrictEqual(s.match.injuries, [injury2]);
		assert.strictEqual(s.timer.upwards, true);
		assert.strictEqual(s.timer.start, 30000);

		// Call the referee
		presses.push({
			type: 'referee',
			team_id: 0,
			player_id: 0,
			timestamp: 31000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [2, 0]);
		assert.deepStrictEqual(s.match.injuries, [injury2]);
		assert.strictEqual(s.timer.upwards, true);
		assert.strictEqual(s.timer.start, 30000);

		// Other player complains that it's all fake
		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
			timestamp: 40000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [3, 0]);
		assert.deepStrictEqual(s.match.injuries, [injury2]);
		assert.ok(s.timer);
		assert.strictEqual(s.timer.upwards, true);
		assert.strictEqual(s.timer.start, 30000);

		// Partner gets injured as well during helping
		var injury3 = {
			type: 'injury',
			team_id: 0,
			player_id: 1,
			timestamp: 50000,
		};
		presses.push(injury3);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [3, 0]);
		assert.deepStrictEqual(s.match.injuries, [injury2, injury3]);
		assert.strictEqual(s.timer.upwards, true);
		assert.strictEqual(s.timer.start, 30000);

		// Just as the first player has recovered, he trips over partner once again (double injury)
		var injury4 = {
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 51000,
		};
		presses.push(injury4);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [3, 0]);
		assert.deepStrictEqual(s.match.injuries, [injury2, injury3, injury4]);
		assert.strictEqual(s.timer.upwards, true);
		assert.strictEqual(s.timer.start, 30000);

		// It was all just a flesh wound
		presses.push({
			type: 'injury-resume',
			timestamp: 53000,
		});
		presses.push({
			type: 'score',
			side: 'right',
			timestamp: 60000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [3, 1]);
		assert.strictEqual(s.timer, false);
		st = bup.stats.calc_stats(s);
		assert.deepStrictEqual(
			st.cols[0].rally_lengths, [2000, 6000, 7000]);
		assert.strictEqual(st.cols[0].avg_rally_length, '0:05');

		presses.push({
			type: 'score',
			side: 'right',
			timestamp: 160000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [3, 2]);
		assert.strictEqual(s.timer, false);

		st = bup.stats.calc_stats(s);
		assert.deepStrictEqual(
			st.cols[0].rally_lengths, [2000, 6000, 7000, 100000]);
		assert.strictEqual(st.cols[0].avg_rally_length, '0:29');

		// Injury before interval
		press_score(presses, 7, 7);
		presses.push({
			type: 'score',
			side: 'right',
			timestamp: 1000000,
		});
		var injury5 = {
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 1001000,
		};
		presses.push(injury5);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [10, 10]);
		assert.deepStrictEqual(s.match.injuries, [injury5]);
		assert.deepStrictEqual(s.timer, {
			upwards: true,
			start: 1001000,
		});

		presses.push({
			type: 'injury-resume',
			side: 'left',
			start: 1008000,
		});
		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 1010000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [11, 10]);
		assert.strictEqual(s.match.injuries, false);
		assert.deepStrictEqual(s.timer, {
			start: 1010000,
			duration: 60000,
			exigent: 20499,
		});

		var injury6 = {
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 1020000,
		};
		presses.push(injury6);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [11, 10]);
		assert.deepStrictEqual(s.match.injuries, [injury6]);
		assert.deepStrictEqual(s.timer, {
			upwards: true,
			start: injury6.timestamp,
		});

		presses.push({
			type: 'injury-resume',
			timestamp: 1025000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [11, 10]);
		assert.deepStrictEqual(s.match.injuries, false);
		assert.deepStrictEqual(s.timer, {
			start: 1010000,
			duration: 60000,
			exigent: 20499,
		});

		// Injury during game end
		press_score(presses, 9, 0);
		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 1200000,
		})
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [21, 10]);
		assert.deepStrictEqual(s.timer, {
			start: 1200000,
			duration: 120000,
			exigent: 20499,
		});

		var base_presses = presses.slice();
		var injury7 = {
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 1230000,
		};
		presses.push(injury7);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [21, 10]);
		assert.deepStrictEqual(s.match.injuries, [injury7]);
		assert.deepStrictEqual(s.timer, {
			upwards: true,
			start: injury7.timestamp,
		});

		presses.push({
			type: 'injury-resume',
			timestamp: 1240000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.game.score, [21, 10]);
		assert.deepStrictEqual(s.match.injuries, false);
		assert.deepStrictEqual(s.timer, {
			start: 1200000,
			duration: 120000,
			exigent: 20499,
		});

		presses = base_presses.slice();
		presses.push({
			type: 'postgame-confirm',
			timestamp: 1201000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.timer, {
			start: 1200000,
			duration: 120000,
			exigent: 20499,
		});
		presses.push(injury7);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.match.injuries, [injury7]);
		assert.deepStrictEqual(s.timer, {
			upwards: true,
			start: injury7.timestamp,
		});

		presses.push({
			type: 'injury-resume',
			timestamp: 1240000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.match.injuries, false);
		assert.deepStrictEqual(s.timer, {
			start: 1200000,
			duration: 120000,
			exigent: 20499,
		});
	});

	_it('suspension before match start', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}];
		presses.push({
			type: 'suspension',
		});
		var s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.suspended, true);

		presses.push({
			type: 'resume',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.just_unsuspended, true);

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.just_unsuspended, false);

		press_score(presses, 1, 0);
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.just_unsuspended, false);
	});

	_it('suspension during injury', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team1_id: 0,
		}, {
			type: 'love-all',
		}];
		presses.push({
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 10000,
		});

		var s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.timer, {
			upwards: true,
			start: 10000,
		});

		presses.push({
			type: 'suspension',
			timestamp: 20000,
		});
		var s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.timer, {
			upwards: true,
			start: 20000,
		});

		presses.push({
			type: 'resume',
			timestamp: 30000,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.timer, {
			upwards: true,
			start: 10000,
		});
	});

	_it('injury during suspension', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team1_id: 0,
		}, {
			type: 'love-all',
		}];
		presses.push({
			type: 'suspension',
			timestamp: 10000,
		});

		var s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.timer, {
			upwards: true,
			start: 10000,
		});

		presses.push({
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 20000,
		});
		var s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.timer, {
			upwards: true,
			start: 10000,
		});

		presses.push({
			type: 'resume',
			timestamp: 30000,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepStrictEqual(s.timer, {
			upwards: true,
			start: 20000,
		});
	});
});

_describe('calc helper functions', function() {
	_it('game_winner', function() {
		assert.equal(bup.calc.game_winner(21, 19), 'left');
		assert.equal(bup.calc.game_winner(19, 21), 'right');
		assert.equal(bup.calc.game_winner(22, 20), 'left');
		assert.equal(bup.calc.game_winner(25, 27), 'right');
		assert.equal(bup.calc.game_winner(29, 30), 'right');
		assert.equal(bup.calc.game_winner(28, 30), 'right');
		assert.equal(bup.calc.game_winner(0, 0), 'inprogress');
		assert.equal(bup.calc.game_winner(20, 19), 'inprogress');
		assert.equal(bup.calc.game_winner(25, 26), 'inprogress');
		assert.equal(bup.calc.game_winner(29, 29), 'inprogress');
		assert.equal(bup.calc.game_winner(22, 19), 'invalid');
		assert.equal(bup.calc.game_winner(32, 30), 'invalid');
		assert.equal(bup.calc.game_winner(30, 31), 'invalid');
		assert.equal(bup.calc.game_winner(30, 30), 'invalid');
		assert.equal(bup.calc.game_winner(28, 25), 'invalid');
	});
});

})();