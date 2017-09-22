var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;

(function() {
'use strict';

_describe('XLSX', function() {
	_it('col2num', function() {
		assert.strictEqual(bup.xlsx._col2num('A'), 0);
		assert.strictEqual(bup.xlsx._col2num('B'), 1);
		assert.strictEqual(bup.xlsx._col2num('Z'), 25);
		assert.strictEqual(bup.xlsx._col2num('AA'), 26);
		assert.strictEqual(bup.xlsx._col2num('AB'), 27);
		assert.strictEqual(bup.xlsx._col2num('AZ'), 51);
		assert.strictEqual(bup.xlsx._col2num('BA'), 52);
		assert.strictEqual(bup.xlsx._col2num('YZ'), 675);
		assert.strictEqual(bup.xlsx._col2num('ZZ'), 701);
		assert.strictEqual(bup.xlsx._col2num('AAA'), 702);
	});

	_it('num2col', function() {
		assert.strictEqual(bup.xlsx.num2col(0), 'A');
		assert.strictEqual(bup.xlsx.num2col(1), 'B');
		assert.strictEqual(bup.xlsx.num2col(25), 'Z');
		assert.strictEqual(bup.xlsx.num2col(26), 'AA');
		assert.strictEqual(bup.xlsx.num2col(27), 'AB');
		assert.strictEqual(bup.xlsx.num2col(51), 'AZ');
		assert.strictEqual(bup.xlsx.num2col(52), 'BA');
		assert.strictEqual(bup.xlsx.num2col(675), 'YZ');
		assert.strictEqual(bup.xlsx.num2col(701), 'ZZ');
		assert.strictEqual(bup.xlsx.num2col(702), 'AAA');
	});

	_it('add_col', function() {
		assert.strictEqual(bup.xlsx.add_col('A', 0), 'A');
		assert.strictEqual(bup.xlsx.add_col('A', 1), 'B');
		assert.strictEqual(bup.xlsx.add_col('Z', 0), 'Z');
		assert.strictEqual(bup.xlsx.add_col('Z', 1), 'AA');
		assert.strictEqual(bup.xlsx.add_col('Z', 2), 'AB');
		assert.strictEqual(bup.xlsx.add_col('AA', 0), 'AA');
		assert.strictEqual(bup.xlsx.add_col('AA', 1), 'AB');
		assert.strictEqual(bup.xlsx.add_col('AA', 25), 'AZ');
		assert.strictEqual(bup.xlsx.add_col('AA', 26), 'BA');
		assert.strictEqual(bup.xlsx.add_col('ZA', 0), 'ZA');
		assert.strictEqual(bup.xlsx.add_col('ZA', 25), 'ZZ');
		assert.strictEqual(bup.xlsx.add_col('ZA', 26), 'AAA');
		assert.strictEqual(bup.xlsx.add_col('FOOBAR', 0), 'FOOBAR');
		assert.strictEqual(bup.xlsx.add_col('ABC', 28), 'ACE');
	});

	_it('date', function() {
		assert.strictEqual(bup.xlsx.date(new Date(2000, 0, 1)), 36526);
		assert.strictEqual(bup.xlsx.date(new Date(2017, 6, 6)), 42922);
		assert.strictEqual(bup.xlsx.date(new Date(2017, 8, 22)), 43000);
	});

	_it('leap year', function() {
		assert.strictEqual(bup.xlsx._leap_year(1970), false);
		assert.strictEqual(bup.xlsx._leap_year(1972), true);
		assert.strictEqual(bup.xlsx._leap_year(1973), false);
		assert.strictEqual(bup.xlsx._leap_year(2001), false);
		assert.strictEqual(bup.xlsx._leap_year(2004), true);
		assert.strictEqual(bup.xlsx._leap_year(2008), true);
		assert.strictEqual(bup.xlsx._leap_year(2009), false);
		assert.strictEqual(bup.xlsx._leap_year(2100), false);
		assert.strictEqual(bup.xlsx._leap_year(2200), false);
		assert.strictEqual(bup.xlsx._leap_year(2300), false);
		assert.strictEqual(bup.xlsx._leap_year(2400), true);
		assert.strictEqual(bup.xlsx._leap_year(2000), true);
	});
});

})();