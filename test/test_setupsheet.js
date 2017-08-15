'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

_describe('setupsheet', function() {
	_it('configuration guessing', function() {
		var matches = [
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
		var ev = {
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
});
