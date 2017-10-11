'use strict';

var assert = require('assert');
var path = require('path');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;


function _order_matches(matches, order_str) {
	var match_names = order_str.split('-');
	bup.eventutils.set_metadata({matches: matches});
	return bup.order.init_order_matches(matches, match_names);
}

function _calc_order(matches, order_str) {
	var match_names = order_str.split('-');
	return match_names.map(function(match_name) {
		for (var i = 0;i < matches.length;i++) {
			if (matches[i].setup.match_name === match_name) {
				return i;
			}
		}
		throw new Error('Could not find match ' + match_name);
	});
}

function _calc_names(matches, order)  {
	return order.map(function(idx) {
		assert.ok(typeof idx === 'number');
		assert.ok(idx >= 0);
		assert.ok(idx < matches.length);
		return matches[idx].setup.match_name;
	}).join('-');
}

var sample_matches = [{setup: {
	match_name: 'HD1',
	match_id: 'HD1',
	is_doubles: true,
	teams: [{
		players: [{
			name: 'Alexander',
		}, {
			name: 'Andreas',
		}],
	}, {
		players: [{
			name: 'Lukas',
		}, {
			name: 'Leon',
		}],
	}],
}}, {setup: {
	match_name: 'HD2',
	match_id: 'HD2',
	is_doubles: true,
	teams: [{
		players: [{
			name: 'Christopher',
		}, {
			name: 'Christian',
		}],
	}, {
		players: [{
			name: 'Nick',
		}, {
			name: 'Norbert',
		}],
	}],
}}, {setup: {
	match_name: 'DD',
	match_id: 'DD',
	is_doubles: true,
	teams: [{
		players: [{
			name: 'Beate',
		}, {
			name: 'Britta',
		}],
	}, {
		players: [{
			name: 'Mareike',
		}, {
			name: 'Manuela',
		}],
	}],
}}, {setup: {
	match_name: 'HE1',
	match_id: 'HE1',
	is_doubles: false,
	teams: [{
		players: [{
			name: 'Alexander',
		}],
	}, {
		players: [{
			name: 'Lukas',
		}],
	}],
}}, {setup: {
	match_name: 'HE2',
	match_id: 'HE2',
	is_doubles: false,
	teams: [{
		players: [{
			name: 'Andreas',
		}],
	}, {
		players: [{
			name: 'Linus',
		}],
	}],
}}, {setup: {
	match_name: 'HE3',
	match_id: 'HE3',
	is_doubles: false,
	teams: [{
		players: [{
			name: 'Dominik',
		}],
	}, {
		players: [{
			name: 'Olaf',
		}],
	}],
}}, {setup: {
	match_name: 'DE',
	match_id: 'DE',
	is_doubles: false,
	teams: [{
		players: [{
			name: 'Beate',
		}],
	}, {
		players: [{
			name: 'Manuela',
		}],
	}],
}}, {setup: {
	match_name: 'MX',
	match_id: 'MX',
	is_doubles: true,
	teams: [{
		players: [{
			name: 'Christopher',
		}, {
			name: 'Britta',
		}],
	}, {
		players: [{
			name: 'Linus',
		}, {
			name: 'Mareike',
		}],
	}],
}}];

