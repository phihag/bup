'use strict';

var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var DOUBLES_SETUP = tutils.DOUBLES_SETUP;
var DOUBLES_TEAM_SETUP = tutils.DOUBLES_TEAM_SETUP;
var DOUBLES_TEAM_SETUP_AWAY_FIRST = tutils.DOUBLES_TEAM_SETUP_AWAY_FIRST;
const {
	DOUBLES_SETUP_5x11
} = tutils;
var SINGLES_SETUP = tutils.SINGLES_SETUP;
var SINGLES_TEAM_SETUP = tutils.SINGLES_TEAM_SETUP;
var SINGLES_TEAM_SETUP_AWAY_FIRST = tutils.SINGLES_TEAM_SETUP_AWAY_FIRST;
var state_after = tutils.state_after;
var press_score = tutils.press_score;
var bup = tutils.bup;

function pronounce(lang_name, s, now) {
	bup.i18n.update_state(s, lang_name);
	return bup.pronunciation.pronounce(s, now);
}

function pronounce_de(s, now) {
	return pronounce('de', s, now);
}

function pronounce_en(s, now) {
	return pronounce('en', s, now);
}

function pronounce_frch(s, now) {
	return pronounce('fr-CH', s, now);
}

function pronounce_dech(s, now) {
	return pronounce('de-CH', s, now);
}

function pronounce_deat(s, now) {
	return pronounce('de-AT', s, now);
}

function loveall_de(s) {
	bup.i18n.update_state(s, 'de');
	return bup.pronunciation.loveall_announcement(s);
}

function loveall_en(s) {
	bup.i18n.update_state(s, 'en');
	return bup.pronunciation.loveall_announcement(s);
}


