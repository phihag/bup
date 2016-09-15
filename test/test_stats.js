var assert = require('assert');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;

(function() {
'use strict';

var WITH_COUNTER = {
	shuttle_counter: true,
	language: 'de',
};
var WITHOUT_COUNTER = {
	shuttle_counter: false,
	language: 'de',
};

function _outline(el) {
	var res;
	switch (el.tagName) {
	case 'text':
		var width = bup.stats.TEXT_WIDTH * el.textContent.length;
		var height = bup.stats.TEXT_HEIGHT;

		var rotate = !! el.attributes.transform;
		if (rotate) {
			height = width;
			width = bup.stats.TEXT_HEIGHT;
		}
		res = {
			x1: el.attributes.x - width / 2,
			x2: el.attributes.x + width / 2,
			y1: el.attributes.y - height / 2,
			y2: el.attributes.y + height / 2,
		};
		break;
	case 'rect':
		res = {
			x1: el.attributes.x,
			x2: el.attributes.x + el.attributes.width,
			y1: el.attributes.y,
			y2: el.attributes.y + el.attributes.height,
		};
		break;
	default:
		throw new Error('Unsupported element ' + el.tagName);
	}
	return res;
}

function _intersects(el1, el2) {
	var o1 = _outline(el1);

	if (el2.tagName === 'line') {
		var x1 = el2.attributes.x1;
		var x2 = el2.attributes.x2;
		assert.ok(x1 <= x2);
		var y1 = Math.min(el2.attributes.y1, el2.attributes.y2);
		var y2 = Math.max(el2.attributes.y1, el2.attributes.y2);
		assert.ok(y1 <= y2);

		if (x1 === x2) {
			return (o1.x1 <= x1) && (x1 <= o1.x2) && (y1 <= o1.y2) && (y2 >= o1.y1);
		} else if (y1 === y2) {
			return (o1.y1 <= y1) && (y1 <= o1.y2) && (x1 <= o1.x2) && (x2 >= o1.x1);
		} else {
			throw new Error('delta not in {inf,0} - unsupported');
		}
	}
	var o2 = _outline(el2);

	return !(
		(o1.x2 < o2.x1) ||
		(o2.x2 < o1.x1) ||
		(o1.y2 < o2.y1) ||
		(o2.y2 < o1.y1)
	);
}

function _plot(s) {
	var st = bup.stats.calc_stats(s);
	var svg = new tutils.Document('container');
	var container = svg.documentElement;
	var gpoints = bup.stats.normalize_gpoints(st.gpoints);
	var max_score = bup.stats.calc_max_score(gpoints);

	bup.stats.draw_graph(s, container, gpoints, max_score);

	return container.childNodes;
}

_describe('stats', function() {
	_it('calculation', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
			timestamp: 1000,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
			timestamp: 2000,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
			timestamp: 3000,
		}, {
			type: 'love-all',
			timestamp: 120000,
		}];
		for (var i = 1; i <= 10;i++) {
			presses.push({
				type: 'score',
				side: 'left',
				timestamp: 120000 + i * 10000,
			});
		}
		presses.push({
			type: 'score',
			side: 'right',
			timestamp: 230000,
		});
		var s = tutils.state_after(presses, tutils.DOUBLES_SETUP, WITH_COUNTER);
		var st = bup.stats.calc_stats(s).cols;
		assert.strictEqual(st.length, 1 + 1);
		assert.strictEqual(st[0].points, '10-1');
		assert.strictEqual(st[0].points_lr, '10/1');
		assert.strictEqual(st[0].duration, '1:50');
		assert.deepStrictEqual(
			st[0].rally_lengths,
			[10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000]);
		assert.strictEqual(st[0].avg_rally_length, '0:10');
		assert.strictEqual(st[0].longest_rally_length, 10000);
		assert.strictEqual(st[0].longest_rally, '0:10');
		assert.strictEqual(st[0].longest_rally_desc, '0:10 (0-0)');
		assert.deepStrictEqual(
			st[0].serves,
			[[11, 0], [0, 0]]
		);
		assert.strictEqual(st[1].points, '10-1');
		assert.strictEqual(st[1].points_lr, '10/1');
		assert.strictEqual(st[1].duration, '1:50');
		assert.strictEqual(st[1].avg_rally_length, '0:10');
		assert.strictEqual(st[1].longest_rally_length, 10000);
		assert.strictEqual(st[1].longest_rally, '0:10');
		assert.strictEqual(st[1].longest_rally_desc, '0:10 (0-0 im 1. Satz)');

		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 250000,
		});
		s = tutils.state_after(presses, tutils.DOUBLES_SETUP, WITH_COUNTER);
		st = bup.stats.calc_stats(s).cols;
		assert.strictEqual(st.length, 1 + 1);
		assert.strictEqual(st[0].points, '11-1');
		assert.strictEqual(st[0].points_lr, '11/1');
		assert.strictEqual(st[0].duration, '2:10');
		assert.deepStrictEqual(
			st[0].rally_lengths,
			[10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 20000]);
		assert.strictEqual(st[0].avg_rally_length, '0:11');
		assert.strictEqual(st[0].longest_rally_length, 20000);
		assert.strictEqual(st[0].longest_rally, '0:20');
		assert.strictEqual(st[0].longest_rally_desc, '0:20 (1-10)');

		assert.deepStrictEqual(
			st[0].serves,
			[[11, 0], [0, 1]]
		);
		assert.strictEqual(st[1].points, '11-1');
		assert.strictEqual(st[1].points_lr, '11/1');
		assert.strictEqual(st[1].duration, '2:10');
		assert.strictEqual(st[1].avg_rally_length, '0:11');
		assert.strictEqual(st[1].longest_rally_length, 20000);
		assert.strictEqual(st[1].longest_rally, '0:20');
		assert.strictEqual(st[1].longest_rally_desc, '0:20 (1-10 im 1. Satz)');

		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 320000,
		});
		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 330000,
		});
		s = tutils.state_after(presses, tutils.DOUBLES_SETUP, WITH_COUNTER);
		st = bup.stats.calc_stats(s).cols;
		assert.strictEqual(st.length, 1 + 1);
		assert.strictEqual(st[0].points, '13-1');
		assert.strictEqual(st[0].points_lr, '13/1');
		assert.strictEqual(st[0].duration, '3:30');
		assert.strictEqual(st[0].avg_rally_length, '0:11');
		assert.deepStrictEqual(
			st[0].serves,
			[[11, 2], [0, 1]]
		);
		assert.strictEqual(st[1].points, '13-1');
		assert.strictEqual(st[1].points_lr, '13/1');
		assert.strictEqual(st[1].duration, '3:30');
		assert.strictEqual(st[1].avg_rally_length, '0:11');

		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 330000,
		});
		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 330000,
		});
		presses.push({
			type: 'score',
			side: 'right',
			timestamp: 330000,
		});
		presses.push({
			type: 'score',
			side: 'left',
			timestamp: 330000,
		});
		s = tutils.state_after(presses, tutils.DOUBLES_SETUP, WITH_COUNTER);
		st = bup.stats.calc_stats(s).cols;
		assert.deepStrictEqual(
			st[0].serves,
			[[11, 5], [1, 1]]
		);
	});

	_it('enable/disable shuttle stats depending on settings', function() {
		var s = tutils.state_after([], tutils.DOUBLES_SETUP, WITH_COUNTER);
		var st = bup.stats.calc_stats(s);
		assert(st.keys.indexOf('shuttles') >= 0);

		s = tutils.state_after([], tutils.DOUBLES_SETUP, WITHOUT_COUNTER);
		st = bup.stats.calc_stats(s);
		assert(st.keys.indexOf('shuttles') == -1);
	});
});

