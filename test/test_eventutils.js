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
		assert.strictEqual(bup.eventutils.name_by_league('1BL-2017'), '1. Bundesliga');
		assert.strictEqual(bup.eventutils.name_by_league('1BL-2019'), '1. Bundesliga');
		assert.strictEqual(bup.eventutils.name_by_league('2BLN-2015'), '2. Bundesliga Nord');
		assert.strictEqual(bup.eventutils.name_by_league('2BLN-2016'), '2. Bundesliga Nord');
		assert.strictEqual(bup.eventutils.name_by_league('2BLN-2017'), '2. Bundesliga Nord');
		assert.strictEqual(bup.eventutils.name_by_league('2BLN-2019'), '2. Bundesliga Nord');
		assert.strictEqual(bup.eventutils.name_by_league('2BLS-2015'), '2. Bundesliga Süd');
		assert.strictEqual(bup.eventutils.name_by_league('2BLS-2016'), '2. Bundesliga Süd');
		assert.strictEqual(bup.eventutils.name_by_league('2BLS-2017'), '2. Bundesliga Süd');
		assert.strictEqual(bup.eventutils.name_by_league('2BLS-2019'), '2. Bundesliga Süd');
		assert.strictEqual(bup.eventutils.name_by_league('NLA-2017'), 'NLA');
		assert.strictEqual(bup.eventutils.name_by_league('NLA-2019'), 'NLA');
		assert.strictEqual(bup.eventutils.name_by_league('RLN-2016'), 'Regionalliga Nord');
		assert.strictEqual(bup.eventutils.name_by_league('RLW-2016'), 'Regionalliga West (001)');
		assert.strictEqual(bup.eventutils.name_by_league('RLM-2016'), 'Regionalliga Mitte');
		assert.strictEqual(bup.eventutils.name_by_league('RLSOO-2017'), 'Regionalliga SüdOst Ost');
		assert.strictEqual(bup.eventutils.name_by_league('RLSOS-2017'), 'Regionalliga SüdOst Süd');
		assert.strictEqual(bup.eventutils.name_by_league('RLSO-2019'), 'Regionalliga SüdOst');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-RL-001-2016'), 'Regionalliga West (001)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-GW-RL-001-2016'), 'Regionalliga West (001)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-GW-OL-002-2016'), 'NRW-Oberliga Nord (002)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-OL-002-2016'), 'NRW-Oberliga Nord (002)');
		assert.strictEqual(bup.eventutils.name_by_league('NRW-O19-GW-OL-003-2016'), 'NRW-Oberliga Süd (003)');
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
		assert.strictEqual(bup.eventutils.name_by_league('OBL-2017'), 'ÖBV-Bundesliga'); // Austria
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

	_it('set_not_before', function() {
		var matches = [{
			setup: {
				match_id: 'HD1',
				is_doubles: true,
				counting: '5x11_15',
				teams: [{
					players: [
						{name: 'Sam Magee'},
						{name: 'Richard Domke'},
					],
				}, {
					players: [
						{name: 'Michael Fuchs'},
						{name: 'Marvin Seidel'},
					],
				}],
			},
			presses_json: '[{"type":"pick_side","team1_left":false,"timestamp":1485104515708},{"type":"pick_server","team_id":0,"player_id":0,"timestamp":1485104518071},{"type":"shuttle","timestamp":1485104604580},{"type":"love-all","timestamp":1485104629089},{"type":"score","side":"left","timestamp":1485104634244},{"type":"score","side":"left","timestamp":1485104652344},{"type":"score","side":"right","timestamp":1485104664394},{"type":"score","side":"left","timestamp":1485104675001},{"type":"score","side":"right","timestamp":1485104687418},{"type":"score","side":"left","timestamp":1485104711434},{"type":"score","side":"right","timestamp":1485104734983},{"type":"score","side":"left","timestamp":1485104751078},{"type":"score","side":"left","timestamp":1485104764877},{"type":"score","side":"left","timestamp":1485104780870},{"type":"score","side":"left","timestamp":1485104800720},{"type":"score","side":"right","timestamp":1485104811950},{"type":"score","side":"right","timestamp":1485104828095},{"type":"score","side":"left","timestamp":1485104846698},{"type":"score","side":"left","timestamp":1485104862631},{"type":"score","side":"right","timestamp":1485104875968},{"type":"score","side":"left","timestamp":1485104890043},{"type":"postgame-confirm","timestamp":1485104898703},{"type":"shuttle","timestamp":1485104920180},{"type":"love-all","timestamp":1485104934444},{"type":"score","side":"right","timestamp":1485104942588},{"type":"score","side":"left","timestamp":1485104960356},{"type":"score","side":"left","timestamp":1485104979838},{"type":"shuttle","timestamp":1485104985393},{"type":"score","side":"left","timestamp":1485104998562},{"type":"score","side":"right","timestamp":1485105018487},{"type":"score","side":"right","timestamp":1485105033746},{"type":"score","side":"left","timestamp":1485105047606},{"type":"score","side":"left","timestamp":1485105059227},{"type":"score","side":"right","timestamp":1485105076295},{"type":"score","side":"left","timestamp":1485105098150},{"type":"shuttle","timestamp":1485105104165},{"type":"score","side":"right","timestamp":1485105122564},{"type":"score","side":"left","timestamp":1485105136055},{"type":"score","side":"right","timestamp":1485105152877},{"type":"score","side":"left","timestamp":1485105161496},{"type":"score","side":"right","timestamp":1485105173256},{"type":"score","side":"left","timestamp":1485105187284},{"type":"score","side":"left","timestamp":1485105214953},{"type":"score","side":"left","timestamp":1485105228895},{"type":"postgame-confirm","timestamp":1485105242122},{"type":"love-all","timestamp":1485105287950},{"type":"score","side":"left","timestamp":1485105292434},{"type":"score","side":"right","timestamp":1485105305858},{"type":"score","side":"left","timestamp":1485105315270},{"type":"score","side":"left","timestamp":1485105333080},{"type":"score","side":"left","timestamp":1485105344764},{"type":"score","side":"right","timestamp":1485105358836},{"type":"score","side":"right","timestamp":1485105384299},{"type":"score","side":"left","timestamp":1485105413244},{"type":"score","side":"right","timestamp":1485105433299},{"type":"score","side":"left","timestamp":1485105447244},{"type":"score","side":"right","timestamp":1485105461851},{"type":"score","side":"right","timestamp":1485105475686},{"type":"score","side":"left","timestamp":1485105488903},{"type":"score","side":"right","timestamp":1485105500580},{"type":"score","side":"right","timestamp":1485105527919},{"type":"score","side":"right","timestamp":1485105543970},{"type":"score","side":"right","timestamp":1485105557129},{"type":"score","side":"right","timestamp":1485105573369},{"type":"postgame-confirm","timestamp":1485105587841},{"type":"love-all","timestamp":1485105634834},{"type":"score","side":"right","timestamp":1485105641832},{"type":"score","side":"left","timestamp":1485105666409},{"type":"score","side":"right","timestamp":1485105683162},{"type":"score","side":"left","timestamp":1485105701543},{"type":"shuttle","timestamp":1485105708590},{"type":"score","side":"left","timestamp":1485105724712},{"type":"score","side":"right","timestamp":1485105742327},{"type":"score","side":"left","timestamp":1485105762148},{"type":"score","side":"right","timestamp":1485105778253},{"type":"score","side":"left","timestamp":1485105793264},{"type":"score","side":"right","timestamp":1485105815518},{"type":"score","side":"right","timestamp":1485105830727},{"type":"score","side":"left","timestamp":1485105843397},{"type":"score","side":"left","timestamp":1485105860064},{"type":"score","side":"right","timestamp":1485105876834},{"type":"score","side":"left","timestamp":1485105894216},{"type":"score","side":"left","timestamp":1485105912956},{"type":"score","side":"left","timestamp":1485105949743},{"type":"shuttle","timestamp":1485105963337},{"type":"score","side":"right","timestamp":1485105976693},{"type":"score","side":"right","timestamp":1485105993078},{"type":"score","side":"right","timestamp":1485106004794},{"type":"score","side":"left","timestamp":1485106019866},{"type":"score","side":"left","timestamp":1485106037052}]',
		}, {
			setup: {
				match_id: 'DD',
				is_doubles: true,
				counting: '5x11_15',
				teams: [{
					players: [
						{name: 'Jennifer Karnott'},
						{name: 'Carla Nelte'},
					],
				}, {
					players: [
						{name: 'Linda Efler'},
						{name: 'Isabel Lohau'},
					],
				}],
			},
			presses_json: '[{"type":"pick_side","team1_left":false,"timestamp":1485104515708},{"type":"pick_server","team_id":0,"player_id":0,"timestamp":1485104518071},{"type":"shuttle","timestamp":1485104604580},{"type":"love-all","timestamp":1485104629089},{"type":"score","side":"left","timestamp":1485104634244},{"type":"score","side":"left","timestamp":1485104652344},{"type":"score","side":"right","timestamp":1485104664394},{"type":"score","side":"left","timestamp":1485104675001},{"type":"score","side":"right","timestamp":1485104687418},{"type":"score","side":"left","timestamp":1485104711434},{"type":"score","side":"right","timestamp":1485104734983},{"type":"score","side":"left","timestamp":1485104751078},{"type":"score","side":"left","timestamp":1485104764877},{"type":"score","side":"left","timestamp":1485104780870},{"type":"score","side":"left","timestamp":1485104800720},{"type":"score","side":"right","timestamp":1485104811950},{"type":"score","side":"right","timestamp":1485104828095},{"type":"score","side":"left","timestamp":1485104846698},{"type":"score","side":"left","timestamp":1485104862631},{"type":"score","side":"right","timestamp":1485104875968},{"type":"score","side":"left","timestamp":1485104890043},{"type":"postgame-confirm","timestamp":1485104898703},{"type":"shuttle","timestamp":1485104920180},{"type":"love-all","timestamp":1485104934444},{"type":"score","side":"right","timestamp":1485104942588},{"type":"score","side":"left","timestamp":1485104960356},{"type":"score","side":"left","timestamp":1485104979838},{"type":"shuttle","timestamp":1485104985393},{"type":"score","side":"left","timestamp":1485104998562},{"type":"score","side":"right","timestamp":1485105018487},{"type":"score","side":"right","timestamp":1485105033746},{"type":"score","side":"left","timestamp":1485105047606},{"type":"score","side":"left","timestamp":1485105059227},{"type":"score","side":"right","timestamp":1485105076295},{"type":"score","side":"left","timestamp":1485105098150},{"type":"shuttle","timestamp":1485105104165},{"type":"score","side":"right","timestamp":1485105122564},{"type":"score","side":"left","timestamp":1485105136055},{"type":"score","side":"right","timestamp":1485105152877},{"type":"score","side":"left","timestamp":1485105161496},{"type":"score","side":"right","timestamp":1485105173256},{"type":"score","side":"left","timestamp":1485105187284},{"type":"score","side":"left","timestamp":1485105214953},{"type":"score","side":"left","timestamp":1485105228895},{"type":"postgame-confirm","timestamp":1485105242122},{"type":"love-all","timestamp":1485105287950},{"type":"score","side":"left","timestamp":1485105292434},{"type":"score","side":"right","timestamp":1485105305858},{"type":"score","side":"left","timestamp":1485105315270},{"type":"score","side":"left","timestamp":1485105333080},{"type":"score","side":"left","timestamp":1485105344764},{"type":"score","side":"right","timestamp":1485105358836},{"type":"score","side":"right","timestamp":1485105384299},{"type":"score","side":"left","timestamp":1485105413244},{"type":"score","side":"right","timestamp":1485105433299},{"type":"score","side":"left","timestamp":1485105447244},{"type":"score","side":"right","timestamp":1485105461851},{"type":"score","side":"right","timestamp":1485105475686},{"type":"score","side":"left","timestamp":1485105488903},{"type":"score","side":"right","timestamp":1485105500580},{"type":"score","side":"right","timestamp":1485105527919},{"type":"score","side":"right","timestamp":1485105543970},{"type":"score","side":"right","timestamp":1485105557129},{"type":"score","side":"right","timestamp":1485105573369},{"type":"postgame-confirm","timestamp":1485105587841},{"type":"love-all","timestamp":1485105634834},{"type":"score","side":"right","timestamp":1485105641832},{"type":"score","side":"left","timestamp":1485105666409},{"type":"score","side":"right","timestamp":1485105683162},{"type":"score","side":"left","timestamp":1485105701543},{"type":"shuttle","timestamp":1485105708590},{"type":"score","side":"left","timestamp":1485105724712},{"type":"score","side":"right","timestamp":1485105742327},{"type":"score","side":"left","timestamp":1485105762148},{"type":"score","side":"right","timestamp":1485105778253},{"type":"score","side":"left","timestamp":1485105793264},{"type":"score","side":"right","timestamp":1485105815518},{"type":"score","side":"right","timestamp":1485105830727},{"type":"score","side":"left","timestamp":1485105843397},{"type":"score","side":"left","timestamp":1485105860064},{"type":"score","side":"right","timestamp":1485105876834},{"type":"score","side":"left","timestamp":1485105894216},{"type":"score","side":"left","timestamp":1485105912956},{"type":"score","side":"left","timestamp":1485105949743},{"type":"shuttle","timestamp":1485105963337},{"type":"score","side":"right","timestamp":1485105976693},{"type":"score","side":"right","timestamp":1485105993078},{"type":"score","side":"right","timestamp":1485106004794},{"type":"score","side":"left","timestamp":1485106019866},{"type":"score","side":"left","timestamp":1485106037051}]',
		}, {
			setup: {
				match_id: 'GD',
				is_doubles: true,
				counting: '5x11_15',
				teams: [{
					players: [
						{name: 'Sam Magee'},
						{name: 'Carla Nelte'},
					],
				}, {
					players: [
						{name: 'Peter Käsbauer'},
						{name: 'Isabel Lohau'},
					],
				}],
			},
			presses_json: '[]',
		}, {
			setup: {
				match_id: 'HE1',
				is_doubles: false,
				counting: '5x11_15',
				teams: [{
					players: [
						{name: 'Fabian Roth'},
					],
				}, {
					players: [
						{name: 'Marc Zwiebler'},
					],
				}],
			},
			presses_json: '[]',
		}, {
			setup: {
				match_id: 'HD2',
				is_doubles: true,
				counting: '5x11_15',
				teams: [{
					players: [
						{name: 'Fabian Holzer'},
						{name: 'Denis Nyenhuis'},
					],
				}, {
					players: [
						{name: 'Johannes Schöttler'},
						{name: 'Marcel Reuter'},
					],
				}],
			},
			presses_json: '[{"type":"pick_side","team1_left":false,"timestamp":1485104515708}]',
		}, {
			setup: {
				match_id: 'HD4',
				is_doubles: true,
				counting: '5x11_15',
				teams: [{
					players: [
						{name: 'Kai Waldenberger'},
						{name: 'Mark Byerly'},
					],
				}, {
					players: [
						{name: 'Tobias Wadenka'},
						{name: 'Lucas Bednorsch'},
					],
				}],
			},
			presses_json: '[{"type":"pick_side","team1_left":false,"timestamp":1485104515708}]',
		}, {
			setup: {
				match_id: 'HE2',
				is_doubles: false,
				counting: '5x11_15',
				teams: [{
					players: [
						{name: 'Denis Nyenhuis'},
					],
				}, {
					players: [
						{name: 'Tobias Wadenka'},
					],
				}],
			},
			presses_json: '[]',
		}, {
			setup: {
				match_id: 'HE3',
				is_doubles: false,
				counting: '5x11_15',
				teams: [{
					players: [
						{name: 'Fabian Holzer'},
					],
				}, {
					players: [
						{name: 'Marvin Seidel'},
					],
				}],
			},
			presses_json: '[]',
		}, {
			setup: {
				match_id: 'HD3',
				is_doubles: true,
				counting: '5x11_15',
				teams: [{
					players: [
						{name: 'Joshua Magee'},
						{name: 'Joshua Domke'},
					],
				}, {
					players: [
						{name: 'Philipp Wachenfeld'},
						{name: 'Samuel Hsiao'},
					],
				}],
			},
			presses_json: '[{"type":"pick_side","team1_left":false,"timestamp":1485104515708},{"type":"pick_server","team_id":0,"player_id":0,"timestamp":1485104518071},{"type":"shuttle","timestamp":1485104604580},{"type":"love-all","timestamp":1485104629089},{"type":"score","side":"left","timestamp":1485104634244},{"type":"score","side":"left","timestamp":1485104652344},{"type":"score","side":"right","timestamp":1485104664394},{"type":"score","side":"left","timestamp":1485104675001},{"type":"score","side":"right","timestamp":1485104687418},{"type":"score","side":"left","timestamp":1485104711434},{"type":"score","side":"right","timestamp":1485104734983},{"type":"score","side":"left","timestamp":1485104751078},{"type":"score","side":"left","timestamp":1485104764877},{"type":"score","side":"left","timestamp":1485104780870},{"type":"score","side":"left","timestamp":1485104800720},{"type":"score","side":"right","timestamp":1485104811950},{"type":"score","side":"right","timestamp":1485104828095},{"type":"score","side":"left","timestamp":1485104846698},{"type":"score","side":"left","timestamp":1485104862631},{"type":"score","side":"right","timestamp":1485104875968},{"type":"score","side":"left","timestamp":1485104890043},{"type":"postgame-confirm","timestamp":1485104898703},{"type":"shuttle","timestamp":1485104920180},{"type":"love-all","timestamp":1485104934444},{"type":"score","side":"right","timestamp":1485104942588},{"type":"score","side":"left","timestamp":1485104960356},{"type":"score","side":"left","timestamp":1485104979838},{"type":"shuttle","timestamp":1485104985393},{"type":"score","side":"left","timestamp":1485104998562},{"type":"score","side":"right","timestamp":1485105018487},{"type":"score","side":"right","timestamp":1485105033746},{"type":"score","side":"left","timestamp":1485105047606},{"type":"score","side":"left","timestamp":1485105059227},{"type":"score","side":"right","timestamp":1485105076295},{"type":"score","side":"left","timestamp":1485105098150},{"type":"shuttle","timestamp":1485105104165},{"type":"score","side":"right","timestamp":1485105122564},{"type":"score","side":"left","timestamp":1485105136055},{"type":"score","side":"right","timestamp":1485105152877},{"type":"score","side":"left","timestamp":1485105161496},{"type":"score","side":"right","timestamp":1485105173256},{"type":"score","side":"left","timestamp":1485105187284},{"type":"score","side":"left","timestamp":1485105214953},{"type":"score","side":"left","timestamp":1485105228895},{"type":"postgame-confirm","timestamp":1485105242122},{"type":"love-all","timestamp":1485105287950},{"type":"score","side":"left","timestamp":1485105292434},{"type":"score","side":"right","timestamp":1485105305858},{"type":"score","side":"left","timestamp":1485105315270},{"type":"score","side":"left","timestamp":1485105333080},{"type":"score","side":"left","timestamp":1485105344764},{"type":"score","side":"right","timestamp":1485105358836},{"type":"score","side":"right","timestamp":1485105384299},{"type":"score","side":"left","timestamp":1485105413244},{"type":"score","side":"right","timestamp":1485105433299},{"type":"score","side":"left","timestamp":1485105447244},{"type":"score","side":"right","timestamp":1485105461851},{"type":"score","side":"right","timestamp":1485105475686},{"type":"score","side":"left","timestamp":1485105488903},{"type":"score","side":"right","timestamp":1485105500580},{"type":"score","side":"right","timestamp":1485105527919},{"type":"score","side":"right","timestamp":1485105543970},{"type":"score","side":"right","timestamp":1485105557129},{"type":"score","side":"right","timestamp":1485105573369},{"type":"postgame-confirm","timestamp":1485105587841},{"type":"love-all","timestamp":1485105634834},{"type":"score","side":"right","timestamp":1485105641832},{"type":"score","side":"left","timestamp":1485105666409},{"type":"score","side":"right","timestamp":1485105683162},{"type":"score","side":"left","timestamp":1485105701543},{"type":"shuttle","timestamp":1485105708590},{"type":"score","side":"left","timestamp":1485105724712},{"type":"score","side":"right","timestamp":1485105742327},{"type":"score","side":"left","timestamp":1485105762148},{"type":"score","side":"right","timestamp":1485105778253},{"type":"score","side":"left","timestamp":1485105793264},{"type":"score","side":"right","timestamp":1485105815518},{"type":"score","side":"right","timestamp":1485105830727},{"type":"score","side":"left","timestamp":1485105843397},{"type":"score","side":"left","timestamp":1485105860064},{"type":"score","side":"right","timestamp":1485105876834},{"type":"score","side":"left","timestamp":1485105894216},{"type":"score","side":"left","timestamp":1485105912956},{"type":"score","side":"left","timestamp":1485105949743},{"type":"shuttle","timestamp":1485105963337},{"type":"score","side":"right","timestamp":1485105976693},{"type":"score","side":"right","timestamp":1485105993078},{"type":"score","side":"right","timestamp":1485106004794},{"type":"score","side":"left","timestamp":1485106019866},{"type":"score","side":"left","timestamp":1485106037053}]',
		}, {
			setup: {
				match_id: 'HE4',
				is_doubles: false,
				counting: '5x11_15',
				teams: [{
					players: [
						{name: 'Richard Domke'},
					],
				}, {
					players: [
						{name: 'Samuel Hsiao'},
					],
				}],
			},
			presses_json: '[]',
		}, {
			setup: {
				match_id: 'DE',
				is_doubles: false,
				counting: '5x11_15',
				teams: [{
					players: [
						{name: 'Chloe Magee'},
					],
				}, {
					players: [
						{name: 'Olga Konon'},
					],
				}],
			},
			presses_json: '[]',

		}];
		var local_state = {};
		var match_states = matches.map(function(m) {
			var presses = JSON.parse(m.presses_json);
			assert(presses);
			return bup.calc.remote_state(local_state, m.setup, presses);
		});
		var named_match_states = {};
		match_states.forEach(function(ms) {
			named_match_states[ms.setup.match_id] = ms;
		});

		bup.eventutils.set_not_before('1BL-2016', match_states);
		assert.deepStrictEqual(named_match_states.HD1.not_before, 'started');
		assert.deepStrictEqual(named_match_states.DD.not_before, 'started');
		assert.deepStrictEqual(named_match_states.GD.not_before, 1485107237052);
		assert.deepStrictEqual(named_match_states.HE1.not_before, 0);
		assert.deepStrictEqual(named_match_states.HD2.not_before, 'started');
		assert.deepStrictEqual(named_match_states.HD4.not_before, 'started');
		assert.deepStrictEqual(named_match_states.HE2.not_before, 'playing');
		assert.deepStrictEqual(named_match_states.HE2.not_before_matches, [named_match_states.HD2, named_match_states.HD4]);
		assert.deepStrictEqual(named_match_states.HE3.not_before, 'playing');
		assert.deepStrictEqual(named_match_states.HE3.not_before_matches, [named_match_states.HD2]);
		assert.deepStrictEqual(named_match_states.HD3.not_before, 'started');
		assert.deepStrictEqual(named_match_states.HE4.not_before, 1485107237053);
		assert.deepStrictEqual(named_match_states.DE.not_before, 0);

		bup.eventutils.set_not_before('RLW-2016', match_states);
		assert.deepStrictEqual(named_match_states.HD1.not_before, 'started');
		assert.deepStrictEqual(named_match_states.GD.not_before, 1485107837052);
		assert.deepStrictEqual(named_match_states.DD.not_before, 'started');
		assert.deepStrictEqual(named_match_states.HE1.not_before, 0);
		assert.deepStrictEqual(named_match_states.HD2.not_before, 'started');
		assert.deepStrictEqual(named_match_states.HD4.not_before, 'started');
		assert.deepStrictEqual(named_match_states.HE2.not_before, 'playing');
		assert.deepStrictEqual(named_match_states.HE2.not_before_matches, [named_match_states.HD2, named_match_states.HD4]);
		assert.deepStrictEqual(named_match_states.HE3.not_before, 'playing');
		assert.deepStrictEqual(named_match_states.HE3.not_before_matches, [named_match_states.HD2]);
		assert.deepStrictEqual(named_match_states.HD3.not_before, 'started');
		assert.deepStrictEqual(named_match_states.HE4.not_before, 1485107837053);
		assert.deepStrictEqual(named_match_states.DE.not_before, 0);

		bup.eventutils.set_not_before('ficticious-league', match_states); // No rest information for this league
		match_states.forEach(function(ms) {
			assert.deepStrictEqual(ms.not_before, undefined);
		});
	});

	_it('default_counting', function() {
		assert.deepStrictEqual(bup.eventutils.default_counting('1BL-2016'), '5x11_15');
		assert.deepStrictEqual(bup.eventutils.default_counting('1BL-2017'), '5x11_15^90');
		assert.deepStrictEqual(bup.eventutils.default_counting('2BLS-2017'), '5x11_15^90');
		assert.deepStrictEqual(bup.eventutils.default_counting('NLA-2017'), '3x21');
		assert.deepStrictEqual(bup.eventutils.default_counting('NLA-2019'), '5x11_15~NLA');
		assert.deepStrictEqual(bup.eventutils.default_counting('NRW-O19-OL-002-2016'), '3x21');
		assert.deepStrictEqual(bup.eventutils.default_counting('RLW-2016'), '3x21');
		assert.deepStrictEqual(bup.eventutils.default_counting('RLN-2016'), '3x21');
		assert.deepStrictEqual(bup.eventutils.default_counting('RLM-2016'), '3x21');
		assert.deepStrictEqual(bup.eventutils.default_counting('RLSOS-2017'), '3x21');
		assert.deepStrictEqual(bup.eventutils.default_counting('RLSOO-2017'), '3x21');
		assert.deepStrictEqual(bup.eventutils.default_counting('RLSO-2019'), '3x21');
		assert.deepStrictEqual(bup.eventutils.default_counting('OBL-2017'), '3x21');
		assert.deepStrictEqual(bup.eventutils.default_counting('bayern-2018'), '3x21');
	});

	_it('get_min_pause', function() {
		assert.deepStrictEqual(bup.eventutils.get_min_pause('NLA-2017'), 900000);
		assert.deepStrictEqual(bup.eventutils.get_min_pause('NLA-2019'), 900000);
		assert.deepStrictEqual(bup.eventutils.get_min_pause('OBL-2017'), 900000);
		assert.deepStrictEqual(bup.eventutils.get_min_pause('bayern-2018'), 20 * 60 * 1000);
		assert.deepStrictEqual(bup.eventutils.get_min_pause('RLSO-2019'), 20 * 60 * 1000);
	});

	_it('annotate counting', function() {
		var s = {};
		var ev = {
			league_key: '1BL-2017',
			matches: [{
				setup: {
					match_id: 'test_foo',
				},
			}],
		};
		bup.eventutils.annotate(s, ev);
		assert.deepStrictEqual(ev.matches[0].setup.counting, '5x11_15^90');

		// Match details should not be overwritten
		ev = {
			league_key: '1BL-2017',
			matches: [{
				setup: {
					match_id: 'test_foo',
					counting: '1x21',
				},
			}],
		};
		bup.eventutils.annotate(s, ev);
		assert.deepStrictEqual(ev.matches[0].setup.counting, '1x21');

		// counting works as well
		ev = {
			counting: '5x11_11',
			matches: [{
				setup: {
					match_id: 'test_foo',
				},
			}],
		};
		bup.eventutils.annotate(s, ev);
		assert.deepStrictEqual(ev.matches[0].setup.counting, '5x11_11');
	
		// counting supercedes league_key
		ev = {
			counting: '5x11_11',
			league_key: '1BL-2017',
			matches: [{
				setup: {
					match_id: 'test_foo',
				},
			}],
		};
		bup.eventutils.annotate(s, ev);
		assert.deepStrictEqual(ev.matches[0].setup.counting, '5x11_11');

		// match counting supercedes event counting
		ev = {
			counting: '5x11_11',
			league_key: '1BL-2017',
			matches: [{
				setup: {
					match_id: 'test_foo',
					counting: '3x21',
				},
			}],
		};
		bup.eventutils.annotate(s, ev);
		assert.deepStrictEqual(ev.matches[0].setup.counting, '3x21');
	});

	_it('pronounce_teamname', function() {
		assert.equal(
			bup.eventutils.pronounce_teamname('Spvgg.Sterkrade-N.'), 'Sportvereinigung Sterkrade-Nord');
		assert.equal(
			bup.eventutils.pronounce_teamname('VfB GW Mülheim'),
			'Grün-Weiß Mülheim');
		assert.equal(
			bup.eventutils.pronounce_teamname('TV Refrath'), 'TV Refrath');
		assert.equal(
			bup.eventutils.pronounce_teamname('TV Refrath 3'), 'TV Refrath 3');
		assert.equal(
			bup.eventutils.pronounce_teamname('TV Refrath 15'), 'TV Refrath 15');
		assert.equal(
			bup.eventutils.pronounce_teamname('Blau-Weiss Wittorf-NMS'), 'Blau-Weiss Wittorf-Neumünster');
		assert.equal(
			bup.eventutils.pronounce_teamname('SC BW Ostenland'), 'SC Blau-Weiss Ostenland');
		assert.equal(
			bup.eventutils.pronounce_teamname('SC BW Ostenland 1'), 'SC Blau-Weiss Ostenland');
		assert.equal(
			bup.eventutils.pronounce_teamname('STC BW Solingen'), 'STC Blau-Weiss Solingen');
		assert.equal(
			bup.eventutils.pronounce_teamname('STC BW Solingen 1'), 'STC Blau-Weiss Solingen');
		assert.equal(
			bup.eventutils.pronounce_teamname('1.BC Sbr.-Bischmisheim 3'), '1.BC Saarbrücken-Bischmisheim 3');
	});
});

