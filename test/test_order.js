var assert = require('assert');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

(function() {
'use strict';

function _calc_order(matches, order_str) {
	var match_names = order_str.split('-');
	return bup.order.calc_order(matches, match_names);
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
	_it('realistic sample for conflicts, cost calculation and optimization', function() {
		var conflicts = bup.order.calc_conflicts(sample_matches);
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
		var optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.cost_rest2,sample_matches, preferred));
		assert.strictEqual(optimized, 'HD1-HD2-DD-HE1-HE2-HE3-DE-MX');

		preferred = _calc_order(sample_matches, 'MX-DE-HE3-HE2-HE1-DD-HD2-HD1');
		optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.cost_rest2,sample_matches, preferred));
		assert.strictEqual(optimized, 'MX-DE-HE3-HE2-HE1-DD-HD2-HD1');

		preferred = _calc_order(sample_matches, 'HD1-HE1-HD2-DD-HE2-HE3-DE-MX');
		optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.cost_rest2,sample_matches, preferred));
		assert.strictEqual(optimized, 'HD1-HD2-DD-HE1-HE2-HE3-DE-MX');

		preferred = _calc_order(sample_matches, 'DE-MX-DD-HD1-HD2-HE1-HE2-HE3');
		optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.cost_rest2,sample_matches, preferred));
		assert.strictEqual(optimized, 'MX-DE-HD1-HD2-DD-HE1-HE2-HE3');

		preferred = _calc_order(sample_matches, 'DD-DE-MX-HD1-HD2-HE1-HE2-HE3');
		optimized = _calc_names(sample_matches, bup.order.optimize(bup.order.cost_rest2,sample_matches, preferred));
		assert.strictEqual(optimized, 'MX-DE-HD1-HD2-DD-HE1-HE2-HE3');
	});

	_it('calc_conflicting_players', function() {
		var conflict_counts = bup.order.calc_conflicting_players(sample_matches);
		assert.deepEqual(conflict_counts, {
			'Alexander': 1,
			'Andreas': 1,
			'Lukas': 1,
			'Leon': 0,
			'Linus': 1,
			'Christopher': 1,
			'Christian': 0,
			'Nick': 0,
			'Norbert': 0,
			'Beate': 1,
			'Britta': 1,
			'Mareike': 1,
			'Manuela': 1,
			'Dominik': 0,
			'Olaf': 0,
		});
	});
});

})();	