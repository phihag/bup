'use strict';

const assert = require('assert');

const tutils = require('./tutils');
const _describe = tutils._describe;
const _it = tutils._it;
const DOUBLES_SETUP = tutils.DOUBLES_SETUP;
const SINGLES_SETUP = tutils.SINGLES_SETUP;
const DOUBLES_SETUP_EN = tutils.DOUBLES_SETUP_EN;
const SINGLES_SETUP_EN = tutils.SINGLES_SETUP_EN;
const press_score = tutils.press_score;
const state_after = tutils.state_after;
const bup = tutils.bup;


_describe('scoresheet generation', () => {
	function _scoresheet_cells(presses, setup) {
		const s = state_after(presses, setup);
		return bup.scoresheet.parse_match(s, 35);
	}

	function _assert_cell(cells, cell) {
		const check = cells.some(function(c) {
			return bup.utils.deep_equal(cell, c);
		});
		if (check) return;

		const matching_cells = cells.filter(c => c.type === cell.type);
		if (matching_cells.length === 1) {
			assert.deepStrictEqual(
				matching_cells[0], cell,
				`Cannot find cell ${JSON.stringify(cell)} in ${cells.length} cells; showing differences to closest cell.`
			);
		} else {
			assert(
				check,
				`Cannot find cell\n${JSON.stringify(cell, undefined, 2)}\nin\n` +
				JSON.stringify(cells, undefined, 2)
			);
		}
	}

	_it('0-0 in third game', () => {
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
		press_score(presses, 21, 0);
		presses.push({
			type: 'postgame-confirm',
		});

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
		press_score(presses, 21, 0);
		presses.push({
			type: 'postgame-confirm',
		});

		presses.push({
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver', // Andrew receives
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});

		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		cells.forEach(function(c) {
			assert.equal(typeof c.table, 'number', JSON.stringify(c) + ' is missing a table value');
			assert(! isNaN(c.table), JSON.stringify(c) + ' has NaN table value');
			assert.equal(typeof c.col, 'number', JSON.stringify(c) + ' is missing a col value');
			assert(! isNaN(c.table), JSON.stringify(c) + ' has NaN col value');
		});
		_assert_cell(cells, {
			type: 'text',
			table: 2,
			col: -1,
			row: 0,
			val: 'R',
		});
		_assert_cell(cells, {
			type: 'text',
			table: 2,
			col: -1,
			row: 2,
			val: 'A',
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

	_it('overrule', () => {
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
			side: 'left',
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
			val: 'O',
			type: 'text',
		});

		presses.push({
			type: 'score',
			side: 'right',
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
			val: 'O',
			type: 'text',
		});

		presses.push({
			type: 'score',
			side: 'left',
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
			val: 'O',
			type: 'text',
		});
	});

	_it('injuries', () => {
		var presses = [];
		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
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
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 1000,
		});
		presses.push({
			type: 'referee',
		});

		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		assert.equal(cells.length, 6);
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 1,
			row: 0,
			val: 'V',
			press_type: 'injury',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 1,
			row: 1,
			val: 'R',
			mark: true,
		});

		presses.push({
			type: 'injury',
			team_id: 1,
			player_id: 1,
			timestamp: 2000,
		});
		presses.push({
			type: 'referee',
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		assert.equal(cells.length, 9);
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 2,
			row: 3,
			val: 'V',
			press_type: 'injury',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 2,
			row: 2,
			val: 'R',
			mark: true,
		});

		presses.push({
			type: 'injury',
			team_id: 1,
			player_id: 0,
			timestamp: 3000,
		});
		presses.push({
			type: 'referee',
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		assert.equal(cells.length, 12);
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 3,
			row: 2,
			val: 'V',
			press_type: 'injury',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 2,
			row: 2,
			val: 'R',
			mark: true,
		});

		presses.push({
			type: 'injury-resume',
			timestamp: 130000,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		assert.equal(cells.length, 18);
		_assert_cell(cells, {
			type: 'vertical-text',
			table: 0,
			col: 1,
			row: 2.5,
			val: '2:09',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'vertical-text',
			table: 0,
			col: 2,
			row: 0.5,
			val: '2:08',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'vertical-text',
			table: 0,
			col: 3,
			row: 0.5,
			val: '2:07',
			mark: true,
		});
	});

	_it('yellow card', () => {
		var base_presses = [];
		base_presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		base_presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		});
		base_presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		base_presses.push({
			type: 'love-all',
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
			type: 'text',
			table: 0,
			col: 1,
			row: 1,
			val: 'W',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 2,
			row: 1,
			val: 'R',
			mark: true,
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
			type: 'text',
			table: 0,
			col: 3,
			row: 2,
			val: 'W',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 4,
			row: 2,
			val: 'R',
			mark: true,
		});

		presses = base_presses.slice();
		presses.push({
			type: 'yellow-card',
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'left',
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 1,
			row: 1,
			val: 'W',
			mark: true,
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

	_it('referee', () => {
		var presses = [];
		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		presses.push({
			type: 'pick_server', // Birgit serves
			team_id: 1,
			player_id: 1,
		});
		presses.push({
			type: 'pick_receiver', // Alice receives
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'love-all',
		});
		presses.push({
			type: 'referee', // Because of leaking roof
		});

		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 1,
			row: 1,
			val: 'R',
			mark: true,
		});
	});

	_it('suspension', () => {
		var presses = [];
		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
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
			type: 'suspension',
			timestamp: 1000000,
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
			type: 'text',
			table: 0,
			col: 2,
			row: 1,
			val: 'U',
			_suspension_timestamp: 1000000,
			mark: true,
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 3,
			row: 1,
			val: 'R',
			mark: true,
		});

		presses.push({
			type: 'resume',
			timestamp: 1519000,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 3,
			val: 1,
			type: 'score',
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 2,
			row: 1,
			val: 'U',
			mark: true,
			_suspension_timestamp: 1000000,
		});
		_assert_cell(cells, {
			type: 'vertical-text',
			table: 0,
			col: 2,
			row: 2.5,
			val: '8:39',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 3,
			row: 1,
			val: 'R',
			mark: true,
		});

	});

	_it('red card', () => {
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
			type: 'love-all',
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
			type: 'text',
			table: 0,
			col: 1,
			row: 1,
			val: 'F',
			press_type: 'red-card',
			mark: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 3,
			val: 1,
			type: 'score',
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 1,
			row: 0,
			val: 'R',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 2,
			row: 0,
			val: 'F',
			press_type: 'red-card',
			mark: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
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
			type: 'text',
			table: 0,
			col: 3,
			row: 3,
			val: 'F',
			press_type: 'red-card',
			mark: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 0,
			val: 1,
			type: 'score',
		});
	});

	_it('red card in singles', () => {
		var presses = [];
		presses.push({
			type: 'pick_side', // Alice picks left
			team1_left: true,
		});
		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
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
			type: 'text',
			table: 0,
			col: 1,
			row: 2,
			val: 'F',
			press_type: 'red-card',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 1,
			row: 3,
			val: 'R',
			mark: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 0,
			val: 1,
			type: 'score',
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 2,
			row: 2,
			val: 'F',
			press_type: 'red-card',
			mark: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
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
			type: 'text',
			table: 0,
			col: 3,
			row: 0,
			val: 'F',
			press_type: 'red-card',
			mark: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
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
			type: 'text',
			table: 0,
			col: 4,
			row: 2,
			val: 'F',
			press_type: 'red-card',
			mark: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 4,
			row: 0,
			val: 3,
			type: 'score',
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 4,
			row: 3,
			val: 'R',
			mark: true,
		});
	});

	_it('red card after match', () => {
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
			type: 'love-all',
		});
		press_score(presses, 21, 5);
		presses.push({
			type: 'postgame-confirm',
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
			type: 'text',
			table: 1,
			col: 22,
			row: 2,
			val: 'F',
			press_type: 'red-card',
			mark: true,
		});
		cells.forEach(function(cell) {
			if (cell.type == 'score') {
				assert(cell.val <= 21);
			}
		});
	});

	_it('retired', () => {
		var base_presses = [];
		base_presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		base_presses.push({
			type: 'pick_server', // Andrew serves
			team_id: 0,
			player_id: 0,
		});
		base_presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		base_presses.push({
			type: 'love-all',
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
			type: 'text',
			table: 0,
			col: 2,
			row: 3,
			val: 'A',
		});
		_assert_cell(cells, {
			table: 0,
			col: 5,
			type: 'circle',
			score: [1, 0],
			width: 3,
		});

		presses = base_presses.slice();
		presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: 2,
			row: 0,
			val: 'A',
		});
		_assert_cell(cells, {
			table: 0,
			col: 5,
			type: 'circle',
			score: [1, 0],
			width: 3,
		});
	});

	_it('disqualified', () => {
		var base_presses = [];
		base_presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		base_presses.push({
			type: 'pick_server', // Andrew serves
			team_id: 0,
			player_id: 0,
		});
		base_presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		base_presses.push({
			type: 'love-all',
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
		_assert_cell(cells, {
			table: 0,
			col: 8,
			type: 'circle',
			score: [1, 0],
			width: 3,
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
		_assert_cell(cells, {
			table: 0,
			col: 7,
			type: 'circle',
			score: [0, 0],
			width: 3,
		});

		cells = _scoresheet_cells(presses, DOUBLES_SETUP_EN);
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 1,
			type: 'longtext',
			val: 'Disqualified',
			width: 4,
		});
	});	

	_it('correction (service court error)', () => {
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
			type: 'correction',
			team_id: 0,
		});
		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 3,
			type: 'score',
			val: 1,
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 1,
			type: 'score',
			val: 1,
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 0,
			val: 'C',
			type: 'text',
			mark: true,
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
			type: 'correction',
			team_id: 0,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 3,
			row: 2,
			type: 'score',
			val: 2,
		});
		_assert_cell(cells, {
			table: 0,
			col: 4,
			row: 0,
			type: 'score',
			val: 2,
		});
		_assert_cell(cells, {
			table: 0,
			col: 4,
			row: 1,
			val: 'C',
			type: 'text',
			mark: true,
		});

		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'score',
			side: 'right',
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
			val: 3,
		});
		_assert_cell(cells, {
			table: 0,
			col: 6,
			row: 3,
			type: 'score',
			val: 4,
		});
		_assert_cell(cells, {
			table: 0,
			col: 6,
			row: 2,
			val: 'C',
			type: 'text',
			mark: true,
		});

		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'right',
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
			val: 3,
		});
		_assert_cell(cells, {
			table: 0,
			col: 8,
			row: 2,
			type: 'score',
			val: 5,
		});
		_assert_cell(cells, {
			table: 0,
			col: 8,
			row: 3,
			val: 'C',
			type: 'text',
			mark: true,
		});

		// Now against the receiver
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
			val: 4,
		});
		_assert_cell(cells, {
			table: 0,
			col: 10,
			row: 3,
			type: 'score',
			val: 6,
		});
		_assert_cell(cells, {
			table: 0,
			col: 11,
			row: 3,
			type: 'score',
			val: 7,
		});
		_assert_cell(cells, {
			table: 0,
			col: 11,
			row: 0,
			val: 'C',
			type: 'text',
			mark: true,
		});

		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'right',
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
			val: 5,
		});
		_assert_cell(cells, {
			table: 0,
			col: 13,
			row: 2,
			type: 'score',
			val: 8,
		});
		_assert_cell(cells, {
			table: 0,
			col: 13,
			row: 0,
			val: 'C',
			type: 'text',
			mark: true,
		});

		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'left',
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
			val: 6,
		});
		_assert_cell(cells, {
			table: 0,
			col: 15,
			row: 0,
			type: 'score',
			val: 7,
		});
		_assert_cell(cells, {
			table: 0,
			col: 15,
			row: 3,
			val: 'C',
			type: 'text',
			mark: true,
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
			type: 'correction',
			team_id: 1,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 16,
			row: 3,
			type: 'score',
			val: 9,
		});
		_assert_cell(cells, {
			table: 0,
			col: 17,
			row: 1,
			type: 'score',
			val: 8,
		});
		_assert_cell(cells, {
			table: 0,
			col: 17,
			row: 3,
			val: 'C',
			type: 'text',
			mark: true,
		});
	});

	_it('server mark in second game in singles', () => {
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
			type: 'love-all',
		});
		var cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: -1,
			row: 2,
			val: 'A',
		});

		press_score(presses, 21, 5);
		presses.push({
			type: 'postgame-confirm',
		});

		presses.push({
			type: 'love-all',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		cells.forEach(function(cell) {
			assert(cell.val != 'R');
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: -1,
			row: 2,
			val: 'A',
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			row: 0,
			type: 'score',
			val: 0,
		});
		_assert_cell(cells, {
			table: 1,
			col: 1,
			row: 0,
			type: 'score',
			val: 1,
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			row: 2,
			type: 'score',
			val: 0,
		});
		_assert_cell(cells, {
			type: 'text',
			table: 1,
			col: -1,
			row: 0,
			val: 'A',
		});


		press_score(presses, 21, 4);
		presses.push({
			type: 'postgame-confirm',
		});

		presses.push({
			type: 'love-all',
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			type: 'text',
			table: 2,
			col: -1,
			row: 2,
			val: 'A',
		});

	});

	_it('aesthetic considerations for final circle', () => {
		var start_presses = [{
			type: 'pick_side', // Alice picks left
			team1_left: true,
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
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
			width: 3,
		});

		// 21-11 should fit in one line
		// In German rules see Anweisungen für Technische Offizielle §8
		presses = start_presses.slice();
		press_score(presses, 21, 11);
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 33,
			type: 'circle',
			score: [21, 11],
			width: 2,
		});
	});

	_it('editmode set-score', () => {
		var presses = [];
		presses.push({
			type: 'editmode_set-score',
			score: [12, 5],
			by_side: false,
		});
		presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 0,
			type: 'editmode-sign',
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 0,
			row: 0,
			type: 'score',
			val: 12,
		});
		_assert_cell(cells, {
			table: 0,
			col: 0,
			row: 2,
			type: 'score',
			val: 5,
		});

		press_score(presses, 0, 1);
		presses.push({
			type: 'editmode_set-score',
			score: [20, 4],
		});
		presses.push({
			type: 'editmode_set-score',
			score: [2, 14],
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 1,
			row: 3,
			type: 'score',
			val: 6,
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			type: 'editmode-sign',
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 0,
			type: 'score',
			val: 2,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 2,
			row: 3,
			type: 'score',
			val: 14,
			editmode_related: true,
		});
	});

	_it('editmode set-finished_games without by_side', () => {
		var presses = [];
		presses.push({
			type: 'editmode_set-finished_games',
			scores: [[12, 21], [25, 23]],
			by_side: false,
		});
		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 0,
			type: 'editmode-sign',
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 0,
			row: 0,
			type: 'score',
			val: 12,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 0,
			row: 2,
			type: 'score',
			val: 21,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			type: 'circle',
			score: [12, 21],
			width: 3,
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			type: 'editmode-sign',
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			row: 0,
			type: 'score',
			val: 25,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			row: 2,
			type: 'score',
			val: 23,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 1,
			col: 3,
			type: 'circle',
			score: [25, 23],
			width: 3,
		});

		presses.push({
			type: 'editmode_set-finished_games',
			scores: [],
			by_side: false,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		assert.equal(cells.length, 0);
	});

	_it('editmode set-finished_games with by_side', () => {
		var presses = [];
		presses.push({
			type: 'editmode_set-finished_games',
			scores: [{
				left: 12,
				right: 21,
			}, {
				left: 25,
				right: 23,
			}],
			by_side: true,
		});
		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 0,
			type: 'editmode-sign',
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 0,
			row: 0,
			type: 'score',
			val: 12,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 0,
			row: 2,
			type: 'score',
			val: 21,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			type: 'circle',
			score: [12, 21],
			width: 3,
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			type: 'editmode-sign',
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			row: 0,
			type: 'score',
			val: 25,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			row: 2,
			type: 'score',
			val: 23,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 1,
			col: 3,
			type: 'circle',
			score: [25, 23],
			width: 3,
		});

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		cells = _scoresheet_cells(alt_presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			table: 0,
			col: 0,
			type: 'editmode-sign',
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 0,
			row: 0,
			type: 'score',
			val: 12,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 0,
			row: 2,
			type: 'score',
			val: 21,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			type: 'circle',
			score: [12, 21],
			width: 3,
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			type: 'editmode-sign',
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			row: 0,
			type: 'score',
			val: 25,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			row: 2,
			type: 'score',
			val: 23,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 1,
			col: 3,
			type: 'circle',
			score: [25, 23],
			width: 3,
		});

		presses.push({
			type: 'pick_side',
			team1_left: false,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.finished_games[0].score, [21, 12]);
		_assert_cell(cells, {
			table: 0,
			col: 0,
			type: 'editmode-sign',
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 0,
			row: 0,
			type: 'score',
			val: 21,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 0,
			row: 2,
			type: 'score',
			val: 12,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 0,
			col: 3,
			type: 'circle',
			score: [21, 12],
			width: 3,
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			type: 'editmode-sign',
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			row: 0,
			type: 'score',
			val: 23,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 1,
			col: 0,
			row: 2,
			type: 'score',
			val: 25,
			editmode_related: true,
		});
		_assert_cell(cells, {
			table: 1,
			col: 3,
			type: 'circle',
			score: [23, 25],
			width: 3,
		});
	});

	_it('setting past games multiple times', () => {
		var presses = [{
			type: 'editmode_set-finished_games',
			scores: [[4, 21], [21, 0]],
		}, {
			type: 'editmode_set-finished_games',
			scores: [[4, 21], [21, 5]],
		}];

		var cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			type: 'circle',
			table: 0,
			col: 3,
			score: [4, 21],
			width: 3,
		});
		_assert_cell(cells, {
			type: 'circle',
			table: 1,
			col: 3,
			score: [21, 5],
			width: 3,
		});
	});

	_it('a natural game should stay that way', () => {
		var presses = [];
		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
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
		press_score(presses, 21, 7);
		presses.push({
			type: 'postgame-confirm',
		});

		presses.push({
			type: 'editmode_set-finished_games',
			scores: [[21, 7], [12, 21]],
		});
		var cells = _scoresheet_cells(presses, SINGLES_SETUP);
		assert(! cells.some(function(cell) {
			return cell.table === 0 && cell.type == 'editmode-sign';
		}));
	});

	_it('correctly show resumed matches', () => {
		var presses = [{
			type: 'editmode_set-score',
			score: [2, 5],
			resumed: true,
		}];

		var cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			type: 'score',
			table: 0,
			col: 0,
			row: 0,
			val: 2,
			editmode_related: true,
		});
		_assert_cell(cells, {
			type: 'score',
			table: 0,
			col: 0,
			row: 2,
			val: 5,
			editmode_related: true,
		});

		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		assert.equal(cells.length, 3);
		_assert_cell(cells, {
			type: 'score',
			table: 0,
			col: 0,
			row: 0,
			val: 2,
			editmode_related: true,
		});
		_assert_cell(cells, {
			type: 'score',
			table: 0,
			col: 0,
			row: 2,
			val: 5,
			editmode_related: true,
		});

		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 1,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		assert.equal(cells.length, 4);
		_assert_cell(cells, {
			type: 'score',
			table: 0,
			col: 0,
			row: 0,
			val: 2,
			editmode_related: true,
		});
		_assert_cell(cells, {
			type: 'score',
			table: 0,
			col: 0,
			row: 3,
			val: 5,
			editmode_related: true,
		});

		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 1,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		assert.equal(cells.length, 5);
		_assert_cell(cells, {
			type: 'score',
			table: 0,
			col: 0,
			row: 1,
			val: 2,
			editmode_related: true,
		});
		_assert_cell(cells, {
			type: 'score',
			table: 0,
			col: 0,
			row: 3,
			val: 5,
			editmode_related: true,
		});
	});

	_it('English symbols', () => {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}];
		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		});

		var cells = _scoresheet_cells(presses, SINGLES_SETUP_EN);
		assert.equal(cells.length, 1);
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: -1,
			row: 2,
			val: 'S',
		});

		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP_EN);
		assert.equal(cells.length, 2);
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: -1,
			row: 2,
			val: 'S',
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: -1,
			row: 0,
			val: 'R',
		});

		presses.push({
			type: 'love-all',
		});
		cells = _scoresheet_cells(presses, DOUBLES_SETUP_EN);
		assert.equal(cells.length, 4);
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: -1,
			row: 2,
			val: 'S',
		});
		_assert_cell(cells, {
			type: 'text',
			table: 0,
			col: -1,
			row: 0,
			val: 'R',
		});

		var sav_presses = presses.slice();
		press_score(presses, 21, 4);
		presses.push({
			type: 'postgame-confirm',
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP_EN);
		_assert_cell(cells, {
			type: 'text',
			table: 1,
			col: -1,
			row: 0,
			val: 'S',
		});

		presses = sav_presses.slice();
		press_score(presses, 4, 21);
		presses.push({
			type: 'postgame-confirm',
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP_EN);
		_assert_cell(cells, {
			type: 'text',
			table: 1,
			col: -1,
			row: 2,
			val: 'S',
		});
	});

	_it('red card at match start', () => {
		// According to RTTO 3.7.7, red cards before or after the match do not influence the score
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}];

		var cells = _scoresheet_cells(presses, SINGLES_SETUP);
		assert.deepStrictEqual(cells, []);

		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 0,
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		assert.deepStrictEqual(cells, [{
			type: 'text',
			col: 0,
			row: 0,
			table: 0,
			val: 'F',
			press_type: 'red-card',
			mark: true,
		}]);

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		assert.deepStrictEqual(cells.length, 3);

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		assert.deepStrictEqual(cells.length, 4);
		_assert_cell(cells, {
			type: 'text',
			col: 1,
			row: 2,
			table: 0,
			val: 'F',
			press_type: 'red-card',
			mark: true,
		});

		presses.push({
			type: 'love-all',
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		assert.deepStrictEqual(cells.length, 7);
		_assert_cell(cells, {
			type: 'score',
			col: 2,
			row: 0,
			table: 0,
			val: 0,
		});
		_assert_cell(cells, {
			type: 'score',
			col: 2,
			row: 2,
			table: 0,
			val: 0,
		});

		press_score(presses, 21, 0);
		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 0, 21);
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		assert.deepStrictEqual(cells.length, 54);
		_assert_cell(cells, {
			type: 'score',
			col: 21,
			row: 0,
			table: 1,
			val: 21,
		});
		_assert_cell(cells, {
			type: 'circle',
			col: 24,
			table: 1,
			score: [21, 0],
			width: 3,
		});

		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 0,
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		assert.deepStrictEqual(cells.length, 55);
		_assert_cell(cells, {
			type: 'text',
			table: 1,
			col: 22,
			row: 0,
			val: 'F',
			press_type: 'red-card',
			mark: true,
		});
		_assert_cell(cells, {
			table: 1,
			type: 'circle',
			col: 25,
			score: [21, 0],
			width: 3,
		});
	});

	_it('recovered injury after game end', async () => {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];

		press_score(presses, 20, 10);
		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 1000000,
		});
		presses.push({
			type: 'referee',
			team_id: 0,
			player_id: 0,
			timestamp: 1003000,
		});
		// 9s later player recovers
		presses.push({
			type: 'injury-resume',
			team_id: 0,
			player_id: 0,
			timestamp: 1009000,
		});
		presses.push({
			type: 'postgame-confirm',
			team_id: 0,
			player_id: 0,
			timestamp: 1010000,
		});
		presses.push({
			type: 'love-all',
		});

		const cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			type: 'vertical-text',
			mark: true,
			col: 32,
			row: 2.5,
			val: '0:09',
			table: 0,
		});
	});

	_it('match end after injury', () => {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];

		presses.push({
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 1000,
		});
		var base_presses = presses.slice();

		presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
			timestamp: 10000,
		});
		var cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			type: 'text',
			col: 1,
			row: 0,
			table: 0,
			val: 'V',
			press_type: 'injury',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'vertical-text',
			col: 1,
			row: 2.5,
			table: 0,
			val: '0:09',
			mark: true,
		});

		presses = base_presses.slice();
		presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
			timestamp: 10000,
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			type: 'text',
			col: 1,
			row: 0,
			table: 0,
			val: 'V',
			press_type: 'injury',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'vertical-text',
			col: 1,
			row: 2.5,
			table: 0,
			val: '0:09',
			mark: true,
		});
	});

	_it('interplay of injuries and red cards', () => {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];

		// A red card should *not* end injury ...
		presses.push({
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 1000,
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		assert.equal(cells.length, 4);

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
			timestamp: 10000,
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			type: 'text',
			mark: true,
			col: 2,
			row: 2,
			table: 0,
			val: 'F',
			press_type: 'red-card',
		});
		assert.equal(cells.length, 7);

		presses.push({
			type: 'editmode_set-finished_games',
			scores: [[12, 21], [25, 23]],
		});
		presses.push({
			type: 'editmode_set-score',
			score: [20, 15],
		});
		presses.push({
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 20000,
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		assert.equal(cells.length, 20);

		// still not ...
		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 0,
			timestamp: 22000,
		});
		var cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			type: 'text',
			col: 5,
			row: 0,
			table: 2,
			val: 'F',
			press_type: 'red-card',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'score',
			col: 5,
			row: 2,
			table: 2,
			val: 16,
		});
		assert.equal(cells.length, 23);
		_assert_cell(cells, {
			type: 'text',
			col: 4,
			row: 0,
			table: 2,
			val: 'V',
			press_type: 'injury',
			mark: true,
		});

		// but if the match ends then yes
		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
			timestamp: 23000,
		});
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			type: 'text',
			col: 6,
			row: 2,
			table: 2,
			val: 'F',
			press_type: 'red-card',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'score',
			col: 6,
			row: 0,
			table: 2,
			val: 21,
		});
		_assert_cell(cells, {
			type: 'text',
			col: 4,
			row: 0,
			table: 2,
			val: 'V',
			press_type: 'injury',
			mark: true,
		});
		_assert_cell(cells, {
			type: 'vertical-text',
			col: 4,
			row: 2.5,
			table: 2,
			val: '0:03',
			mark: true,
		});
	});

	_it('walkover', () => {
		var presses = [{
			type: 'walkover',
			team_id: 0,
		}];
		var cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			type: 'longtext',
			col: 0,
			row: 0.5,
			table: 0,
			val: 'Walkover',
			width: 4,
		});

		presses = [{
			type: 'walkover',
			team_id: 1,
		}];
		cells = _scoresheet_cells(presses, DOUBLES_SETUP);
		_assert_cell(cells, {
			type: 'longtext',
			col: 0,
			row: 2.5,
			table: 0,
			val: 'Walkover',
			width: 4,
		});

		presses = [{
			type: 'walkover',
			team_id: 0,
		}];
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			type: 'longtext',
			col: 0,
			row: 0,
			table: 0,
			val: 'Walkover',
			width: 4,
		});

		presses = [{
			type: 'walkover',
			team_id: 1,
		}];
		cells = _scoresheet_cells(presses, SINGLES_SETUP);
		_assert_cell(cells, {
			type: 'longtext',
			col: 0,
			row: 2,
			table: 0,
			val: 'Walkover',
			width: 4,
		});
	});

	_it('characters (french)', () => {
		var s = tutils.state_after([], SINGLES_SETUP, {language: 'fr-CH'});
		assert.strictEqual(s._('scoresheet:server'), 'S');
		assert.strictEqual(s._('scoresheet:receiver'), 'R');
		assert.strictEqual(s._('mark|overrule'), 'O');
		assert.strictEqual(s._('mark|referee'), 'JA');
		assert.strictEqual(s._('mark|suspension'), 'S');
		assert.strictEqual(s._('mark|correction'), 'C');
		assert.strictEqual(s._('mark|yellow-card'), 'A');
		assert.strictEqual(s._('mark|red-card'), 'F');
		assert.strictEqual(s._('mark|injury'), 'B');
		assert.strictEqual(s._('mark|retired'), 'Abandon');
		assert.strictEqual(s._('mark|disqualified'), 'Disqualifié');
		assert.strictEqual(s._('mark|walkover'), 'Walkover');
	});

	_it('sheet_name', () => {
		assert.strictEqual(bup.scoresheet.sheet_name({
			counting: '3x21',
		}), 'international');
		assert.strictEqual(bup.scoresheet.sheet_name({
			counting: '5x11_11',
		}), 'international_5x11');

		assert.strictEqual(bup.scoresheet.sheet_name({
			counting: '5x11_15',
			league_key: '1BL-2016',
		}), 'bundesliga-2016');
		assert.strictEqual(bup.scoresheet.sheet_name({
			counting: '5x11_15^90',
			league_key: '1BL-2017',
		}), 'bundesliga-2016');
		assert.strictEqual(bup.scoresheet.sheet_name({
			counting: '5x11_15^90',
			league_key: '1BL-2019',
		}), 'bundesliga-2016');

		assert.strictEqual(bup.scoresheet.sheet_name({
			counting: '5x11_15~NLA',
			league_key: 'NLA-2019',
		}), 'nla-2019');

	});
});
