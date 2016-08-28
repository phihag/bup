#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */

var bup = require('../js/bup');

function rand(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function main() {
	var args = process.argv.slice(2);
	if (args.length !== 2) {
		console.error('Usage: genmatch \'{"is_doubles":true,"counting":"5x11_15"}\' START_TIMESTAMP');
		return 1;
	}
	var setup = JSON.parse(args[0]);
	var ts = parseInt(args[1], 10);

	var s = {};
	bup.calc.init_state(s, setup);
	bup.calc.state(s);
	s.presses.push({
		timestamp: ts,
		type: 'note',
		val: 'Dies ist ein fiktives (zufällig generiertes) Spiel',
	});
	while (!s.match.finished) {
		if (s.game.team1_left === null) {
			s.presses.push({
				timestamp: ts,
				type: 'pick_side',
				team1_left: !!rand(0, 1),
			});
		} else if(s.game.game) {
			ts += rand(1000, 3000);
			s.presses.push({
				timestamp: ts,
				type: 'postgame-confirm',
			});
			ts += rand(s.timer.duration, s.timer.duration + 10000);
		} else if ((s.game.team1_serving === null) || (s.game.start_server_player_id === null)) {
			ts += 2000;
			var server_team = ((s.game.team1_serving === null) ? rand(0, 1) : (s.game.team1_serving ? 0 : 1));
			s.presses.push({
				timestamp: ts,
				type: 'pick_server',
				team_id: server_team,
				player_id: setup.is_doubles ? rand(0, 1) : 0,
			});
			if (setup.is_doubles) {
				ts += 2000;
				s.presses.push({
					timestamp: ts,
					type: 'pick_receiver',
					team_id: 1 - server_team,
					player_id: setup.is_doubles ? rand(0, 1) : 0,
				});
			}
			if (s.match.finished_games.length === 0) {
				// Start of match
				ts += rand(1000, 2000);
				s.presses.push({
					timestamp: ts,
					type: 'shuttle',
				});
				ts += rand(400, 1000);
				s.presses.push({
					timestamp: ts,
					type: 'shuttle',
				});

				ts += 120000;
				s.presses.push({
					timestamp: ts,
					type: 'shuttle',
				});
			} else {
				ts += rand(1000, 2000);
			}
		} else if (! s.game.started) {
			ts += rand(8000, 15000);
			s.presses.push({
				timestamp: ts,
				type: 'love-all',
			});
			ts += rand(2000, 5000);
		} else {
			if (rand(0, 100) < 10) {
				ts += rand(1000, 2000);
				s.presses.push({
					timestamp: ts,
					type: 'shuttle',
				});
			}
			ts += rand(5000, 60000);
			s.presses.push({
				timestamp: ts,
				type: 'score',
				side: rand(0, 1) ? 'left' : 'right',
			});
		}
		bup.calc.state(s);
	}

	ts += rand(8000, 13000);
	s.presses.push({
		timestamp: ts,
		type: 'postmatch-confirm',
	});

	console.log('"network_score": ' + JSON.stringify(bup.calc.netscore(s)) + ',');
	console.log('"presses_json": ' + JSON.stringify(JSON.stringify(s.presses)));
	return 0;
}

process.exit(main());