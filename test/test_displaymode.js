'use strict';

var assert = require('assert');

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
	_it('render_castall', function() {
		var state = {
			settings: {
				d_scale: 100,
				d_team_colors: true,
			},
		};
		bup.i18n.update_state(state, 'de');

		var event = {};

		var container = _make_container();
		bup.displaymode.render_castall(state, container, event);

		event = {
			league_key: '1BL-2016',
			team_names: ['1. BC Bischmisheim', 'TV Refrath'],
		};
		container = _make_container();
		bup.displaymode.render_castall(state, container, event);
		// Error: no courts available
		assert(container.querySelectorAll('div[class="error"]').length > 0);

		event.courts = [{}, {}];
		event.matches = [];
		container = _make_container();
		bup.displaymode.render_castall(state, container, event);
		assert(container.querySelectorAll('div[class="error"]').length === 0);
		assert(container.querySelectorAll('div[style*="bundesliga-logo.svg"]').length === 3);
		// TODO: require team names to be present
		// TODO: require team colors to be present

		// TODO test with full
		// TODO test with missing match presses
	});
});
