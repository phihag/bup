var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;

(function() {
'use strict';

function _match_all(rex, s, group) {
	rex.lastIndex = 0
	var res = [];
	var m;
	while ((m = rex.exec(s))) {
		res.push(m[group]);
	}
	return res;
}

_describe('i18n', function() {
	_it('all keys present', function() {
		var languages = bup.utils.values(bup.i18n.languages);
		var expect_keys = Object.keys(languages[0]);
		expect_keys.sort();

		languages.forEach(function(lang) {
			var keys = Object.keys(lang);
			keys.sort();
			assert.deepEqual(expect_keys, keys);

			for (var k in lang) {
				var v = lang[k];
				var rex = /(\{[^}]+\})/g;
				var expected_templates = _match_all(rex, languages[0][k], 1);
				var got_templates = _match_all(rex, lang[k], 1);
				expected_templates.sort();
				got_templates.sort();
				assert.deepEqual(expected_templates, got_templates);
			}
		});
	});
});

})();