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
					type: 'pick_server',
					team_id: 1,
					player_id: 0,
					timestamp: 1482068712227,
				}, {
					type: 'pick_receiver',
					team_id: 0,
					player_id: 0,
					timestamp: 1482068712769,
				}, {
					type: 'love-all',
					timestamp: 1482068714598,
				}, {
					type: 'score',
					side: 'right',
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

	_it('is_incomplete (singles)', function() {
		assert.strictEqual(bup.eventutils.is_incomplete({
			is_doubles: false,
			teams: [{
				players: [{
					name: 'Alice',
				}],
			}, {
				players: [{
					name: 'Bob',
				}],
			}],
		}), false);
		assert.strictEqual(bup.eventutils.is_incomplete({
			is_doubles: false,
			teams: [{
				players: [{
					name: 'Alice',
				}],
			}, {
				players: [],
			}],
		}), true);
		assert.strictEqual(bup.eventutils.is_incomplete({
			is_doubles: false,
			teams: [{
				players: [],
			}, {
				players: [{
					name: 'Bob',
				}],
			}],
		}), true);
		assert.strictEqual(bup.eventutils.is_incomplete({
			is_doubles: false,
			teams: [{
				players: [],
			}, {
				players: [],
			}],
		}), true);
	});

	_it('is_incomplete (doubles)', function() {
		assert.strictEqual(bup.eventutils.is_incomplete({
			is_doubles: true,
			teams: [{
				players: [{
					name: 'Alice',
				}, {
					name: 'Andrew',
				}],
			}, {
				players: [{
					name: 'Bob',
				}, {
					name: 'Birgit',
				}],
			}],
		}), false);
		assert.strictEqual(bup.eventutils.is_incomplete({
			is_doubles: true,
			teams: [{
				players: [{
					name: 'Alice',
				}, {
					name: 'Andrew',
				}],
			}, {
				players: [{
					name: 'Birgit',
				}],
			}],
		}), true);
		assert.strictEqual(bup.eventutils.is_incomplete({
			is_doubles: true,
			teams: [{
				players: [],
			}, {
				players: [{
					name: 'Bob',
				}, {
					name: 'Birgit',
				}],
			}],
		}), true);
		assert.strictEqual(bup.eventutils.is_incomplete({
			is_doubles: true,
			teams: [{
				players: [{
					name: 'Alice',
				}],
			}, {
				players: [{
					name: 'Bob',
				}],
			}],
		}), true);
		assert.strictEqual(bup.eventutils.is_incomplete({
			is_doubles: true,
			teams: [{
				players: [],
			}, {
				players: [],
			}],
		}), true);
	});

	_it('setups_eq', function() {
		var ev = {
			last_update: 1484691649276,
			event_id: 'foo',
			league_key: '1BL-2016',
			matches: [{
				setup: {
					match_name: '1.HD',
					eventsheet_id: 'HD1',
					is_doubles: true,
					match_id: 'test_hd1',
					counting: '5x11_15',
					teams: [{
						players: [
							{name: 'Michael Mustermann'},
							{name: 'Manfred Müller'},
						],
					}, {
						players: [
							{name: 'Evan Example'},
							{name: 'Sam Smith'},
						],
					}],
				},
				network_score: [],
				presses_json: '[]',
			}, {
				setup: {
					match_name: '1. HE',
					eventsheet_id: 'HE1',
					is_doubles: false,
					match_id: 'test_he1',
					counting: '5x11_15',
					teams: [{
						players: [
							{name: 'Dieter Domke'},
						],
					}, {
						players: [
							{name: 'Marc Zwiebler'},
						],
					}],
				},
			}, {
				setup: {
					match_name: 'DE',
					eventsheet_id: 'DE',
					is_doubles: false,
					match_id: 'test_de',
					counting: '5x11_15',
					incomplete: true,
					teams: [{
						players: [],
					}, {
						players: [],
					}],
				},
			}],
			backup_players: [[{
				name: 'Bernd Backup',
				gender: 'm',
				ranking: 100,
			}, {
				name: 'Emil Ersatz',
				gender: 'm',
				ranking: 101,
			}], [
			]],
			present_players: [[{
				name: 'Alfred Anwesend',
				gender: 'm',
				ranking: 102,
			}], [
			]],
			team_names: [
				'TV Refrath',
				'BC Bischmisheim',
			],
		};
		assert(bup.eventutils.setups_eq(ev, ev));

		var ev2 = bup.utils.deep_copy(ev);
		ev2.last_update = ev.last_update + 1;
		assert(bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.id = 'bar';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.event_name = 'Irgendein match';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.league_key = '1BL-2015';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.team_names[1] = '1. BV Mülheim';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.matches.push({
			setup: {
				match_id: 'test_he3',
				match_name: 'HE3',
				counting: '5x11_15',
				is_doubles: false,
				teams: [{
					players: [],
				}, {
					players: [],
				}],
			},
		});
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.matches.splice(1, 1);
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.matches[0].setup.match_name = '1. HD';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.matches[0].setup.is_doubles = false;
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.matches[0].setup.match_id = 'test2';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.matches[0].setup.counting = '3x21';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.matches[0].setup.teams[0].players[0].name = 'Manuel Mensch';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.matches[0].setup.teams[1].players[1].name = 'Manuel Mensch';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.matches[2].setup.teams[0].players.push({name: 'Daniela Damm'});
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.matches[0].setup.teams[1].players[1].gender = 'f';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.matches[0].network_score = [[0, 21]];
		ev2.matches[0].presses_json = '[{"type":"pick_side","team1_left":true,"umpire_name":"Philipp Hagemeister","court_id":"1","timestamp":1484698732364},{"type":"pick_server","team_id":1,"player_id":0,"timestamp":1484698732943},{"type":"pick_receiver","team_id":0,"player_id":0,"timestamp":1484698733359},{"type":"love-all","timestamp":1484698733928},{"type":"editmode_set-score","score":{"winner":"inprogress","left":2,"right":0},"by_side":true,"timestamp":1484698738986},{"type":"editmode_set-finished_games","scores":[{"winner":"left","left":21,"right":0}],"by_side":true,"timestamp":1484698739087},{"type":"editmode_set-score","score":{"winner":"inprogress","left":0,"right":0},"by_side":true,"timestamp":1484698739097},{"type":"editmode_set-finished_games","scores":[{"winner":"left","left":21,"right":5}],"by_side":true,"timestamp":1484698741126}]';
		assert(bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.backup_players[0][0].gender = 'f';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.backup_players[0][0].name = 'Beate Backup';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.backup_players[1].push({
			name: 'Ferdinand Foo',
			gender: 'm',
		});
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.backup_players[0] = [];
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.present_players[0][0].gender = 'f';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.present_players[0][0].name = 'Beate Backup';
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.present_players[1].push({
			name: 'Ferdinand Foo',
			gender: 'm',
		});
		assert(!bup.eventutils.setups_eq(ev, ev2));

		ev2 = bup.utils.deep_copy(ev);
		ev2.present_players[0] = [];
		assert(!bup.eventutils.setups_eq(ev, ev2));
	});
});

