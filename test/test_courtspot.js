'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var state_after = tutils.state_after;
var _describe = tutils._describe;
var _it = tutils._it;

var settings = {
	court_id: 1,
	language: 'de',
};
var setup = bup.utils.deep_copy(tutils.DOUBLES_SETUP);
setup.counting = '5x11_15';
setup.match_id = 'courtspot_testmatch';
setup.match_name = 'GD';
function gen_cs_data(presses) {
	var s = state_after(presses, setup, settings);
	var data = bup.courtspot().gen_data(s);
	delete data.presses_json;
	delete data.court;
	return data;
}


_describe('CourtSpot', function() {
	_it('data generation (team1_left)', function() {
		var presses = [];

		assert.deepStrictEqual(gen_cs_data(presses), {
			art: 'GD',
			Detail: 'leer',
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
			Satz: 1,
			aufschlag_score: 0,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			// These values are just set this way, but could be set differently at the very start of the match
			team_aufschlag: 'Gast',
			team_links: 'gast',
			gast_spieler1_links: 'true',
			heim_spieler1_links: 'true',
			verein: 'gast',
		});

		presses.push({
			type: 'pick_side',
			team1_left: true,
		});
		assert.deepStrictEqual(gen_cs_data(presses), {
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
			// These values are just set this way, but could be set differently at the very start of the match
			team_aufschlag: 'Gast',
			gast_spieler1_links: 'true',
			heim_spieler1_links: 'true',
			verein: 'gast',
		});

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses), {
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
			// These values are just set this way, but could be set differently at the very start of the match
			gast_spieler1_links: 'true',
		});

		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
	});

	_it('data generation (team1_right)', function() {
		var presses = [];

		assert.deepStrictEqual(gen_cs_data(presses), {
			art: 'GD',
			Detail: 'leer',
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
			Satz: 1,
			aufschlag_score: 0,
			gewonnenHeim: 0,
			gewonnenGast: 0,
			// These values are just set this way, but could be set differently at the very start of the match
			team_aufschlag: 'Gast',
			team_links: 'gast',
			gast_spieler1_links: 'true',
			heim_spieler1_links: 'true',
			verein: 'gast',
		});

		presses.push({
			type: 'pick_side',
			team1_left: false,
		});
		assert.deepStrictEqual(gen_cs_data(presses), {
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
			// These values are just set this way, but could be set differently at the very start of the match
			team_aufschlag: 'Gast',
			gast_spieler1_links: 'true',
			heim_spieler1_links: 'true',
			verein: 'gast',
		});

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses), {
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
			// These values are just set this way, but could be set differently at the very start of the match
			gast_spieler1_links: 'true',
		});

		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		});
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
		assert.deepStrictEqual(gen_cs_data(presses), {
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
});
