'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var tutils = require('./tutils');
var vdom = require('./vdom');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

function _make_container() {
	var doc = new vdom.Document('testroot');
	return bup.uiu.el(doc.documentElement, 'div');
}

_describe('displaymode', function() {
	_it('extract_netscore', function() {
		assert.deepStrictEqual(bup.displaymode.extract_netscore({
			network_score: [],
			setup: {
				counting: '3x21',
			},
		}, true), [[0, 0]]);
		assert.deepStrictEqual(bup.displaymode.extract_netscore({
			network_score: [[18, 1]],
			setup: {
				counting: '3x21',
			},
		}, true), [[18, 1]]);
		assert.deepStrictEqual(bup.displaymode.extract_netscore({
			network_score: [[21, 1], [5, 4]],
			setup: {
				counting: '3x21',
			},
		}, true), [[21, 1], [5, 4]]);
		assert.deepStrictEqual(bup.displaymode.extract_netscore({
			network_score: [[21, 1], [23, 25]],
			setup: {
				counting: '3x21',
			},
		}, true), [[21, 1], [23, 25], [0, 0]]);
		assert.deepStrictEqual(bup.displaymode.extract_netscore({
			network_score: [[21, 1], [27, 25]],
			setup: {
				counting: '3x21',
			},
		}, true), [[21, 1], [27, 25]]);
		assert.deepStrictEqual(bup.displaymode.extract_netscore({
			network_score: [[21, 1]],
			setup: {
				counting: '1x21',
			},
		}, true), [[21, 1]]);
		assert.deepStrictEqual(bup.displaymode.extract_netscore({
			network_score: [[11, 2], [14, 15]],
			setup: {
				counting: '5x11_15',
			},
		}, true), [[11, 2], [14, 15], [0, 0]]);
		assert.deepStrictEqual(bup.displaymode.extract_netscore({
			network_score: [[11, 2], [14, 15], [13, 11], [12, 14]],
			setup: {
				counting: '5x11_15',
			},
		}, true), [[11, 2], [14, 15], [13, 11], [12, 14], [0, 0]]);
		assert.deepStrictEqual(bup.displaymode.extract_netscore({
			network_score: [[11, 2], [14, 15], [13, 11], [12, 14], [11, 6]],
			setup: {
				counting: '5x11_15',
			},
		}, true), [[11, 2], [14, 15], [13, 11], [12, 14], [11, 6]]);
		// Do not modify match
		var m = {
			network_score: [[21, 2]],
			setup: {
				counting: '3x21',
			},
		};
		assert.deepStrictEqual(bup.displaymode.extract_netscore(m), [[21, 2], [0, 0]]);
		assert.deepStrictEqual(m.network_score, [[21, 2]]);
	});

	_it('render_castall', function() {
		var state = {
			settings: {
				d_scale: 100,
				d_team_colors: true,
			},
		};
		var colors = bup.displaymode.calc_colors(state.settings);
		bup.i18n.update_state(state, 'de');

		var event = {};

		var container = _make_container();
		bup.displaymode.render_castall(state, container, event, colors);

		event = {
			league_key: '1BL-2016',
			team_names: ['1. BC Bischmisheim', 'TV Refrath'],
		};
		container = _make_container();
		bup.displaymode.render_castall(state, container, event, colors);
		// Error: no courts available
		assert(container.querySelectorAll('div[class="error"]').length > 0);

		event.courts = [{}, {}];
		event.matches = [];
		container = _make_container();
		bup.displaymode.render_castall(state, container, event, colors);
		assert(container.querySelectorAll('div[class="error"]').length === 0);
		assert(container.querySelectorAll('div[style*="bundesliga-logo.svg"]').length === 3);
		// TODO: require team names to be present
		// TODO: require team colors to be present

		// TODO test with full
		// TODO test with missing match presses
	});

	_it('all translations present', function() {
		var state = {};
		bup.i18n.update_state(state, 'de');
		bup.displaymode.ALL_STYLES.forEach(function(style) {
			assert.strictEqual(typeof style, 'string');
			var label = state._('displaymode|' + style);
			assert(!/:|untranslated/.test(label), 'untranslated displaymode style label: Missing \'displaymode|' + style + '\'');
		});
	});

	_it('all dm_styles documented', function(done) {
		var ROOT = path.dirname(__dirname);
		var url_doc_fn = path.join(ROOT, 'div', 'URLs.txt');

		fs.readFile(url_doc_fn, {encoding: 'utf8'}, function(err, doc) {
			if (err) return done(err);

			bup.displaymode.ALL_STYLES.forEach(function(style) {
				assert(doc.includes(style), 'Missing dm_style doc in div/URLs.txt: ' + style);
			});
			done();
		});
	});
});
