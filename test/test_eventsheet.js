var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;

(function() {
'use strict';

_describe('eventsheet', function() {
	_it('XLSX add_col', function() {
		assert.strictEqual(bup.eventsheet._xlsx_add_col('A', 1), 'B');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('Z', 1), 'AA');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('Z', 2), 'AB');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('FOOBAR', 0), 'FOOBAR');
		assert.strictEqual(bup.eventsheet._xlsx_add_col('ABC', 28), 'ACE');
	});
});

})();