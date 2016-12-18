'use strict';
var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

_describe('eventutils', function() {
	_it('name_by_league', function() {
		assert.strictEqual(bup.eventutils.name_by_league('1BL-2015'), '1. Bundesliga');
		assert.strictEqual(bup.eventutils.name_by_league('1BL-2016'), '1. Bundesliga');
		assert.strictEqual(bup.eventutils.name_by_league('2BLN-2015'), '2. Bundesliga Nord');
		assert.strictEqual(bup.eventutils.name_by_league('2BLN-2016'), '2. Bundesliga Nord');
		assert.strictEqual(bup.eventutils.name_by_league('2BLS-2015'), '2. Bundesliga Süd');
		assert.strictEqual(bup.eventutils.name_by_league('2BLS-2016'), '2. Bundesliga Süd');
		assert.strictEqual(bup.eventutils.name_by_league('RLN-2016'), 'Regionalliga Nord');
		assert.strictEqual(bup.eventutils.name_by_league('RLW-2016'), 'Regionalliga West (001)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-RL-001-2016'), 'Regionalliga West (001)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-OL-002-2016'), 'NRW-Oberliga Nord (002)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-OL-003-2016'), 'NRW-Oberliga Süd (003)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-N1-VL-004-2016'), 'Verbandsliga Nord 1 (004)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-N2-VL-005-2016'), 'Verbandsliga Nord 2 (005)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-S1-VL-006-2016'), 'Verbandsliga Süd 1 (006)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-S2-VL-007-2016'), 'Verbandsliga Süd 2 (007)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-N2-LL-012-2016'), 'Landesliga Nord 2 (012)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-S1-BL-025-2016'), 'Bezirksliga Süd 1 (025)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-S1-BK-051-2016'), 'Bezirksklasse Süd 1 (051)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-S1-KL-100-2016'), 'Kreisliga Süd 1 (100)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-S1-KK-194-2016'), 'Kreisklasse Süd 1 (194)');
	});

	_it('set_metadata with incomplete match', function() {
		var event = {
			matches: [{
				setup: {
					is_doubles: false,
					counting: '3x21',
				},
				presses_json: JSON.stringify([{
					type: 'pick_side',
					team1_left: true,
					umpire_name: 'Philipp Hagemeister',
					court_id:'2',
					timestamp:1482068711532,
				}, {
					type:'pick_server',
					team_id:1,
					player_id:0,
					timestamp:1482068712227,
				}, {
					'type':'pick_receiver',
					team_id:0,
					player_id:0,
					timestamp:1482068712769,
				}, {
					type:'love-all',
					timestamp:1482068714598,
				}, {
					type:'score',
					side:'right',
					timestamp: 1482068715266,
				}, {
					type: 'disqualified',
					team_id: 0,
					player_id: 0,
					timestamp: 1482070499,
				}]),
			}],
		};

		bup.eventutils.set_metadata(event);
	});
});

