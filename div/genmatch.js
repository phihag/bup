#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */

var fs = require('fs');
var bup = require('../js/bup');

function rand(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function main() {
	var args = process.argv.slice(2);
	if (args.length !== 3) {
		console.error('Usage: genmatch export-file.json 1.HD,2.HD,DD,3.HE,2.HE,1.HE,DE,GD START_TIMESTAMP');
		return 1;
	}

	var json_fn = args[0];
	var match_order = args[1].split(',');
	var ts = parseInt(args[2], 10);

	fs.readFile(json_fn, function(err, data_json) {
		if (err) throw err;

		var data = JSON.parse(data_json);
		var courts = data.event.courts;
		var match_by_eid = {};
		for (let m of data.event.matches) {
			match_by_eid[m.setup.eventsheet_id || m.setup.match_name] = m;
		}

		for (let c of courts) {
			c._avail = ts;
			delete c.match_id;
		}

		for (let eid of match_order) {
			let m = match_by_eid[eid];
			if (!m) {
				let all_match_ids = Object.keys(match_by_eid).join(',');
				throw new Error('Cannot find match ' + eid + ', available: ' + all_match_ids);
			}

			let min_court;
			for (let c of courts) {
				if (!c.match_id) {
					min_court = c;
					break;
				}

				if (min_court) {
					if (min_court._avail > c._avail) {
						min_court = c;
					}
				} else {
					min_court = c;
				}
			}

			play_on_court(m, min_court, min_court + rand(0, 10000));
		}

		for (let c of courts) {
			if (c._avail) {
				delete c._avail;
			}
		}

		fs.writeFile(json_fn, JSON.stringify(data, null, 2), function(err) {
			if (err) throw err;
		});
	});
}

function play_on_court(match, court, ts) {
	console.log(match.setup.match_id + ' starts at ' + (new Date(ts)).toString());
	court.match_id = match.setup.match_id;
	var s = gen_match(match.setup, ts);
	var presses = s.presses;
	s.presses[0].court_id = court.court_id;
	match.network_score = bup.calc.netscore(s);
	match.presses_json = JSON.stringify(presses);
	court._avail = presses[presses.length - 1].timestamp + rand(10000, 60000);
}

function gen_match(setup, ts) {
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

	return s;
}

main();