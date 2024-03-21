'use strict';
// Compound tests per league
var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

_describe('eventutils', function() {
	_it('Regionalliga SüdOst Ost 2017/2018', function() {
		assert.strictEqual(bup.eventutils.name_by_league('RLSOO-2017'), 'Regionalliga SüdOst Ost');
		assert.deepStrictEqual(bup.eventutils.default_counting('RLSOO-2017'), '3x21');
		assert.deepStrictEqual(bup.eventutils.get_min_pause('RLSOO-2017'), 1200000);
		assert(bup.eventsheet._SHEETS_BY_LEAGUE['RLSOO-2017'].length > 0);
		assert.deepStrictEqual(bup.order.preferred_by_league('RLSOO-2017'), [
			'1.HD', 'DD', '2.HD', '1.HE', 'DE', 'GD', '2.HE', '3.HE',
		]);
		assert.deepStrictEqual(bup.eventutils.umpire_pay('RLSOO-2017'), {
			base: 25,
			per_km: .3,
			currency: '€',
		});

		assert.strictEqual(bup.eventutils.name_by_league('RLSOS-2017'), 'Regionalliga SüdOst Süd');
		assert.deepStrictEqual(bup.eventutils.default_counting('RLSOS-2017'), '3x21');
		assert.deepStrictEqual(bup.eventutils.get_min_pause('RLSOS-2017'), 1200000);
		assert(bup.eventsheet._SHEETS_BY_LEAGUE['RLSOO-2017'].length > 0);
		assert.deepStrictEqual(bup.order.preferred_by_league('RLSOS-2017'), [
			'1.HD', 'DD', '2.HD', '1.HE', 'DE', 'GD', '2.HE', '3.HE',
		]);
		assert.deepStrictEqual(bup.eventutils.umpire_pay('RLSOS-2017'), {
			base: 25,
			per_km: .3,
			currency: '€',
		});
	});

	_it('NLA-2019', function() {
		assert.strictEqual(bup.eventutils.name_by_league('NLA-2019'), 'NLA');
		assert.deepStrictEqual(bup.eventutils.default_counting('NLA-2019'), '5x11_15~NLA');
		assert.deepStrictEqual(bup.eventutils.get_min_pause('NLA-2019'), 15 * 60000);
		assert(bup.eventsheet._SHEETS_BY_LEAGUE['NLA-2019'].length > 0);
		assert.deepStrictEqual(bup.order.preferred_by_league('NLA-2019'), undefined);
	});

	_it('Bundesliga 2020/2021', function() {
		assert.strictEqual(bup.eventutils.name_by_league('1BL-2020'), '1. Bundesliga');
		assert.strictEqual(bup.eventutils.name_by_league('2BLN-2020'), '2. Bundesliga Nord');
		assert.strictEqual(bup.eventutils.name_by_league('2BLS-2020'), '2. Bundesliga Süd');
		assert(bup.eventutils.is_bundesliga('2BLS-2020'));
		assert(bup.eventutils.is_5x1190_bundesliga('2BLN-2020'));
		assert.strictEqual(bup.scoresheet.sheet_name({league_key: '2BLS-2020'}), 'bundesliga-2016');
		assert.deepStrictEqual(bup.eventutils.default_counting('1BL-2020'), '5x11_15^90');
		assert.deepStrictEqual(bup.eventutils.get_min_pause('1BL-2020'), 1200000);
		assert(bup.eventsheet._SHEETS_BY_LEAGUE['1BL-2020'].length > 0);
		assert.deepStrictEqual(bup.order.preferred_by_league('1BL-2020'), [
			'1.HD', 'DD', '2.HD', '1.HE', 'DE', 'GD', '2.HE',
		]);
		assert.deepStrictEqual(bup.eventutils.umpire_pay('2BLN-2020'), {
			base: 50,
			per_km: .35,
			currency: '€',
		});
		assert.deepStrictEqual(bup.eventutils.make_empty_matches('1BL-2020', 'testev'), [{setup: {
			counting: '5x11_15^90',
			match_id: 'testev_1.HD', match_name: '1.HD', is_doubles: true,
			teams: [{players: []}, {players: []}],
		}}, {setup: {
			counting: '5x11_15^90',
			match_id: 'testev_DD', match_name: 'DD', is_doubles: true,
			teams: [{players: []}, {players: []}],
		}}, {setup: {
			counting: '5x11_15^90',
			match_id: 'testev_2.HD', match_name: '2.HD', is_doubles: true,
			teams: [{players: []}, {players: []}],
		}}, {setup: {
			counting: '5x11_15^90',
			match_id: 'testev_1.HE', match_name: '1.HE', is_doubles: false,
			teams: [{players: []}, {players: []}],
		}}, {setup: {
			counting: '5x11_15^90',
			match_id: 'testev_DE', match_name: 'DE', is_doubles: false,
			teams: [{players: []}, {players: []}],
		}}, {setup: {
			counting: '5x11_15^90',
			match_id: 'testev_GD', match_name: 'GD', is_doubles: true,
			teams: [{players: []}, {players: []}],
		}}, {setup: {
			counting: '5x11_15^90',
			match_id: 'testev_2.HE', match_name: '2.HE', is_doubles: false,
			teams: [{players: []}, {players: []}],
		}}]);
	});

	_it('Oberliga Mitte / Oberliga Südwest', () => {
		assert.strictEqual(bup.eventutils.name_by_league('OLM-2020'), 'Oberliga Mitte');
		assert.strictEqual(bup.eventutils.name_by_league('OLSW-2020'), 'Oberliga Südwest');
		assert.deepStrictEqual(bup.eventutils.get_min_pause('OLSW-2020'), 20 * 60000);
		assert.deepStrictEqual(bup.eventutils.default_counting('OLSW-2020'), '3x21');
		assert.deepStrictEqual(bup.eventutils.default_counting('OLM-2020'), '3x21');
		assert.deepStrictEqual(bup.order.preferred_by_league('OLSW-2020'), [
			'1.HD', 'DD', '2.HD', '1.HE', 'DE', 'GD', '2.HE', '3.HE',
		]);
	});
});

