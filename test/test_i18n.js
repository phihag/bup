var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;

(function() {
'use strict';

_describe('i18n', function() {
	_it('all keys present', function() {
		var languages = bup.utils.values(bup.i18n.languages);
		var expect_keys = Object.keys(languages[0]);
		expect_keys.sort();

		languages.forEach(function(lang) {
			var keys = Object.keys(lang);
			keys.sort();
			assert.deepEqual(expect_keys, keys);
		});
	});
});

})();