var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;

(function() {
'use strict';

_describe('eventsheet', function() {
	_it('XLSX col2num', function() {
		assert.strictEqual(bup.eventsheet._xlsx_col2num('A'), 0);
		assert.strictEqual(bup.eventsheet._xlsx_col2num('B'), 1);
		assert.strictEqual(bup.eventsheet._xlsx_col2num('Z'), 25);
		assert.strictEqual(bup.eventsheet._xlsx_col2num('AA'), 26);
		assert.strictEqual(bup.eventsheet._xlsx_col2num('AB'), 27);
		assert.strictEqual(bup.eventsheet._xlsx_col2num('AZ'), 51);
		assert.strictEqual(bup.eventsheet._xlsx_col2num('BA'), 52);
		assert.strictEqual(bup.eventsheet._xlsx_col2num('YZ'), 675);
		assert.strictEqual(bup.eventsheet._xlsx_col2num('ZZ'), 701);
		assert.strictEqual(bup.eventsheet._xlsx_col2num('AAA'), 702);
	});

	_it('XLSX num2col', function() {
		assert.strictEqual(bup.eventsheet._xlsx_num2col(0), 'A');
		assert.strictEqual(bup.eventsheet._xlsx_num2col(1), 'B');
		assert.strictEqual(bup.eventsheet._xlsx_num2col(25), 'Z');
		assert.strictEqual(bup.eventsheet._xlsx_num2col(26), 'AA');
		assert.strictEqual(bup.eventsheet._xlsx_num2col(27), 'AB');
		assert.strictEqual(bup.eventsheet._xlsx_num2col(51), 'AZ');
		assert.strictEqual(bup.eventsheet._xlsx_num2col(52), 'BA');
		assert.strictEqual(bup.eventsheet._xlsx_num2col(675), 'YZ');
		assert.strictEqual(bup.eventsheet._xlsx_num2col(701), 'ZZ');
		assert.strictEqual(bup.eventsheet._xlsx_num2col(702), 'AAA');
	});

	_it('XLSX add_col', function() {
		assert.strictEqual(bup.eventsheet._xlsx_add_col('A', 0), 'A');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('A', 1), 'B');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('Z', 0), 'Z');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('Z', 1), 'AA');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('Z', 2), 'AB');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('AA', 0), 'AA');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('AA', 1), 'AB');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('AA', 25), 'AZ');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('AA', 26), 'BA');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('ZA', 0), 'ZA');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('ZA', 25), 'ZZ');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('ZA', 26), 'AAA');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('FOOBAR', 0), 'FOOBAR');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('ABC', 28), 'ACE');
	});

	_it('XLSX date', function() {
		assert.strictEqual(bup.eventsheet._xlsx_date(new Date(2000, 0, 1)), 36526);
		assert.strictEqual(bup.eventsheet._xlsx_date(new Date(2017, 6, 6)), 42922);
	});

	_it('XLSX leap year', function() {
		assert.strictEqual(bup.eventsheet._xlsx_leap_year(1970), false);
		assert.strictEqual(bup.eventsheet._xlsx_leap_year(1972), true);
		assert.strictEqual(bup.eventsheet._xlsx_leap_year(1973), false);
		assert.strictEqual(bup.eventsheet._xlsx_leap_year(2001), false);
		assert.strictEqual(bup.eventsheet._xlsx_leap_year(2004), true);
		assert.strictEqual(bup.eventsheet._xlsx_leap_year(2008), true);
		assert.strictEqual(bup.eventsheet._xlsx_leap_year(2009), false);
		assert.strictEqual(bup.eventsheet._xlsx_leap_year(2100), false);
		assert.strictEqual(bup.eventsheet._xlsx_leap_year(2200), false);
		assert.strictEqual(bup.eventsheet._xlsx_leap_year(2300), false);
		assert.strictEqual(bup.eventsheet._xlsx_leap_year(2400), true);
		assert.strictEqual(bup.eventsheet._xlsx_leap_year(2000), true);
	});
});

})();