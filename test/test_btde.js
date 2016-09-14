var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;

(function() {
'use strict';

_describe('btde', function() {
	_it('parse_match_list', function() {
		var doc = [
			{'heim':'TV Refrath','gast':'1. BV M\u00fclheim', 'GewS': 3, Liga: 'BL1'},
			{'id':'1','dis':'HD 1','heim':'Magee, Sam~Holzer, Fabian','gast':'Ellis, Marcus~de Ruiter, Jorrit','satz1':'6','satz2':'','satz3':'','satz4':'','satz5':'','satz6':'0','satz7':'','satz8':'','satz9':'','satz10':'','feld':'1'},
			{'id':'2','dis':'DD','heim':'Magee, Chloe~Nelte, Carla','gast':'Goliszewski, Johanna~K\u00e4pplein, Lara','satz1':'4','satz2':'12','satz3':'','satz4':'','satz5':'','satz6':'11','satz7':'10','satz8':'','satz9':'','satz10':'','feld':'2'},
			{'id':'3','dis':'HE 1','heim':'Domke, Richard','gast':'Zavadsky, Dmytro','satz1':'11','satz2':'11','satz3':'11','satz4':'','satz5':'','satz6':'5','satz7':'8','satz8':'2','satz9':'','satz10':'','feld':'0'},
			{'id':'4','dis':'DE','heim':'Magee, Chloe','gast':'K\u00e4pplein, Lara','satz1':'11','satz2':'0','satz3':'','satz4':'','satz5':'','satz6':'4','satz7':'3','satz8':'','satz9':'','satz10':'','feld':'0'},
			{'id':'5','dis':'GD','heim':'Nelte, Carla~Magee, Sam','gast':'Goliszewski, Johanna~Ellis, Marcus','satz1':'12','satz2':'10','satz3':'10','satz4':'11','satz5':'11','satz6':'9','satz7':'12','satz8':'12','satz9':'3','satz10':'13','feld':'0'},
			{'id':'6','dis':'HE 2','heim':'Sch\u00e4nzler, Lars','gast':'Roovers, Alexander','satz1':'11','satz2':'11','satz3':'11','satz4':'','satz5':'','satz6':'8','satz7':'2','satz8':'3','satz9':'','satz10':'','feld':'0'},
		];

		var expected = {
			'event_name': 'TV Refrath - 1. BV Mülheim',
			'team_names': ['TV Refrath', '1. BV Mülheim'],
			'league_key': '1BL-2016',
			'courts': [{
				'court_id': 1,
				'description': '1 (links)',
				'match_id': 'btde_2016-11-05_HD 1_TV Refrath-1. BV Mülheim',
			}, {
				'court_id': 2,
				'description': '2 (rechts)',
				'match_id': 'btde_2016-11-05_DD_TV Refrath-1. BV Mülheim',
			}],
			'matches': [
				{
					'setup': {
						'incomplete': false,
						'league_key': '1BL-2016',
						'counting': '5x11_15',
						'match_name': 'HD 1',
						'eventsheet_id': '1.HD',
						'is_doubles': true,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Sam',
										'lastname': 'Magee',
										'name': 'Sam Magee',
									},
									{
										'firstname': 'Fabian',
										'lastname': 'Holzer',
										'name': 'Fabian Holzer',
									},
								],
								'name': 'TV Refrath',
							},
							{
								'players': [
									{
										'firstname': 'Marcus',
										'lastname': 'Ellis',
										'name': 'Marcus Ellis',
									},
									{
										'firstname': 'Jorrit',
										'lastname': 'de Ruiter',
										'name': 'Jorrit de Ruiter',
									},
								],
								'name': '1. BV Mülheim',
							},
						],
						'btde_match_id': '1',
						'team_competition': true,
						'match_id': 'btde_2016-11-05_HD 1_TV Refrath-1. BV Mülheim',
					},
					'network_score': [[6, 0]],
				},
				{
					'setup': {
						'incomplete': false,
						'league_key': '1BL-2016',
						'counting': '5x11_15',
						'match_name': 'DD',
						'eventsheet_id': 'DD',
						'is_doubles': true,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Chloe',
										'lastname': 'Magee',
										'name': 'Chloe Magee',
									},
									{
										'firstname': 'Carla',
										'lastname': 'Nelte',
										'name': 'Carla Nelte',
									},
								],
								'name': 'TV Refrath',
							},
							{
								'players': [
									{
										'firstname': 'Johanna',
										'lastname': 'Goliszewski',
										'name': 'Johanna Goliszewski',
									},
									{
										'firstname': 'Lara',
										'lastname': 'Käpplein',
										'name': 'Lara Käpplein',
									},
								],
								'name': '1. BV Mülheim',
							},
						],
						'btde_match_id': '2',
						'team_competition': true,
						'match_id': 'btde_2016-11-05_DD_TV Refrath-1. BV Mülheim',
					},
					'network_score': [[4, 11], [12, 10]],
				},
				{
					'setup': {
						'counting': '5x11_15',
						'incomplete': false,
						'league_key': '1BL-2016',
						'match_name': 'HE 1',
						'eventsheet_id': '1.HE',
						'is_doubles': false,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Richard',
										'lastname': 'Domke',
										'name': 'Richard Domke',
									},
								],
								'name': 'TV Refrath',
							},
							{
								'players': [
									{
										'firstname': 'Dmytro',
										'lastname': 'Zavadsky',
										'name': 'Dmytro Zavadsky',
									},
								],
								'name': '1. BV Mülheim',
							},
						],
						'btde_match_id': '3',
						'team_competition': true,
						'match_id': 'btde_2016-11-05_HE 1_TV Refrath-1. BV Mülheim',
					},
					'network_score': [[11, 5], [11, 8], [11, 2]],
				},
				{
					'setup': {
						'incomplete': false,
						'league_key': '1BL-2016',
						'counting': '5x11_15',
						'match_name': 'DE',
						'eventsheet_id': 'DE',
						'is_doubles': false,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Chloe',
										'lastname': 'Magee',
										'name': 'Chloe Magee',
									},
								],
								'name': 'TV Refrath',
							},
							{
								'players': [
									{
										'firstname': 'Lara',
										'lastname': 'Käpplein',
										'name': 'Lara Käpplein',
									},
								],
								'name': '1. BV Mülheim',
							},
						],
						'btde_match_id': '4',
						'team_competition': true,
						'match_id': 'btde_2016-11-05_DE_TV Refrath-1. BV Mülheim',
					},
					'network_score': [[11, 4], [0, 3]],
				},
				{
					'setup': {
						'incomplete': false,
						'league_key': '1BL-2016',
						'counting': '5x11_15',
						'match_name': 'GD',
						'eventsheet_id': 'GD',
						'is_doubles': true,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Carla',
										'lastname': 'Nelte',
										'name': 'Carla Nelte',
									},
									{
										'firstname': 'Sam',
										'lastname': 'Magee',
										'name': 'Sam Magee',
									},
								],
								'name': 'TV Refrath',
							},
							{
								'players': [
									{
										'firstname': 'Johanna',
										'lastname': 'Goliszewski',
										'name': 'Johanna Goliszewski',
									},
									{
										'firstname': 'Marcus',
										'lastname': 'Ellis',
										'name': 'Marcus Ellis',
									},
								],
								'name': '1. BV Mülheim',
							},
						],
						'btde_match_id': '5',
						'team_competition': true,
						'match_id': 'btde_2016-11-05_GD_TV Refrath-1. BV Mülheim',
					},
					'network_score': [[12, 9], [10, 12], [10, 12], [11, 3], [11, 13]],
				},  {
					'setup': {
						'incomplete': false,
						'league_key': '1BL-2016',
						'is_doubles': false,
						'teams': [{
							'name': 'TV Refrath',
							'players': [{
								'firstname': 'Lars',
								'lastname': 'Schänzler',
								'name': 'Lars Schänzler',
							}],
						}, {
							'name': '1. BV Mülheim',
							'players': [{
								'firstname': 'Alexander',
								'lastname': 'Roovers',
								'name': 'Alexander Roovers',
							}],
						}],
						'counting': '5x11_15',
						'match_name': 'HE 2',
						'eventsheet_id': '2.HE',
						'btde_match_id': '6',
						'team_competition': true,
						'match_id': 'btde_2016-11-05_HE 2_TV Refrath-1. BV Mülheim',
					},
					'network_score': [[11, 8], [11, 2], [11, 3]],
				},
			],
		};

		var date = new Date(2016, 10, 5);
		var ml = bup.btde()._parse_match_list(doc, date);
		assert.deepEqual(ml, expected);
	});

	_it('parse_match_list with holes', function() {
		var doc = [
			{'heim':'TV Refrath','gast':'1. BV M\u00fclheim', Liga: 'BL2N'},
			{'id':'1','dis':'HD 1','heim':'Magee, Sam~Holzer, Fabian','gast':'Ellis, Marcus~de Ruiter, Jorrit','satz1':'6','satz2':'','satz3':'','satz4':'','satz5':'','satz6':'0','satz7':'','satz8':'','satz9':'','satz10':'','feld':'1'},
			{'id':'2','dis':'DD','heim':'~','gast':'Meulendijks, Judith~','satz1':'4','satz2':'2','satz3':'','satz4':'','satz5':'','satz6':'11','satz7':'4','satz8':'','satz9':'','satz10':'','feld':'0'},
			{'id':'3','dis':'HE 1','heim':'Richard Domke','gast':'Zavadsky, Dmytro','satz1':'','satz2':'','satz3':'','satz4':'','satz5':'','satz6':'','satz7':'','satz8':'','satz9':'','satz10':'','feld':'0'},
			{'id':'4','dis':'DE','heim':'Magee, Chloe','gast':'K\u00e4pplein, Lara','satz1':'11','satz2':'0','satz3':'','satz4':'','satz5':'','satz6':'4','satz7':'3','satz8':'','satz9':'','satz10':'','feld':'0'},
			{'id':'5','dis':'GD','heim':'Carla Nelte~Magee, Sam','gast':'Johanna~Marcus Ellis','satz1':'3','satz2':'0','satz3':'2','satz4':'','satz5':'','satz6':'11','satz7':'11','satz8':'11','satz9':'','satz10':'','feld':'0'},
			{'id':'6','dis':'HE 2','heim':'Sch\u00e4nzler, Lars','gast':'Alexander Roovers','satz1':'','satz2':'','satz3':'','satz4':'','satz5':'','satz6':'','satz7':'','satz8':'','satz9':'','satz10':'','feld':'0'},
		];

		var expected = {
			'team_names': ['TV Refrath', '1. BV Mülheim'],
			'league_key': '2BLN-2016',
			'event_name': 'TV Refrath - 1. BV Mülheim',
			'courts': [{
				'court_id': 1,
				'description': '1 (links)',
				'match_id':'btde_2016-11-05_HD 1_TV Refrath-1. BV Mülheim',
			}, {
				'court_id': 2,
				'description': '2 (rechts)',
			}],
			'matches': [
				{
					'setup': {
						'incomplete': false,
						'league_key': '2BLN-2016',
						'counting': '5x11_15',
						'match_name': 'HD 1',
						'eventsheet_id': '1.HD',
						'is_doubles': true,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Sam',
										'lastname': 'Magee',
										'name': 'Sam Magee',
									},
									{
										'firstname': 'Fabian',
										'lastname': 'Holzer',
										'name': 'Fabian Holzer',
									},
								],
								'name': 'TV Refrath',
							},
							{
								'players': [
									{
										'firstname': 'Marcus',
										'lastname': 'Ellis',
										'name': 'Marcus Ellis',
									},
									{
										'firstname': 'Jorrit',
										'lastname': 'de Ruiter',
										'name': 'Jorrit de Ruiter',
									},
								],
								'name': '1. BV Mülheim',
							},
						],
						'btde_match_id': '1',
						'team_competition': true,
						'match_id': 'btde_2016-11-05_HD 1_TV Refrath-1. BV Mülheim',
					},
					'network_score': [[6, 0]],
				},
				{
					'setup': {
						'incomplete': true,
						'league_key': '2BLN-2016',
						'counting': '5x11_15',
						'match_name': 'DD',
						'eventsheet_id': 'DD',
						'is_doubles': true,
						'teams': [
							{
								'players': [],
								'name': 'TV Refrath',
							},
							{
								'players': [
									{
										'firstname': 'Judith',
										'lastname': 'Meulendijks',
										'name': 'Judith Meulendijks',
									},
								],
								'name': '1. BV Mülheim',
							},
						],
						'btde_match_id': '2',
						'team_competition': true,
						'match_id': 'btde_2016-11-05_DD_TV Refrath-1. BV Mülheim',
					},
					'network_score': [[4, 11], [2, 4]],
				},
				{
					'setup': {
						'incomplete': false,
						'league_key': '2BLN-2016',
						'counting': '5x11_15',
						'match_name': 'HE 1',
						'eventsheet_id': '1.HE',
						'is_doubles': false,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Richard',
										'lastname': 'Domke',
										'name': 'Richard Domke',
									},
								],
								'name': 'TV Refrath',
							},
							{
								'players': [
									{
										'firstname': 'Dmytro',
										'lastname': 'Zavadsky',
										'name': 'Dmytro Zavadsky',
									},
								],
								'name': '1. BV Mülheim',
							},
						],
						'btde_match_id': '3',
						'team_competition': true,
						'match_id': 'btde_2016-11-05_HE 1_TV Refrath-1. BV Mülheim',
					},
					'network_score': [],
				},
				{
					'setup': {
						'incomplete': false,
						'league_key': '2BLN-2016',
						'counting': '5x11_15',
						'match_name': 'DE',
						'eventsheet_id': 'DE',
						'is_doubles': false,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Chloe',
										'lastname': 'Magee',
										'name': 'Chloe Magee',
									},
								],
								'name': 'TV Refrath',
							},
							{
								'players': [
									{
										'firstname': 'Lara',
										'lastname': 'Käpplein',
										'name': 'Lara Käpplein',
									},
								],
								'name': '1. BV Mülheim',
							},
						],
						'btde_match_id': '4',
						'team_competition': true,
						'match_id': 'btde_2016-11-05_DE_TV Refrath-1. BV Mülheim',
					},
					'network_score': [[11, 4], [0, 3]],
				},
				{
					'setup': {
						'incomplete': false,
						'league_key': '2BLN-2016',
						'counting': '5x11_15',
						'match_name': 'GD',
						'eventsheet_id': 'GD',
						'is_doubles': true,
						'teams': [
							{
								'players': [
									{
										'firstname': 'Carla',
										'lastname': 'Nelte',
										'name': 'Carla Nelte',
									},
									{
										'firstname': 'Sam',
										'lastname': 'Magee',
										'name': 'Sam Magee',
									},
								],
								'name': 'TV Refrath',
							},
							{
								'players': [
									{
										'name': 'Johanna',
									},
									{
										'firstname': 'Marcus',
										'lastname': 'Ellis',
										'name': 'Marcus Ellis',
									},
								],
								'name': '1. BV Mülheim',
							},
						],
						'btde_match_id': '5',
						'team_competition': true,
						'match_id': 'btde_2016-11-05_GD_TV Refrath-1. BV Mülheim',
					},
					'network_score': [[3, 11], [0, 11], [2, 11]],
				}, {
					'setup': {
						'incomplete': false,
						'league_key': '2BLN-2016',
						'is_doubles': false,
						'teams': [{
							'name': 'TV Refrath',
							'players': [{
								'firstname': 'Lars',
								'lastname': 'Schänzler',
								'name': 'Lars Schänzler',
							}],
						}, {
							'name': '1. BV Mülheim',
							'players': [{
								'firstname': 'Alexander',
								'lastname': 'Roovers',
								'name': 'Alexander Roovers',
							}],
						}],
						'counting': '5x11_15',
						'match_name': 'HE 2',
						'eventsheet_id': '2.HE',
						'btde_match_id': '6',
						'team_competition': true,
						'match_id': 'btde_2016-11-05_HE 2_TV Refrath-1. BV Mülheim',
					},
					'network_score': [],
				},
			],
		};

		var date = new Date(2016, 10, 5);
		var ml = bup.btde()._parse_match_list(doc, date);
		assert.deepEqual(ml, expected);
	});
});

})();