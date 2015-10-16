'use strict';

var assert = require('assert');
var _ = require('underscore');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var DOUBLES_SETUP = tutils.DOUBLES_SETUP;
var SINGLES_SETUP = tutils.SINGLES_SETUP;
var press_score = tutils.press_score;
var state_after = tutils.state_after;
var bup = tutils.bup;


_describe('scoresheet generation', function() {
	function _scoresheet_cells(presses, setup) {
		var state = state_after(presses, setup);
		return bup.scoresheet._parse_match(state, 35);
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
			val: 0,
			type: 'score',
		});
		_assert_cell(cells, {
			table: 2,
			col: 0,
			row: 2,
			val: 0,
			type: 'score',
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
			val: 0,
			type: 'score',
		});
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 0,
			val: 1,
			type: 'score',
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
			val: 1,
			type: 'score',
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
			val: 2,
			type: 'score',
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
			val: 1,
			type: 'score',
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 1,
			val: 2,
			type: 'score',
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
			val: 1,
			type: 'score',
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
			val: 1,
			type: 'score',
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
			val: 2,
			type: 'score',
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
			val: 1,
			type: 'score',
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
			val: 1,
			type: 'score',
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
			val: 2,
			type: 'score',
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
			val: 1,
			type: 'score',
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
			val: 3,
			type: 'score',
		});
		_assert_cell(cells, {
			table: 0,
			col: 6,
			row: 2,
			val: 'R'
		});
	});

	_it('red card after match', function() {
		var presses = [];
		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all'
		});
		press_score(presses, 21, 5);
		presses.push({
			type: 'postgame-confirm'
		});
		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 0, 21);
		presses.push({  // Red card against Bob after he lost 21-0
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});

		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 1,
			col: 20,
			row: 1,
			type: 'score',
			val: 20,
		});
		_assert_cell(cells, {
			table: 1,
			col: 21,
			row: 1,
			type: 'score',
			val: 21,
		});
		_assert_cell(cells, {
			table: 1,
			col: 22,
			row: 2,
			val: 'F',
		});
		cells.forEach(function(cell) {
			if (cell.type == 'score') {
				assert(cell.val <= 21);
			}
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

		var presses = base_presses.slice();
		presses.push({
			type: 'score',
			side: 'left',
		});
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
			val: 'Disqualifiziert',
			width: 4,
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
			col: 1,
			row: 1,
			type: 'longtext',
			val: 'Disqualifiziert',
			width: 4,
		});
	});	

	_it('correction (service court error)', function() {
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
			type: 'love-all'
		});

		presses.push({
			type: 'score',
			side: 'right'
		});
		presses.push({
			type: 'score',
			side: 'left'
		});
		presses.push({
			type: 'correction',
			team_id: 0,
		});
		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 3,
			type: 'score',
			val: 1
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 1,
			type: 'score',
			val: 1
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 0,
			val: 'C'
		});

		presses.push({
			type: 'score',
			side: 'right'
		});
		presses.push({
			type: 'score',
			side: 'left'
		});
		presses.push({
			type: 'correction',
			team_id: 0,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 2,
			type: 'score',
			val: 2
		});
		_assert_cell(cells, {
			table: 0,
			col: 4,
			row: 0,
			type: 'score',
			val: 2
		});
		_assert_cell(cells, {
			table: 0,
			col: 4,
			row: 1,
			val: 'C'
		});

		presses.push({
			type: 'score',
			side: 'right'
		});
		presses.push({
			type: 'score',
			side: 'right'
		});
		presses.push({
			type: 'correction',
			team_id: 1,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 5,
			row: 3,
			type: 'score',
			val: 3
		});
		_assert_cell(cells, {
			table: 0,
			col: 6,
			row: 3,
			type: 'score',
			val: 4
		});
		_assert_cell(cells, {
			table: 0,
			col: 6,
			row: 2,
			val: 'C'
		});

		presses.push({
			type: 'score',
			side: 'left'
		});
		presses.push({
			type: 'score',
			side: 'right'
		});
		presses.push({
			type: 'correction',
			team_id: 1,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 7,
			row: 1,
			type: 'score',
			val: 3
		});
		_assert_cell(cells, {
			table: 0,
			col: 8,
			row: 2,
			type: 'score',
			val: 5
		});
		_assert_cell(cells, {
			table: 0,
			col: 8,
			row: 3,
			val: 'C'
		});

		// Now against the receiver
		presses.push({
			type: 'score',
			side: 'left'
		});
		presses.push({
			type: 'score',
			side: 'right'
		});
		presses.push({
			type: 'score',
			side: 'right'
		});
		presses.push({
			type: 'correction',
			team_id: 0,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 9,
			row: 0,
			type: 'score',
			val: 4
		});
		_assert_cell(cells, {
			table: 0,
			col: 10,
			row: 3,
			type: 'score',
			val: 6
		});
		_assert_cell(cells, {
			table: 0,
			col: 11,
			row: 3,
			type: 'score',
			val: 7
		});
		_assert_cell(cells, {
			table: 0,
			col: 11,
			row: 0,
			val: 'C'
		});

		presses.push({
			type: 'score',
			side: 'left'
		});
		presses.push({
			type: 'score',
			side: 'right'
		});
		presses.push({
			type: 'correction',
			team_id: 0,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 12,
			row: 1,
			type: 'score',
			val: 5
		});
		_assert_cell(cells, {
			table: 0,
			col: 13,
			row: 2,
			type: 'score',
			val: 8
		});
		_assert_cell(cells, {
			table: 0,
			col: 13,
			row: 0,
			val: 'C'
		});

		presses.push({
			type: 'score',
			side: 'left'
		});
		presses.push({
			type: 'score',
			side: 'left'
		});
		presses.push({
			type: 'correction',
			team_id: 1,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 14,
			row: 0,
			type: 'score',
			val: 6
		});
		_assert_cell(cells, {
			table: 0,
			col: 15,
			row: 0,
			type: 'score',
			val: 7
		});
		_assert_cell(cells, {
			table: 0,
			col: 15,
			row: 3,
			val: 'C'
		});

		presses.push({
			type: 'score',
			side: 'right'
		});
		presses.push({
			type: 'score',
			side: 'left'
		});
		presses.push({
			type: 'correction',
			team_id: 1,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 16,
			row: 3,
			type: 'score',
			val: 9
		});
		_assert_cell(cells, {
			table: 0,
			col: 17,
			row: 1,
			type: 'score',
			val: 8
		});
		_assert_cell(cells, {
			table: 0,
			col: 17,
			row: 3,
			val: 'C'
		});
	});

	_it('server mark in second game in singles', function() {
		var presses = [{
			type: 'pick_side', // Alice picks left
			team1_left: true,
		}];
		presses.push({
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all'
		});
		var cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: -1,
			row: 2,
			val: 'A'
		});

		press_score(presses, 21, 5);
		presses.push({
			type: 'postgame-confirm'
		});

		presses.push({
			type: 'love-all'
		});
		presses.push({
			type: 'score',
			side: 'right'
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		cells.forEach(function(cell) {
			assert(cell.val != 'R');
		});
		_assert_cell(cells, {
			table: 0,
			col: -1,
			row: 2,
			val: 'A'
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			row: 0,
			type: 'score',
			val: 0
		});
		_assert_cell(cells, {
			table: 1,
			col: 1,
			row: 0,
			type: 'score',
			val: 1
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			row: 2,
			type: 'score',
			val: 0
		});
		_assert_cell(cells, {
			table: 1,
			col: -1,
			row: 0,
			val: 'A'
		});


		press_score(presses, 21, 4);
		presses.push({
			type: 'postgame-confirm'
		});

		presses.push({
			type: 'love-all'
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			table: 2,
			col: -1,
			row: 2,
			val: 'A'
		});

	});

	_it('aesthetic considerations for final circle', function() {
		var start_presses = [{
			type: 'pick_side', // Alice picks left
			team1_left: true,
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all'
		}];

		// 21-10 should fit comfortably into the line
		var presses = start_presses.slice();
		press_score(presses, 21, 10);
		var cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 32,
			type: 'circle',
			score: [21, 10],
			width: 3
		});

		// 21-11 should fit in one line
		// By German rules see Anweisungen für Technische Offizielle §8
		var presses = start_presses.slice();
		press_score(presses, 21, 11);
		var cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 33,
			type: 'circle',
			score: [21, 11],
			width: 2
		});


	});
});