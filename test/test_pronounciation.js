var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var DOUBLES_SETUP = tutils.DOUBLES_SETUP;
var DOUBLES_TEAM_SETUP = tutils.DOUBLES_TEAM_SETUP;
var SINGLES_SETUP = tutils.SINGLES_SETUP;
var SINGLES_TEAM_SETUP = tutils.SINGLES_TEAM_SETUP;
var state_after = tutils.state_after;
var press_score = tutils.press_score;
var bup = tutils.bup;

function pronounce_de(s) {
	bup.i18n.update_state(s, 'de');
	return bup.pronounciation.pronounce(s);
}

function pronounce_en(s) {
	bup.i18n.update_state(s, 'en');
	return bup.pronounciation.pronounce(s);
}

function loveall_de(s) {
	bup.i18n.update_state(s, 'de');
	return bup.pronounciation.loveall_announcement(s);
}

function loveall_en(s) {
	bup.i18n.update_state(s, 'en');
	return bup.pronounciation.loveall_announcement(s);
}


(function() {
'use strict';

_describe('pronounciation', function() {
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
			'Zu meiner Rechten, Bob und Birgit,\n' +
			'und zu meiner Linken, Andrew und Alice.\n' +
			'Andrew schlägt auf zu Birgit.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right, Bob and Birgit,\n' +
			'and on my left, Andrew and Alice.\n' +
			'Andrew to serve to Birgit.\n' +
			'Love all.\n' +
			'Play.'
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
			'Zu meiner Rechten, Andrew und Alice,\n' +
			'und zu meiner Linken, Bob und Birgit.\n' +
			'Alice schlägt auf zu Birgit.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right, Andrew and Alice,\n' +
			'and on my left, Bob and Birgit.\n' +
			'Alice to serve to Birgit.\n' +
			'Love all.\n' +
			'Play.'
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
			'Zu meiner Rechten, Bob und Birgit,\n' +
			'und zu meiner Linken, Andrew und Alice.\n' +
			'Bob schlägt auf zu Alice.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right, Bob and Birgit,\n' +
			'and on my left, Andrew and Alice.\n' +
			'Bob to serve to Alice.\n' +
			'Love all.\n' +
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
			'Zu meiner Rechten, Bob,\n' +
			'und zu meiner Linken, Alice.\n' +
			'Alice schlägt auf.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right, Bob,\n' +
			'and on my left, Alice.\n' +
			'Alice to serve.\n' +
			'Love all.\n' +
			'Play.'
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
			'Zu meiner Rechten, Alice,\n' +
			'und zu meiner Linken, Bob.\n' +
			'Alice schlägt auf.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right, Alice,\n' +
			'and on my left, Bob.\n' +
			'Alice to serve.\n' +
			'Love all.\n' +
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
			'Zu meiner Rechten, Bob,\n' +
			'und zu meiner Linken, Alice.\n' +
			'Bob schlägt auf.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right, Bob,\n' +
			'and on my left, Alice.\n' +
			'Bob to serve.\n' +
			'Love all.\n' +
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
			'Zu meiner Rechten, Alice,\n' +
			'und zu meiner Linken, Bob.\n' +
			'Bob schlägt auf.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right, Alice,\n' +
			'and on my left, Bob.\n' +
			'Bob to serve.\n' +
			'Love all.\n' +
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
			'Zu meiner Rechten, B team, vertreten durch Bob und Birgit,\n' +
			'und zu meiner Linken, A team, vertreten durch Andrew und Alice.\n' +
			'A team schlägt auf, Alice zu Birgit.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right, B team, represented by Bob and Birgit,\n' +
			'and on my left, A team, represented by Andrew and Alice.\n' +
			'A team to serve, Alice to Birgit.\n' +
			'Love all.\n' +
			'Play.'
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
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Linken, B team, vertreten durch Bob und Birgit,\n' +
			'und zu meiner Rechten, A team, vertreten durch Andrew und Alice.\n' +
			'A team schlägt auf, Alice zu Birgit.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my left, B team, represented by Bob and Birgit,\n' +
			'and on my right, A team, represented by Andrew and Alice.\n' +
			'A team to serve, Alice to Birgit.\n' +
			'Love all.\n' +
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
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Linken, B team, vertreten durch Bob und Birgit,\n' +
			'und zu meiner Rechten, A team, vertreten durch Andrew und Alice.\n' +
			'B team schlägt auf, Bob zu Andrew.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my left, B team, represented by Bob and Birgit,\n' +
			'and on my right, A team, represented by Andrew and Alice.\n' +
			'B team to serve, Bob to Andrew.\n' +
			'Love all.\n' +
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
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten, B team, vertreten durch Bob und Birgit,\n' +
			'und zu meiner Linken, A team, vertreten durch Andrew und Alice.\n' +
			'B team schlägt auf, Birgit zu Andrew.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right, B team, represented by Bob and Birgit,\n' +
			'and on my left, A team, represented by Andrew and Alice.\n' +
			'B team to serve, Birgit to Andrew.\n' +
			'Love all.\n' +
			'Play.'
		);

	});

	_it('Match start in a team competition (singles)', function() {
		var presses = [];
		var s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.strictEqual(pronounce_de(s), null);
		assert.strictEqual(pronounce_en(s), null);

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
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.strictEqual(
			pronounce_de(s),
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten, B team, vertreten durch Bob,\n' +
			'und zu meiner Linken, A team, vertreten durch Alice.\n' +
			'A team schlägt auf.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right, B team, represented by Bob,\n' +
			'and on my left, A team, represented by Alice.\n' +
			'A team to serve.\n' +
			'Love all.\n' +
			'Play.'
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
			'Zu meiner Linken, B team, vertreten durch Bob,\n' +
			'und zu meiner Rechten, A team, vertreten durch Alice.\n' +
			'A team schlägt auf.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my left, B team, represented by Bob,\n' +
			'and on my right, A team, represented by Alice.\n' +
			'A team to serve.\n' +
			'Love all.\n' +
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
			'Zu meiner Rechten, B team, vertreten durch Bob,\n' +
			'und zu meiner Linken, A team, vertreten durch Alice.\n' +
			'B team schlägt auf.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my right, B team, represented by Bob,\n' +
			'and on my left, A team, represented by Alice.\n' +
			'B team to serve.\n' +
			'Love all.\n' +
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
			'Zu meiner Linken, B team, vertreten durch Bob,\n' +
			'und zu meiner Rechten, A team, vertreten durch Alice.\n' +
			'B team schlägt auf.\n' +
			'0 beide.\n' +
			'Bitte spielen.'
		);
		assert.strictEqual(
			pronounce_en(s),
			'Ladies and Gentlemen:\n' +
			'On my left, B team, represented by Bob,\n' +
			'and on my right, A team, represented by Alice.\n' +
			'B team to serve.\n' +
			'Love all.\n' +
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
		assert.equal(pronounce_en(s), '1-Love');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), '2-0');
		assert.equal(pronounce_en(s), '2-Love');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 1-2');
		assert.equal(pronounce_en(s), 'Service over. 1-2');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), '2 beide');
		assert.equal(pronounce_en(s), '2 all');

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
		assert.equal(pronounce_en(s), '1-Love');

		presses.push({
			type: 'score',
			side: 'left',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '2-0');
		assert.equal(pronounce_en(s), '2-Love');

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
		assert.equal(pronounce_de(s), '11-9 Pause');
		assert.equal(pronounce_en(s), '11-9 Interval');

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

		alt_presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s), '20 Satzpunkt 19');
		assert.equal(pronounce_en(s), '20 game point 19');

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
			'Satz.\n' +
			'Der erste Satz wurde gewonnen von Bob mit 23-21');
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'First game won by Bob 23-21');

		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Der erste Satz wurde gewonnen von Bob und Birgit mit 23-21');
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'First game won by Bob and Birgit 23-21');

		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Der erste Satz wurde gewonnen von B team mit 23-21');
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'First game won by B team 23-21');

		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Der erste Satz wurde gewonnen von B team mit 23-21');
		assert.equal(pronounce_en(s),
			'Game.\n' +
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
		assert.equal(pronounce_de(s), 'Aufschlagwechsel. 11-10 Pause');
		assert.equal(pronounce_en(s), 'Service over. 11-10 Interval');

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
			'Satz.\n' +
			'Das Spiel wurde gewonnen von Bob mit 23-21 30-29');
		assert.equal(pronounce_en(s),
			'Game.\n' +
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
			'Satz.\n' +
			'Der zweite Satz wurde gewonnen von A team mit 30-29; einen Satz beide');
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Second game won by A team 30-29; One game all');
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s), 
			'Satz.\n' +
			'Der zweite Satz wurde gewonnen von A team mit 30-29; einen Satz beide');
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Second game won by A team 30-29; One game all');
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Der zweite Satz wurde gewonnen von Alice mit 30-29; einen Satz beide');
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Second game won by Alice 30-29; One game all');
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s), 
			'Satz.\n' +
			'Der zweite Satz wurde gewonnen von Andrew und Alice mit 30-29; einen Satz beide');
		assert.equal(pronounce_en(s),
			'Game.\n' +
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
			'Aufschlagwechsel. 11-10 Pause. Bitte die Spielfeldseiten wechseln');
		assert.equal(pronounce_en(s),
			'Service over. 11-10 Interval; change ends');

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
			'Satz.\n' +
			'Das Spiel wurde gewonnen von B team mit 23-21 29-30 22-20');
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Match won by B team 23-21 29-30 22-20');
		s = state_after(alt_presses, SINGLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Das Spiel wurde gewonnen von B team mit 23-21 29-30 22-20');
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Match won by B team 23-21 29-30 22-20');
		s = state_after(alt_presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit mit 23-21 29-30 22-20');
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Match won by Bob and Birgit 23-21 29-30 22-20');
		s = state_after(alt_presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Das Spiel wurde gewonnen von Bob mit 23-21 29-30 22-20');
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Match won by Bob 23-21 29-30 22-20');

		presses.push({
			type: 'score',
			side: 'right',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Das Spiel wurde gewonnen von Alice mit 21-23 30-29 21-19');
		s = state_after(presses, DOUBLES_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice mit 21-23 30-29 21-19');
		s = state_after(presses, SINGLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Das Spiel wurde gewonnen von A team mit 21-23 30-29 21-19');
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Das Spiel wurde gewonnen von A team mit 21-23 30-29 21-19');
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
			'Love all');

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
			'Bob, disqualifiziert wegen unsportlichen Verhaltens.\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice mit 4-4');
		assert.equal(pronounce_en(s),
			'Bob, disqualified for misconduct.\n' +
			'Match won by Andrew and Alice 4-4');

		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Bob, disqualifiziert wegen unsportlichen Verhaltens.\n' +
			'Das Spiel wurde gewonnen von A team mit 4-4');
		assert.equal(pronounce_en(s),
			'Bob, disqualified for misconduct.\n' +
			'Match won by A team 4-4');
	});

	_it('cards at beginning of match', function() {
		var presses = [];
		var s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.strictEqual(pronounce_de(s), null);

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

		var red_card = {
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		};
		presses.push(red_card);
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.');
		assert.equal(pronounce_en(s),
			'Andrew, warning for misconduct.\n' +
			'Bob, faulted.');
		assert.strictEqual(s.match.carded[0], true);
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
		assert.strictEqual(s.match.carded[0], true);
		assert.deepEqual(s.match.pending_red_cards, []); // See RTTO 3.7.7
		assert.deepEqual(s.game.score, [0, 0]);
		assert.equal(s.game.started, false);
		assert.equal(pronounce_de(s),
			'Andrew, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten, Bob und Birgit,\n' +
			'und zu meiner Linken, Andrew und Alice.\n' +
			'Andrew schlägt auf zu Birgit.\n' +
			'0 beide.\n' +
			'Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Andrew, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'Ladies and Gentlemen:\n' +
			'On my right, Bob and Birgit,\n' +
			'and on my left, Andrew and Alice.\n' +
			'Andrew to serve to Birgit.\n' +
			'Love all.\n' +
			'Play.'
		);
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten, B team, vertreten durch Bob und Birgit,\n' +
			'und zu meiner Linken, A team, vertreten durch Andrew und Alice.\n' +
			'A team schlägt auf, Andrew zu Birgit.\n' +
			'0 beide.\n' +
			'Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Andrew, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'Ladies and Gentlemen:\n' +
			'On my right, B team, represented by Bob and Birgit,\n' +
			'and on my left, A team, represented by Andrew and Alice.\n' +
			'A team to serve, Andrew to Birgit.\n' +
			'Love all.\n' +
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
			'Zu meiner Rechten, Bob und Birgit,\n' +
			'und zu meiner Linken, Andrew und Alice.\n' +
			'Andrew schlägt auf zu Birgit.\n' +
			'0 beide.\n' +
			'Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Andrew, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'Alice, fault for misconduct.\n' +
			'Ladies and Gentlemen:\n' +
			'On my right, Bob and Birgit,\n' +
			'and on my left, Andrew and Alice.\n' +
			'Andrew to serve to Birgit.\n' +
			'Love all.\n' +
			'Play.'
		);
		s = state_after(presses, DOUBLES_TEAM_SETUP);
		assert.equal(pronounce_de(s),
			'Andrew, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Meine Damen und Herren:\n' +
			'Zu meiner Rechten, B team, vertreten durch Bob und Birgit,\n' +
			'und zu meiner Linken, A team, vertreten durch Andrew und Alice.\n' +
			'A team schlägt auf, Andrew zu Birgit.\n' +
			'0 beide.\n' +
			'Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Andrew, warning for misconduct.\n' +
			'Bob, fault for misconduct.\n' +
			'Alice, fault for misconduct.\n' +
			'Ladies and Gentlemen:\n' +
			'On my right, B team, represented by Bob and Birgit,\n' +
			'and on my left, A team, represented by Andrew and Alice.\n' +
			'A team to serve, Andrew to Birgit.\n' +
			'Love all.\n' +
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
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Birgit, Fehler wegen unsportlichen Verhaltens.\n' +
			'Der erste Satz wurde gewonnen von Andrew und Alice mit 21-19');
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Birgit, faulted.\n' +
			'First game won by Andrew and Alice 21-19');

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
			'Birgit, faulted.');

		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.match.pending_red_cards, []);
		assert.equal(pronounce_de(s),
			'Zweiter Satz. 0 beide.\n' +
			'Birgit, Fehler wegen unsportlichen Verhaltens.\n' +
			'1-0. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Second game; love all.\n' +
			'Birgit, faulted.\n' +
			'1-Love. Play.');

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [1, 0]);
		assert.strictEqual(pronounce_de(s), '1-0');
		assert.strictEqual(pronounce_en(s), '1-Love');

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
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Der zweite Satz wurde gewonnen von Bob und Birgit mit 21-19; einen Satz beide');
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Alice, faulted.\n' +
			'Second game won by Bob and Birgit 21-19; One game all');
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
		assert.equal(pronounce_de(s),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.');
		assert.equal(pronounce_en(s),
			'Alice, faulted.\n' +
			'Bob, faulted.');

		presses.push({
			type: 'pick_server',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [1, 1]);
		assert.equal(pronounce_de(s),
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.');
		assert.equal(pronounce_en(s),
			'Alice, faulted.\n' +
			'Bob, faulted.');

		presses.push({
			type: 'pick_receiver',
			team_id: 0,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [1, 1]);
		assert.equal(pronounce_de(s),
			'Entscheidungssatz. 0 beide.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1 beide. Bitte spielen.'
		);
		assert.equal(pronounce_en(s),
			'Final game; love all.\n' +
			'Alice, faulted.\n' +
			'Bob, faulted.\n' +
			'Service over. 1 all. Play.');

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
			'Satz.\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice mit 21-19 19-21 21-12'
		);
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Match won by Andrew and Alice 21-19 19-21 21-12'
		);

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [21, 12]);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice mit 21-19 19-21 21-12'
		);
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Bob, faulted.\n' +
			'Match won by Andrew and Alice 21-19 19-21 21-12'
		);

		presses.push({
			type: 'red-card',
			team_id: 0,
			player_id: 1,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [21, 12]);
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice mit 21-19 19-21 21-12'
		);
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Bob, faulted.\n' +
			'Alice, faulted.\n' +
			'Match won by Andrew and Alice 21-19 19-21 21-12'
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
		assert.equal(pronounce_de(s),
			'Satz.\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Der erste Satz wurde gewonnen von Andrew und Alice mit 21-19');
		assert.equal(pronounce_en(s),
			'Game.\n' +
			'Andrew, faulted.\n' +
			'First game won by Andrew and Alice 21-19');

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
		assert.equal(pronounce_de(s),
			'Zweiter Satz. 0 beide.\n' +
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1-0. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Second game; love all.\n' +
			'Andrew, faulted.\n' +
			'Service over. 1-Love. Play.');

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.deepEqual(s.game.score, [0, 1]);
		assert.equal(s.game.team1_serving, false);
		assert.equal(pronounce_de(s),
			'Aufschlagwechsel. 1-0');
		assert.equal(pronounce_en(s),
			'Service over. 1-Love');
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
			'Bob gibt auf.\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice mit 0-0');
		assert.equal(pronounce_en(s),
			'Bob retired.\n' +
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
			'Alice gibt auf.\n' +
			'Das Spiel wurde gewonnen von B team mit 2-3');
		assert.equal(pronounce_en(s),
			'Alice retired.\n' +
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
			'Andrew gibt auf.\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit mit 19-21 2-2');
		assert.equal(pronounce_en(s),
			'Andrew retired.\n' +
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
			'Bob gibt auf.\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice mit 0-0');
		assert.equal(pronounce_en(s),
			'Bob retired.\n' +
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
			'Andrew gibt auf.\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit mit 0-0');
		assert.equal(pronounce_en(s),
			'Andrew retired.\n' +
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
			'Birgit gibt auf.\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice mit 0-0');
		assert.equal(pronounce_en(s),
			'Birgit retired.\n' +
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
			'Alice gibt auf.\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit mit 0-0');
		assert.equal(pronounce_en(s),
			'Alice retired.\n' +
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
			'Andrew gibt auf.\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit mit 0-0');
		assert.equal(pronounce_en(s),
			'Andrew retired.\n' +
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
			'Andrew gibt auf.\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit mit 19-21');
		assert.equal(pronounce_en(s),
			'Andrew retired.\n' +
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
			'Bob, disqualifiziert wegen unsportlichen Verhaltens.\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice mit 0-0');
		assert.equal(pronounce_en(s),
			'Bob, disqualified for misconduct.\n' +
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
			'Andrew, disqualifiziert wegen unsportlichen Verhaltens.\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit mit 0-0');
		assert.equal(pronounce_en(s),
			'Andrew, disqualified for misconduct.\n' +
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
			'Birgit, disqualifiziert wegen unsportlichen Verhaltens.\n' +
			'Das Spiel wurde gewonnen von Andrew und Alice mit 0-0');
		assert.equal(pronounce_en(s),
			'Birgit, disqualified for misconduct.\n' +
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
			'Alice, disqualifiziert wegen unsportlichen Verhaltens.\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit mit 0-0');
		assert.equal(pronounce_en(s),
			'Alice, disqualified for misconduct.\n' +
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
			'Andrew, disqualifiziert wegen unsportlichen Verhaltens.\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit mit 0-0');
		assert.equal(pronounce_en(s),
			'Andrew, disqualified for misconduct.\n' +
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
			'Andrew, disqualifiziert wegen unsportlichen Verhaltens.\n' +
			'Das Spiel wurde gewonnen von Bob und Birgit mit 19-21');
		assert.equal(pronounce_en(s),
			'Andrew, disqualified for misconduct.\n' +
			'Match won by Bob and Birgit 19-21');
	});

	_it('red card at interval (RTTO 3.7.2 after November 9th 2015)', function() {
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
			'11-7 Pause');
		assert.equal(pronounce_en(s),
			'11-7 Interval');

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 1,
		});

		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.interval, true);
		assert.deepEqual(s.game.score, [12, 7]);
		assert.deepEqual(s.game.interval_score, [11, 7]);
		assert.equal(pronounce_de(s),
			'11-7 Pause.\n' +
			'Birgit, Fehler wegen unsportlichen Verhaltens.\n' +
			'12-7. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'11-7 Interval.\n' +
			'Birgit, faulted.\n' +
			'12-7. Play.');

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
		assert.equal(pronounce_de(s),
			'11-7 Pause.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 8-11. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'11-7 Interval.\n' +
			'Alice, faulted.\n' +
			'Service over. 8-11. Play.');

		presses.push({
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		});
		s = state_after(presses, DOUBLES_SETUP);
		assert.strictEqual(s.game.interval, true);
		assert.deepEqual(s.game.score, [12, 8]);
		assert.deepEqual(s.game.interval_score, [11, 7]);
		assert.equal(pronounce_de(s),
			'11-7 Pause.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 12-8. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'11-7 Interval.\n' +
			'Alice, faulted.\n' +
			'Bob, faulted.\n' +
			'Service over. 12-8. Play.');
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
			'Aufschlagwechsel. 11-10 Pause');
		assert.equal(pronounce_en(s),
			'Andrew, fault for misconduct.\n' +
			'Service over. 11-10 Interval');

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
			'Aufschlagwechsel. 11-10 Pause');
		assert.equal(pronounce_en(s),
			'Andrew, fault for misconduct.\n' +
			'Service over. 11-10 Interval');
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
		assert.equal(pronounce_de(s),
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11-10 Pause.\n' +
			'Bob, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11 beide. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Andrew, fault for misconduct.\n' +
			'Service over. 11-10 Interval.\n' +
			'Bob, faulted.\n' +
			'Service over. 11 all. Play.');

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
		assert.equal(pronounce_de(s),
			'Andrew, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 11-10 Pause.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'12-10. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Andrew, fault for misconduct.\n' +
			'Service over. 11-10 Interval.\n' +
			'Alice, faulted.\n' +
			'12-10. Play.');
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
			'Satz.\n' +
			'Der erste Satz wurde gewonnen von Alice mit 21-16');
		assert.equal(pronounce_en(s),
			'Bob, fault for misconduct.\n' +
			'Game.\n' +
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
			'Satz.\n' +
			'Der erste Satz wurde gewonnen von Alice mit 21-16');
		assert.equal(pronounce_en(s),
			'Bob, fault for misconduct.\n' +
			'Game.\n' +
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
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Der erste Satz wurde gewonnen von Alice mit 21-16');
		assert.equal(pronounce_en(s),
			'Bob, fault for misconduct.\n' +
			'Game.\n' +
			'Alice, faulted.\n' +
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
			'Zweiter Satz. 0 beide.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1-0. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Second game; love all.\n' +
			'Alice, faulted.\n' +
			'Service over. 1-Love. Play.');
		assert.ok(! s.timer);

		var injury = {
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 5,
		};
		presses.push(injury);
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.marks, [
			referee,
			red_card2,
			injury,
		]);
		assert.deepEqual(s.game.score, [0, 1]);
		assert.equal(pronounce_de(s),
			'Zweiter Satz. 0 beide.\n' +
			'Alice, Fehler wegen unsportlichen Verhaltens.\n' +
			'Aufschlagwechsel. 1-0. Bitte spielen.');
		assert.equal(pronounce_en(s),
			'Second game; love all.\n' +
			'Alice, faulted.\n' +
			'Service over. 1-Love. Play.');
		assert.ok(! s.timer);

		presses.push({
			type: 'love-all',
		});
		s = state_after(presses, SINGLES_SETUP);
		assert.deepEqual(s.match.marks, []);
		assert.deepEqual(s.game.score, [0, 1]);
		assert.strictEqual(pronounce_de(s), 'Aufschlagwechsel. 1-0');
		assert.strictEqual(pronounce_en(s), 'Service over. 1-Love');
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
			'Satz.\n' +
			'Das Spiel wurde gewonnen von Alice mit 21-23 30-29 21-16');
		assert.equal(pronounce_en(s),
			'Bob, fault for misconduct.\n' +
			'Game.\n' +
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
			'Alice, Verwarnung wegen unsportlichen Verhaltens.\n' +
			'Das Spiel wurde gewonnen von Alice mit 21-23 30-29 21-16');
		assert.equal(pronounce_en(s),
			'Bob, fault for misconduct.\n' +
			'Game.\n' +
			'Alice, warning for misconduct.\n' +
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
			'Das Spiel wurde gewonnen von Alice mit 21-23 30-29 21-16');
		assert.equal(pronounce_en(s),
			'Bob, fault for misconduct.\n' +
			'Game.\n' +
			'Alice, warning for misconduct.\n' +
			'Alice, faulted.\n' +
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
});


})();
