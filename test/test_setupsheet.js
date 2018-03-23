'use strict';

const assert = require('assert');

const tutils = require('./tutils');
const _describe = tutils._describe;
const _it = tutils._it;
const bup = tutils.bup;

_describe('setupsheet', () => {
	_it('configuration guessing', () => {
		let matches = [
			{setup: {eventsheet_id: '1.HD', is_doubles: true}},
			{setup: {match_name: '2.MX', is_doubles: true}},
			{setup: {match_name: '1.HE', is_doubles: false}},
			{setup: {match_name: 'DE', is_doubles: false}},
			{setup: {match_name: '2.HD', is_doubles: true}},
			{setup: {match_name: 'DD', is_doubles: true}},
			{setup: {match_name: '2.HE', is_doubles: false}},
			{setup: {match_name: '3.HE', is_doubles: false}},
			{setup: {match_name: '1.MX', is_doubles: true}},
		];
		let ev = {
			matches: matches,
		};
		assert.deepStrictEqual(
			bup.setupsheet.calc_config(ev),
			{
				m: ['1.HD', '2.HD', '1.HE', '2.HE', '3.HE', '1.MX', '2.MX', 'backup'],
				f: ['dark', 'dark', 'dark', 'DD', 'DE', '1.MX', '2.MX', 'backup'],
				limits: {
					m: {
						'1.HD': 2,
						'2.HD': 2,
						'1.HE': 1,
						'2.HE': 1,
						'3.HE': 1,
						'1.MX': 1,
						'2.MX': 1,
					},
					f: {
						'DD': 2,
						'DE': 1,
						'1.MX': 1,
						'2.MX': 1,
					},
				},
			}
		);

		// more f games then m ones
		matches = [
			{setup: {eventsheet_id: '1.HD', is_doubles: true}},
			{setup: {match_name: '2.GD', is_doubles: true}},
			{setup: {match_name: '1.HE', is_doubles: false}},
			{setup: {match_name: '1.DE', is_doubles: false}},
			{setup: {match_name: '3.DD', is_doubles: true}},
			{setup: {match_name: '2.HD', is_doubles: true}},
			{setup: {match_name: '1.DD', is_doubles: true}},
			{setup: {match_name: '2.DD', is_doubles: true}},
			{setup: {match_name: '2.HE', is_doubles: false}},
			{setup: {match_name: '3.DE', is_doubles: false}},
			{setup: {match_name: '2.DE', is_doubles: false}},
			{setup: {match_name: '1.GD', is_doubles: true}},
		];
		ev = {
			matches: matches,
		};
		assert.deepStrictEqual(
			bup.setupsheet.calc_config(ev),
			{
				m: ['dark', 'dark', '1.HD', '2.HD', '1.HE', '2.HE', '1.GD', '2.GD', 'backup'],
				f: ['1.DD', '2.DD', '3.DD', '1.DE', '2.DE', '3.DE', '1.GD', '2.GD', 'backup'],
				limits: {
					m: {
						'1.HD': 2,
						'2.HD': 2,
						'1.HE': 1,
						'2.HE': 1,
						'1.GD': 1,
						'2.GD': 1,
					},
					f: {
						'1.DD': 2,
						'2.DD': 2,
						'3.DD': 2,
						'1.DE': 1,
						'2.DE': 1,
						'3.DE': 1,
						'1.GD': 1,
						'2.GD': 1,
					},
				},
			}
		);
	});

	_it('available_players', () => {
		const ev = {
			all_players: [[{
				name: 'Michael Mustermann',
				gender: 'm',
			}, {
				name: 'Alex Aber',
				gender: 'm',
			}, {
				name: 'Danel Ranked',
				gender: 'm',
				ranking: 4,
			}, {
				name: 'Dennis VRL',
				gender: 'm',
				ranking: 2,
			}, {
				name: 'David Listed',
				gender: 'm',
				ranking: 3,
			}, {
				name: 'Zulu Last',
				gender: 'm',
			}, {
				name: 'Walter Pre',
				gender: 'm',
			}]],
		};
		const s = {
			event: ev,
		};
		const listed = [{
			name: 'Daniel Ranked',
			gender: 'm',
			ranking: 4,
		}];
		assert.deepStrictEqual(bup.setupsheet.available_players(s, listed, 0, 'm'), [{
			name: 'Dennis VRL',
			gender: 'm',
			ranking: 2,
		}, {
			name: 'David Listed',
			gender: 'm',
			ranking: 3,
		}, {
			name: 'Danel Ranked',
			gender: 'm',
			ranking: 4,
		}, {
			name: 'Alex Aber',
			gender: 'm',
		}, {
			name: 'Michael Mustermann',
			gender: 'm',
		}, {
			name: 'Walter Pre',
			gender: 'm',
		}, {
			name: 'Zulu Last',
			gender: 'm',
		}]);
	});

	_it('calc_linecounts', () => {
		assert.deepStrictEqual(
			bup.setupsheet.calc_linecounts({m: 1, f: 1}, {m:8, f:4}, 22, 2),
			{m: 8, f: 4});
		assert.deepStrictEqual(
			bup.setupsheet.calc_linecounts({m: 14, f: 15}, {m:8, f:4}, 22, 2),
			{m: 14, f: 15});
		assert.deepStrictEqual(
			bup.setupsheet.calc_linecounts({m: 7, f: 5}, {m:8, f:4}, 22, 2),
			{m: 9, f: 7});
		assert.deepStrictEqual(
			bup.setupsheet.calc_linecounts({m: 7, f: 1}, {m:8, f:4}, 22, 2),
			{m: 9, f: 4});
		assert.deepStrictEqual(
			bup.setupsheet.calc_linecounts({m: 7, f: 1}, {m:8, f:4}, 13, 1),
			{m: 8, f: 4});
		assert.deepStrictEqual(
			bup.setupsheet.calc_linecounts({m: 7, f: 1}, {m:8, f:4}, 13, 2),
			{m: 9, f: 4});
		assert.deepStrictEqual(
			bup.setupsheet.calc_linecounts({m: 7, f: 1}, {m:8, f:4}, 13, 3),
			{m: 9, f: 4});
		assert.deepStrictEqual(
			bup.setupsheet.calc_linecounts({m: 10, f: 10}, {m:10, f:10}, 22, 2),
			{m: 11, f: 11});
		assert.deepStrictEqual(
			bup.setupsheet.calc_linecounts({m: 10, f: 10}, {m:10, f:10}, 23, 2),
			{m: 12, f: 11});
	});

	_it('check_setup', () => {
		const s = {};
		const team = {
		'm': [{
			'gender': 'm',
			'name': 'Lars Schänzler',
			'ranking': 1,
			'ranking_d': 9,
			'regular': true,
		}, {
			'gender': 'm',
			'name': 'Nhat Nguyen',
			'ranking': 2,
			'ranking_d': 6,
			'nationality': 'IRL',
			'regular': true,
		}, {
			'gender': 'm',
			'name': 'Sam Magee',
			'ranking': 5,
			'ranking_d': 2,
			'nationality': 'IRL',
			'regular': true,
		}, {
			'gender': 'm',
			'name': 'Raphael Beck',
			'ranking': 6,
			'ranking_d': 1,
			'regular': true,
		}, {
			'name': 'Kai Waldenberger',
			'gender': 'm',
			'ranking': 7,
			'ranking_d': 10,
		}, {
			'name': 'Jan-Colin Völker',
			'gender': 'm',
			'ranking': 8,
		}, {
			'name': 'Dennis Nyenhuis',
			'gender': 'm',
			'ranking': 9,
			'ranking_d': 7,
		}],
		'f': [{
			'gender': 'f',
			'name': 'Chloe Magee',
			'ranking': 1,
			'nationality': 'IRL',
			'regular': true,
		}, {
			'gender': 'f',
			'name': 'Carla Nelte',
			'ranking': 2,
			'regular': true,
		}, {
			'name': 'Elin Svensson',
			'gender': 'f',
			'ranking': 3,
		}, {
			'name': 'Annika Dörr',
			'gender': 'f',
			'ranking': 4,
		}]};

		// No assignments
		assert.deepStrictEqual(
			bup.setupsheet.check_setup(s, team, 0, {
				'1.HD': [[], []],
				'2.HD': [[], []],
				'1.HE': [[], []],
				'2.HE': [[], []],
			}),
			[]
		);

		// TODO one setup that's fine
		// TODO double setups
	});
});