_describe('order', function() {
	_it('realistic sample for conflict determination', function() {
		var omatches = _order_matches(sample_matches, 'HD1-HD2-DD-HE1-HE2-HE3-DE-MX');
		var conflicts = bup.order.calc_conflicting_players(omatches, omatches.length);
		assert.deepStrictEqual(conflicts, {
			'Alexander': 3,
			'Linus': 3,
			'Lukas': 3,
		});

		omatches = _order_matches(sample_matches, 'HD1-HE1-HD2-DD-HE2-HE3-DE-MX');
		conflicts = bup.order.calc_conflicting_players(omatches, omatches.length);
		assert.deepStrictEqual(conflicts, {
			'Alexander': 1,
			'Lukas': 1,
			'Beate': 3,
			'Linus': 3,
			'Manuela': 3,
		});

		omatches = _order_matches(sample_matches, 'HD1-DE-HE1-HD2-DD-HE2-HE3-MX');
		conflicts = bup.order.calc_conflicting_players(omatches, omatches.length);
		assert.deepStrictEqual(conflicts, {
			'Alexander': 2,
			'Beate': 3,
			'Britta': 3,
			'Lukas': 2,
			'Linus': 2,
			'Manuela': 3,
			'Mareike': 3,
		});
	});

	_it('realistic sample optimization', function() {
		this.timeout(30000);

		var conflicts = bup.order.calc_conflict_map(sample_matches);
		assert.deepStrictEqual(conflicts, [
			[undefined, 0, 0, 1, 1, 0, 0, 0], // HD1
			[0, undefined, 0, 0, 0, 0, 0, 1], // HD2
			[0, 0, undefined, 0, 0, 0, 1, 1], // DD
			[1, 0, 0, undefined, 0, 0, 0, 0], // HE1
			[1, 0, 0, 0, undefined, 0, 0, 1], // HE2
			[0, 0, 0, 0, 0, undefined, 0, 0], // HE3
			[0, 0, 1, 0, 0, 0, undefined, 0], // DE
			[0, 1, 1, 0, 1, 0, 0, undefined], // MX
		]);

		// Test cost calculation
		var preferred = _calc_order(sample_matches, 'HD1-HD2-DD-HE1-HE2-HE3-DE-MX');
		var cost = bup.order.calc_cost(preferred, conflicts, preferred, 1000);
		assert.strictEqual(cost, 2000); // HD1<-3->HE1 + HE2<-3->MX

		preferred = _calc_order(sample_matches, 'HD1-HE1-HD2-DD-HE2-HE3-DE-MX');
		cost = bup.order.calc_cost(preferred, conflicts, preferred, 1000);
		assert.strictEqual(cost, 102000); // HD1<-1->HE1 + HE2<-3->MX + DD<-3->MX

		preferred = _calc_order(sample_matches, 'HD1-HD2-HE1-DD-HE2-HE3-DE-MX');
		cost = bup.order.calc_cost(preferred, conflicts, preferred, 1000);
		assert.strictEqual(cost, 12000); // HD1<-2->E1 + DD<-3->DE + HE2<-3->MX

		preferred = _calc_order(sample_matches, 'HD1-HE2-HD2-DD-HE1-HE3-DE-MX');
		cost = bup.order.calc_cost(preferred, conflicts, preferred, 1000);
		assert.strictEqual(cost, 101000); // HD1<-1->HE2 + DD<-3->DE
		cost = bup.order.calc_cost(preferred, conflicts, preferred, 0);
		assert.strictEqual(cost, 100000); // HD1<-1->HE2 + DD<-3->DE
		cost = bup.order.calc_cost(preferred, conflicts, preferred, 500);
		assert.strictEqual(cost, 100500); // HD1<-1->HE2 + DD<-3->DE

		preferred = _calc_order(sample_matches, 'HD1-HE2-HD2-DD-HE1-HE3-DE-MX');
		var order = _calc_order(sample_matches, 'HE2-HD1-HD2-DD-HE1-HE3-DE-MX');
		cost = bup.order.calc_cost(order, conflicts, preferred, 1000);
		assert.strictEqual(cost, 102001); // HD1<-1->HE2 + HD1<-3->HE1 + DD<-3->DE

		preferred = _calc_order(sample_matches, 'HD1-HD2-DD-HE1-HE2-HE3-DE-MX');
		order = _calc_order(sample_matches, 'MX-DE-HE3-HE2-HE1-DD-HD2-HD1');
		cost = bup.order.calc_cost(order, conflicts, preferred, 1000);
		assert.strictEqual(cost, 2000 + 28); // HD1<-3->HE1 + HE2<-3->MX + 1xDE + 2xHE3 + 3xHE2 + 4xHE1 + 5xDD + 6xHD2 + 7xHD1

		// Test optimization
		preferred = _calc_order(sample_matches, 'HD1-HD2-DD-HE1-HE2-HE3-DE-MX');
		var optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.calc_cost, sample_matches, preferred, {}, 0));
		assert.strictEqual(optimized, 'HD1-HD2-DD-HE1-HE2-HE3-DE-MX');

		preferred = _calc_order(sample_matches, 'MX-DE-HE3-HE2-HE1-DD-HD2-HD1');
		optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.calc_cost, sample_matches, preferred, {}, 0));
		assert.strictEqual(optimized, 'MX-DE-HE3-HE2-HE1-DD-HD2-HD1');

		preferred = _calc_order(sample_matches, 'HD1-HE1-HD2-DD-HE2-HE3-DE-MX');
		optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.calc_cost, sample_matches, preferred, {}, 0));
		assert.strictEqual(optimized, 'HD1-HD2-DD-HE1-HE2-HE3-DE-MX');

		preferred = _calc_order(sample_matches, 'DE-MX-DD-HD1-HD2-HE1-HE2-HE3');
		optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.calc_cost,sample_matches, preferred, {}, 0));
		assert.strictEqual(optimized, 'MX-DE-HD1-HD2-DD-HE1-HE2-HE3');

		preferred = _calc_order(sample_matches, 'DD-DE-MX-HD1-HD2-HE1-HE2-HE3');
		optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.calc_cost,sample_matches, preferred, {}, 0));
		assert.strictEqual(optimized, 'MX-DE-HD1-HD2-DD-HE1-HE2-HE3');
	});

	_it('Gifhorn example (Sunday, easy)', function() {
		var matches = [{setup: {
			match_name: 'HD1',
			match_id: 'HD1',
			is_doubles: true,
			teams: [{
				players: [{
					name: 'Maurice Niesner',
				}, {
					name: 'Daniel Porath',
				}],
			}, {
				players: [{
					name: 'Adi Pratama',
				}, {
					name: 'Filip Spoljarec',
				}],
			}],
		}}, {setup: {
			match_name: 'DD',
			match_id: 'DD',
			is_doubles: true,
			teams: [{
				players: [{
					name: 'Fabienne Deprez',
				}, {
					name: 'Sonja Schlösser',
				}],
			}, {
				players: [{
					name: 'Laura Ufermann',
				}, {
					name: 'Jenny Wan',
				}],
			}],
		}}, {setup: {
			match_name: 'HD2',
			match_id: 'HD2',
			is_doubles: true,
			teams: [{
				players: [{
					name: 'Patrick Kämnitz',
				}, {
					name: 'Timo Teulings',
				}],
			}, {
				players: [{
					name: 'Niklas Niemczyk',
				}, {
					name: 'Niclas Lohau',
				}],
			}],
		}}, {setup: {
			match_name: 'HE1',
			match_id: 'HE1',
			is_doubles: false,
			teams: [{
				players: [{
					name: 'Patrick Kämnitz',
				}],
			}, {
				players: [{
					name: 'Adi Pratama',
				}],
			}],
		}}, {setup: {
			match_name: 'DE',
			match_id: 'DE',
			is_doubles: false,
			teams: [{
				players: [{
					name: 'Fabienne Deprez',
				}],
			}, {
				players: [{
					name: 'Jenny Wan',
				}],
			}],
		}}, {setup: {
			match_name: 'GD',
			match_id: 'GD',
			is_doubles: true,
			teams: [{
				players: [{
					name: 'Daniel Porath',
				}, {
					name: 'Sonja Schlösser',
				}],
			}, {
				players: [{
					name: 'Niclas Lohau',
				}, {
					name: 'Laura Ufermann',
				}],
			}],
		}}, {setup: {
			match_name: 'HE2',
			match_id: 'HE2',
			is_doubles: false,
			teams: [{
				players: [{
					name: 'Yannik Joop',
				}],
			}, {
				players: [{
					name: 'Filip Spoljarec',
				}],
			}],
		}}, {setup: {
			match_name: 'HE3',
			match_id: 'HE3',
			is_doubles: false,
			teams: [{
				players: [{
					name: 'Mirco Ewert',
				}],
			}, {
				players: [{
					name: 'Niklas Niemczyk',
				}],
			}],
		}}];

		var preferred = _calc_order(matches, 'HD1-DD-HD2-HE1-DE-GD-HE2-HE3');
		var optimized = _calc_names(matches, bup.order.optimize(bup.order.calc_cost, matches, preferred, {}, 0));
		assert.strictEqual(optimized, 'DD-HD1-HD2-DE-HE2-HE1-GD-HE3');
	});

	_it('Gifhorn example (Saturday, hard, includes locking)', function() {
		var matches = [{setup: {
			match_name: 'HD1',
			match_id: 'HD1',
			is_doubles: true,
			teams: [{
				players: [{
					name: 'Maurice Niesner',
				}, {
					name: 'Daniel Porath',
				}],
			}, {
				players: [{
					name: 'Mark Lamsfuß',
				}, {
					name: 'Jens Lamsfuß',
				}],
			}],
		}}, {setup: {
			match_name: 'DD',
			match_id: 'DD',
			is_doubles: true,
			teams: [{
				players: [{
					name: 'Fabienne Deprez',
				}, {
					name: 'Alicia Molitor',
				}],
			}, {
				players: [{
					name: 'Brid Stepper',
				}, {
					name: 'Ramona Hacks',
				}],
			}],
		}}, {setup: {
			match_name: 'HD2',
			match_id: 'HD2',
			is_doubles: true,
			teams: [{
				players: [{
					name: 'Patrick Kämnitz',
				}, {
					name: 'Timo Teulings',
				}],
			}, {
				players: [{
					name: 'Hubert Paczek',
				}, {
					name: 'Jones Ralfy Jansen',
				}],
			}],
		}}, {setup: {
			match_name: 'HE1',
			match_id: 'HE1',
			is_doubles: false,
			teams: [{
				players: [{
					name: 'Patrick Kämnitz',
				}],
			}, {
				players: [{
					name: 'Hubert Paczek',
				}],
			}],
		}}, {setup: {
			match_name: 'DE',
			match_id: 'DE',
			is_doubles: false,
			teams: [{
				players: [{
					name: 'Fabienne Deprez',
				}],
			}, {
				players: [{
					name: 'Brid Stepper',
				}],
			}],
		}}, {setup: {
			match_name: 'GD',
			match_id: 'GD',
			is_doubles: true,
			teams: [{
				players: [{
					name: 'Daniel Porath',
				}, {
					name: 'Alicia Molitor',
				}],
			}, {
				players: [{
					name: 'Mateusz Szalankiewicz',
				}, {
					name: 'Ramona Hacks',
				}],
			}],
		}}, {setup: {
			match_name: 'HE2',
			match_id: 'HE2',
			is_doubles: false,
			teams: [{
				players: [{
					name: 'Timo Teulings',
				}],
			}, {
				players: [{
					name: 'Mark Lamsfuß',
				}],
			}],
		}}, {setup: {
			match_name: 'HE3',
			match_id: 'HE3',
			is_doubles: false,
			teams: [{
				players: [{
					name: 'Yannik Joop',
				}],
			}, {
				players: [{
					name: 'Jones Ralfy Jansen',
				}],
			}],
		}}];

		var preferred = _calc_order(matches, 'HD1-DD-HD2-HE1-DE-GD-HE2-HE3');
		var optimized = _calc_names(matches, bup.order.optimize(bup.order.calc_cost, matches, preferred, {}, 0));
		assert.strictEqual(optimized, 'HD2-DD-HD1-HE1-DE-GD-HE2-HE3');

		// Restrict to HD1 and DD at start. There is no basis for this in the actual rules.
		var imagined_costfunc = function(order, conflict_map, preferred, d3_cost) {
			var res = bup.order.calc_cost(order, conflict_map, preferred, d3_cost);
			if (order[0] > 1) {
				res += 100000;
			}
			if (order[1] > 1) {
				res += 100000;
			}
			return res;
		};
		optimized = _calc_names(matches, bup.order.optimize(imagined_costfunc, matches, preferred, {}, 0));
		assert.strictEqual(optimized, 'DD-HD1-HD2-DE-GD-HE1-HE2-HE3');

		// Restrict to HD1 at 1 and DD at 2. There is no basis for this in the actual rules.
		imagined_costfunc = function(order, conflict_map, preferred, d3_cost) {
			var res = bup.order.calc_cost(order, conflict_map, preferred, d3_cost);
			if (order[0] !== 0) {
				res += 100000;
			}
			if (order[1] !== 1) {
				res += 100000;
			}
			return res;
		};
		optimized = _calc_names(matches, bup.order.optimize(imagined_costfunc, matches, preferred, {}, 0));
		assert.strictEqual(optimized, 'HD1-DD-HE1-HE2-HE3-DE-GD-HD2');

		// Restrict to HD1 at 1 and DD at 2, via locking
		optimized = _calc_names(matches, bup.order.optimize(
			imagined_costfunc, matches, preferred, {'HD1': true, 'DD': true}, 0));
		assert.strictEqual(optimized, 'HD1-DD-HE1-HE2-HE3-DE-GD-HD2');

		// Make sure locking was not accidental
		preferred = _calc_order(matches, 'HE1-HE2-HD1-DD-HE3-GD-DE-HD2');
		optimized = _calc_names(matches, bup.order.optimize(
			imagined_costfunc, matches, preferred, {'HD1': true, 'DD': true}, 0));
		assert.strictEqual(optimized, 'HD1-DD-HE1-HE2-HE3-GD-DE-HD2');

		preferred = _calc_order(matches, 'HE3-HE2-GD-DE-HE1-HD2-DD-HD1');
		optimized = _calc_names(matches, bup.order.optimize(
			imagined_costfunc, matches, preferred, {'HD1': true, 'DD': true}, 0));
		assert.strictEqual(optimized, 'HD1-DD-HE3-HE2-HE1-GD-DE-HD2');

		preferred = _calc_order(matches, 'HE1-HE2-HD1-DD-HE3-GD-DE-HD2');
		var alt_matches = matches.slice();
		var m0 = alt_matches[0];
		alt_matches[0] = alt_matches[1];
		alt_matches[1] = m0;
		optimized = _calc_names(alt_matches, bup.order.optimize(
			imagined_costfunc, alt_matches, preferred, {'HD1': true, 'DD': true}, 0));
		assert.strictEqual(optimized, 'DD-HD1-HE1-HE3-HE2-GD-DE-HD2');
	});

	_it('Bundesliga final match 2016/2017', function(done) {
		var fn = path.join(__dirname, 'buli_finals2016.json');
		tutils.load_event(fn, function(err, event) {
			if (err) {
				return done(err);
			}

			var matches = event.matches;
			var conflicts = bup.order.calc_conflict_map(matches);
			var preferred = _calc_order(matches, 'HD1-DD-HD2-HE1-DE-GD-HE2');
			var order = _calc_order(matches, 'HD1-DD-HD2-HE1-DE-GD-HE2');
			var cost = bup.order.calc_cost(order, conflicts, preferred, 100);
			assert.strictEqual(cost, 200); // DD<-3->DE + HD2<-3->GD

			order = _calc_order(matches, 'HD1-DD-HD2-HE1-DE-HE2-GD');
			cost = bup.order.calc_cost(order, conflicts, preferred, 100);
			assert.strictEqual(cost, 101); // DD<-3->DE + GD_HE2

			order = _calc_order(matches, 'HD1-DD-HE2-HE1-DE-GD-HD2');
			cost = bup.order.calc_cost(order, conflicts, preferred, 100);
			assert.strictEqual(cost, 100107); // GD<-1->HD2 + DD<-3->DE + HE1_HE2 + DE_HE2 + GD_HE2 + HD2_HE2 + HD2_HE1 + HD2_DE + HD2_GD

			var optimized = _calc_names(matches, bup.order.optimize(bup.order.calc_cost, matches, preferred, {}, 100));
			assert.strictEqual(optimized, 'DD-HD1-HD2-HE1-DE-HE2-GD');

			// Test yellow markings
			var omatches = _order_matches(matches, 'HD1-DD-HD2-HE1-DE-HE2-GD');
			var conflicting_players = bup.order.calc_conflicting_players(omatches, matches.length);
			assert.deepStrictEqual(conflicting_players, {
				'Chloe Magee': 3,
				'Olga Konon': 3,
			});

			done();
		});		
	});

	_it('Freystadt - Mülheim in 2016/2017 (testcase by Markus Schwendtner)', function(done) {
		var fn = path.join(__dirname, 'order_2016_freystadt-muelheim.json');
		tutils.load_event(fn, function(err, event) {
			if (err) {
				return done(err);
			}

			var matches = event.matches;
			var conflicts = bup.order.calc_conflict_map(matches);
			var preferred = _calc_order(matches, 'HD1-DD-HD2-HE1-DE-GD-HE2');
			var order = _calc_order(matches, 'HD1-DD-HD2-HE1-DE-GD-HE2');
			var cost = bup.order.calc_cost(order, conflicts, preferred, 100);
			assert.strictEqual(cost, 100100); // HD2<-1->HE1 + DD<-3->DE

			var optimized = _calc_names(
				matches, bup.order.optimize(bup.order.calc_cost, matches, preferred, {}, 0));
			assert.strictEqual(optimized, 'HD2-DD-HD1-HE1-DE-GD-HE2');

			optimized = _calc_names(
				matches, bup.order.optimize(bup.order.calc_cost, matches, preferred, {}, 100));
			assert.strictEqual(optimized, 'DD-HD1-HD2-HE2-DE-GD-HE1');

			// Test initialization of order module
			var pref = bup.order.preferred_by_league(event.league_key);
			bup.eventutils.set_metadata(event);
			bup.order.init_order_matches(event.matches, pref);

			done(err);
		});		
	});

	_it('Refrath 2 - Wittorf in 2017/2018', function(done) {
		var fn = path.join(__dirname, 'order_2017_refrath2-wittorf.json');
		tutils.load_event(fn, function(err, event) {
			if (err) {
				return done(err);
			}

			var matches = event.matches;
			var conflicts = bup.order.calc_conflict_map(matches);
			var preferred = _calc_order(matches, 'HD1-DD-HD2-HE1-DE-GD-HE2');

			var wrong_order = _calc_order(matches, 'DD-HD2-HD1-DE-HE2-GD-HE1');
			var cost = bup.order.calc_cost(wrong_order, conflicts, wrong_order, 100);
			assert.strictEqual(cost, 300); // DD<-3->DE + HD2<-3->HE2 + HD1<->GD

			cost = bup.order.calc_cost(wrong_order, conflicts, preferred, 100);
			assert.strictEqual(cost, 306); // DD<-3->DE + HD2<-3->HE2 + HD1<->GD + pairwise HD1-DD + HD1-HD2 + GD-HE2 + HE1-DE + HE1-HE2 + HE1-GD

			var correct_string = 'DD-HD2-HD1-DE-HE2-HE1-GD';
			var correct_order = _calc_order(matches, correct_string);
			cost = bup.order.calc_cost(correct_order, conflicts, preferred, 100);
			assert.strictEqual(cost, 305); // DD<-3->DE + HD2<-3->HE2 + HD1<->GD + pairwise HD1-DD + HD1-HD2 + HE1-DE + HE1-HE2 + GD-HE2

			var optimized = _calc_names(
				matches, bup.order.optimize(bup.order.calc_cost, matches, preferred, {}, 100));
			assert.strictEqual(optimized, correct_string);

			done(err);
		});		
	});

	_it('preferred_by_league', function() {
		assert.deepStrictEqual(bup.order.preferred_by_league('OBL-2017'), [
			'1.HD',
			'2.HD',
			'DD',
			'1.HE',
			'2.HE',
			'DE',
			'3.HE',
			'GD',
		]);
	});
});
