var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

(function() {
'use strict';

function _order_matches(matches, order_str) {
	var match_names = order_str.split('-');
	return bup.order.order_by_names(matches, match_names);
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
		assert.deepStrictEqual(conflicts, {});

		omatches = _order_matches(sample_matches, 'HD1-HE1-HD2-DD-HE2-HE3-DE-MX');
		conflicts = bup.order.calc_conflicting_players(omatches, omatches.length);
		assert.deepStrictEqual(conflicts, {
			'Alexander': 1,
			'Lukas': 1,
		});

		omatches = _order_matches(sample_matches, 'HD1-DE-HE1-HD2-DD-HE2-HE3-MX');
		conflicts = bup.order.calc_conflicting_players(omatches, omatches.length);
		assert.deepStrictEqual(conflicts, {
			'Alexander': 2,
			'Lukas': 2,
			'Linus': 2,
		});
	});

	_it('realistic sample optimization', function() {
		var conflicts = bup.order.calc_conflict_map(sample_matches);
		assert.deepStrictEqual(conflicts, [
			[undefined, 0, 0, 2, 1, 0, 0, 0], // HD1
			[0, undefined, 0, 0, 0, 0, 0, 1], // HD2
			[0, 0, undefined, 0, 0, 0, 2, 2], // DD
			[2, 0, 0, undefined, 0, 0, 0, 0], // HE1
			[1, 0, 0, 0, undefined, 0, 0, 1], // HE2
			[0, 0, 0, 0, 0, undefined, 0, 0], // HE3
			[0, 0, 2, 0, 0, 0, undefined, 0], // DE
			[0, 1, 2, 0, 1, 0, 0, undefined], // MX
		]);

		// Test cost calculation
		var preferred = _calc_order(sample_matches, 'HD1-HD2-DD-HE1-HE2-HE3-DE-MX');
		var cost = bup.order.cost_rest2(preferred, conflicts, preferred);
		assert.strictEqual(cost, 0);

		preferred = _calc_order(sample_matches, 'HD1-HE1-HD2-DD-HE2-HE3-DE-MX');
		cost = bup.order.cost_rest2(preferred, conflicts, preferred);
		assert.strictEqual(cost, 20000); // 2 between HD1 and HE1, distance 1

		preferred = _calc_order(sample_matches, 'HD1-HD2-HE1-DD-HE2-HE3-DE-MX');
		cost = bup.order.cost_rest2(preferred, conflicts, preferred);
		assert.strictEqual(cost, 2000); // 2 between HD1 and HE1, distance 2

		preferred = _calc_order(sample_matches, 'HD1-HE2-HD2-DD-HE1-HE3-DE-MX');
		cost = bup.order.cost_rest2(preferred, conflicts, preferred);
		assert.strictEqual(cost, 10000); // 1 between HD1 and HE2, distance 1

		preferred = _calc_order(sample_matches, 'HD1-HE2-HD2-DD-HE1-HE3-DE-MX');
		var order = _calc_order(sample_matches, 'HE2-HD1-HD2-DD-HE1-HE3-DE-MX');
		cost = bup.order.cost_rest2(order, conflicts, preferred);
		assert.strictEqual(cost, 10002);

		preferred = _calc_order(sample_matches, 'HD1-HD2-DD-HE1-HE2-HE3-DE-MX');
		order = _calc_order(sample_matches, 'MX-DE-HE3-HE2-HE1-DD-HD2-HD1');
		cost = bup.order.cost_rest2(order, conflicts, preferred);
		assert.strictEqual(cost, 7 + 5 + 3 + 1 + 1 + 3 + 5 + 7);

		// Test optimization
		preferred = _calc_order(sample_matches, 'HD1-HD2-DD-HE1-HE2-HE3-DE-MX');
		var optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.cost_rest2,sample_matches, preferred, {}));
		assert.strictEqual(optimized, 'HD1-HD2-DD-HE1-HE2-HE3-DE-MX');

		preferred = _calc_order(sample_matches, 'MX-DE-HE3-HE2-HE1-DD-HD2-HD1');
		optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.cost_rest2,sample_matches, preferred, {}));
		assert.strictEqual(optimized, 'MX-DE-HE3-HE2-HE1-DD-HD2-HD1');

		preferred = _calc_order(sample_matches, 'HD1-HE1-HD2-DD-HE2-HE3-DE-MX');
		optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.cost_rest2,sample_matches, preferred, {}));
		assert.strictEqual(optimized, 'HD1-HD2-DD-HE1-HE2-HE3-DE-MX');

		preferred = _calc_order(sample_matches, 'DE-MX-DD-HD1-HD2-HE1-HE2-HE3');
		optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.cost_rest2,sample_matches, preferred, {}));
		assert.strictEqual(optimized, 'MX-DE-HD1-HD2-DD-HE1-HE2-HE3');

		preferred = _calc_order(sample_matches, 'DD-DE-MX-HD1-HD2-HE1-HE2-HE3');
		optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.cost_rest2,sample_matches, preferred, {}));
		assert.strictEqual(optimized, 'MX-DE-HD1-HD2-DD-HE1-HE2-HE3');
	});

	_it('Gifhorn example (Sunday, easy)', function() {
		var matches = [{setup: {
			match_name: 'HD1',
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
		var optimized = _calc_names(matches, bup.order.optimize(bup.order.cost_rest2, matches, preferred, {}));
		assert.strictEqual(optimized, 'HD1-DD-HD2-HE2-DE-GD-HE1-HE3');
	});

	_it('Gifhorn example (Saturday, hard, includes locking)', function() {
		var matches = [{setup: {
			match_name: 'HD1',
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
			is_doubles: false,
			teams: [{
				players: [{
					name: 'Patrick Kämnitz',
				}],
			}, {
				players: [{
					name: 'Hubert PaczekHubert Paczek',
				}],
			}],
		}}, {setup: {
			match_name: 'DE',
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
		var optimized = _calc_names(matches, bup.order.optimize(bup.order.cost_rest2, matches, preferred, {}));
		assert.strictEqual(optimized, 'HD2-DD-HD1-HE1-DE-GD-HE2-HE3');

		// Restrict to HD1 and DD at start. There is no basis for this in the actual rules.
		var imagined_costfunc = function(order, conflict_map, preferred) {
			var res = bup.order.cost_rest2(order, conflict_map, preferred);
			if (order[0] > 1) {
				res += 100000;
			}
			if (order[1] > 1) {
				res += 100000;
			}
			return res;
		};
		optimized = _calc_names(matches, bup.order.optimize(imagined_costfunc, matches, preferred, {}));
		assert.strictEqual(optimized, 'DD-HD1-HD2-DE-GD-HE1-HE2-HE3');

		// Restrict to HD1 at 1 and DD at 2. There is no basis for this in the actual rules.
		imagined_costfunc = function(order, conflict_map, preferred) {
			var res = bup.order.cost_rest2(order, conflict_map, preferred);
			if (order[0] !== 0) {
				res += 100000;
			}
			if (order[1] !== 1) {
				res += 100000;
			}
			return res;
		};
		optimized = _calc_names(matches, bup.order.optimize(imagined_costfunc, matches, preferred, {}));
		assert.strictEqual(optimized, 'HD1-DD-HE1-HE2-HE3-GD-DE-HD2');

		// Restrict to HD1 at 1 and DD at 2, via locking
		optimized = _calc_names(matches, bup.order.optimize(
			imagined_costfunc, matches, preferred, {'HD1': true, 'DD': true}));
		assert.strictEqual(optimized, 'HD1-DD-HE1-HE2-HE3-GD-DE-HD2');

		// Make sure locking was not accidental
		preferred = _calc_order(matches, 'HE1-HE2-HD1-DD-HE3-GD-DE-HD2');
		optimized = _calc_names(matches, bup.order.optimize(
			imagined_costfunc, matches, preferred, {'HD1': true, 'DD': true}));
		assert.strictEqual(optimized, 'HD1-DD-HE1-HE2-HE3-GD-DE-HD2');

	});

});

})();	
