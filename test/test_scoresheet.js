'use strict';

var assert = require('assert');
var _ = require('underscore');

var test_utils = require('./test_utils');
var _describe = test_utils._describe;
var _it = test_utils._it;
var DOUBLES_SETUP = test_utils.DOUBLES_SETUP;
var SINGLES_SETUP = test_utils.SINGLES_SETUP;
var press_score = test_utils.press_score;
var state_after = test_utils.state_after;

var bup = require('../bup');

_describe('scoresheet generation', function() {
	function _scoresheet_cells(presses, setup) {
		var state = state_after(presses, setup);
		return bup._scoresheet_parse_match(state, 35);
	}

	function _assert_cell(cells, cell) {
		assert(cells.some(function(c) {
			return _.isEqual(cell, c);
		}), 'Cannot find cell ' + JSON.stringify(cell) + ' in ' + JSON.stringify(cells, undefined, 2));
	}

	_it('0-0 in third game', function() {
		var presses = [{
			'type': 'pick_side', // Andrew&Alice pick left
			'team1_left': true,
		}];
		presses.push({
			'type': 'pick_server', // Andrew serves
			'team_id': 0,
			'player_id': 0,
		});
		presses.push({
			'type': 'pick_receiver', // Bob receives
			'team_id': 1,
			'player_id': 0,
		});
		presses.push({
			'type': 'love-all'
		});
		press_score(presses, 21, 0);
		presses.push({
			'type': 'postgame-confirm'
		});

		presses.push({
			'type': 'pick_server', // Andrew serves
			'team_id': 0,
			'player_id': 0,
		});
		presses.push({
			'type': 'pick_receiver', // Bob receives
			'team_id': 1,
			'player_id': 0,
		});
		presses.push({
			'type': 'love-all'
		});
		press_score(presses, 21, 0);
		presses.push({
			'type': 'postgame-confirm'
		});

		presses.push({
			'type': 'pick_server', // Bob serves
			'team_id': 1,
			'player_id': 0,
		});
		presses.push({
			'type': 'pick_receiver', // Andrew receives
			'team_id': 0,
			'player_id': 0,
		});
		presses.push({
			'type': 'love-all'
		});

		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		cells.forEach(function(c) {
			assert.equal(typeof c.table, 'number', JSON.stringify(c) + ' is missing a table value');
			assert(! isNaN(c.table), JSON.stringify(c) + ' has NaN table value');
			assert.equal(typeof c.col, 'number', JSON.stringify(c) + ' is missing a col value');
			assert(! isNaN(c.table), JSON.stringify(c) + ' has NaN col value');
		});
		_assert_cell(cells, {
			table: 2,
			col: -1,
			row: 0,
			val: 'R'
		});
		_assert_cell(cells, {
			table: 2,
			col: -1,
			row: 2,
			val: 'A'
		});
		_assert_cell(cells, {
			table: 2,
			col: 0,
			row: 0,
			val: 0
		});
		_assert_cell(cells, {
			table: 2,
			col: 0,
			row: 2,
			val: 0
		});
	});

	_it('overrule', function() {
		var presses = [{
			'type': 'pick_side', // Andrew&Alice pick left
			'team1_left': true,
		}];
		presses.push({
			'type': 'pick_server', // Andrew serves
			'team_id': 0,
			'player_id': 0,
		});
		presses.push({
			'type': 'pick_receiver', // Bob receives
			'team_id': 1,
			'player_id': 0,
		});
		presses.push({
			'type': 'love-all'
		});
		presses.push({
			type: 'score',
			side: 'left'
		});
		presses.push({
			type: 'overrule',
		});

		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 0,
			row: 0,
			val: 0
		});
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 0,
			val: 1
		});
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 1,
			val: 'O'
		});

		presses.push({
			type: 'score',
			side: 'right'
		});
		presses.push({
			type: 'overrule',
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 3,
			val: 1
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 2,
			val: 'O'
		});

		presses.push({
			type: 'score',
			side: 'left'
		});
		presses.push({
			type: 'referee',  // to ask how overruling works
		});
		presses.push({
			type: 'overrule',
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 1,
			val: 2
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 0,
			val: 'O'
		});
	});

	_it('injuries', function() {
		var presses = [];
		presses.push({
			'type': 'pick_side', // Andrew&Alice pick left
			'team1_left': true,
		});
		presses.push({
			'type': 'pick_server', // Andrew serves
			'team_id': 0,
			'player_id': 0,
		});
		presses.push({
			'type': 'pick_receiver', // Bob receives
			'team_id': 1,
			'player_id': 0,
		});
		presses.push({
			'type': 'love-all'
		});
		presses.push({
			type: 'injury',
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'referee',
		});

		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 0,
			val: 'V'
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 0,
			val: 'R'
		});

		presses.push({
			type: 'injury',
			team_id: 1,
			player_id: 1,
		});
		presses.push({
			type: 'referee',
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 3,
			val: 'V'
		});
		_assert_cell(cells, {
			table: 0,
			col: 4,
			row: 3,
			val: 'R'
		});

		presses.push({
			type: 'injury',
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'referee',
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 5,
			row: 2,
			val: 'V'
		});
		_assert_cell(cells, {
			table: 0,
			col: 6,
			row: 2,
			val: 'R'
		});
	});

	_it('yellow card', function() {
		var base_presses = [];
		base_presses.push({
			'type': 'pick_side', // Andrew&Alice pick left
			'team1_left': true,
		});
		base_presses.push({
			'type': 'pick_server', // Alice serves
			'team_id': 0,
			'player_id': 1,
		});
		base_presses.push({
			'type': 'pick_receiver', // Bob receives
			'team_id': 1,
			'player_id': 0,
		});
		base_presses.push({
			'type': 'love-all'
		});
		var presses = base_presses.slice();
		presses.push({
			type: 'yellow-card',
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'referee',
		});

		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 1,
			val: 'W'
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 1,
			val: 'R'
		});

		presses.push({
			type: 'yellow-card',
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'referee',
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 2,
			val: 'W'
		});
		_assert_cell(cells, {
			table: 0,
			col: 4,
			row: 2,
			val: 'R'
		});

		presses = base_presses.slice();
		presses.push({
			type: 'yellow-card',
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'score',
			side: 'left'
		});
		presses.push({
			type: 'score',
			side: 'left'
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 1,
			val: 'W'
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 1,
			val: 1
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 1,
			val: 2
		});
	});

	_it('referee', function() {
		var presses = [];
		presses.push({
			'type': 'pick_side', // Andrew&Alice pick left
			'team1_left': true,
		});
		presses.push({
			'type': 'pick_server', // Birgit serves
			'team_id': 1,
			'player_id': 1,
		});
		presses.push({
			'type': 'pick_receiver', // Alice receives
			'team_id': 0,
			'player_id': 1,
		});
		presses.push({
			'type': 'love-all'
		});
		presses.push({
			type: 'referee', // Because of leaking roof
		});

		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 1,
			val: 'R'
		});
	});

	_it('interruption', function() {
		var presses = [];
		presses.push({
			'type': 'pick_side', // Andrew&Alice pick left
			'team1_left': true,
		});
		presses.push({
			'type': 'pick_server', // Andrew serves
			'team_id': 0,
			'player_id': 0,
		});
		presses.push({
			'type': 'pick_receiver', // Bob receives
			'team_id': 1,
			'player_id': 0,
		});
		presses.push({
			'type': 'love-all'
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'interruption',
		});
		presses.push({
			type: 'referee',
		});

		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 3,
			val: 1
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 1,
			val: 'U'
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 1,
			val: 'R'
		});
	});

	_it('correction', function() {
		var presses = [];
		presses.push({
			'type': 'pick_side', // Andrew&Alice pick left
			'team1_left': true,
		});
		presses.push({
			'type': 'pick_server', // Andrew serves
			'team_id': 0,
			'player_id': 0,
		});
		presses.push({
			'type': 'pick_receiver', // Bob receives
			'team_id': 1,
			'player_id': 0,
		});
		presses.push({
			'type': 'love-all'
		});
		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'correction',
		});
		presses.push({
			type: 'referee',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});

		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 0,
			val: 1
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 1,
			val: 'C'
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 1,
			val: 'R'
		});
		_assert_cell(cells, {
			table: 0,
			col: 4,
			row: 3,
			val: 1
		});
	});

	_it('red card', function() {
		var presses = [];
		presses.push({
			'type': 'pick_side', // Andrew&Alice pick left
			'team1_left': true,
		});
		presses.push({
			'type': 'pick_server', // Alice serves
			'team_id': 0,
			'player_id': 1,
		});
		presses.push({
			'type': 'pick_receiver', // Bob receives
			'team_id': 1,
			'player_id': 0,
		});
		presses.push({
			'type': 'love-all'
		});
		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'referee',
		});
		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 0,
		});

		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 1,
			val: 'F'
		});
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 3,
			val: 1
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 1,
			val: 'R'
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 0,
			val: 'F'
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 3,
			val: 2
		});

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 1,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 4,
			row: 3,
			val: 'F'
		});
		_assert_cell(cells, {
			table: 0,
			col: 4,
			row: 0,
			val: 1
		});
	});

	_it('red card in singles', function() {
		var presses = [];
		presses.push({
			'type': 'pick_side', // Alice picks left
			'team1_left': true,
		});
		presses.push({
			'type': 'pick_server', // Alice serves
			'team_id': 0,
			'player_id': 0,
		});
		presses.push({
			'type': 'love-all'
		});
		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'referee',
		});
		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});

		var cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 2,
			val: 'F'
		});
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 0,
			val: 1
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 2,
			val: 'R'
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 2,
			val: 'F'
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 0,
			val: 2
		});

		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 0,
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 4,
			row: 0,
			val: 'F'
		});
		_assert_cell(cells, {
			table: 0,
			col: 4,
			row: 2,
			val: 1
		});

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'referee',
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);

		_assert_cell(cells, {
			table: 0,
			col: 5,
			row: 2,
			val: 'F'
		});
		_assert_cell(cells, {
			table: 0,
			col: 5,
			row: 0,
			val: 3
		});
		_assert_cell(cells, {
			table: 0,
			col: 6,
			row: 2,
			val: 'R'
		});
	});

	_it('retired', function() {
		var base_presses = [];
		base_presses.push({
			'type': 'pick_side', // Andrew&Alice pick left
			'team1_left': true,
		});
		base_presses.push({
			'type': 'pick_server', // Andrew serves
			'team_id': 0,
			'player_id': 0,
		});
		base_presses.push({
			'type': 'pick_receiver', // Bob receives
			'team_id': 1,
			'player_id': 0,
		});
		base_presses.push({
			'type': 'love-all'
		});
		base_presses.push({
			type: 'score',
			side: 'left',
		});

		var presses = base_presses.slice();
		presses.push({
			type: 'retired',
			team_id: 1,
			player_id: 1,
		});
		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 3,
			val: 'A'
		});

		presses = base_presses.slice();
		presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 0,
			val: 'A'
		});
	});

	_it('disqualified', function() {
		var base_presses = [];
		base_presses.push({
			'type': 'pick_side', // Andrew&Alice pick left
			'team1_left': true,
		});
		base_presses.push({
			'type': 'pick_server', // Andrew serves
			'team_id': 0,
			'player_id': 0,
		});
		base_presses.push({
			'type': 'pick_receiver', // Bob receives
			'team_id': 1,
			'player_id': 0,
		});
		base_presses.push({
			'type': 'love-all'
		});
		base_presses.push({
			type: 'score',
			side: 'left',
		});

		var presses = base_presses.slice();
		presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 2,
			type: 'longtext',
			val: 'Disqualifiziert'
		});

		presses = base_presses.slice();
		presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 1,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 1,
			type: 'longtext',
			val: 'Disqualifiziert'
		});
	});	
});