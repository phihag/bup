'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var press_score = tutils.press_score;
var bup = tutils.bup;
var state_after = tutils.state_after;
var _describe = tutils._describe;
var _it = tutils._it;

var settings = {
	court_id: 1,
	language: 'de',
};
var doubles_setup = bup.utils.deep_copy(tutils.DOUBLES_SETUP);
doubles_setup.counting = '5x11_15';
doubles_setup.match_id = 'courtspot_testmatch';
doubles_setup.match_name = 'GD';
var singles_setup = bup.utils.deep_copy(tutils.SINGLES_SETUP);
singles_setup.counting = '5x11_15';
singles_setup.match_id = 'courtspot_testmatch_singles';
singles_setup.match_name = 'DE';

function gen_cs_data(presses, setup) {
	var s = state_after(presses, setup, settings);
	var data = bup.courtspot().gen_data(s);
	delete data.presses_json;
	delete data.court;
	return data;
}


_describe('CourtSpot', function() {
	_it('data generation (team1_left)', function() {
		var presses = [];

		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'leer',
			GastSatz1: -1,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: -1,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			Satz: 1,
			aufschlag_score: 0,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			team_aufschlag: '',
			team_links: '',
			gast_spieler1_links: '',
			heim_spieler1_links: '',
			verein: '',
		});

		presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 0,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 0,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 0,
			team_links: 'heim',
			team_aufschlag: '',
			gast_spieler1_links: '',
			heim_spieler1_links: '',
			verein: '',
		});

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 0,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 0,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 0,
			team_links: 'heim',
			heim_spieler1_links: 'false',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: '',
		});

		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 0,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 0,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 0,
			team_links: 'heim',
			heim_spieler1_links: 'false',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'love-all',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 0,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 0,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 0,
			team_links: 'heim',
			heim_spieler1_links: 'false',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'score',
			side: 'left',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 0,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 1,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 1,
			team_links: 'heim',
			heim_spieler1_links: 'true',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'score',
			side: 'left',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 0,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 2,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 2,
			team_links: 'heim',
			heim_spieler1_links: 'false',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'score',
			side: 'left',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 0,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 3,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 3,
			team_links: 'heim',
			heim_spieler1_links: 'true',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'score',
			side: 'right',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 1,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 3,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 1,
			team_links: 'heim',
			heim_spieler1_links: 'true',
			verein: 'gast',
			team_aufschlag: 'Gast',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'score',
			side: 'right',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 3,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 2,
			team_links: 'heim',
			heim_spieler1_links: 'true',
			verein: 'gast',
			team_aufschlag: 'Gast',
			gast_spieler1_links: 'true',
		});

		presses.push({
			type: 'score',
			side: 'left',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 4,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 4,
			team_links: 'heim',
			heim_spieler1_links: 'true',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: 'true',
		});

		presses.push({
			type: 'score',
			side: 'left',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 5,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 5,
			team_links: 'heim',
			heim_spieler1_links: 'false',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: 'true',
		});

		press_score(presses, 5, 0);
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 10,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 10,
			team_links: 'heim',
			heim_spieler1_links: 'true',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: 'true',
		});

		press_score(presses, 1, 0);
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 1,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 11,
			team_links: 'heim',
			heim_spieler1_links: 'true',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: 'true',
		});

		presses.push({
			type: 'postgame-confirm',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: 0,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 0,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 1,
			gewonnenGast: 0,
			Satz: 2,
			aufschlag_score: 0,
			verein: 'heim',
			team_aufschlag: 'Heim',
			team_links: 'gast',
			heim_spieler1_links: '',
			gast_spieler1_links: '',
		});

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(alt_presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: 0,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 0,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 1,
			gewonnenGast: 0,
			Satz: 2,
			aufschlag_score: 0,
			verein: 'heim',
			team_aufschlag: 'Heim',
			team_links: 'gast',
			heim_spieler1_links: 'false',
			gast_spieler1_links: '',
		});

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 1,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: 0,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 0,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 1,
			gewonnenGast: 0,
			Satz: 2,
			aufschlag_score: 0,
			verein: 'heim',
			team_aufschlag: 'Heim',
			team_links: 'gast',
			heim_spieler1_links: 'true',
			gast_spieler1_links: '',
		});

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(alt_presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: 0,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 0,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 1,
			gewonnenGast: 0,
			Satz: 2,
			aufschlag_score: 0,
			verein: 'heim',
			team_aufschlag: 'Heim',
			team_links: 'gast',
			heim_spieler1_links: 'true',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 1,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: 0,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 0,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 1,
			gewonnenGast: 0,
			Satz: 2,
			aufschlag_score: 0,
			verein: 'heim',
			team_aufschlag: 'Heim',
			team_links: 'gast',
			heim_spieler1_links: 'true',
			gast_spieler1_links: 'true',
		});

		press_score(presses, 11, 5);
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 1,
			gewonnenGast: 1,
			Satz: 2,
			aufschlag_score: 11,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'gast',
			heim_spieler1_links: 'true',
			gast_spieler1_links: 'true',
		});

		presses.push({
			type: 'postgame-confirm',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 0,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 0,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 1,
			gewonnenGast: 1,
			Satz: 3,
			aufschlag_score: 0,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'heim',
			heim_spieler1_links: '',
			gast_spieler1_links: '',
		});

		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 0,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 0,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 1,
			gewonnenGast: 1,
			Satz: 3,
			aufschlag_score: 0,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'heim',
			gast_spieler1_links: 'false',
			heim_spieler1_links: '',
		});

		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 1,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 0,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 0,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 1,
			gewonnenGast: 1,
			Satz: 3,
			aufschlag_score: 0,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'heim',
			gast_spieler1_links: 'false',
			heim_spieler1_links: 'true',
		});

		presses.push({
			type: 'love-all',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 0,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 0,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 1,
			gewonnenGast: 1,
			Satz: 3,
			aufschlag_score: 0,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'heim',
			gast_spieler1_links: 'false',
			heim_spieler1_links: 'true',
		});

		press_score(presses, 14, 14);
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 14,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 1,
			gewonnenGast: 1,
			Satz: 3,
			aufschlag_score: 14,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'heim',
			gast_spieler1_links: 'false',
			heim_spieler1_links: 'true',
		});

		press_score(presses, 1, 0);
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 2,
			gewonnenGast: 1,
			Satz: 3,
			aufschlag_score: 15,
			verein: 'heim',
			team_aufschlag: 'Heim',
			team_links: 'heim',
			gast_spieler1_links: 'false',
			heim_spieler1_links: 'true',
		});

		presses.push({
			type: 'postgame-confirm',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 0,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 0,
			HeimSatz5: -1,
			gewonnenHeim: 2,
			gewonnenGast: 1,
			Satz: 4,
			aufschlag_score: 0,
			verein: 'heim',
			team_aufschlag: 'Heim',
			team_links: 'gast',
			gast_spieler1_links: '',
			heim_spieler1_links: '',
		});

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 0,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 0,
			HeimSatz5: -1,
			gewonnenHeim: 2,
			gewonnenGast: 1,
			Satz: 4,
			aufschlag_score: 0,
			verein: 'heim',
			team_aufschlag: 'Heim',
			team_links: 'gast',
			heim_spieler1_links: 'false',
			gast_spieler1_links: '',
		});

		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 0,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 0,
			HeimSatz5: -1,
			gewonnenHeim: 2,
			gewonnenGast: 1,
			Satz: 4,
			aufschlag_score: 0,
			verein: 'heim',
			team_aufschlag: 'Heim',
			team_links: 'gast',
			heim_spieler1_links: 'false',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'love-all',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 0,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 0,
			HeimSatz5: -1,
			gewonnenHeim: 2,
			gewonnenGast: 1,
			Satz: 4,
			aufschlag_score: 0,
			verein: 'heim',
			team_aufschlag: 'Heim',
			team_links: 'gast',
			heim_spieler1_links: 'false',
			gast_spieler1_links: 'false',
		});

		press_score(presses, 13, 12);
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 13,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 12,
			HeimSatz5: -1,
			gewonnenHeim: 2,
			gewonnenGast: 1,
			Satz: 4,
			aufschlag_score: 13,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'gast',
			heim_spieler1_links: 'false',
			gast_spieler1_links: 'false',
		});

		press_score(presses, 1, 0);
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 14,
			GastSatz5: -1,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 12,
			HeimSatz5: -1,
			gewonnenHeim: 2,
			gewonnenGast: 2,
			Satz: 4,
			aufschlag_score: 14,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'gast',
			// vv Implementation detail vv
			heim_spieler1_links: 'false',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'postgame-confirm',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 14,
			GastSatz5: 0,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 12,
			HeimSatz5: 0,
			gewonnenHeim: 2,
			gewonnenGast: 2,
			Satz: 5,
			aufschlag_score: 0,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'heim',
			heim_spieler1_links: '',
			gast_spieler1_links: '',
		});

		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 1,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 14,
			GastSatz5: 0,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 12,
			HeimSatz5: 0,
			gewonnenHeim: 2,
			gewonnenGast: 2,
			Satz: 5,
			aufschlag_score: 0,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'heim',
			gast_spieler1_links: 'true',
			heim_spieler1_links: '',
		});

		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 14,
			GastSatz5: 0,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 12,
			HeimSatz5: 0,
			gewonnenHeim: 2,
			gewonnenGast: 2,
			Satz: 5,
			aufschlag_score: 0,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'heim',
			gast_spieler1_links: 'true',
			heim_spieler1_links: 'false',
		});

		press_score(presses, 0, 5);
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 14,
			GastSatz5: 5,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 12,
			HeimSatz5: 0,
			gewonnenHeim: 2,
			gewonnenGast: 2,
			Satz: 5,
			aufschlag_score: 5,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'heim',
			gast_spieler1_links: 'false',
			heim_spieler1_links: 'false',
		});

		press_score(presses, 0, 1);
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 14,
			GastSatz5: 6,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 12,
			HeimSatz5: 0,
			gewonnenHeim: 2,
			gewonnenGast: 2,
			Satz: 5,
			aufschlag_score: 6,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'gast',
			gast_spieler1_links: 'true',
			heim_spieler1_links: 'false',
		});

		presses.push({
			type: 'postinterval-confirm',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 14,
			GastSatz5: 6,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 12,
			HeimSatz5: 0,
			gewonnenHeim: 2,
			gewonnenGast: 2,
			Satz: 5,
			aufschlag_score: 6,
			verein: 'gast',
			team_aufschlag: 'Gast',
			team_links: 'gast',
			gast_spieler1_links: 'true',
			heim_spieler1_links: 'false',
		});

		press_score(presses, 0, 10);
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 14,
			GastSatz5: 6,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 12,
			HeimSatz5: 10,
			gewonnenHeim: 2,
			gewonnenGast: 2,
			Satz: 5,
			aufschlag_score: 10,
			verein: 'heim',
			team_aufschlag: 'Heim',
			team_links: 'gast',
			gast_spieler1_links: 'true',
			heim_spieler1_links: 'true',
		});

		press_score(presses, 0, 1);
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 14,
			GastSatz5: 6,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 12,
			HeimSatz5: 11,
			gewonnenHeim: 3,
			gewonnenGast: 2,
			Satz: 5,
			aufschlag_score: 11,
			verein: 'heim',
			team_aufschlag: 'Heim',
			team_links: 'gast',
			// vv Implementation detail vv
			gast_spieler1_links: 'true',
			heim_spieler1_links: 'true',
		});

		presses.push({
			type: 'postmatch-confirm',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'leer', // switch to advertisement after match
			GastSatz1: 2,
			GastSatz2: 11,
			GastSatz3: 14,
			GastSatz4: 14,
			GastSatz5: 6,
			HeimSatz1: 11,
			HeimSatz2: 5,
			HeimSatz3: 15,
			HeimSatz4: 12,
			HeimSatz5: 11,
			gewonnenHeim: 3,
			gewonnenGast: 2,
			Satz: 5,
			aufschlag_score: 11,
			verein: 'heim',
			team_aufschlag: 'Heim',
			team_links: 'gast',
			// vv Implementation detail vv
			gast_spieler1_links: 'true',
			heim_spieler1_links: 'true',
		});
	});

	_it('team1_right', function() {
		var presses = [];

		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'leer',
			GastSatz1: -1,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: -1,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			Satz: 1,
			aufschlag_score: 0,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			team_aufschlag: '',
			team_links: '',
			gast_spieler1_links: '',
			heim_spieler1_links: '',
			verein: '',
		});

		presses.push({
			type: 'pick_side',
			team1_left: false,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 0,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 0,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 0,
			team_links: 'gast',
			team_aufschlag: '',
			gast_spieler1_links: '',
			heim_spieler1_links: '',
			verein: '',
		});

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'punkte',
			GastSatz1: 0,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 0,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 0,
			team_links: 'gast',
			heim_spieler1_links: 'false',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: '',
		});

		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 0,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 0,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 0,
			team_links: 'gast',
			heim_spieler1_links: 'false',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'love-all',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 0,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 0,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 0,
			team_links: 'gast',
			heim_spieler1_links: 'false',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'score',
			side: 'left',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 1,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 0,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 1,
			team_links: 'gast',
			heim_spieler1_links: 'false',
			verein: 'gast',
			team_aufschlag: 'Gast',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'score',
			side: 'left',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 0,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 2,
			team_links: 'gast',
			heim_spieler1_links: 'false',
			verein: 'gast',
			team_aufschlag: 'Gast',
			gast_spieler1_links: 'true',
		});

		presses.push({
			type: 'score',
			side: 'left',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 3,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 0,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 3,
			team_links: 'gast',
			heim_spieler1_links: 'false',
			verein: 'gast',
			team_aufschlag: 'Gast',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'score',
			side: 'right',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 3,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 1,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 1,
			team_links: 'gast',
			heim_spieler1_links: 'false',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'score',
			side: 'right',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 3,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 2,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 2,
			team_links: 'gast',
			heim_spieler1_links: 'true',
			verein: 'heim',
			team_aufschlag: 'Heim',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'score',
			side: 'left',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 4,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 2,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 4,
			team_links: 'gast',
			heim_spieler1_links: 'true',
			verein: 'gast',
			team_aufschlag: 'Gast',
			gast_spieler1_links: 'false',
		});

		presses.push({
			type: 'score',
			side: 'left',
		});
		assert.deepStrictEqual(gen_cs_data(presses, doubles_setup), {
			art: 'GD',
			Detail: 'alles',
			GastSatz1: 5,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 2,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 5,
			team_links: 'gast',
			heim_spieler1_links: 'true',
			verein: 'gast',
			team_aufschlag: 'Gast',
			gast_spieler1_links: 'true',
		});
	});

	_it('cards', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: false,
		}, {
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 2, 3);
		assert.deepStrictEqual(gen_cs_data(presses, singles_setup), {
			art: 'DE',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 3,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 3,
			team_links: 'gast',
			team_aufschlag: 'Heim',
			verein: 'heim',
			gast_spieler1_links: 'true',
			heim_spieler1_links: 'true',
		});

		presses.push({
			type: 'yellow-card',
			team_id: 1,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses, singles_setup), {
			art: 'DE',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 3,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 3,
			team_links: 'gast',
			team_aufschlag: 'Heim',
			verein: 'heim',
			gast_spieler1_links: 'true',
			heim_spieler1_links: 'true',
		});

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses, singles_setup), {
			art: 'DE',
			Detail: 'alles',
			GastSatz1: 2,
			GastSatz2: -1,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 4,
			HeimSatz2: -1,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 1,
			aufschlag_score: 4,
			team_links: 'gast',
			team_aufschlag: 'Heim',
			verein: 'heim',
			gast_spieler1_links: 'false',
			heim_spieler1_links: 'false',
		});

		presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses, singles_setup), {
			art: 'DE',
			Detail: 'punkte',
			GastSatz1: 11,
			GastSatz2: 11,
			GastSatz3: 11,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 4,
			HeimSatz2: 0,
			HeimSatz3: 0,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 3,
			team_aufschlag: 'Gast',
			verein: 'gast',
			team_links: 'gast',
			// vv Implementation detail vv
			aufschlag_score: 2,
			gast_spieler1_links: 'false',
			heim_spieler1_links: 'false',
		});

		presses.push({
			type: 'postmatch-confirm',
		});
		assert.deepStrictEqual(gen_cs_data(presses, singles_setup), {
			art: 'DE',
			Detail: 'leer',
			GastSatz1: 11,
			GastSatz2: 11,
			GastSatz3: 11,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 4,
			HeimSatz2: 0,
			HeimSatz3: 0,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			Satz: 3,
			team_aufschlag: 'Gast',
			verein: 'gast',
			team_links: 'gast',
			// vv Implementation detail vv
			aufschlag_score: 2,
			gast_spieler1_links: 'false',
			heim_spieler1_links: 'false',
		});
	});

	_it('injury', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 5, 11);
		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'love-all',
		});
		assert.deepStrictEqual(gen_cs_data(presses, singles_setup), {
			art: 'DE',
			Detail: 'alles',
			GastSatz1: 11,
			GastSatz2: 0,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 5,
			HeimSatz2: 0,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 1,
			Satz: 2,
			aufschlag_score: 0,
			team_links: 'gast',
			team_aufschlag: 'Gast',
			verein: 'gast',
			gast_spieler1_links: 'false',
			heim_spieler1_links: 'false',
		});

		presses.push({
			type: 'injury',
			team_id: 1,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses, singles_setup), {
			art: 'DE',
			Detail: 'alles',
			GastSatz1: 11,
			GastSatz2: 0,
			GastSatz3: -1,
			GastSatz4: -1,
			GastSatz5: -1,
			HeimSatz1: 5,
			HeimSatz2: 0,
			HeimSatz3: -1,
			HeimSatz4: -1,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 1,
			Satz: 2,
			aufschlag_score: 0,
			team_links: 'gast',
			team_aufschlag: 'Gast',
			verein: 'gast',
			gast_spieler1_links: 'false',
			heim_spieler1_links: 'false',
		});

		presses.push({
			type: 'retired',
			team_id: 1,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses, singles_setup), {
			art: 'DE',
			Detail: 'punkte',
			GastSatz1: 11,
			GastSatz2: 0,
			GastSatz3: 0,
			GastSatz4: 0,
			GastSatz5: -1,
			HeimSatz1: 5,
			HeimSatz2: 11,
			HeimSatz3: 11,
			HeimSatz4: 11,
			HeimSatz5: -1,
			gewonnenHeim: 0,
			gewonnenGast: 1,
			Satz: 4,
			aufschlag_score: 0,
			team_links: 'gast',
			team_aufschlag: 'Heim',
			verein: 'heim',
			gast_spieler1_links: 'false',
			heim_spieler1_links: 'false',
		});
	});

});
