'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

_describe('importexport', function() {
	['edemo.json', 'vdemo.json', 'bldemo.json', 'bldemo_incomplete.json', 'nrwdemo.json'].forEach(function(test_basename) {
		_it('importing and exporting should be injective (' + test_basename + ')', function(done) {
			var fn = path.join(__dirname, '..', 'div', test_basename);
			fs.readFile(fn, function(err, content_json) {
				if (err) return done(err);

				var data = JSON.parse(content_json);
				var s = {};

				var imported = bup.importexport.load_data(s, data);
				var ev = imported.event;
				assert(ev);
				bup.network.update_event(s, ev);

				var export_data = bup.importexport.gen_export_data(s);
				var s2 = {};
				var imported2 = bup.importexport.load_data(s2, export_data);
				assert.deepStrictEqual(imported.event, imported2.event);

				done(err);
			});
		});
	});
});
