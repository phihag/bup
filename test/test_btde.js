'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;

var i18n = tutils.bup.i18n;

_describe('btde', function() {
	_it('parse_event', function() {
		var doc = {
			'home': 'TV Refrath 2',
			'guest': 'BC Hohenlimburg',
			'league': '(002) 2. Bundesliga Nord',
			'matchday': '1. Spieltag',
			'datetime': '07.09.2019 13:00',
			'venue': 'SpH, Steinbreche, 51427 Bergisch Gladbach-Refrath',
			'url': 'https://www.turnier.de/sport/teammatch.aspx?id=DCA64B96-526B-415F-831C-0F30E39546BC&match=208',
			'gews': '3',
			'fixtures': [{
				'id':'1',
				'dis':'HD1',
				'home':'Holtschke, Brian/Graalmann, Hauke',
				'guest':'Magee, Joshua/Laibacher, Malte',
				'course': [
					['0:0','1:0','2:0','3:0','4:0','5:0','6:0','7:0','8:0','9:0','10:0','10:1','10:2','10:3','10:4','10:5','10:6','10:7','11:7'],
					['0:0','1:0','2:0','3:0','4:0','5:0','6:0','7:0','8:0','9:0','9:1','9:2','9:3','9:4','9:5','9:6','9:7','9:8','9:9','9:10','10:10','11:10','12:10'],
					['0:0','1:0','2:0','3:0','4:0','5:0','6:0','7:0','8:0','9:0','10:0','10:1','10:2','10:3','10:4','10:5','10:6','10:7','10:8','10:9','11:9'],
				],
				'court':'0',
			},{
				'id':'2',
				'dis':'DD',
				'home':'Sp\u00f6ri, Ann-Kathrin/Karnott, Jennifer',
				'guest':'Romanova, Jekaterina/Fischer, Lena',
				'course': [
					['0:0','1:0','2:0','3:0','4:0','5:0','6:0','7:0','8:0','9:0','9:1','9:2','9:3','9:4','9:5','9:6','10:6','11:6'],
					['0:0','1:0','2:0','3:0','4:0','5:0','6:0','7:0','8:0','9:0','10:0','10:1','10:2','10:3','11:3'],
					['0:0','1:0','2:0','2:1','2:2','2:3','3:3','3:4','4:4','4:5','5:5','6:5','7:5','7:6','7:7','7:8','7:9','7:10','7:11'],
					['0:0','1:0','2:0','3:0','4:0','5:0','6:0','7:0','8:0','9:0','10:0','10:1','10:2','10:3','10:4','10:5','11:5']],
				'court':'0',
			}, {
				'id':'3',
				'dis':'HD2',
				'home':'Klauer, Christopher/Nyenhuis, Denis',
				'guest':'Bald, Christian/Stoppel, Fabian',
				'course': [['9:11'],['8:11'],['8:11']],
				'court':'0',
			}, {
				'id':'4',
				'dis':'HE1',
				'home':'Klauer, Christopher',
				'guest':'Magee, Joshua',
				'course': [['11:6'],['11:7'],['6:11'],['6:11'],['7:11']],
				'court':'2',
			}, {
				'id':'5', 'dis':'DE',
				'home':'Sp\u00f6ri, Ann-Kathrin',
				'guest':'Romanova, Jekaterina',
				'course':[['11:3'],['12:10'],['11:3']],
				'court':'0',
			}, {
				'id':'6',
				'dis':'GD',
				'home': 'Karnott, Jennifer/Graalmann, Hauke',
				'guest':'Fischer, Lena/Stoppel, Fabian',
				'course': [['12:10'],['9:11'],['4:11'],['11:8'],['8:11']],
				'court':'1',
			}, {
				'id':'7',
				'dis':'HE2',
				'home':'Holtschke, Brian',
				'guest':'Laibacher, Malte',
				'course': [['12:14'],['9:11'],['11:9'],['11:2'],['11:1']],
				'court':'0',
			}],
		};

		var expected = {
			'team_names': ['TV Refrath 2', 'BC Hohenlimburg'],
			'team_competition': true,
			'league_key': '2BLN-2020',
			'date': '07.09.2019',
			'starttime': '13:00',
			'matchday': '1',
			'report_urls': ['https://www.turnier.de/sport/teammatch.aspx?id=DCA64B96-526B-415F-831C-0F30E39546BC&match=208'],
			'location': 'SpH, Steinbreche, 51427 Bergisch Gladbach-Refrath',
			'courts': [{
				'court_id': 1,
				'description': 'links',
				'match_id': 'btde_2019-10-12_GD_TV Refrath 2-BC Hohenlimburg',
			}, {
				'court_id': 2,
				'description': 'rechts',
				'match_id': 'btde_2019-10-12_HE1_TV Refrath 2-BC Hohenlimburg',
			}],
			'matches': [
				{
					'setup': {
						'incomplete': false,
						'counting': '5x11_15^90',
						'match_name': 'HD1',
						'eventsheet_id': '1.HD',
						'is_doubles': true,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Brian',
										'lastname': 'Holtschke',
										'name': 'Brian Holtschke',
									},
									{
										'firstname': 'Hauke',
										'lastname': 'Graalmann',
										'name': 'Hauke Graalmann',
									},
								],
							},
							{
								'players': [
									{
										'firstname': 'Joshua',
										'lastname': 'Magee',
										'name': 'Joshua Magee',
									},
									{
										'firstname': 'Malte',
										'lastname': 'Laibacher',
										'name': 'Malte Laibacher',
									},
								],
							},
						],
						'btde_match_id': '1',
						'match_id': 'btde_2019-10-12_HD1_TV Refrath 2-BC Hohenlimburg',
					},
					'network_score': [[11, 7], [12, 10], [11, 9]],
				},
				{
					'setup': {
						'incomplete': false,
						'counting': '5x11_15^90',
						'match_name': 'DD',
						'eventsheet_id': 'DD',
						'is_doubles': true,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Ann-Kathrin',
										'lastname': 'Spöri',
										'name': 'Ann-Kathrin Spöri',
									},
									{
										'firstname': 'Jennifer',
										'lastname': 'Karnott',
										'name': 'Jennifer Karnott',
									},
								],
							},
							{
								'players': [
									{
										'firstname': 'Jekaterina',
										'lastname': 'Romanova',
										'name': 'Jekaterina Romanova',
									},
									{
										'firstname': 'Lena',
										'lastname': 'Fischer',
										'name': 'Lena Fischer',
									},
								],
							},
						],
						'btde_match_id': '2',
						'match_id': 'btde_2019-10-12_DD_TV Refrath 2-BC Hohenlimburg',
					},
					'network_score': [[11, 6], [11, 3], [7, 11], [11, 5]],
				},
				{
					'setup': {
						'incomplete': false,
						'counting': '5x11_15^90',
						'match_name': 'HD2',
						'eventsheet_id': '2.HD',
						'is_doubles': true,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Christopher',
										'lastname': 'Klauer',
										'name': 'Christopher Klauer',
									},
									{
										'firstname': 'Denis',
										'lastname': 'Nyenhuis',
										'name': 'Denis Nyenhuis',
									},
								],
							},
							{
								'players': [
									{
										'firstname': 'Christian',
										'lastname': 'Bald',
										'name': 'Christian Bald',
									},
									{
										'firstname': 'Fabian',
										'lastname': 'Stoppel',
										'name': 'Fabian Stoppel',
									},
								],
							},
						],
						'btde_match_id': '3',
						'match_id': 'btde_2019-10-12_HD2_TV Refrath 2-BC Hohenlimburg',
					},
					'network_score': [[9, 11], [8, 11], [8, 11]],
				},
				{
					'setup': {
						'counting': '5x11_15^90',
						'incomplete': false,
						'match_name': 'HE1',
						'eventsheet_id': '1.HE',
						'is_doubles': false,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Christopher',
										'lastname': 'Klauer',
										'name': 'Christopher Klauer',
									},
								],
							},
							{
								'players': [
									{
										'firstname': 'Joshua',
										'lastname': 'Magee',
										'name': 'Joshua Magee',
									},
								],
							},
						],
						'btde_match_id': '4',
						'match_id': 'btde_2019-10-12_HE1_TV Refrath 2-BC Hohenlimburg',
					},
					'network_score': [[11, 6], [11, 7], [6, 11], [6, 11], [7, 11]],
				},
				{
					'setup': {
						'incomplete': false,
						'counting': '5x11_15^90',
						'match_name': 'DE',
						'eventsheet_id': 'DE',
						'is_doubles': false,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Ann-Kathrin',
										'lastname': 'Spöri',
										'name': 'Ann-Kathrin Spöri',
									},
								],
							},
							{
								'players': [
									{
										'firstname': 'Jekaterina',
										'lastname': 'Romanova',
										'name': 'Jekaterina Romanova',
									},
								],
							},
						],
						'btde_match_id': '5',
						'match_id': 'btde_2019-10-12_DE_TV Refrath 2-BC Hohenlimburg',
					},
					'network_score': [[11, 3], [12, 10], [11, 3]],
				},
				{
					'setup': {
						'incomplete': false,
						'counting': '5x11_15^90',
						'match_name': 'GD',
						'eventsheet_id': 'GD',
						'is_doubles': true,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Hauke',
										'lastname': 'Graalmann',
										'name': 'Hauke Graalmann',
									},
									{
										'firstname': 'Jennifer',
										'lastname': 'Karnott',
										'name': 'Jennifer Karnott',
									},
								],
							},
							{
								'players': [
									{
										'firstname': 'Fabian',
										'lastname': 'Stoppel',
										'name': 'Fabian Stoppel',
									},
									{
										'firstname': 'Lena',
										'lastname': 'Fischer',
										'name': 'Lena Fischer',
									},
								],
							},
						],
						'btde_match_id': '6',
						'match_id': 'btde_2019-10-12_GD_TV Refrath 2-BC Hohenlimburg',
					},
					'network_score': [[12, 10], [9, 11], [4, 11], [11, 8], [8, 11]],
				},  {
					'setup': {
						'incomplete': false,
						'is_doubles': false,
						'teams': [{
							'players': [{
								'firstname': 'Brian',
								'lastname': 'Holtschke',
								'name': 'Brian Holtschke',
							}],
						}, {
							'players': [{
								'firstname': 'Malte',
								'lastname': 'Laibacher',
								'name': 'Malte Laibacher',
							}],
						}],
						'counting': '5x11_15^90',
						'match_name': 'HE2',
						'eventsheet_id': '2.HE',
						'btde_match_id': '7',
						'match_id': 'btde_2019-10-12_HE2_TV Refrath 2-BC Hohenlimburg',
					},
					'network_score': [[12, 14], [9, 11], [11, 9], [11, 2], [11, 1]],
				},
			],
		};

		var date = new Date(2019, 9, 12);
		let s = {team_competition: true};
		i18n.update_state(s, 'de');
		var ml = bup.btde()._parse_event(s, doc, date);
		assert.deepEqual(ml, expected);

		s = {event: ml};
		i18n.update_state(s, 'de');
		bup.eventutils.annotate(s, ml);
		assert.deepStrictEqual(ml.event_name, 'TV Refrath 2 - BC Hohenlimburg');
	});

	_it('league_key parsing', function() {
		var b = bup.btde();

		assert.strictEqual(b._get_league_key('(001) 1. Bundesliga'), '1BL-2020');
		assert.strictEqual(b._get_league_key('(002) 2. Bundesliga Nord'), '2BLN-2020');
		assert.strictEqual(b._get_league_key('(003) 2. Bundesliga Süd'), '2BLS-2020');
		assert.strictEqual(b._get_league_key('(001) Regionalliga SüdOst Ost'), 'RLSOO-2017');
		assert.strictEqual(b._get_league_key('(001) Regionalliga West'), 'RLW-2016');
		assert.strictEqual(b._get_league_key('(007) Verbandsliga Süd 2'), 'NRW-O19-S2-VL-007-2016');
		assert.strictEqual(b._get_league_key('(008) Landesliga Nord 1'), 'NRW-O19-N1-LL-008-2016');
		assert.strictEqual(b._get_league_key('(015) Landesliga Süd 2'), 'NRW-O19-S2-LL-015-2016');
		assert.strictEqual(b._get_league_key('NLA'), 'NLA-2019');
		assert.strictEqual(b._get_league_key('NLB'), 'NLA-2019');
		assert.strictEqual(b._get_league_key('1. Bundesliga'), 'OBL-2024');
		assert.strictEqual(b._get_league_key('(001) Regionalliga SüdOst'), 'RLSO-2019');

		assert(! b._get_league_key('foo bar'));
	});

	_it('_get_counting', function() {
		var b = bup.btde();

		assert.strictEqual(b._get_counting('1BL-2018', {gews: 3}), '5x11_15^90');
		assert.strictEqual(b._get_counting('2BLN-2018', {gews: 3}), '5x11_15^90');
		assert.strictEqual(b._get_counting('2BLS-2018', {}), '5x11_15^90');
		assert.strictEqual(b._get_counting('newleague', {gews: 3}), '5x11_15^90');
		assert.strictEqual(b._get_counting('newleague', {gews: 2}), '3x21');
	});

	_it('send_score', function() {
		const presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}];
		tutils.press_score(presses, 21, 5);
		presses.push({type: 'postgame-confirm'});
		tutils.press_score(presses, 11, 5);
		const setup = bup.utils.deep_copy(tutils.SINGLES_SETUP);
		setup.btde_match_id = '4';
		const s = tutils.state_after(presses, setup, {court_id: 2});
		const netscore = bup.calc.netscore(s, true);

		assert.deepStrictEqual(bup.btde()._calc_send_data(s, netscore), {
			court: 2,
			id: '4',
			course: [['21:5'], ['5:11']],
		});
	});
});
