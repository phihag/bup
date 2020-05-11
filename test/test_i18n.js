'use strict';

const assert = require('assert');
const async = require('async');
const fs = require('fs');
const path = require('path');

const tutils = require('./tutils');
const bup = tutils.bup;
const _describe = tutils._describe;
const _it = tutils._it;


function _match_all_again(rex, s, group) {
	rex.lastIndex = 0;
	const res = [];
	let m;
	while ((m = rex.exec(s))) {
		res.push(m[group]);
	}
	return res;
}

function _concat_lists(lists) {
	const res = [];
	for (const l of lists) {
		res.push.apply(res, l);
	}
	return res;
}

function _map_files(dir, file_filter, content_cb, callback) {
	fs.readdir(dir, (err, files) => {
		if (err) return callback(err);

		async.map(files.filter(file_filter), (filename, cb) => {
			fs.readFile(path.join(dir, filename), 'utf8', (err, content) => {
				if (err) return cb(err);
				content_cb(filename, content, cb);
			});
		}, callback);
	});
}

function _map_files_concat(dir, file_filter, content_cb, callback) {
	_map_files(dir, file_filter, content_cb,
		(err, ref_lists) => {
			if (err) return callback(err);
			return callback(err, _concat_lists(ref_lists));
		}
	);
}

function _xml_refs(filename, contents, cb) {
	const all_matches = bup.utils.match_all(/data-i18n(?:|-title|-placeholder)="([^"]+)"/g, contents);
	cb(null, all_matches.map((m) => {
		return {
			filename: filename,
			key: m[1],
		};
	}));
}

function js_refs(js_dir, callback) {
	_map_files_concat(
		js_dir, fn => fn.endsWith('.js'),
		(filename, js_code, cb) => {
			const calls = bup.utils.match_all(/\._\(\s*'([^']+)'\s*(?:\)|,)/g, js_code);
			const attrs = bup.utils.match_all(/'data-i18n':\s*'([^']+)',/g, js_code);
			const refmode_msgs = bup.utils.match_all(/'?message_i18n'?:\s*'([^']+)',/g, js_code);
			const manual_terms = bup.utils.match_all(/\/\*\s*i18n-term:\s*\*\/\s*'([^']+)'/g, js_code);
			const all_matches = _concat_lists([calls, attrs, refmode_msgs, manual_terms]);

			cb(null, all_matches.map((m) => {
				return {
					filename: filename,
					key: m[1],
				};
			}));
		},
		callback
	);
}

function svg_refs(svg_dir, callback) {
	_map_files_concat(svg_dir, fn => fn.endsWith('.svg'), _xml_refs, callback);
}

function html_refs(root_dir, callback) {
	_map_files_concat(root_dir, fn => fn.endsWith('.html'), _xml_refs, callback);
}

_describe('i18n', function() {
	_it('all keys present', function() {
		var languages = bup.utils.values(bup.i18n.languages).filter(function(lang) {
			return ! lang._fallback;
		});
		var expect_keys = Object.keys(languages[0]);
		expect_keys.sort();

		languages.forEach(function(lang) {
			var keys = Object.keys(lang);
			keys.sort();
			assert.deepEqual(expect_keys, keys);

			for (var k in lang) {
				var rex = /(\{[^}]+\})/g;
				var expected_templates = _match_all_again(rex, languages[0][k], 1);
				var got_templates = _match_all_again(rex, lang[k], 1);
				expected_templates.sort();
				got_templates.sort();
				assert.deepEqual(expected_templates, got_templates, 'differing templates in ' + k);
			}
		});
	});

	_it('all keys used', function(done) {
		const ROOT_DIR = path.join(__dirname, '..');
		const IGNORED = [
			'dads:add rg', // in development, will be added soon
		];

		async.parallel([
			cb => js_refs(path.join(ROOT_DIR, 'js'), cb),
			cb => html_refs(ROOT_DIR, cb),
			cb => svg_refs(path.join(ROOT_DIR, 'div', 'scoresheet'), cb),
			cb => svg_refs(path.join(ROOT_DIR, 'div'), cb),
		], (err, all_ref_lists) => {
			if (err) return done(err);

			const all_refs = _concat_lists(all_ref_lists);
			const lang = bup.utils.deep_copy(bup.i18n.languages.en);

			// Test that all references are present in i18n file
			for (const ref of all_refs) {
				assert(
					Object.prototype.hasOwnProperty.call(lang, ref.key),
					'Can not find key ' + JSON.stringify(ref.key) + ', referenced in ' + ref.filename
				);
			}

			// Test that i18n contains only references
			for (const ref of all_refs) {
				delete lang[ref.key];
			}

			// Remove all dynamic keys
			for (const key of Object.keys(lang)) {
				if (key.startsWith('_') || key.includes('|')) {
					delete lang[key];
				}
			}
			for (const key of IGNORED) {
				delete lang[key];
			}

			const lang_keys = Object.keys(lang);
			lang_keys.sort();
			assert.deepStrictEqual(lang_keys, []);
			done();
		});
	});

	_it('format_money', function() {
		assert.strictEqual(bup.i18n.format_money('de', 1), '1,00');
		assert.strictEqual(bup.i18n.format_money('en', 1), '1.00');
		assert.strictEqual(bup.i18n.format_money('de', .3), '0,30');
		assert.strictEqual(bup.i18n.format_money('en', .3), '0.30');
		assert.strictEqual(bup.i18n.format_money('en', .35), '0.35');
	});
});
