'use strict';
// Compound tests per league
var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

_describe('eventutils', function() {
	_it('Bundesliga 2017/2018', function() {
		assert.strictEqual(bup.eventutils.name_by_league('1BL-2017'), '1. Bundesliga');
		assert.strictEqual(bup.eventutils.name_by_league('2BLN-2017'), '2. Bundesliga Nord');
		assert.strictEqual(bup.eventutils.name_by_league('2BLS-2017'), '2. Bundesliga Süd');
		assert.deepStrictEqual(bup.eventutils.default_counting('1BL-2017'), '5x11_15^90');
		assert.deepStrictEqual(bup.eventutils.get_min_pause('1BL-2017'), 1200000);
		assert(bup.eventsheet._SHEETS_BY_LEAGUE['1BL-2017'].length > 0);
		assert.deepStrictEqual(bup.order.preferred_by_league('1BL-2017'), [
			'1.HD', 'DD', '2.HD', '1.HE', 'DE', 'GD', '2.HE',
		]);
		assert.deepStrictEqual(bup.eventutils.umpire_pay('1BL-2017'), {
			base: 50,
			per_km: .3,
			currency: '€',
		});
	});

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

});

