
var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;
var SINGLES_SETUP = tutils.SINGLES_SETUP;
var press_score = tutils.press_score;

(function() {
'use strict';

_describe('network functions', function() {
	_it('calc_team0_left', function() {
		var presses = [];
		var m = {
			setup: SINGLES_SETUP,
			presses: presses,
		};
		assert.strictEqual(bup.network.calc_team0_left(m), null);

		m = {
			setup: SINGLES_SETUP,
			network_team0_left: null,
		};
		assert.strictEqual(bup.network.calc_team0_left(m), null);

		presses = [{
			type: 'pick_side',
			team1_left: true,
		}];
		m = {
			setup: SINGLES_SETUP,
			presses: presses,
		};
		assert.strictEqual(bup.network.calc_team0_left(m), true);

		m = {
			setup: SINGLES_SETUP,
			network_team0_left: true,
			presses: presses,
		};
		assert.strictEqual(bup.network.calc_team0_left(m), true);

		m = {
			setup: SINGLES_SETUP,
			network_team0_left: false,
			presses: presses,
		};
		assert.strictEqual(bup.network.calc_team0_left(m), false);

		presses = [{
			type: 'pick_side',
			team1_left: false,
		}];
		m = {
			setup: SINGLES_SETUP,
			presses: presses,
		};
		assert.strictEqual(bup.network.calc_team0_left(m), false);

		m = {
			setup: SINGLES_SETUP,
			network_team0_left: true,
			presses: presses,
		};
		assert.strictEqual(bup.network.calc_team0_left(m), true);

		m = {
			setup: SINGLES_SETUP,
			network_team0_left: false,
			presses: presses,
		};
		assert.strictEqual(bup.network.calc_team0_left(m), false);

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 21, 0);

		m = {
			setup: SINGLES_SETUP,
			presses: presses,
		};
		assert.strictEqual(bup.network.calc_team0_left(m), false);

		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'love-all',
		});

		m = {
			setup: SINGLES_SETUP,
			presses: presses,
		};
		assert.strictEqual(bup.network.calc_team0_left(m), true);
	});
});

})();
