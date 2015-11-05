'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;

_describe('btde', function() {
	_it('parse_match_list', function() {
		var doc = [
			{"heim":"TV Refrath","gast":"1. BV M\u00fclheim"},
			{"id":"1","dis":"HD","heim":"Magee, Sam~Holzer, Fabian","gast":"Ellis, Marcus~de Ruiter, Jorrit","satz1":"6","satz2":"","satz3":"","satz4":"0","satz5":"","satz6":"","feld":"1"},
			{"id":"2","dis":"DD","heim":"Magee, Chloe~Nelte, Carla","gast":"Goliszewski, Johanna~K\u00e4pplein, Lara","satz1":"4","satz2":"12","satz3":"","satz4":"21","satz5":"14","satz6":"","feld":"0"},
			{"id":"3","dis":"HE 1","heim":"Domke, Richard","gast":"Zavadsky, Dmytro","satz1":"14","satz2":"21","satz3":"21","satz4":"21","satz5":"17","satz6":"17","feld":"0"},
			{"id":"4","dis":"DE","heim":"Magee, Chloe","gast":"K\u00e4pplein, Lara","satz1":"21","satz2":"0","satz3":"","satz4":"4","satz5":"3","satz6":"","feld":"0"},
			{"id":"5","dis":"GD","heim":"Nelte, Carla~Magee, Sam","gast":"Goliszewski, Johanna~Ellis, Marcus","satz1":"3","satz2":"0","satz3":"","satz4":"21","satz5":"21","satz6":"","feld":"0"},
			{"id":"6","dis":"HE 2","heim":"Sch\u00e4nzler, Lars","gast":"Roovers, Alexander","satz1":"21","satz2":"21","satz3":"11","satz4":"5","satz5":"18","satz6":"20","feld":"0"}
		];

		var expected = {
			"event_name": "TV Refrath - 1. BV Mülheim",
			"matches": [
				{
					"setup": {
						"counting": "3x21",
						"match_name": "HD",
						"is_doubles": true,
						"teams": [
							{
								"players": [
									{
										"firstname": "Sam",
										"lastname": "Magee",
										"name": "Sam Magee"
									},
									{
										"firstname": "Fabian",
										"lastname": "Holzer",
										"name": "Fabian Holzer"
									}
								],
								"name": "TV Refrath"
							},
							{
								"players": [
									{
										"firstname": "Marcus",
										"lastname": "Ellis",
										"name": "Marcus Ellis"
									},
									{
										"firstname": "Jorrit",
										"lastname": "de Ruiter",
										"name": "Jorrit de Ruiter"
									}
								],
								"name": "1. BV Mülheim"
							}
						],
						"btde_match_id": "1",
						"team_competition": true,
						"match_id": "btde_2015-11-05_HD_TV Refrath-1. BV Mülheim"
					},
					"network_score": [
						[
							6,
							0
						]
					]
				},
				{
					"setup": {
						"counting": "3x21",
						"match_name": "DD",
						"is_doubles": true,
						"teams": [
							{
								"players": [
									{
										"firstname": "Chloe",
										"lastname": "Magee",
										"name": "Chloe Magee"
									},
									{
										"firstname": "Carla",
										"lastname": "Nelte",
										"name": "Carla Nelte"
									}
								],
								"name": "TV Refrath"
							},
							{
								"players": [
									{
										"firstname": "Johanna",
										"lastname": "Goliszewski",
										"name": "Johanna Goliszewski"
									},
									{
										"firstname": "Lara",
										"lastname": "Käpplein",
										"name": "Lara Käpplein"
									}
								],
								"name": "1. BV Mülheim"
							}
						],
						"btde_match_id": "2",
						"team_competition": true,
						"match_id": "btde_2015-11-05_DD_TV Refrath-1. BV Mülheim"
					},
					"network_score": [
						[
							4,
							21
						],
						[
							12,
							14
						]
					]
				},
				{
					"setup": {
						"counting": "3x21",
						"match_name": "HE 1",
						"is_doubles": false,
						"teams": [
							{
								"players": [
									{
										"firstname": "Richard",
										"lastname": "Domke",
										"name": "Richard Domke"
									}
								],
								"name": "TV Refrath"
							},
							{
								"players": [
									{
										"firstname": "Dmytro",
										"lastname": "Zavadsky",
										"name": "Dmytro Zavadsky"
									}
								],
								"name": "1. BV Mülheim"
							}
						],
						"btde_match_id": "3",
						"team_competition": true,
						"match_id": "btde_2015-11-05_HE 1_TV Refrath-1. BV Mülheim"
					},
					"network_score": [
						[
							14,
							21
						],
						[
							21,
							17
						],
						[
							21,
							17
						]
					]
				},
				{
					"setup": {
						"counting": "3x21",
						"match_name": "DE",
						"is_doubles": false,
						"teams": [
							{
								"players": [
									{
										"firstname": "Chloe",
										"lastname": "Magee",
										"name": "Chloe Magee"
									}
								],
								"name": "TV Refrath"
							},
							{
								"players": [
									{
										"firstname": "Lara",
										"lastname": "Käpplein",
										"name": "Lara Käpplein"
									}
								],
								"name": "1. BV Mülheim"
							}
						],
						"btde_match_id": "4",
						"team_competition": true,
						"match_id": "btde_2015-11-05_DE_TV Refrath-1. BV Mülheim"
					},
					"network_score": [
						[
							21,
							4
						],
						[
							0,
							3
						]
					]
				},
				{
					"setup": {
						"counting": "3x21",
						"match_name": "GD",
						"is_doubles": true,
						"teams": [
							{
								"players": [
									{
										"firstname": "Carla",
										"lastname": "Nelte",
										"name": "Carla Nelte"
									},
									{
										"firstname": "Sam",
										"lastname": "Magee",
										"name": "Sam Magee"
									}
								],
								"name": "TV Refrath"
							},
							{
								"players": [
									{
										"firstname": "Johanna",
										"lastname": "Goliszewski",
										"name": "Johanna Goliszewski"
									},
									{
										"firstname": "Marcus",
										"lastname": "Ellis",
										"name": "Marcus Ellis"
									}
								],
								"name": "1. BV Mülheim"
							}
						],
						"btde_match_id": "5",
						"team_competition": true,
						"match_id": "btde_2015-11-05_GD_TV Refrath-1. BV Mülheim"
					},
					"network_score": [
						[
							3,
							21
						],
						[
							0,
							21
						]
					]
				}
			]
		};

		var date = new Date(2015, 10, 5);
		var ml = bup.btde()._parse_match_list(doc, date);
		assert.deepStrictEqual(ml, expected);
	});
});