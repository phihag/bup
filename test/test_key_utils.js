'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

_describe('key_utils', function() {
	_it('fingerprint', function(done) {
		try {
			require('node-webcrypto-ossl');
		} catch(e) {
			done();
			return; // Not supported in this environment
		}

		var example_str = 'foobar';
		bup.key_utils.fingerprint(example_str, function(err, fp) {
			if (err) throw err;

			assert.strictEqual(fp, 'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2');
			done();
		});
	});
});