_describe('stats graphs', function() {
	function _check_els(els) {
		assert.ok(els.length > 0);
		for (var i = 0;i < els.length;i++) {
			var el1 = els[i];
			if ((el1.tagName === 'line') || (el1.tagName === 'g')) {
				continue;
			}

			var o1 = _outline(el1);
			assert.ok(o1.x1 > 0, 'x1 > 0');
			assert.ok(o1.y1 > 0, 'y1 > 0');
			assert.ok(o1.x2 < bup.stats.WIDTH, 'x2 < width');
			assert.ok(o1.y2 < bup.stats.HEIGHT, 'y2 < height');

			for (var j = i + 1;j < els.length;j++) {
				var el2 = els[j];

				if (el2.tagName === 'line') {
					assert.ok(
						((el2.attributes.x1 !== el2.attributes.x2) ||
							(el2.attributes.y1 !== el2.attributes.y2)),
						'trivial line ' + JSON.stringify(el2.attributes));
				}

				assert.ok(! _intersects(el1, el2));
			}
		}
	}

	_it('basic positioning', function() {
		var pseudo_state = tutils.state_after([], tutils.DOUBLES_SETUP);
		var svg = new tutils.Document('container');
		var container = svg.documentElement;
		var game = {};
		var gpoints = [{
			score: [0, 0],
			game: game,
			normalized: 0,
		}, {
			score: [1, 0],
			game: game,
			normalized: 1000,
		}, {
			score: [1, 0],
			game: game,
			normalized: 1500,
			press: {
				type: 'injury',
				team_id: 0,
				player_id: 0,
			},
		}, {
			score: [1, 1],
			game: game,
			normalized: 10000,
		}, {
			score: [2, 1],
			game: game,
			normalized: 11000,
		}, {
			score: [2, 2],
			game: game,
			normalized: 12000,
		}, {
			score: [3, 2],
			game: game,
			normalized: 13000,
		}, {
			score: [4, 2],
			game: game,
			normalized: 14000,
		}, {
			score: [5, 2],
			game: game,
			normalized: 15000,
		}];
		gpoints.forEach(function(gp) {
			if (!gp.press) {
				gp.press = {
					type: 'fake-score',
				};
			}
			gp.draw_line = true;
		});
		var max_score = bup.stats.calc_max_score(gpoints);

		bup.stats.draw_graph(pseudo_state, container, gpoints, max_score);
		var els = container.childNodes;

		var text = tutils.find_object(els, {
			tagName: 'text',
		});
		var line = tutils.find_object(els, {
			tagName: 'line',
			attributes: {
				x2: 34,
			},
		});

		// Clearly, given that team 1 is above team 2, the yellow card should be painted above (= smaller)
		assert.equal(text.attributes.y, line.attributes.y2 - bup.stats.TEXT_HEIGHT / 2 - bup.stats.CARD_PADDING);
	});

	_it('retiring', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
			timestamp: 0,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
			timestamp: 1000,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
			timestamp: 2000,
		}, {
			type: 'love-all',
			timestamp: 120000,
		}, {
			type: 'retired',
			team_id: 1,
			player_id: 1,
			timestamp: 130000,
		}];
		var s = tutils.state_after(presses, tutils.DOUBLES_SETUP);
		var els = _plot(s);
		_check_els(els);

		// Now in English
		s = tutils.state_after(presses, tutils.DOUBLES_SETUP_EN);
		els = _plot(s);
		_check_els(els);
	});

	_it('red cards at match end', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
			timestamp: 0,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
			timestamp: 1000,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
			timestamp: 2000,
		}, {
			type: 'love-all',
			timestamp: 120000,
		}, {
			type: 'red-card',
			team_id: 1,
			player_id: 1,
		}, {
			type: 'red-card',
			team_id: 0,
			player_id: 1,
		}, {
			type: 'red-card',
			team_id: 1,
			player_id: 0,
		}, {
			type: 'red-card',
			team_id: 0,
			player_id: 1,
		}];
		var s = tutils.state_after(presses, tutils.DOUBLES_SETUP);
		var els = _plot(s);
		_check_els(els);

		// Now in English
		s = tutils.state_after(presses, tutils.DOUBLES_SETUP_EN);
		els = _plot(s);
		_check_els(els);
	});

	_it('realistic example', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
			timestamp: 0,
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
			timestamp: 1000,
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 0,
			timestamp: 2000,
		}, {
			type: 'love-all',
			timestamp: 120000,
		}, {
			type: 'score',
			side: 'left',
			timestamp: 130000,
		}, {
			type: 'score',
			side: 'right',
			timestamp: 140000,
		}, {
			type: 'score',
			side: 'right',
			timestamp: 150000,
		}, {
			type: 'score',
			side: 'left',
			timestamp: 160000,
		}, {
			type: 'injury',
			team_id: 0,
			player_id: 0,
			timestamp: 162000,
		}, {
			type: 'referee',
			timestamp: 165000,
		}, {
			type: 'injury',
			team_id: 1,
			player_id: 0,
			timestamp: 170000,
		}, {
			type: 'referee',
			timestamp: 180000,
		}, {
			type: 'injury',
			team_id: 0,
			player_id: 1,
			timestamp: 190000,
		}, {
			type: 'referee',
			timestamp: 192000,
		}, {
			type: 'injury-resume',
			timestamp: 200000,
		}, {
			type: 'score',
			side: 'left',
			timestamp: 205000,
		}, {
			type: 'yellow-card',
			team_id: 0,
			player_id: 0,
			timestamp: 208000,
		}, {
			type: 'yellow-card',
			team_id: 1,
			player_id: 1,
			timestamp: 209000,
		}, {
			type: 'referee',
			timestamp: 210000,
		}, {
			type: 'red-card',
			team_id: 0,
			player_id: 0,
			timestamp: 212000,
		}, {
			type: 'red-card',
			team_id: 0,
			player_id: 1,
			timestamp: 214000,
		}, {
			type: 'red-card',
			team_id: 1,
			player_id: 1,
			timestamp: 215000,
		}, {
			type: 'referee',
			timestamp: 216000,
		}, {
			type: 'score',
			side: 'left',
			timestamp: 220000,
		}, {
			type: 'score',
			side: 'left',
			timestamp: 225000,
		}, {
			type: 'score',
			side: 'left',
			timestamp: 235000,
		}, {
			type: 'score',
			side: 'left',
			timestamp: 245000,
		}, {
			type: 'score',
			side: 'right',
			timestamp: 260000,
		}, {
			type: 'score',
			side: 'right',
			timestamp: 300000,
		}, {
			type: 'score',
			side: 'right',
			timestamp: 400000,
		}, {
			type: 'score',
			side: 'left',
			timestamp: 500000,
		}, {
			type: 'score',
			side: 'right',
			timestamp: 600000,
		}, {
			type: 'score',
			side: 'left',
			timestamp: 700000,
		}, {
			type: 'score',
			side: 'left',
			timestamp: 800000,
		}, {
			type: 'red-card',
			team_id: 0,
			player_id: 0,
			timestamp: 801000,
		}, {
			type: 'referee',
			timestamp: 802000,
		}];

		var s = tutils.state_after(presses, tutils.DOUBLES_SETUP);
		var els = _plot(s);
		_check_els(els);
	});

	_it('press descriptions', function() {
		var presses = [{
			type: 'pick_side',
			team1_left: true,
			desc: 'Seitenwahl',
			sdesc: 'Andrew / Alice links,\nBob / Birgit rechts',
		}, {
			type: 'undo',
			desc: 'Rückgängig',
			sdesc: '',
		}, {
			type: 'redo',
			desc: 'Wiederholen',
			sdesc: '',
		}, {
			type: 'undo',
			desc: 'Rückgängig',
			sdesc: '',
		}, {
			type: 'pick_side',
			team1_left: false,
			desc: 'Seitenwahl',
			sdesc: 'Bob / Birgit links,\nAndrew / Alice rechts',
		}, {
			type: 'pick_server',
			team_id: 0,
			player_id: 0,
			desc: 'Aufschläger',
			sdesc: 'Andrew',
		}, {
			type: 'pick_receiver',
			team_id: 1,
			player_id: 1,
			desc: 'Rückschläger',
			sdesc: 'Birgit',
		}, {
			type: 'timer_restart',
			desc: 'Stoppuhr Reset',
			sdesc: '2:00',
		}, {
			type: 'love-all',
			desc: '0 beide',
			sdesc: '',
		}, {
			type: 'score',
			side: 'left',
			desc: 'Punkt links',
			sdesc: '1-0',
		}, {
			type: 'score',
			side: 'right',
			desc: 'Punkt rechts',
			sdesc: '1-1',
		}, {
			type: 'score',
			side: 'left',
			desc: 'Punkt links',
			sdesc: '2-1',
		}, {
			type: 'editmode_set-score',
			score: [3, 8],
			desc: 'Manuelle Korrektur: Spielstand',
			sdesc: '8-3',
		}, {
			type: 'score',
			side: 'right',
			desc: 'Punkt rechts',
			sdesc: '8-4',
		}, {
			type: 'score',
			side: 'left',
			desc: 'Punkt links',
			sdesc: '9-4',
		}, {
			type: 'score',
			side: 'left',
			desc: 'Punkt links',
			sdesc: '10-4',
		}, {
			type: 'score',
			side: 'left',
			desc: 'Punkt links',
			sdesc: '11-4',
		}, {
			type: 'postinterval-confirm',
			desc: 'Ende der Pause',
			sdesc: '"11-4. Bitte spielen."',
		}, {
			type: 'score',
			side: 'right',
			desc: 'Punkt rechts',
			sdesc: '11-5',
		}, {
			type: 'editmode_set-score',
			score: [1, 1],
			desc: 'Manuelle Korrektur: Spielstand',
			sdesc: '1-1',
		}, {
			type: 'overrule',
			desc: 'Overrule Linienrichter',
			sdesc: '',
		}, {
			type: 'correction',
			team_id: 0,
			desc: 'Vertauschung Aufschlagfeld',
			sdesc: 'Korrekt: Alice links,\nAndrew rechts',
		}, {
			type: 'suspension',
			desc: 'Unterbrechung',
			sdesc: '',
			timestamp: 1000,
		}, {
			type: 'resume',
			desc: 'Spielfortsetzung',
			sdesc: '0:09',
			timestamp: 10000,
		}, {
			type: 'injury',
			team_id: 0,
			player_id: 1,
			desc: 'Verletzung',
			sdesc: 'Alice verletzt',
			timestamp: 100000,
		}, {
			type: 'injury-resume',
			team_id: 0,
			player_id: 1,
			desc: 'Spiel wird fortgesetzt',
			sdesc: '2:10',
			timestamp: 230000,
		}, {
			type: 'shuttle',
			desc: 'Ball ausgegeben',
			sdesc: '1 Bälle',
		}, {
			type: 'shuttle',
			desc: 'Ball ausgegeben',
			sdesc: '2 Bälle',
		}, {
			type: 'editmode_change-ends',
			desc: 'Manuelle Korrektur: Seitenwechsel',
			sdesc: 'Andrew / Alice links,\nBob / Birgit rechts',
		}, {
			type: 'editmode_change-ends',
			desc: 'Manuelle Korrektur: Seitenwechsel',
			sdesc: 'Bob / Birgit links,\nAndrew / Alice rechts',
		}, {
			type: 'editmode_change-serve',
			desc: 'Manuelle Korrektur: Aufschlagsrecht',
			sdesc: 'Bob schlägt auf',
		}, {
			type: 'editmode_change-serve',
			desc: 'Manuelle Korrektur: Aufschlagsrecht',
			sdesc: 'Alice schlägt auf',
		}, {
			type: 'editmode_switch-sides',
			side: 'right',
			desc: 'Manuelle Korrektur: Position',
			sdesc: 'Andrew links,\nAlice rechts',
		}, {
			type: 'editmode_switch-sides',
			side: 'right',
			desc: 'Manuelle Korrektur: Position',
			sdesc: 'Alice links,\nAndrew rechts',
		}, {
			type: 'editmode_switch-sides',
			side: 'right',
			desc: 'Manuelle Korrektur: Position',
			sdesc: 'Andrew links,\nAlice rechts',
		}, {
			type: 'editmode_switch-sides',
			side: 'left',
			desc: 'Manuelle Korrektur: Position',
			sdesc: 'Birgit links,\nBob rechts',
		}, {
			type: 'editmode_change-serve',
			desc: 'Manuelle Korrektur: Aufschlagsrecht',
			sdesc: 'Birgit schlägt auf',
		}, {
			type: 'editmode_change-serve',
			desc: 'Manuelle Korrektur: Aufschlagsrecht',
			sdesc: 'Andrew schlägt auf',
		}, {
			type: 'editmode_change-ends',
			desc: 'Manuelle Korrektur: Seitenwechsel',
			sdesc: 'Andrew / Alice links,\nBob / Birgit rechts',
		}, {
			type: 'editmode_set-finished_games',
			scores: [[21, 15]],
			desc: 'Manuelle Korrektur: Spielstand',
			sdesc: '21-15 1-1',
		}, {
			type: 'editmode_change-ends',
			desc: 'Manuelle Korrektur: Seitenwechsel',
			sdesc: 'Bob / Birgit links,\nAndrew / Alice rechts',
		}, {
			type: 'editmode_set-finished_games',
			scores: [[21, 16]],
			desc: 'Manuelle Korrektur: Spielstand',
			sdesc: '16-21 1-1',
		}, {
			type: 'editmode_set-score',
			score: [13, 19],
			desc: 'Manuelle Korrektur: Spielstand',
			sdesc: '16-21 19-13',
		}, {
			type: 'yellow-card',
			team_id: 1,
			player_id: 0,
			desc: 'Gelbe Karte',
			sdesc: 'Bob verwarnt',
		}, {
			type: 'referee',
			desc: 'Referee',
			sdesc: '',
		}, {
			type: 'red-card',
			team_id: 0,
			player_id: 0,
			desc: 'Rote Karte',
			sdesc: 'Fehlerwarnung Andrew, 16-21 20-13',
		}, {
			type: 'note',
			val: 'foo bar',
			desc: 'Notiz',
			sdesc: 'foo bar',
		}, {
			type: 'score',
			side: 'left',
			desc: 'Punkt links',
			sdesc: '21-13',
		}, {
			type: 'postgame-confirm',
			desc: 'Satz-Bestätigung',
			sdesc: '',
		}, {
			type: 'retired',
			team_id: 0,
			player_id: 1,
			desc: 'Alice gibt auf',
			sdesc: 'Bob / Birgit gewinnt 16-21 21-13 0-0',
		}, {
			type: 'undo',
			desc: 'Rückgängig',
			sdesc: '',
		}, {
			type: 'disqualified',
			team_id: 1,
			player_id: 0,
			desc: 'Schwarze Karte Bob.',
			sdesc: 'Andrew / Alice gewinnt 21-16 13-21 0-0',
		}, {
			type: 'postmatch-confirm',
			desc: 'Spiel-Bestätigung',
			sdesc: '',
		}];

		var cur_presses = [];
		for (var i = 0;i < presses.length;i++) {
			var press = presses[i];
			cur_presses.push(press);
			var s = tutils.state_after(cur_presses, tutils.DOUBLES_SETUP);
			assert.strictEqual(bup.stats.press_description(s, press), press.desc);
			assert.strictEqual(bup.stats.press_state_desc(s, press), press.sdesc);
		}
	});
});

})();