_describe('pronunciation', function() {
	_it('Start of match (singles)', function() {
		var presses = [];
		var s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(pronounce_de(s), null);

		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(pronounce_de(s), null);

		presses.push({
			type: 'pick_server', // Andrew serves
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(pronounce_de(s), null);

		presses.push({
			type: 'pick_receiver', // Birgit receives
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Bob und Birgit,\n' +
			'und zu meiner Linken,\n' +
			'Andrew und Alice.\n' +
			'Andrew schlägt auf zu Birgit.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Bob and Birgit,\n' +
			'and on my left,\n' +
			'Andrew and Alice.\n' +
			'Andrew to serve to Birgit.\n\n' +
			'love all.\n' +
			'Play.'
		);
		assert.strictEqual(
			pronounce_frch(s),
			'Mesdames et messieurs,\n' +
			'à ma droite,\n' +
			'Bob et Birgit,\n' +
			'et à ma gauche,\n' +
			'Andrew et Alice.\n' +
			'Andrew sert sur Birgit.\n\n' +
			'0 partout.\n' +
			'Jouez.'
		);
		assert.equal(loveall_de(s),
			'0 beide.\nBitte spielen.');

		presses = [{
			type: 'pick_side', // Andrew&Alice pick right
			team1_left: false,
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		}, {
			type: 'pick_receiver', // Birgit receives
			team_id: 1,
			player_id: 1,
		}];
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Andrew und Alice,\n' +
			'und zu meiner Linken,\n' +
			'Bob und Birgit.\n' +
			'Alice schlägt auf zu Birgit.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Andrew and Alice,\n' +
			'and on my left,\n' +
			'Bob and Birgit.\n' +
			'Alice to serve to Birgit.\n\n' +
			'love all.\n' +
			'Play.'
		);
		assert.strictEqual(
			pronounce_frch(s),
			'Mesdames et messieurs,\n' +
			'à ma droite,\n' +
			'Andrew et Alice,\n' +
			'et à ma gauche,\n' +
			'Bob et Birgit.\n' +
			'Alice sert sur Birgit.\n\n' +
			'0 partout.\n' +
			'Jouez.'
		);

		presses = [{
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}, {
			type: 'pick_receiver', // Alice receives
			team_id: 0,
			player_id: 1,
		}];
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Bob und Birgit,\n' +
			'und zu meiner Linken,\n' +
			'Andrew und Alice.\n' +
			'Bob schlägt auf zu Alice.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Bob and Birgit,\n' +
			'and on my left,\n' +
			'Andrew and Alice.\n' +
			'Bob to serve to Alice.\n\n' +
			'love all.\n' +
			'Play.'
		);
	});

	_it('Start of match (singles)', function() {
		var presses = [];
		var s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(pronounce_de(s), null);

		presses.push({
			type: 'pick_side', // Alice picks left
			team1_left: true,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(pronounce_de(s), null);

		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Bob,\n' +
			'und zu meiner Linken,\n' +
			'Alice.\n' +
			'Alice schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Bob,\n' +
			'and on my left,\n' +
			'Alice.\n' +
			'Alice to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);
		assert.strictEqual(
			pronounce_frch(s),
			'Mesdames et messieurs,\n' +
			'à ma droite,\n' +
			'Bob,\n' +
			'et à ma gauche,\n' +
			'Alice.\n' +
			'Alice au service.\n\n' +
			'0 partout.\n' +
			'Jouez.'
		);

		presses = [{
			type: 'pick_side', // Alice picks right
			team1_left: false,
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 0,
		}];
		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Alice,\n' +
			'und zu meiner Linken,\n' +
			'Bob.\n' +
			'Alice schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Alice,\n' +
			'and on my left,\n' +
			'Bob.\n' +
			'Alice to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);


		presses = [{
			type: 'pick_side', // Alice picks left
			team1_left: true,
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}];
		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Bob,\n' +
			'und zu meiner Linken,\n' +
			'Alice.\n' +
			'Bob schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Bob,\n' +
			'and on my left,\n' +
			'Alice.\n' +
			'Bob to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);

		presses = [{
			type: 'pick_side', // Alice picks right
			team1_left: false,
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}];
		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Alice,\n' +
			'und zu meiner Linken,\n' +
			'Bob.\n' +
			'Bob schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Alice,\n' +
			'and on my left,\n' +
			'Bob.\n' +
			'Bob to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);
	});

	_it('Start of match in a team competition (doubles)', function() {
		var presses = [{
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		}, {
			type: 'pick_receiver', // Birgit receives
			team_id: 1,
			player_id: 1,
		}];
		var s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'B team, vertreten durch Bob und Birgit,\n' +
			'und zu meiner Linken,\n' +
			'A team, vertreten durch Andrew und Alice.\n' +
			'A team schlägt auf, Alice zu Birgit.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'B team, represented by Bob and Birgit,\n' +
			'and on my left,\n' +
			'A team, represented by Andrew and Alice.\n' +
			'A team to serve, Alice to Birgit.\n\n' +
			'love all.\n' +
			'Play.'
		);
		assert.strictEqual(
			pronounce_frch(s),
			'Mesdames et messieurs,\n' +
			'à ma droite,\n' +
			'B team, representé par Bob et Birgit,\n' +
			'et à ma gauche,\n' +
			'A team, representé par Andrew et Alice.\n' +
			'A team au service, Alice sur Birgit.\n\n' +
			'0 partout.\n' +
			'Jouez.'
		);

		presses = [{
			type: 'pick_side', // Andrew&Alice pick right
			team1_left: false,
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		}, {
			type: 'pick_receiver', // Birgit receives
			team_id: 1,
			player_id: 1,
		}];
		s = state_after(presses, DOUBLES_TEAM_SETUP_AWAY_FIRST);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Linken,\n' +
			'B team, vertreten durch Bob und Birgit,\n' +
			'und zu meiner Rechten,\n' +
			'A team, vertreten durch Andrew und Alice.\n' +
			'A team schlägt auf, Alice zu Birgit.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my left,\n' +
			'B team, represented by Bob and Birgit,\n' +
			'and on my right,\n' +
			'A team, represented by Andrew and Alice.\n' +
			'A team to serve, Alice to Birgit.\n\n' +
			'love all.\n' +
			'Play.'
		);
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'A team, vertreten durch Andrew und Alice,\n' +
			'und zu meiner Linken,\n' +
			'B team, vertreten durch Bob und Birgit.\n' +
			'A team schlägt auf, Alice zu Birgit.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'A team, represented by Andrew and Alice,\n' +
			'and on my left,\n' +
			'B team, represented by Bob and Birgit.\n' +
			'A team to serve, Alice to Birgit.\n\n' +
			'love all.\n' +
			'Play.'
		);


		presses = [{
			type: 'pick_side', // Andrew&Alice pick right
			team1_left: false,
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}, {
			type: 'pick_receiver', // Andrew receives
			team_id: 0,
			player_id: 0,
		}];
		s = state_after(presses, DOUBLES_TEAM_SETUP_AWAY_FIRST);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Linken,\n' +
			'B team, vertreten durch Bob und Birgit,\n' +
			'und zu meiner Rechten,\n' +
			'A team, vertreten durch Andrew und Alice.\n' +
			'B team schlägt auf, Bob zu Andrew.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my left,\n' +
			'B team, represented by Bob and Birgit,\n' +
			'and on my right,\n' +
			'A team, represented by Andrew and Alice.\n' +
			'B team to serve, Bob to Andrew.\n\n' +
			'love all.\n' +
			'Play.'
		);
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'A team, vertreten durch Andrew und Alice,\n' +
			'und zu meiner Linken,\n' +
			'B team, vertreten durch Bob und Birgit.\n' +
			'B team schlägt auf, Bob zu Andrew.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'A team, represented by Andrew and Alice,\n' +
			'and on my left,\n' +
			'B team, represented by Bob and Birgit.\n' +
			'B team to serve, Bob to Andrew.\n\n' +
			'love all.\n' +
			'Play.'
		);

		presses = [{
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		}, {
			type: 'pick_server', // Birgit serves
			team_id: 1,
			player_id: 1,
		}, {
			type: 'pick_receiver', // Andrew receives
			team_id: 0,
			player_id: 0,
		}];
		s = state_after(presses, DOUBLES_TEAM_SETUP_AWAY_FIRST);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'B team, vertreten durch Bob und Birgit,\n' +
			'und zu meiner Linken,\n' +
			'A team, vertreten durch Andrew und Alice.\n' +
			'B team schlägt auf, Birgit zu Andrew.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'B team, represented by Bob and Birgit,\n' +
			'and on my left,\n' +
			'A team, represented by Andrew and Alice.\n' +
			'B team to serve, Birgit to Andrew.\n\n' +
			'love all.\n' +
			'Play.'
		);
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'B team, vertreten durch Bob und Birgit,\n' +
			'und zu meiner Linken,\n' +
			'A team, vertreten durch Andrew und Alice.\n' +
			'B team schlägt auf, Birgit zu Andrew.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'B team, represented by Bob and Birgit,\n' +
			'and on my left,\n' +
			'A team, represented by Andrew and Alice.\n' +
			'B team to serve, Birgit to Andrew.\n\n' +
			'love all.\n' +
			'Play.'
		);
	});

	_it('Match start in a team competition (singles)', function() {
		var presses = [];
		var s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.strictEqual(pronounce_de(s), null);
		assert.strictEqual(pronounce_en(s), null);
		assert.strictEqual(pronounce_frch(s), null);

		presses.push({
			type: 'pick_side', // Alice picks left
			team1_left: true,
		});
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.strictEqual(pronounce_de(s), null);

		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_TEAM_SETUP_AWAY_FIRST);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'B team, vertreten durch Bob,\n' +
			'und zu meiner Linken,\n' +
			'A team, vertreten durch Alice.\n' +
			'A team schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'B team, represented by Bob,\n' +
			'and on my left,\n' +
			'A team, represented by Alice.\n' +
			'A team to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);
		assert.strictEqual(
			pronounce_frch(s),
			'Mesdames et messieurs,\n' +
			'à ma droite,\n' +
			'B team, representé par Bob,\n' +
			'et à ma gauche,\n' +
			'A team, representé par Alice.\n' +
			'A team au service.\n\n' +
			'0 partout.\n' +
			'Jouez.'
		);
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'B team, vertreten durch Bob,\n' +
			'und zu meiner Linken,\n' +
			'A team, vertreten durch Alice.\n' +
			'A team schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'B team, represented by Bob,\n' +
			'and on my left,\n' +
			'A team, represented by Alice.\n' +
			'A team to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);
		assert.strictEqual(
			pronounce_frch(s),
			'Mesdames et messieurs,\n' +
			'à ma droite,\n' +
			'B team, representé par Bob,\n' +
			'et à ma gauche,\n' +
			'A team, representé par Alice.\n' +
			'A team au service.\n\n' +
			'0 partout.\n' +
			'Jouez.'
		);

		presses = [{
			type: 'pick_side', // Alice picks right
			team1_left: false,
		}, {
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 0,
		}];
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'A team, vertreten durch Alice,\n' +
			'und zu meiner Linken,\n' +
			'B team, vertreten durch Bob.\n' +
			'A team schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'A team, represented by Alice,\n' +
			'and on my left,\n' +
			'B team, represented by Bob.\n' +
			'A team to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);
		s = state_after(presses, SINGLES_TEAM_SETUP_AWAY_FIRST);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Linken,\n' +
			'B team, vertreten durch Bob,\n' +
			'und zu meiner Rechten,\n' +
			'A team, vertreten durch Alice.\n' +
			'A team schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my left,\n' +
			'B team, represented by Bob,\n' +
			'and on my right,\n' +
			'A team, represented by Alice.\n' +
			'A team to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);

		presses = [{
			type: 'pick_side', // Alice picks left
			team1_left: true,
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}];
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'B team, vertreten durch Bob,\n' +
			'und zu meiner Linken,\n' +
			'A team, vertreten durch Alice.\n' +
			'B team schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'B team, represented by Bob,\n' +
			'and on my left,\n' +
			'A team, represented by Alice.\n' +
			'B team to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);
		s = state_after(presses, SINGLES_TEAM_SETUP_AWAY_FIRST);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'B team, vertreten durch Bob,\n' +
			'und zu meiner Linken,\n' +
			'A team, vertreten durch Alice.\n' +
			'B team schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'B team, represented by Bob,\n' +
			'and on my left,\n' +
			'A team, represented by Alice.\n' +
			'B team to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);


		presses = [{
			type: 'pick_side', // Alice picks right
			team1_left: false,
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}];
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'A team, vertreten durch Alice,\n' +
			'und zu meiner Linken,\n' +
			'B team, vertreten durch Bob.\n' +
			'B team schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'A team, represented by Alice,\n' +
			'and on my left,\n' +
			'B team, represented by Bob.\n' +
			'B team to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);
		s = state_after(presses, SINGLES_TEAM_SETUP_AWAY_FIRST);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Linken,\n' +
			'B team, vertreten durch Bob,\n' +
			'und zu meiner Rechten,\n' +
			'A team, vertreten durch Alice.\n' +
			'B team schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my left,\n' +
			'B team, represented by Bob,\n' +
			'and on my right,\n' +
			'A team, represented by Alice.\n' +
			'B team to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);
	});

	_it('Basic counting (doubles)', function() {
		var presses = [{
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		}, {
			type: 'pick_server', // Andrew serves
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver', // Birgit receives
			team_id: 1,
			player_id: 1,
		}, {
			type: 'love-all',
		}, {
			type: 'score',
			side: 'left',
		}];
		var s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), '1-0');
		assert.equal(pronounce_en(s), '1-love');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), '2-0');
		assert.equal(pronounce_en(s), '2-love');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 1-2');
		assert.equal(pronounce_en(s), 'Service over. 1-2');
		assert.equal(pronounce_frch(s), 'Changement de service. 1-2');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), '2 beide');
		assert.equal(pronounce_en(s), '2 all');
		assert.equal(pronounce_frch(s), '2 partout');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), '3-2');
		assert.equal(pronounce_en(s), '3-2');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), '4-2');
		assert.equal(pronounce_en(s), '4-2');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 3-4');
		assert.equal(pronounce_en(s), 'Service over. 3-4');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), '4 beide');
		assert.equal(pronounce_en(s), '4 all');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), '5-4');
		assert.equal(pronounce_en(s), '5-4');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 5 beide');
		assert.equal(pronounce_en(s), 'Service over. 5 all');
	});

	_it('Basic counting', function() {
		var presses = [{
			type: 'pick_side', // Alice picks right
			team1_left: false,
		}, {
			type: 'pick_server', // Bob serves
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}, {
			type: 'score',
			side: 'left',
		}];
		var s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '1-0');
		assert.equal(pronounce_en(s), '1-love');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '2-0');
		assert.equal(pronounce_en(s), '2-love');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 1-2');
		assert.equal(pronounce_en(s), 'Service over. 1-2');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '2 beide');
		assert.equal(pronounce_en(s), '2 all');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '3-2');
		assert.equal(pronounce_en(s), '3-2');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '4-2');
		assert.equal(pronounce_en(s), '4-2');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 3-4');
		assert.equal(pronounce_en(s), 'Service over. 3-4');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '4 beide');
		assert.equal(pronounce_en(s), '4 all');
		assert.equal(pronounce_en(s), '4 all');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '5-4');
		assert.equal(pronounce_en(s), '5-4');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 5 beide');
		assert.equal(pronounce_en(s), 'Service over. 5 all');
	});

	_it('Interval / game point', function() {
		var presses = [{
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		}, {
			type: 'pick_server', // Bob serves  (player 0 so it works in singles as well)
			team_id: 1,
			player_id: 0,
		}, {
			type: 'pick_receiver', // Andrew receives (player 0 so it works in singles as well)
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 9, 9);
		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'left',
		});
		var s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'11-9 Pause.\n\n' +
			'11-9. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'11-9 Interval\n\n' +
			'11-9. Play.');

		press_score(presses, 8, 9);
		presses.push({
			type: 'score',
			side: 'right',
		});
		var alt_presses = presses.slice();
		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 20 Satzpunkt 19');
		assert.equal(pronounce_en(s), 'Service over. 20 game point 19');
		assert.equal(pronounce_frch(s), 'Changement de service. 20 point de set 19');
		assert.equal(pronounce_deat(s), 'Aufschlagwechsel. 20 Satzball 19');

		alt_presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '20 Satzpunkt 19');
		assert.equal(pronounce_en(s), '20 game point 19');
		assert.equal(pronounce_deat(s), '20 Satzball 19');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 20 beide');
		assert.equal(pronounce_en(s), 'Service over. 20 all');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '21-20');
		assert.equal(pronounce_en(s), '21-20');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 21 beide');
		assert.equal(pronounce_en(s), 'Service over. 21 all');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 22-21');
		assert.equal(pronounce_en(s), 'Service over. 22-21');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von Bob 23-21');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'First game won by Bob 23-21');
		assert.equal(pronounce_frch(s),
			'Set.\n\n' +
			'Premier set gagné par Bob 23-21');

		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von Bob und Birgit 23-21');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'First game won by Bob and Birgit 23-21');

		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von B team 23-21');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'First game won by B team 23-21');

		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von B team 23-21');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'First game won by B team 23-21');


		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(pronounce_de(s), null);
		assert.strictEqual(pronounce_en(s), null);

		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(pronounce_de(s),
			'Zweiter Satz. 0 beide.\nBitte spielen.');
		assert.strictEqual(pronounce_en(s),
			'Second game; love all; play');
		assert.strictEqual(loveall_de(s),
			'Zweiter Satz. 0 beide.\nBitte spielen.');
		assert.strictEqual(loveall_en(s),
			'Second game; love all; play');

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(pronounce_de(s), null);

		press_score(presses, 9, 9);
		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'Aufschlagwechsel. 11-10 Pause.\n\n' +
			'11-10. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Service over. 11-10 Interval\n\n' +
			'11-10. Play.');
		assert.equal(pronounce_frch(s),
			'Changement de service. 11-10 pause\n\n' +
			'11-10. Jouez.');

		press_score(presses, 9, 6);
		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '19 beide');
		assert.equal(pronounce_en(s), '19 all');

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 20 Spielpunkt 19');
		assert.equal(pronounce_en(s), 'Service over. 20 match point 19');
		assert.equal(pronounce_frch(s), 'Changement de service. 20 point de match 19');
		assert.equal(pronounce_deat(s), 'Aufschlagwechsel. 20 Matchball 19');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '20 Satzpunkt 19');
		assert.equal(pronounce_en(s), '20 game point 19');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 20 beide');
		assert.equal(pronounce_en(s), 'Service over. 20 all');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 21-20');
		assert.equal(pronounce_en(s), 'Service over. 21-20');		

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 21 beide');
		assert.equal(pronounce_en(s), 'Service over. 21 all');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s), '22-21');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 22 beide');
		assert.equal(pronounce_en(s), 'Service over. 22 all');

		press_score(presses, 5, 5);
		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 28 beide');
		assert.equal(pronounce_en(s), 'Service over. 28 all');

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '29 Spielpunkt 28');
		assert.equal(pronounce_en(s), '29 match point 28');
		assert.equal(pronounce_deat(s), '29 Matchball 28');

		alt_presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 29 Satzpunkt beide');
		assert.equal(pronounce_en(s), 'Service over. 29 game point all');

		alt_presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von Bob 23-21 30-29');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Match won by Bob 23-21 30-29');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 29 Satzpunkt 28');
		assert.equal(pronounce_en(s), 'Service over. 29 game point 28');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 29 Spielpunkt beide');
		assert.equal(pronounce_en(s), 'Service over. 29 match point all');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von A team 30-29; einen Satz beide');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by A team 30-29; One game all');
		assert.equal(pronounce_frch(s),
			'Set.\n\n' +
			'Deuxième set gagné par A team 30-29. Un set partout');
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s), 
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von A team 30-29; einen Satz beide');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by A team 30-29; One game all');
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von Alice 30-29; einen Satz beide');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by Alice 30-29; One game all');
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), 
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von Andrew und Alice 30-29; einen Satz beide');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by Andrew and Alice 30-29; One game all');

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(pronounce_de(s), null);
		assert.strictEqual(pronounce_en(s), null);

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(pronounce_de(s), null);
		assert.strictEqual(pronounce_en(s), null);

		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Entscheidungssatz. 0 beide.\nBitte spielen.');
		assert.equal(pronounce_en(s),
			'Final game; love all; play');
		assert.equal(pronounce_frch(s),
			'Set décisif. 0 partout.\nJouez.');
		assert.equal(loveall_de(s),
			'Entscheidungssatz. 0 beide.\nBitte spielen.');
		assert.equal(loveall_en(s),
			'Final game; love all; play');
		
		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(pronounce_de(s), null);
		assert.strictEqual(pronounce_en(s), null);

		press_score(presses, 9, 9);
		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'Aufschlagwechsel. 11-10 Pause. Feldseiten wechseln.\n\n' +
			'11-10. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Service over. 11-10 Interval; change ends\n\n' +
			'11-10. Play.');
		assert.equal(pronounce_dech(s),
			'Aufschlagwechsel. 11-10 Pause. Seitenwechsel.\n\n' +
			'11-10. Bitte spielen.');
		assert.equal(pronounce_frch(s),
			'Changement de service. 11-10 pause. Changez de côté.\n\n' +
			'11-10. Jouez.');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'Aufschlagwechsel. 11 beide');
		assert.equal(pronounce_en(s),
			'Service over. 11 all');

		press_score(presses, 7, 7);
		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 19 beide');
		assert.equal(pronounce_en(s), 'Service over. 19 all');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '20 Spielpunkt 19');
		assert.equal(pronounce_en(s), '20 match point 19');

		alt_presses = presses.slice();
		alt_presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 20 beide');
		assert.equal(pronounce_en(s), 'Service over. 20 all');

		alt_presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '21-20');
		assert.equal(pronounce_en(s), '21-20');

		alt_presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(alt_presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von B team 23-21 29-30 22-20');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Match won by B team 23-21 29-30 22-20');
		assert.equal(pronounce_frch(s),
			'Set.\n\n' +
			'Match gagné par B team 23-21 29-30 22-20');
		s = state_after(alt_presses, SINGLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von B team 23-21 29-30 22-20');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Match won by B team 23-21 29-30 22-20');
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit 23-21 29-30 22-20');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Match won by Bob and Birgit 23-21 29-30 22-20');
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von Bob 23-21 29-30 22-20');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Match won by Bob 23-21 29-30 22-20');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von Alice 21-23 30-29 21-19');
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice 21-23 30-29 21-19');
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von A team 21-23 30-29 21-19');
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von A team 21-23 30-29 21-19');
	});

	_it('cards basics', function() {
		var presses = [{
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		}, {
			type: 'pick_server', // Bob serves  (player 0 so it works in singles as well)
			team_id: 1,
			player_id: 0,
		}, {
			type: 'pick_receiver', // Andrew receives (player 0 so it works in singles as well)
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];

		presses.push({
			type: 'yellow-card',
			team_id: 0,
			player_id: 0,
		});
		var s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'0 beide');
		assert.equal(pronounce_en(s),
			'Andrew, warning for misconduct.\n' +
			'love all');
		assert.equal(pronounce_frch(s),
			'Andrew, avertissement pour mauvais comportement.\n' +
			'0 partout');
		assert.equal(pronounce_dech(s),
			'Andrew, Verwarnung wegen schlechten Benehmens.\n' +
			'0 beide');

		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1 beide');
		assert.equal(pronounce_en(s),
			'Alice, fault for misconduct.\n' +
			'Service over. 1 all');
		assert.equal(pronounce_frch(s),
			'Alice, faute pour mauvais comportement.\n' +
			'Changement de service. 1 partout');
		assert.equal(pronounce_dech(s),
			'Alice, Fehler wegen schlechten Benehmens.\n' +
			'Aufschlagwechsel. 1 beide');

		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'yellow-card',
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'2-1');
		assert.equal(pronounce_en(s),
			'Birgit, warning for misconduct.\n' +
			'2-1');

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 2 beide');
		assert.equal(pronounce_en(s),
			'Birgit, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'Service over. 2 all');


		presses.push({
			type: 'score',
			side: 'right',
		});
		presses.push({
			type: 'score',
			side: 'left',
		});
		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 4-3');
		assert.equal(pronounce_en(s),
			'Alice, fault for misconduct.\n' +
			'Service over. 4-3');

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 4 beide');
		assert.equal(pronounce_en(s),
			'Alice, fault for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'Service over. 4 all');

		presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Bob, disqualifiziert wegen unsportlichen Verhaltens.\n\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice 4-4');
		assert.equal(pronounce_en(s),
			'Bob, disqualified for misconduct.\n\n' +
			'Match won by Andrew and Alice 4-4');
		assert.equal(pronounce_frch(s),
			'Bob, disqualifié pour mauvais comportement.\n\n' +
			'Match gagné par Andrew et Alice 4-4');
		assert.equal(pronounce_dech(s),
			'Bob, disqualifiziert wegen schlechten Benehmens.\n\n' +
			'Spiel gewonnen von Andrew und Alice 4-4');

		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Bob, disqualifiziert wegen unsportlichen Verhaltens.\n\n' +
			'Das Spiel wurde gewonnen von A team 4-4');
		assert.equal(pronounce_en(s),
			'Bob, disqualified for misconduct.\n\n' +
			'Match won by A team 4-4');
	});

	_it('cards at beginning of match', function() {
		var presses = [];
		var s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(pronounce_de(s), null);
		assert.deepStrictEqual(s.match.cards, []);

		var yellow_card = {
			type: 'yellow-card',
			team_id: 0,
			player_id: 0,
		};
		presses.push(yellow_card);
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew, Verwarnung wegen unsportlichen Verhaltens.');
		assert.equal(pronounce_en(s),
			'Andrew, warning for misconduct.');
		assert.deepStrictEqual(s.match.cards, [yellow_card]);

		var red_card = {
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		};
		presses.push(red_card);
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.deepStrictEqual(s.match.cards, [yellow_card, red_card]);
		assert.equal(pronounce_de(s),
			'Andrew, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.');
		assert.equal(pronounce_en(s),
			'Andrew, warning for misconduct.\n' +
			'Bob, fault for misconduct.');
		assert.deepEqual(s.match.pending_red_cards, []); // See RTTO 3.7.7

		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver', // Birgit receives
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.match.cards, [yellow_card, red_card]);
		assert.deepEqual(s.match.pending_red_cards, []); // See RTTO 3.7.7
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.started, false);
		assert.equal(pronounce_de(s),
			'Andrew, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Bob und Birgit,\n' +
			'und zu meiner Linken,\n' +
			'Andrew und Alice.\n' +
			'Andrew schlägt auf zu Birgit.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Andrew, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Bob and Birgit,\n' +
			'and on my left,\n' +
			'Andrew and Alice.\n' +
			'Andrew to serve to Birgit.\n\n' +
			'love all.\n' +
			'Play.'
		);
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'B team, vertreten durch Bob und Birgit,\n' +
			'und zu meiner Linken,\n' +
			'A team, vertreten durch Andrew und Alice.\n' +
			'A team schlägt auf, Andrew zu Birgit.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Andrew, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'B team, represented by Bob and Birgit,\n' +
			'and on my left,\n' +
			'A team, represented by Andrew and Alice.\n' +
			'A team to serve, Andrew to Birgit.\n\n' +
			'love all.\n' +
			'Play.'
		);
		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Bob und Birgit,\n' +
			'und zu meiner Linken,\n' +
			'Andrew und Alice.\n' +
			'Andrew schlägt auf zu Birgit.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Andrew, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'Alice, fault for misconduct.\n' +
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Bob and Birgit,\n' +
			'and on my left,\n' +
			'Andrew and Alice.\n' +
			'Andrew to serve to Birgit.\n\n' +
			'love all.\n' +
			'Play.'
		);
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'B team, vertreten durch Bob und Birgit,\n' +
			'und zu meiner Linken,\n' +
			'A team, vertreten durch Andrew und Alice.\n' +
			'A team schlägt auf, Andrew zu Birgit.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Andrew, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'Alice, fault for misconduct.\n' +
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'B team, represented by Bob and Birgit,\n' +
			'and on my left,\n' +
			'A team, represented by Andrew and Alice.\n' +
			'A team to serve, Andrew to Birgit.\n\n' +
			'love all.\n' +
			'Play.'
		);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(pronounce_de(s), null);
	});

	_it('cards after games', function() {
		var presses = [];
		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		presses.push({
			type: 'pick_server', // Bob serves  (player 0 so it works in singles as well)
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver', // Andrew receives (player 0 so it works in singles as well)
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 21, 19);

		var card_birgit = {
			type: 'red-card',
			team_id: 1,
			player_id: 1,
		};
		presses.push(card_birgit);
		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [21, 19]);
		assert.deepEqual(s.match.pending_red_cards, [card_birgit]);
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Birgit, fault for misconduct.\n' +
			'\n' +
			'First game won by Andrew and Alice 21-19');
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Birgit, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Der erste Satz wurde gewonnen von Andrew und Alice 21-19');

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.pending_red_cards, []);

		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.pending_red_cards, []);
		assert.equal(pronounce_de(s),
			'Birgit, Fehler wegen unsportlichen Verhaltens.');
		assert.equal(pronounce_en(s),
			'Birgit, fault for misconduct.');

		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.pending_red_cards, []);
		assert.equal(pronounce_en(s),
			'Birgit, fault for misconduct.\n' +
			'\n' +
			'Second game; love all.\n' +
			'Birgit, faulted for misconduct.\n' +
			'1-love; play');
		assert.equal(pronounce_de(s),
			'Birgit, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Zweiter Satz. 0 beide.\n' +
			'Birgit, Fehler wegen unsportlichen Verhaltens.\n' +
			'1-0.\n' +
			'Bitte spielen.');

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [1, 0]);
		assert.strictEqual(pronounce_de(s), '1-0');
		assert.strictEqual(pronounce_en(s), '1-love');

		press_score(presses, 19, 18);
		press_score(presses, 2, 0);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [19, 21]);

		var card_alice = {
			type: 'red-card',
			team_id: 0,
			player_id: 1,
		};
		presses.push(card_alice);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.pending_red_cards, [card_alice]);
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Alice, fault for misconduct.\n' +
			'\n' +
			'Second game won by Bob and Birgit 21-19; One game all');
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Der zweite Satz wurde gewonnen von Bob und Birgit 21-19; einen Satz beide');
		assert.deepEqual(s.game.score, [19, 21]);

		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [1, 1]);
		assert.equal(pronounce_en(s),
			'Alice, fault for misconduct.\n' +
			'Bob, fault for misconduct.');
		assert.equal(pronounce_de(s),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.');

		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [1, 1]);
		assert.equal(pronounce_en(s),
			'Alice, fault for misconduct.\n' +
			'Bob, fault for misconduct.');
		assert.equal(pronounce_de(s),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.');

		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [1, 1]);
		assert.equal(pronounce_en(s),
			'Alice, fault for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'\n' +
			'Final game; love all.\n' +
			'Alice, faulted for misconduct.\n' +
			'Bob, faulted for misconduct.\n' +
			'Service over. 1 all; play');
		assert.equal(pronounce_de(s),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Entscheidungssatz. 0 beide.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1 beide.\n' +
			'Bitte spielen.'
		);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [1, 1]);
		assert.equal(pronounce_de(s),
			'Aufschlagwechsel. 1 beide'
		);
		assert.equal(pronounce_en(s),
			'Service over. 1 all'
		);

		// Card after match
		press_score(presses, 9, 9);
		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [11, 10]);
		press_score(presses, 2, 10);
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [21, 12]);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice 21-19 19-21 21-12'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Match won by Andrew and Alice 21-19 19-21 21-12'
		);

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [21, 12]);
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Bob, fault for misconduct.\n' +
			'\n' +
			'Match won by Andrew and Alice 21-19 19-21 21-12'
		);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice 21-19 19-21 21-12'
		);

		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [21, 12]);
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Bob, fault for misconduct.\n' +
			'Alice, fault for misconduct.\n\n' +
			'Match won by Andrew and Alice 21-19 19-21 21-12'
		);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice 21-19 19-21 21-12'
		);
	});

	_it('service over by red card at beginning of game', function() {
		var presses = [];
		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 21, 19);

		var card_alice = {
			type: 'red-card',
			team_id: 0,
			player_id: 0,
		};
		presses.push(card_alice);
		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [21, 19]);
		assert.deepEqual(s.match.pending_red_cards, [card_alice]);
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Andrew, fault for misconduct.\n' +
			'\n' +
			'First game won by Andrew and Alice 21-19');
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Der erste Satz wurde gewonnen von Andrew und Alice 21-19');

		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [0, 1]);
		assert.equal(s.game.service_over, true);
		assert.equal(s.game.team1_serving, false);
		// See RTT 3.7.2
		assert.equal(pronounce_en(s),
			'Andrew, fault for misconduct.\n' +
			'\n' +
			'Second game; love all.\n' +
			'Andrew, faulted for misconduct.\n' +
			'Service over. 1-love; play');
		assert.equal(pronounce_de(s),
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Zweiter Satz. 0 beide.\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1-0.\nBitte spielen.');

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [0, 1]);
		assert.equal(s.game.team1_serving, false);
		assert.equal(pronounce_de(s),
			'Aufschlagwechsel. 1-0');
		assert.equal(pronounce_en(s),
			'Service over. 1-love');
	});

	_it('retiring', function() {
		var presses = [{
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		}, {
			type: 'pick_server', // Birgit serves
			team_id: 1,
			player_id: 1,
		}, {
			type: 'pick_receiver', // Andrew receives
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];

		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 1,
			player_id: 0,
		});
		var s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Bob hat aufgegeben.\n\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice 0-0');
		assert.equal(pronounce_en(s),
			'Bob retired.\n\n' +
			'Match won by Andrew and Alice 0-0');

		alt_presses = presses.slice();
		press_score(alt_presses, 3, 2);
		alt_presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(alt_presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Alice hat aufgegeben.\n\n' +
			'Das Spiel wurde gewonnen von B team 2-3');
		assert.equal(pronounce_en(s),
			'Alice retired.\n\n' +
			'Match won by B team 2-3');

		press_score(presses, 21, 19);
		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'pick_server', // Alice serves
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'pick_receiver', // Bob receives
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'love-all',
		});
		press_score(presses, 2, 2);

		presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew hat aufgegeben.\n\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit 19-21 2-2');
		assert.equal(pronounce_en(s),
			'Andrew retired.\n\n' +
			'Match won by Bob and Birgit 19-21 2-2');
	});

	_it('retired at game start', function() {
		var presses = [];
		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 1,
			player_id: 0,
		});
		var s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Bob hat aufgegeben.\n\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice 0-0');
		assert.equal(pronounce_en(s),
			'Bob retired.\n\n' +
			'Match won by Andrew and Alice 0-0');

		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew hat aufgegeben.\n\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit 0-0');
		assert.equal(pronounce_en(s),
			'Andrew retired.\n\n' +
			'Match won by Bob and Birgit 0-0');

		presses.push({
			type: 'pick_server', // Birgit serves
			team_id: 1,
			player_id: 1,
		});
		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 1,
			player_id: 1,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Birgit hat aufgegeben.\n\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice 0-0');
		assert.equal(pronounce_en(s),
			'Birgit retired.\n\n' +
			'Match won by Andrew and Alice 0-0');

		presses.push({
			type: 'pick_receiver', // Andrew receives
			team_id: 0,
			player_id: 0,
		});
		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Alice hat aufgegeben.\n\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit 0-0');
		assert.equal(pronounce_en(s),
			'Alice retired.\n\n' +
			'Match won by Bob and Birgit 0-0');

		presses.push({
			type: 'love-all',
		});
		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew hat aufgegeben.\n\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit 0-0');
		assert.equal(pronounce_en(s),
			'Andrew retired.\n\n' +
			'Match won by Bob and Birgit 0-0');

		press_score(presses, 21, 19);
		alt_presses = presses.slice();
		alt_presses.push({
			type: 'retired',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew hat aufgegeben.\n\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit 19-21');
		assert.equal(pronounce_en(s),
			'Andrew retired.\n\n' +
			'Match won by Bob and Birgit 19-21');
	});

	_it('disqualified at game start', function() {
		var presses = [];
		var alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
		});
		var s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Bob, disqualifiziert wegen unsportlichen Verhaltens.\n\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice 0-0');
		assert.equal(pronounce_en(s),
			'Bob, disqualified for misconduct.\n\n' +
			'Match won by Andrew and Alice 0-0');

		presses.push({
			type: 'pick_side', // Andrew&Alice pick left
			team1_left: true,
		});
		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew, disqualifiziert wegen unsportlichen Verhaltens.\n\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit 0-0');
		assert.equal(pronounce_en(s),
			'Andrew, disqualified for misconduct.\n\n' +
			'Match won by Bob and Birgit 0-0');

		presses.push({
			type: 'pick_server', // Birgit serves
			team_id: 1,
			player_id: 1,
		});
		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 1,
			player_id: 1,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Birgit, disqualifiziert wegen unsportlichen Verhaltens.\n\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice 0-0');
		assert.equal(pronounce_en(s),
			'Birgit, disqualified for misconduct.\n\n' +
			'Match won by Andrew and Alice 0-0');

		presses.push({
			type: 'pick_receiver', // Andrew receives
			team_id: 0,
			player_id: 0,
		});
		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Alice, disqualifiziert wegen unsportlichen Verhaltens.\n\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit 0-0');
		assert.equal(pronounce_en(s),
			'Alice, disqualified for misconduct.\n\n' +
			'Match won by Bob and Birgit 0-0');

		presses.push({
			type: 'love-all',
		});
		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew, disqualifiziert wegen unsportlichen Verhaltens.\n\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit 0-0');
		assert.equal(pronounce_en(s),
			'Andrew, disqualified for misconduct.\n\n' +
			'Match won by Bob and Birgit 0-0');

		press_score(presses, 21, 19);
		alt_presses = presses.slice();
		alt_presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew, disqualifiziert wegen unsportlichen Verhaltens.\n\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit 19-21');
		assert.equal(pronounce_en(s),
			'Andrew, disqualified for misconduct.\n\n' +
			'Match won by Bob and Birgit 19-21');
	});

	_it('red card at interval (RTTO 3.7.5)', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		var base_presses = presses.slice();

		press_score(presses, 9, 7);
		press_score(presses, 2, 0);
		var s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.interval, true);
		assert.deepEqual(s.game.score, [11, 7]);
		assert.equal(pronounce_de(s),
			'11-7 Pause.\n\n' +
			'11-7. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'11-7 Interval\n\n' +
			'11-7. Play.');

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 1,
		});

		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.interval, true);
		assert.deepEqual(s.game.score, [12, 7]);
		assert.deepEqual(s.game.interval_score, [11, 7]);
		assert.equal(pronounce_en(s),
			'11-7 Interval\n' +
			'Birgit, fault for misconduct.\n' +
			'\n' +
			'Birgit, faulted for misconduct.\n' +
			'12-7. Play.');
		assert.equal(pronounce_de(s),
			'11-7 Pause.\n' +
			'Birgit, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Birgit, Fehler wegen unsportlichen Verhaltens.\n' +
			'12-7. Bitte spielen.');

		presses = base_presses.slice();
		press_score(presses, 9, 7);
		press_score(presses, 2, 0);
		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.interval, true);
		assert.deepEqual(s.game.score, [11, 8]);
		assert.deepEqual(s.game.interval_score, [11, 7]);
		assert.equal(pronounce_en(s),
			'11-7 Interval\n' +
			'Alice, fault for misconduct.\n' +
			'\n' +
			'Alice, faulted for misconduct.\n' +
			'Service over. 8-11. Play.');
		assert.equal(pronounce_de(s),
			'11-7 Pause.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 8-11. Bitte spielen.');

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.interval, true);
		assert.deepEqual(s.game.score, [12, 8]);
		assert.deepEqual(s.game.interval_score, [11, 7]);
		assert.equal(pronounce_en(s),
			'11-7 Interval\n' +
			'Alice, fault for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'\n' +
			'Alice, faulted for misconduct.\n' +
			'Bob, faulted for misconduct.\n' +
			'Service over. 12-8. Play.');
		assert.equal(pronounce_de(s),
			'11-7 Pause.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 12-8. Bitte spielen.');
	});

	_it('Getting to the interval with a red card', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 9, 10);
		press_score(presses, 1, 0);
		var first_red_card = {
			type: 'red-card',
			team_id: 0,
			player_id: 0,
		};
		presses.push(first_red_card);
		var s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.interval, true);
		assert.deepEqual(s.game.score, [10, 11]);
		assert.deepEqual(s.match.marks, [
			first_red_card,
		]);
		assert.equal(pronounce_de(s),
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11-10 Pause.\n\n' +
			'11-10. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Andrew, fault for misconduct.\n' +
			'Service over. 11-10 Interval\n\n' + 
			'11-10. Play.');

		var referee = {
			type: 'referee',
		};
		presses.push(referee);
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.interval, true);
		assert.deepEqual(s.game.score, [10, 11]);
		assert.deepEqual(s.match.marks, [
			first_red_card,
			referee,
		]);
		assert.equal(pronounce_de(s),
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11-10 Pause.\n\n' +
			'11-10. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Andrew, fault for misconduct.\n' +
			'Service over. 11-10 Interval\n\n' +
			'11-10. Play.');
		var sav_presses = presses.slice();

		var second_red_card = {
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		};
		presses.push(second_red_card);
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.interval, true);
		assert.deepEqual(s.game.score, [11, 11]);
		assert.deepEqual(s.match.marks, [
			first_red_card,
			referee,
			second_red_card,
		]);
		assert.equal(pronounce_en(s),
			'Andrew, fault for misconduct.\n' +
			'Service over. 11-10 Interval\n' +
			'Bob, fault for misconduct.\n' +
			'\n' +
			'Bob, faulted for misconduct.\n' +
			'Service over. 11 all. Play.');
		assert.equal(pronounce_de(s),
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11-10 Pause.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11 beide. Bitte spielen.');

		var red_card2b = {
			type: 'red-card',
			team_id: 0,
			player_id: 1,
		};
		presses = sav_presses.slice();
		presses.push(red_card2b);
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.interval, true);
		assert.deepEqual(s.game.score, [10, 12]);
		assert.deepEqual(s.match.marks, [
			first_red_card,
			referee,
			red_card2b,
		]);
		assert.equal(pronounce_en(s),
			'Andrew, fault for misconduct.\n' +
			'Service over. 11-10 Interval\n' +
			'Alice, fault for misconduct.\n' +
			'\n' +
			'Alice, faulted for misconduct.\n' +
			'12-10. Play.');
		assert.equal(pronounce_de(s),
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11-10 Pause.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'12-10. Bitte spielen.');

		presses.push({
			type: 'postinterval-confirm',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.interval, false);
		assert.deepEqual(s.game.score, [10, 12]);
		assert.strictEqual(pronounce_en(s),
			'Alice, fault for misconduct.\n' +
			'\n' +
			'Alice, faulted for misconduct.\n' +
			'12-10. Play.');
		assert.strictEqual(pronounce_de(s),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'12-10. Bitte spielen.');

		presses = sav_presses.slice();
		var yellow_card = {
			type: 'yellow-card',
			team_id: 1,
			player_id: 0,
		};
		presses.push(yellow_card);
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.interval, true);
		assert.deepEqual(s.game.score, [10, 11]);
		assert.deepEqual(s.match.marks, [
			first_red_card,
			referee,
			yellow_card,
		]);
		assert.equal(pronounce_en(s),
			'Andrew, fault for misconduct.\n' +
			'Service over. 11-10 Interval\n' +
			'Bob, warning for misconduct.\n' +
			'\n' +
			'11-10. Play.');
		assert.equal(pronounce_de(s),
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11-10 Pause.\n' +
			'Bob, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'11-10. Bitte spielen.');

		presses.push({
			type: 'postinterval-confirm',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.interval, false);
		assert.deepEqual(s.game.score, [10, 11]);
		assert.equal(pronounce_en(s),
			'Bob, warning for misconduct.\n' +
			'11-10. Play.');
		assert.equal(pronounce_de(s),
			'Bob, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'11-10. Bitte spielen.');
	});

	_it('ending game / match with a red card', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 19, 14);
		press_score(presses, 1, 0);
		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 0,
		});
		var s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 15-20');
		assert.equal(pronounce_en(s),
			'Alice, fault for misconduct.\n' +
			'Service over. 15-20');
		assert.ok(! s.timer);
		press_score(presses, 0, 1);
		var sav_presses = presses.slice();

		var red_card1 = {
			type: 'red-card',
			team_id: 1,
			player_id: 0,
			timestamp: 1,
		};
		presses.push(red_card1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.marks, [
			red_card1,
		]);
		assert.equal(pronounce_de(s),
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von Alice 21-16');
		assert.equal(pronounce_en(s),
			'Bob, fault for misconduct.\n' +
			'Game.\n\n' +
			'First game won by Alice 21-16');
		assert.strictEqual(s.timer.start, red_card1.timestamp);

		var referee = {
			type: 'referee',
			timestamp: 2,
		};
		presses.push(referee);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.marks, [
			red_card1,
			referee,
		]);
		assert.equal(pronounce_de(s),
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von Alice 21-16');
		assert.equal(pronounce_en(s),
			'Bob, fault for misconduct.\n' +
			'Game.\n\n' +
			'First game won by Alice 21-16');
		assert.strictEqual(s.timer.start, red_card1.timestamp);

		var red_card2 = {
			type: 'red-card',
			team_id: 0,
			player_id: 0,
			timestamp: 3,
		};
		presses.push(red_card2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.marks, [
			red_card1,
			referee,
			red_card2,
		]);
		assert.deepEqual(s.game.score, [21, 16]);
		assert.equal(pronounce_de(s),
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Der erste Satz wurde gewonnen von Alice 21-16');
		assert.equal(pronounce_en(s),
			'Bob, fault for misconduct.\n' +
			'Game.\n' +
			'Alice, fault for misconduct.\n\n' +
			'First game won by Alice 21-16');
		assert.strictEqual(s.timer.start, red_card1.timestamp);

		presses.push({
			type: 'postgame-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.marks, [
			referee,
			red_card2,
		]);
		assert.deepEqual(s.game.score, [0, 1]);
		assert.equal(pronounce_de(s),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Zweiter Satz. 0 beide.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1-0.\nBitte spielen.');
		assert.equal(pronounce_en(s),
			'Alice, fault for misconduct.\n' +
			'\n' +
			'Second game; love all.\n' +
			'Alice, faulted for misconduct.\n' +
			'Service over. 1-love; play');

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.marks, []);
		assert.deepEqual(s.game.score, [0, 1]);
		assert.strictEqual(pronounce_de(s), 'Aufschlagwechsel. 1-0');
		assert.strictEqual(pronounce_en(s), 'Service over. 1-love');
		assert.ok(! s.timer);

		// Test at end of match
		presses = sav_presses.slice();
		presses.push({
			type: 'editmode_set-finished_games',
			scores: [[21, 23], [30, 29]],
		});
		presses.push(red_card1);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.marks, [
			red_card1,
		]);
		assert.equal(pronounce_de(s),
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von Alice 21-23 30-29 21-16');
		assert.equal(pronounce_en(s),
			'Bob, fault for misconduct.\n' +
			'Game.\n\n' +
			'Match won by Alice 21-23 30-29 21-16');
		assert.ok(! s.timer);

		var yellow_card = {
			type: 'yellow-card',
			team_id: 0,
			player_id: 0,
			timestamp: 5,
		};
		presses.push(yellow_card);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.marks, [
			red_card1,
			yellow_card,
		]);
		assert.equal(pronounce_de(s),
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n' +
			'Alice, Verwarnung wegen unsportlichen Verhaltens.\n\n' +
			'Das Spiel wurde gewonnen von Alice 21-23 30-29 21-16');
		assert.equal(pronounce_en(s),
			'Bob, fault for misconduct.\n' +
			'Game.\n' +
			'Alice, warning for misconduct.\n\n' +
			'Match won by Alice 21-23 30-29 21-16');
		assert.ok(! s.timer);

		presses.push(red_card2);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.marks, [
			red_card1,
			yellow_card,
			red_card2,
		]);
		assert.deepEqual(s.game.score, [21, 16]);
		assert.equal(pronounce_de(s),
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n' +
			'Alice, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'Das Spiel wurde gewonnen von Alice 21-23 30-29 21-16');
		assert.equal(pronounce_en(s),
			'Bob, fault for misconduct.\n' +
			'Game.\n' +
			'Alice, warning for misconduct.\n' +
			'Alice, fault for misconduct.\n' +
			'\n' +
			'Match won by Alice 21-23 30-29 21-16');
		assert.ok(! s.timer);

		presses.push({
			type: 'postmatch-confirm',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.ok(! s.timer);
	});

	_it('suspending match', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 4, 1);
		press_score(presses, 0, 1);
		press_score(presses, 1, 0);

		var s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.suspended, false);
		assert.strictEqual(s.match.just_unsuspended, false);
		assert.equal(pronounce_de(s),
			'Aufschlagwechsel. 5-2');
		assert.equal(pronounce_en(s),
			'Service over. 5-2');

		presses.push({
			type: 'suspension',
			timestamp: 1000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.suspended, true);
		assert.strictEqual(s.match.just_unsuspended, false);
		assert.deepEqual(s.timer, {
			start: 1000,
			upwards: true,
		});
		assert.equal(pronounce_de(s),
			'Das Spiel ist unterbrochen');
		assert.equal(pronounce_en(s),
			'Play is suspended');

		presses.push({
			type: 'resume',
			timestamp: 1242,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.suspended, false);
		assert.strictEqual(s.match.just_unsuspended, true);
		assert.strictEqual(s.timer, false);
		assert.equal(pronounce_de(s),
			'Sind Sie spielbereit?\n' +
			'5-2. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Are you ready?\n' +
			'5-2. Play.');

		press_score(presses, 0, 1);
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.match.suspended, false);
		assert.strictEqual(s.match.just_unsuspended, false);
		assert.strictEqual(s.timer, false);
		assert.equal(pronounce_de(s),
			'Aufschlagwechsel. 3-5');
		assert.equal(pronounce_en(s),
			'Service over. 3-5');

	});

	_it('team name in love-all', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: false,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}];

		var setup = {
			teams: [{
				name: 'Germany',
				players: [{name: 'Marc Zwiebler'}],
			}, {
				players: [{name: 'Chen Long'}],
				name: 'China',
			}],
			nation_competition: true,
			is_doubles: false,
			counting: '3x21',
		};
		var s = state_after(presses, setup);

		assert.equal(pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Marc Zwiebler, Germany,\n' +
			'und zu meiner Linken,\n' +
			'Chen Long, China.\n' +
			'Marc Zwiebler schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.equal(pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Marc Zwiebler, Germany,\n' +
			'and on my left,\n' +
			'Chen Long, China.\n' +
			'Marc Zwiebler to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);
	});

	_it('injury', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'love-all',
		}];

		presses.push({
			type: 'injury',
			team_id: 0,
			player_id: 0,
		});

		var s = state_after(presses, DOUBLES_SETUP);
		// This used to instruct the umpire to call referee.
		// Now, there is a call referee button right there.
		assert.equal(pronounce_de(s),
			'Werden Sie aufgeben?'
		);
		assert.equal(pronounce_en(s),
			'Are you retiring?'
		);

		presses.push({
			type: 'referee',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Werden Sie aufgeben?'
		);
		assert.equal(pronounce_en(s),
			'Are you retiring?'
		);

		presses.push({
			type: 'injury-resume',
		});

		press_score(presses, 1, 0);
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'1-0'
		);

		presses.push({
			type: 'injury',
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'yellow-card',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Bob, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Werden Sie aufgeben?'
		);
		assert.equal(pronounce_en(s),
			'Bob, warning for misconduct.\n' +
			'Are you retiring?'
		);

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Bob, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Birgit, Fehler wegen unsportlichen Verhaltens.\n' +
			'Werden Sie aufgeben?'
		);
		assert.equal(pronounce_en(s),
			'Bob, warning for misconduct.\n' +
			'Birgit, fault for misconduct.\n' +
			'Are you retiring?'
		);

		presses.push({
			type: 'injury-resume',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Bob, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Birgit, Fehler wegen unsportlichen Verhaltens.\n' +
			'2-0'
		);
		assert.equal(pronounce_en(s),
			'Bob, warning for misconduct.\n' +
			'Birgit, fault for misconduct.\n' +
			'2-love'
		);

		press_score(presses, 19, 0);
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von Alice 21-0');
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'First game won by Alice 21-0');

		presses.push({
			type: 'injury',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Werden Sie aufgeben?'
		);
		assert.equal(pronounce_en(s),
			'Are you retiring?'
		);
	});

	_it('5x11 end-of game pronunciation', function() {
		var SINGLES_SETUP_5x11 = bup.utils.deep_copy(SINGLES_SETUP);
		SINGLES_SETUP_5x11.counting = '5x11_15';
		var SINGLES_TEAM_SETUP_5x11 = bup.utils.deep_copy(SINGLES_TEAM_SETUP);
		SINGLES_TEAM_SETUP_5x11.counting = '5x11_15';
		var DOUBLES_TEAM_SETUP_5x11 = bup.utils.deep_copy(DOUBLES_TEAM_SETUP);
		DOUBLES_TEAM_SETUP_5x11.counting = '5x11_15';

		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 11, 1);

		var s = state_after(presses, SINGLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von Alice 11-1'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'First game won by Alice 11-1'
		);
		s = state_after(presses, DOUBLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von Andrew und Alice 11-1'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'First game won by Andrew and Alice 11-1'
		);
		s = state_after(presses, SINGLES_TEAM_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von A team 11-1'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'First game won by A team 11-1'
		);
		s = state_after(presses, DOUBLES_TEAM_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von A team 11-1'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'First game won by A team 11-1'
		);

		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Zweiter Satz. 0 beide.\nBitte spielen.'
		);
		assert.equal(pronounce_en(s),
			'Second game; love all; play'
		);
		presses.push({
			type: 'love-all',
		});

		var alt_presses = presses.slice();
		press_score(alt_presses, 11, 2);
		s = state_after(alt_presses, SINGLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von Bob 11-2; einen Satz beide'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by Bob 11-2; One game all'
		);
		s = state_after(alt_presses, DOUBLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von Bob und Birgit 11-2; einen Satz beide'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by Bob and Birgit 11-2; One game all'
		);
		s = state_after(alt_presses, SINGLES_TEAM_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von B team 11-2; einen Satz beide'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by B team 11-2; One game all'
		);
		s = state_after(alt_presses, DOUBLES_TEAM_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von B team 11-2; einen Satz beide'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by B team 11-2; One game all'
		);

		press_score(presses, 3, 11);
		s = state_after(presses, SINGLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von Alice 11-3. Alice führt mit 2:0 Sätzen'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by Alice 11-3. Alice leads two games to love'
		);
		s = state_after(presses, DOUBLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von Andrew und Alice 11-3. Andrew und Alice führen mit 2:0 Sätzen'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by Andrew and Alice 11-3. Andrew and Alice lead two games to love'
		);
		s = state_after(presses, SINGLES_TEAM_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von A team 11-3. A team führt mit 2:0 Sätzen'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by A team 11-3. A team leads two games to love'
		);
		s = state_after(presses, DOUBLES_TEAM_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der zweite Satz wurde gewonnen von A team 11-3. A team führt mit 2:0 Sätzen'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Second game won by A team 11-3. A team leads two games to love'
		);

		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Dritter Satz. 0 beide.\nBitte spielen.'
		);
		assert.equal(pronounce_en(s),
			'Third game; love all; play'
		);
		presses.push({
			type: 'love-all',
		});

		press_score(presses, 4, 11);
		s = state_after(presses, SINGLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der dritte Satz wurde gewonnen von Bob 11-4. Alice führt mit 2:1 Sätzen'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Third game won by Bob 11-4. Alice leads two games to one'
		);
		s = state_after(presses, DOUBLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der dritte Satz wurde gewonnen von Bob und Birgit 11-4. Andrew und Alice führen mit 2:1 Sätzen'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Third game won by Bob and Birgit 11-4. Andrew and Alice lead two games to one'
		);
		s = state_after(presses, SINGLES_TEAM_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der dritte Satz wurde gewonnen von B team 11-4. A team führt mit 2:1 Sätzen'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Third game won by B team 11-4. A team leads two games to one'
		);
		s = state_after(presses, DOUBLES_TEAM_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der dritte Satz wurde gewonnen von B team 11-4. A team führt mit 2:1 Sätzen'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Third game won by B team 11-4. A team leads two games to one'
		);

		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Vierter Satz. 0 beide.\nBitte spielen.'
		);
		assert.equal(pronounce_en(s),
			'Fourth game; love all; play'
		);
		presses.push({
			type: 'love-all',
		});

		press_score(presses, 11, 5);
		s = state_after(presses, SINGLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der vierte Satz wurde gewonnen von Bob 11-5; zwei Sätze beide'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Fourth game won by Bob 11-5; Two games all'
		);
		s = state_after(presses, DOUBLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der vierte Satz wurde gewonnen von Bob und Birgit 11-5; zwei Sätze beide'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Fourth game won by Bob and Birgit 11-5; Two games all'
		);
		s = state_after(presses, SINGLES_TEAM_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der vierte Satz wurde gewonnen von B team 11-5; zwei Sätze beide'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Fourth game won by B team 11-5; Two games all'
		);
		s = state_after(presses, DOUBLES_TEAM_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Der vierte Satz wurde gewonnen von B team 11-5; zwei Sätze beide'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Fourth game won by B team 11-5; Two games all'
		);

		presses.push({
			type: 'postgame-confirm',
		});
		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		});
		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, SINGLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Entscheidungssatz. 0 beide.\nBitte spielen.'
		);
		assert.equal(pronounce_en(s),
			'Final game; love all; play'
		);
		presses.push({
			type: 'love-all',
		});

		press_score(presses, 6, 5);
		press_score(presses, 1, 5);
		s = state_after(presses, SINGLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von Alice 11-1 11-3 4-11 5-11 11-6'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Match won by Alice 11-1 11-3 4-11 5-11 11-6'
		);
		s = state_after(presses, DOUBLES_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice 11-1 11-3 4-11 5-11 11-6'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Match won by Andrew and Alice 11-1 11-3 4-11 5-11 11-6'
		);
		s = state_after(presses, SINGLES_TEAM_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von A team 11-1 11-3 4-11 5-11 11-6'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Match won by A team 11-1 11-3 4-11 5-11 11-6'
		);
		s = state_after(presses, DOUBLES_TEAM_SETUP_5x11);
		assert.equal(pronounce_de(s),
			'Satz.\n\n' +
			'Das Spiel wurde gewonnen von A team 11-1 11-3 4-11 5-11 11-6'
		);
		assert.equal(pronounce_en(s),
			'Game.\n\n' +
			'Match won by A team 11-1 11-3 4-11 5-11 11-6'
		);
	});

	_it('postinterval-confirm', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 5, 10);
		press_score(presses, 1, 0);
		presses.push({
			type: 'score',
			side: 'right',
			timestamp: 1000000,
		});

		var s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s, 1000000),
			'Aufschlagwechsel. 11-6 Pause.\n\n' +
			'11-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1000000),
			'Service over. 11-6 Interval\n\n' +
			'11-6. Play.'
		);
		assert.deepStrictEqual(s.timer, {
			duration: 60000,
			exigent: 25000,
			start: 1000000,
		});
		assert.strictEqual(s.game.just_interval, false);

		presses.push({
			type: 'postinterval-confirm',
			timestamp: 1050000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		// no pronounciation now (unless cards are involved, tested somewhere else)
		assert.strictEqual(pronounce_de(s), null);
		assert.strictEqual(pronounce_en(s), null);
		assert.strictEqual(s.game.just_interval, true);
		assert.deepStrictEqual(s.timer, false);
	});

	_it('20 seconds call', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 5, 10);
		press_score(presses, 1, 0);
		presses.push({
			type: 'score',
			side: 'right',
			timestamp: 1000000,
		});

		var s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s, 1000000),
			'Aufschlagwechsel. 11-6 Pause.\n\n' +
			'11-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1000000),
			'Service over. 11-6 Interval\n\n' +
			'11-6. Play.'
		);
		assert.deepStrictEqual(s.timer, {
			duration: 60000,
			exigent: 25000,
			start: 1000000,
		});
		var sav_presses = presses.slice();

		s = state_after(presses, DOUBLES_SETUP, {court_id: 5});
		assert.equal(pronounce_de(s, 1040000),
			'Feld 5, 20 Sekunden.\n' +
			'Feld 5, 20 Sekunden.\n\n' +
			'11-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1040000),
			'Court 5, 20 seconds. Court 5, 20 seconds.\n\n' +
			'11-6. Play.'
		);
		assert.equal(pronounce_frch(s, 1040000),
			'Court 5, 20 secondes. Court 5, 20 secondes.\n\n' +
			'11-6. Jouez.'
		);
		assert.deepStrictEqual(s.timer, {
			duration: 60000,
			exigent: 25000,
			start: 1000000,
		});

		s = state_after(presses, DOUBLES_SETUP, {court_id: 'referee'});
		assert.equal(pronounce_de(s, 1040000),
			'20 Sekunden. 20 Sekunden.\n\n' +
			'11-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1040000),
			'20 seconds. 20 seconds.\n\n' +
			'11-6. Play.'
		);
		assert.equal(pronounce_frch(s, 1040000),
			'20 secondes. 20 secondes.\n\n' +
			'11-6. Jouez.'
		);

		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s, 1040000),
			'20 Sekunden. 20 Sekunden.\n\n' +
			'11-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1040000),
			'20 seconds. 20 seconds.\n\n' +
			'11-6. Play.'
		);

		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s, 1070000),
			'11-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1070000),
			'11-6. Play.'
		);
		assert.deepStrictEqual(s.timer, {
			duration: 60000,
			exigent: 25000,
			start: 1000000,
		});

		presses.push({
			type: 'postinterval-confirm',
			timestamp: 1080000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		// no pronounciation now (unless cards are involved, tested somewhere else)
		assert.strictEqual(pronounce_de(s), null);
		assert.strictEqual(pronounce_en(s), null);
		assert.strictEqual(s.game.just_interval, true);
		assert.deepStrictEqual(s.timer, false);

		// Early resumption of play
		presses = sav_presses.slice();
		presses.push({
			type: 'postinterval-confirm',
			timestamp: 1030000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(pronounce_de(s), null);
		assert.strictEqual(pronounce_en(s), null);
		assert.strictEqual(s.game.just_interval, true);
		assert.deepStrictEqual(s.timer, false);

		press_score(presses, 14, 0);
		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 2000000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(pronounce_de(s, 2000000),
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von Andrew und Alice 21-11');
		assert.strictEqual(pronounce_en(s, 2000000),
			'Game.\n\n' +
			'First game won by Andrew and Alice 21-11');
		assert.deepStrictEqual(s.timer, {
			start: 2000000,
			duration: 120000,
			exigent: 25000,
		});

		presses.push({
			type: 'postgame-confirm',
			timestamp: 2050000,
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(pronounce_de(s, 2050000),
			'Zweiter Satz. 0 beide.\n' +
			'Bitte spielen.');
		assert.strictEqual(pronounce_en(s, 2050000),
			'Second game; love all; play');
		assert.strictEqual(pronounce_frch(s, 2050000),
			'Deuxième set. 0 partout.\nJouez.');
		assert.deepStrictEqual(s.timer, {
			start: 2000000,
			duration: 120000,
			exigent: 25000,
		});

		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(pronounce_de(s, 2100000),
			'20 Sekunden. 20 Sekunden.\n\n' +
			'Zweiter Satz. 0 beide.\n' +
			'Bitte spielen.');
		assert.strictEqual(pronounce_en(s, 2100000),
			'20 seconds. 20 seconds.\n\n' +
			'Second game; love all; play');

		s = state_after(presses, SINGLES_SETUP);
		assert.strictEqual(pronounce_de(s, 2200000),
			'Zweiter Satz. 0 beide.\n' +
			'Bitte spielen.');
		assert.strictEqual(pronounce_en(s, 2200000),
			'Second game; love all; play');

		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(pronounce_de(s, 2080000), null);
		assert.strictEqual(pronounce_en(s, 2080000), null);

		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
			timestamp: 2090000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(pronounce_de(s, 2090000), null);
		assert.strictEqual(pronounce_en(s, 2090000), null);

		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 1,
			timestamp: 2095000,
		});

		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(pronounce_de(s, 2090000),
			'Zweiter Satz. 0 beide.\n' +
			'Bitte spielen.');
		assert.strictEqual(pronounce_en(s, 2090000),
			'Second game; love all; play');
		assert.deepStrictEqual(s.timer, {
			start: 2000000,
			duration: 120000,
			exigent: 25000,
		});

		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(pronounce_de(s, 2100000),
			'20 Sekunden. 20 Sekunden.\n\n' +
			'Zweiter Satz. 0 beide.\n' +
			'Bitte spielen.');
		assert.strictEqual(pronounce_en(s, 2100000),
			'20 seconds. 20 seconds.\n\n' +
			'Second game; love all; play');

		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(pronounce_de(s, 2200000),
			'Zweiter Satz. 0 beide.\n' +
			'Bitte spielen.');
		assert.strictEqual(pronounce_en(s, 2200000),
			'Second game; love all; play');

		presses.push({
			type: 'love-all',
			timestamp: 2098000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(pronounce_de(s, 2980000), null);
		assert.strictEqual(pronounce_en(s, 2980000), null);
	});

	_it('walkover', function() {
		var presses = [{
			type: 'walkover',
			team_id: 1,
		}];
		var s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(pronounce_de(s),
			'(Walkover zugunsten von Andrew und Alice.\nBob und Birgit waren nicht anwesend.)');
		assert.strictEqual(pronounce_en(s),
			'(Walkover in favor of Andrew and Alice.\nBob and Birgit did not show up.)');
	});

	_it('match_str', function() {
		assert.strictEqual(bup.pronunciation.match_str(DOUBLES_SETUP), 'Andrew/Alice vs Bob/Birgit');

		var incomplete_setup = {
			incomplete: true,
			match_name: 'XD',
		};
		assert.strictEqual(bup.pronunciation.match_str(incomplete_setup), 'XD');
	});

	_it('teamtext_internal', function() {
		var s = tutils.state_after([], DOUBLES_SETUP);
		assert.strictEqual(bup.pronunciation.teamtext_internal(s, 0), 'Andrew / Alice');

		s = tutils.state_after([], DOUBLES_TEAM_SETUP);
		assert.strictEqual(bup.pronunciation.teamtext_internal(s, 0), 'A team (Andrew / Alice)');

		// Incomplete doubles
		s = {
			setup: {
				teams: [{
					players: [{
						name: 'Ohne Partner',
					}],
				}, {
					players: [],
				}],
				is_doubles: true,
			},
		};
		assert.strictEqual(bup.pronunciation.teamtext_internal(s, 0), 'Ohne Partner');
		assert.strictEqual(bup.pronunciation.teamtext_internal(s, 1), '');

		// Invalid players (should not happen, but be very resistent here)
		s = {
			setup: {
				teams: [{
					players: [{
						name: 'Ohne Partner',
					}, null],
				}, {
					players: [null],
				}],
				is_doubles: true,
			},
		};
		assert.strictEqual(bup.pronunciation.teamtext_internal(s, 0), 'Ohne Partner / ');
		assert.strictEqual(bup.pronunciation.teamtext_internal(s, 1), '');
	});

	_it('general correct handling around intervals', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 5, 10);
		press_score(presses, 1, 0);
		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 1,
			timestamp: 1000000,
		});

		var s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s, 1000000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11-6 Pause.\n\n' +
			'11-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1000000),
			'Alice, fault for misconduct.\n' +
			'Service over. 11-6 Interval\n\n' +
			'11-6. Play.'
		);
		assert.equal(pronounce_de(s, 1040000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'20 Sekunden. 20 Sekunden.\n\n' +
			'11-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1040000),
			'Alice, fault for misconduct.\n' +
			'20 seconds. 20 seconds.\n\n' +
			'11-6. Play.'
		);
		assert.equal(pronounce_de(s, 1070000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'\n' +
			'11-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1070000),
			'Alice, fault for misconduct.\n' +
			'\n' +
			'11-6. Play.'
		);

		presses.push({
			type: 'referee',
			timestamp: 1010000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s, 1000000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11-6 Pause.\n\n' +
			'11-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1000000),
			'Alice, fault for misconduct.\n' +
			'Service over. 11-6 Interval\n\n' +
			'11-6. Play.'
		);

		var presses_sav = presses.slice();
		presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
			timestamp: 1030000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s, 1040000),
			'Andrew, disqualifiziert wegen unsportlichen Verhaltens.\n\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit 11-6'
		);
		assert.equal(pronounce_en(s, 1040000),
			'Andrew, disqualified for misconduct.\n\n' +
			'Match won by Bob and Birgit 11-6'
		);
		presses = presses_sav.slice();

		presses.push({
			type: 'yellow-card',
			timestamp: 1020000,
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s, 1020000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11-6 Pause.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n\n' +
			'11-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1020000),
			'Alice, fault for misconduct.\n' +
			'Service over. 11-6 Interval\n' +
			'Birgit, warning for misconduct.\n\n' +
			'11-6. Play.'
		);
		assert.equal(pronounce_de(s, 1040000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'20 Sekunden. 20 Sekunden.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n\n' +
			'11-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1040000),
			'Alice, fault for misconduct.\n' +
			'20 seconds. 20 seconds.\n' +
			'Birgit, warning for misconduct.\n\n' +
			'11-6. Play.'
		);
		assert.equal(pronounce_de(s, 1070000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n\n' +
			'11-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1070000),
			'Alice, fault for misconduct.\n' +
			'Birgit, warning for misconduct.\n\n' +
			'11-6. Play.'
		);

		presses.push({
			type: 'red-card',
			timestamp: 1030000,
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_en(s, 1020000),
			'Alice, fault for misconduct.\n' +
			'Service over. 11-6 Interval\n' +
			'Birgit, warning for misconduct.\n' +
			'Andrew, fault for misconduct.\n\n' +
			'Andrew, faulted for misconduct.\n' +
			'12-6. Play.'
		);
		assert.equal(pronounce_de(s, 1020000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11-6 Pause.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'12-6. Bitte spielen.'
		);
		assert.equal(pronounce_de(s, 1040000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'20 Sekunden. 20 Sekunden.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'12-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1040000),
			'Alice, fault for misconduct.\n' +
			'20 seconds. 20 seconds.\n' +
			'Birgit, warning for misconduct.\n' +
			'Andrew, fault for misconduct.\n\n' +
			'Andrew, faulted for misconduct.\n' +
			'12-6. Play.'
		);
		assert.equal(pronounce_de(s, 1070000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'12-6. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1070000),
			'Alice, fault for misconduct.\n' +
			'Birgit, warning for misconduct.\n' +
			'Andrew, fault for misconduct.\n\n' +
			'Andrew, faulted for misconduct.\n' +
			'12-6. Play.'
		);

		presses.push({
			type: 'red-card',
			timestamp: 1035000,
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_en(s, 1020000),
			'Alice, fault for misconduct.\n' +
			'Service over. 11-6 Interval\n' +
			'Birgit, warning for misconduct.\n' +
			'Andrew, fault for misconduct.\n' +
			'Bob, fault for misconduct.\n\n' +
			'Andrew, faulted for misconduct.\n' +
			'Bob, faulted for misconduct.\n' +
			'Service over. 7-12. Play.'
		);
		assert.equal(pronounce_de(s, 1020000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11-6 Pause.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 7-12. Bitte spielen.'
		);
		assert.equal(pronounce_de(s, 1040000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'20 Sekunden. 20 Sekunden.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 7-12. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1040000),
			'Alice, fault for misconduct.\n' +
			'20 seconds. 20 seconds.\n' +
			'Birgit, warning for misconduct.\n' +
			'Andrew, fault for misconduct.\n' +
			'Bob, fault for misconduct.\n\n' +
			'Andrew, faulted for misconduct.\n' +
			'Bob, faulted for misconduct.\n' +
			'Service over. 7-12. Play.'
		);
		assert.equal(pronounce_de(s, 1070000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 7-12. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1070000),
			'Alice, fault for misconduct.\n' +
			'Birgit, warning for misconduct.\n' +
			'Andrew, fault for misconduct.\n' +
			'Bob, fault for misconduct.\n\n' +
			'Andrew, faulted for misconduct.\n' +
			'Bob, faulted for misconduct.\n' +
			'Service over. 7-12. Play.'
		);

		// Remove pre-interval marks after confirmation
		presses.push({
			type: 'postinterval-confirm',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_en(s, 1020000),
			'Birgit, warning for misconduct.\n' +
			'Andrew, fault for misconduct.\n' +
			'Bob, fault for misconduct.\n\n' +
			'Andrew, faulted for misconduct.\n' +
			'Bob, faulted for misconduct.\n' +
			'Service over. 7-12. Play.'
		);
		assert.equal(pronounce_de(s, 1020000),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 7-12. Bitte spielen.'
		);
		assert.equal(pronounce_de(s, 1040000),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 7-12. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1040000),
			'Birgit, warning for misconduct.\n' +
			'Andrew, fault for misconduct.\n' +
			'Bob, fault for misconduct.\n\n' +
			'Andrew, faulted for misconduct.\n' +
			'Bob, faulted for misconduct.\n' +
			'Service over. 7-12. Play.'
		);
		assert.equal(pronounce_de(s, 1070000),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 7-12. Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1070000),
			'Birgit, warning for misconduct.\n' +
			'Andrew, fault for misconduct.\n' +
			'Bob, fault for misconduct.\n\n' +
			'Andrew, faulted for misconduct.\n' +
			'Bob, faulted for misconduct.\n' +
			'Service over. 7-12. Play.'
		);
	});

	_it('red cards around game end', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'love-all',
		}];
		press_score(presses, 5, 20);
		press_score(presses, 1, 0);
		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 1,
			timestamp: 1000000,
		});

		var s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.timer, {
			duration: 120000,
			exigent: 25000,
			start: 1000000,
		});
		assert.equal(pronounce_de(s, 1000000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von Bob und Birgit 21-6'
		);
		assert.equal(pronounce_en(s, 1000000),
			'Alice, fault for misconduct.\n' +
			'Game.\n\n' +
			'First game won by Bob and Birgit 21-6'
		);
		assert.equal(pronounce_de(s, 1100000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von Bob und Birgit 21-6'
		);
		assert.equal(pronounce_en(s, 1100000),
			'Alice, fault for misconduct.\n' +
			'Game.\n\n' +
			'First game won by Bob and Birgit 21-6'
		);

		presses.push({
			type: 'referee',
			timestamp: 1010000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s, 1000000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n\n' +
			'Der erste Satz wurde gewonnen von Bob und Birgit 21-6'
		);
		assert.equal(pronounce_en(s, 1000000),
			'Alice, fault for misconduct.\n' +
			'Game.\n\n' +
			'First game won by Bob and Birgit 21-6'
		);
		assert.deepStrictEqual(s.timer, {
			duration: 120000,
			exigent: 25000,
			start: 1000000,
		});

		var presses_sav = presses.slice();
		presses.push({
			type: 'disqualified',
			team_id: 0,
			player_id: 0,
			timestamp: 1030000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s, 1040000),
			'Andrew, disqualifiziert wegen unsportlichen Verhaltens.\n\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit 21-6'
		);
		assert.equal(pronounce_en(s, 1040000),
			'Andrew, disqualified for misconduct.\n\n' +
			'Match won by Bob and Birgit 21-6'
		);

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 1,
			timestamp: 1030000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s, 1040000),
			'Andrew, disqualifiziert wegen unsportlichen Verhaltens.\n' +
			'Birgit, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit 21-6'
		);
		assert.equal(pronounce_en(s, 1040000),
			'Andrew, disqualified for misconduct.\n' +
			'Birgit, fault for misconduct.\n\n' +
			'Match won by Bob and Birgit 21-6'
		);


		presses = presses_sav.slice();

		presses.push({
			type: 'yellow-card',
			timestamp: 1020000,
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.timer, {
			duration: 120000,
			exigent: 25000,
			start: 1000000,
		});
		assert.equal(pronounce_de(s, 1020000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n\n' +
			'Der erste Satz wurde gewonnen von Bob und Birgit 21-6'
		);
		assert.equal(pronounce_en(s, 1020000),
			'Alice, fault for misconduct.\n' +
			'Game.\n' +
			'Birgit, warning for misconduct.\n\n' +
			'First game won by Bob and Birgit 21-6'
		);
		assert.equal(pronounce_de(s, 1100000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n\n' +
			'Der erste Satz wurde gewonnen von Bob und Birgit 21-6'
		);
		assert.equal(pronounce_en(s, 1100000),
			'Alice, fault for misconduct.\n' +
			'Game.\n' +
			'Birgit, warning for misconduct.\n\n' +
			'First game won by Bob and Birgit 21-6'
		);
		assert.equal(pronounce_de(s, 1130000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n\n' +
			'Der erste Satz wurde gewonnen von Bob und Birgit 21-6'
		);
		assert.equal(pronounce_en(s, 1130000),
			'Alice, fault for misconduct.\n' +
			'Game.\n' +
			'Birgit, warning for misconduct.\n\n' +
			'First game won by Bob and Birgit 21-6'
		);

		presses_sav = presses.slice();
		presses.push({
			type: 'red-card',
			timestamp: 1020000,
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.timer, {
			duration: 120000,
			exigent: 25000,
			start: 1000000,
		});
		assert.equal(pronounce_de(s, 1020000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Der erste Satz wurde gewonnen von Bob und Birgit 21-6'
		);
		assert.equal(pronounce_en(s, 1020000),
			'Alice, fault for misconduct.\n' +
			'Game.\n' +
			'Birgit, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n\n' +
			'First game won by Bob and Birgit 21-6'
		);
		assert.equal(pronounce_de(s, 1100000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Der erste Satz wurde gewonnen von Bob und Birgit 21-6'
		);
		assert.equal(pronounce_en(s, 1100000),
			'Alice, fault for misconduct.\n' +
			'Game.\n' +
			'Birgit, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n\n' +
			'First game won by Bob and Birgit 21-6'
		);
		assert.equal(pronounce_de(s, 1130000),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Satz.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Der erste Satz wurde gewonnen von Bob und Birgit 21-6'
		);
		assert.equal(pronounce_en(s, 1130000),
			'Alice, fault for misconduct.\n' +
			'Game.\n' +
			'Birgit, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n\n' +
			'First game won by Bob and Birgit 21-6'
		);

		presses.push({
			type: 'postgame-confirm',
			timestamp: 1020005,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.timer, {
			duration: 120000,
			exigent: 25000,
			start: 1000000,
		});

		presses.push({
			type: 'pick_server',
			timestamp: 1020006,
			team_id: 1,
			player_id: 1,
		});
		var presses_save_inbetween = presses.slice();
		presses.push({
			type: 'pick_receiver',
			timestamp: 1020007,
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_en(s, 1020000),
			'Birgit, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n\n' +
			'Second game; love all.\n' +
			'Bob, faulted for misconduct.\n' +
			'Service over. 1-love; play'
		);
		assert.equal(pronounce_de(s, 1020000),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Zweiter Satz. 0 beide.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1-0.\n' +
			'Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1100000),
			'20 seconds. 20 seconds.\n' +
			'Birgit, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n\n' +
			'Second game; love all.\n' +
			'Bob, faulted for misconduct.\n' +
			'Service over. 1-love; play'
		);
		assert.equal(pronounce_de(s, 1100000),
			'20 Sekunden. 20 Sekunden.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Zweiter Satz. 0 beide.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1-0.\n' +
			'Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1130000),
			'Birgit, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n\n' +
			'Second game; love all.\n' +
			'Bob, faulted for misconduct.\n' +
			'Service over. 1-love; play'		);
		assert.equal(pronounce_de(s, 1130000),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Zweiter Satz. 0 beide.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1-0.\n' +
			'Bitte spielen.'
		);

		// test red card during receiver selection
		presses = presses_save_inbetween;
		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 1,
		});
		presses.push({
			type: 'pick_receiver',
			timestamp: 1020007,
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepStrictEqual(s.timer, {
			duration: 120000,
			exigent: 25000,
			start: 1000000,
		});
		assert.equal(pronounce_en(s, 1020000),
			'Birgit, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'Alice, fault for misconduct.\n\n' +
			'Second game; love all.\n' +
			'Bob, faulted for misconduct.\n' +
			'Alice, faulted for misconduct.\n' +
			'Service over. 1 all; play'
		);
		assert.equal(pronounce_de(s, 1020000),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Zweiter Satz. 0 beide.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1 beide.\n' +
			'Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1100000),
			'20 seconds. 20 seconds.\n' +
			'Birgit, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'Alice, fault for misconduct.\n\n' +
			'Second game; love all.\n' +
			'Bob, faulted for misconduct.\n' +
			'Alice, faulted for misconduct.\n' +
			'Service over. 1 all; play'
		);
		assert.equal(pronounce_de(s, 1100000),
			'20 Sekunden. 20 Sekunden.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Zweiter Satz. 0 beide.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1 beide.\n' +
			'Bitte spielen.'
		);
		assert.equal(pronounce_en(s, 1130000),
			'Birgit, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'Alice, fault for misconduct.\n\n' +
			'Second game; love all.\n' +
			'Bob, faulted for misconduct.\n' +
			'Alice, faulted for misconduct.\n' +
			'Service over. 1 all; play'
		);
		assert.equal(pronounce_de(s, 1130000),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n\n' +
			'Zweiter Satz. 0 beide.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1 beide.\n' +
			'Bitte spielen.'
		);


		// test postgame-confirm before more cards
		presses = presses_sav;
		presses.push({
			type: 'postgame-confirm',
			timestamp: 1020000,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s, 1020000),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.'
		);
		assert.equal(pronounce_en(s, 1020000),
			'Birgit, warning for misconduct.'
		);
		assert.equal(pronounce_de(s, 1100000),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.'
		);
		assert.equal(pronounce_en(s, 1100000),
			'Birgit, warning for misconduct.'
		);
		assert.equal(pronounce_de(s, 1130000),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.'
		);
		assert.equal(pronounce_en(s, 1130000),
			'Birgit, warning for misconduct.'
		);

		presses.push({
			type: 'pick_server',
			timestamp: 1020002,
			team_id: 1,
			player_id: 1,
		});
		presses.push({
			type: 'pick_receiver',
			timestamp: 1020003,
			team_id: 1,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s, 1020000),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n\n' +
			'Zweiter Satz. 0 beide.\nBitte spielen.'
		);
		assert.equal(pronounce_en(s, 1020000),
			'Birgit, warning for misconduct.\n\n' +
			'Second game; love all; play'
		);
		assert.equal(pronounce_de(s, 1100000),
			'20 Sekunden. 20 Sekunden.\n' +
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n\n' +
			'Zweiter Satz. 0 beide.\nBitte spielen.'
		);
		assert.equal(pronounce_en(s, 1100000),
			'20 seconds. 20 seconds.\n' +
			'Birgit, warning for misconduct.\n\n' +
			'Second game; love all; play'
		);
		assert.equal(pronounce_de(s, 1130000),
			'Birgit, Verwarnung wegen unsportlichen Verhaltens.\n\n' +
			'Zweiter Satz. 0 beide.\nBitte spielen.'
		);
		assert.equal(pronounce_en(s, 1130000),
			'Birgit, warning for misconduct.\n\n' +
			'Second game; love all; play'
		);
	});

	_it('Pronounce full team name', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: false,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}];
		var s = state_after(presses, {
			teams: [{
				players: [{name: 'Andrew'}],
				name: 'Spvgg.Sterkrade-N.',
			}, {
				players: [{name: 'Bob'}],
				name: 'TV Refrath',
			}],
			is_doubles: false,
			team_competition: true,
			counting: '3x21',
		});

		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Sportvereinigung Sterkrade-Nord, vertreten durch Andrew,\n' +
			'und zu meiner Linken,\n' +
			'TV Refrath, vertreten durch Bob.\n' +
			'Sportvereinigung Sterkrade-Nord schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
	});

	_it('mixed-nationality teams in international tournaments', () => {
		const presses = [{
			type: 'pick_side',
			team1_left: false,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}];
		const s = state_after(presses, {
			teams: [{
				players: [{name: 'Denise', nationality: 'DEN'}, {name: 'Svea', nationality: 'SWE'}],
				name: 'Denmark / Sweden (generated)',
			}, {
				players: [{name: 'Beatrix', nationality: 'BEL'}, {name: 'Natalia', nationality: 'NED'}],
				name: 'Belgium / Netherlands (generated)',
			}],
			is_doubles: true,
			team_competition: false,
			nation_competition: true,
			counting: '3x21',
		});

		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Denise, Denmark and Svea, Sweden,\n' +
			'and on my left,\n' +
			'Beatrix, Belgium and Natalia, Netherlands.\n' +
			'Denise to serve to Beatrix.\n\n' +
			'love all.\n' +
			'Play.'
		);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Denise, Denmark und Svea, Sweden,\n' +
			'und zu meiner Linken,\n' +
			'Beatrix, Belgium und Natalia, Netherlands.\n' +
			'Denise schlägt auf zu Beatrix.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
	});

	_it('nationalities in international tournaments', () => {
		const presses = [{
			type: 'pick_side',
			team1_left: false,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}];
		const s = state_after(presses, {
			teams: [{
				players: [{name: 'Michael', nationality: 'GER'}, {name: 'Michaela', nationality: 'GER'}],
				name: 'generated',
			}, {
				players: [{name: 'John', nationality: 'USA'}, {name: 'Jane', nationality: 'USA'}],
			}],
			is_doubles: true,
			team_competition: false,
			nation_competition: true,
			counting: '3x21',
		});

		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Michael and Michaela, Germany,\n' +
			'and on my left,\n' +
			'John and Jane, USA.\n' + // Not United States of America
			'Michael to serve to John.\n\n' +
			'love all.\n' +
			'Play.'
		);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Michael und Michaela, Germany,\n' +
			'und zu meiner Linken,\n' +
			'John und Jane, USA.\n' +
			'Michael schlägt auf zu John.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);

		const singles_s = state_after(presses, {
			teams: [{
				players: [{name: 'Michael', nationality: 'GER'}],
			}, {
				players: [{name: 'Xu Yie', nationality: 'TPE'}],
			}],
			is_doubles: false,
			team_competition: false,
			nation_competition: true,
			counting: '3x21',
		});

		assert.strictEqual(
			pronounce_en(singles_s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Michael, Germany,\n' +
			'and on my left,\n' +
			'Xu Yie, Chinese Taipei.\n' +
			'Michael to serve.\n\n' +
			'love all.\n' +
			'Play.'
		);
		assert.strictEqual(
			pronounce_de(singles_s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Michael, Germany,\n' +
			'und zu meiner Linken,\n' +
			'Xu Yie, Chinese Taipei.\n' +
			'Michael schlägt auf.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
	});

	_it('nationalities if incorrectly specified in a national tournament', () => {
		const presses = [{
			type: 'pick_side',
			team1_left: false,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
		}];
		const s = state_after(presses, {
			teams: [{
				players: [{name: 'Michael', nationality: 'GER'}, {name: 'Michaela', nationality: 'GER'}],
				name: 'Germany',
			}, {
				players: [{name: 'John', nationality: 'GER'}, {name: 'Jane', nationality: 'GER'}],
				name: 'Germany',
			}],
			is_doubles: true,
			team_competition: false,
			nation_competition: false,
			counting: '3x21',
		});

		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right,\n' +
			'Michael and Michaela,\n' +
			'and on my left,\n' +
			'John and Jane.\n' +
			'Michael to serve to John.\n\n' +
			'love all.\n' +
			'Play.'
		);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten,\n' +
			'Michael und Michaela,\n' +
			'und zu meiner Linken,\n' +
			'John und Jane.\n' +
			'Michael schlägt auf zu John.\n\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
	});
});

module.exports = {
	pronounce_de: pronounce_de,
	pronounce_en: pronounce_en,
	pronounce_dech: pronounce_dech,
	pronounce_frch: pronounce_frch,
};
