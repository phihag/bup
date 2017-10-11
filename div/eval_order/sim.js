'use strict';

const assert = require('assert');
const fs = require('fs');
const https = require('https');
const path = require('path');

const async = require('async');

const bup = require('../../js/bup.js');

const CACHE_DIR = path.join(__dirname, '.cache');
const EXPERIMENT_COUNT = 1000;
// These are some match length values from random Bundesliga matches
const LENGTH_VALUES = [
	17, 41, 30, 16, 29, 22, 15, 26, 26, 26, 44, 27, 43, 20, 25, 56,
	31, 30, 23, 34, 17, 25, 20, 20, 23, 26, 26, 15, 24, 45, 21, 43,
	12, 23, 23, 24, 17, 25, 27, 28, 37, 40, 39, 39, 21, 20, 17, 29,
	29, 35, 21, 18, 19, 15, 25, 19, 16, 29, 17, 26, 32];

function main() {
	async.waterfall([
		cb => ensure_mkdir(CACHE_DIR, cb),
		read_urls,
		(urls, cb) => async.mapSeries(urls, fetch_tm, cb),
		generate_tdata,
		(tdata, cb) => async.map(tdata, run_experiment, cb),
		summarize,
	], function(err, results) {
		if (err) {
			console.error(err);
			return;
		}

		console.log(results);
	});
}

function read_urls(cb) {
	const url_fn = path.join(__dirname, 'urls.txt');
	fs.readFile(url_fn, {encoding: 'utf8'}, function(err, text) {
		if (err) return cb(err);

		const lines = (
			text.split(/\n/)
			.map(line => line.trim())
			.filter(line => ! /^(?:#|$)/.test(line))
		);

		cb(null, lines);
	});
}

function parse_file(cache_fn, cb) {
	fs.readFile(cache_fn, {encoding: 'utf8'}, (err, contents) => {
		if (err) return cb(err);
		const match_data = JSON.parse(contents);
		assert(match_data);
		cb(null, match_data);
	});
}

function fetch_tm(url, cb) {
	const import_url = (
		'https://aufschlagwechsel.de/bup/http_proxy/tde_import?' +
		'format=export&url=' + encodeURIComponent(url));
	const cache_fn = path.join(
		CACHE_DIR,
		url.replace('^https?://', '').replace(/[^a-z0-9]+/g, '_'));
	parse_file(cache_fn, (err, match_data) => {
		if (err) {
			if (err.code === 'ENOENT') {
				download_file(import_url, cache_fn, (err) => {
					if (err) return cb(err);
					return parse_file(cache_fn, cb);
				});
				return;
			} else {
				return cb(err);
			}
		}

		return cb(err, match_data);
	});
}

function random_pick(ar) {
	const idx = Math.floor(Math.random() * ar.length);
	return ar[idx];
}

function generate_tdata(tms, cb) {
	const tdata = [];
	for (let i = 0;i < EXPERIMENT_COUNT;i++) {
		const tm = bup.utils.deep_copy(random_pick(tms));
		for (const m of tm.event.matches) {
			m.sim_duration = random_pick(LENGTH_VALUES);
		}

		tdata.push(tm);
	}
	return cb(null, tdata);
}

function get_players(match) {
	const res = [];
	for (const t of match.setup.teams) {
		for (const p of t.players) {
			res.push(p.name);
		}
	}
	return res;
}

function _move2court(match, time, blocked_until) {
	match.sim_start = time;
	assert(match.sim_duration);
	match.sim_end = match.sim_start + match.sim_duration;

	for (const pn of get_players(match)) {
		assert(! blocked_until.has(pn));
		blocked_until.set(pn, match.sim_end + 20);
	}
}

function play(matches, order_idxs) {
	const blocked_until = new Map();
	const courts = [
		matches[order_idxs[0]],
		matches[order_idxs[1]],
	];

	let time = 0;
	_move2court(courts[0], time, blocked_until);
	_move2court(courts[1], time, blocked_until);

	for (let oidx = 2;oidx < order_idxs.length;oidx++) {
		const finishing = (courts[0].sim_end > courts[1].sim_end) ? 1 : 0;
		time = courts[finishing].sim_end;

		const next_match = matches[order_idxs[oidx]];
		for (const pn of get_players(next_match)) {
			if (blocked_until.has(pn)) {
				time = Math.max(time, blocked_until.get(pn));
				blocked_until.delete(pn);
			}
		}
		courts[finishing] = next_match;
		_move2court(next_match, time, blocked_until);
	}

	return Math.max(courts[0].sim_end, courts[1].sim_end);
}

function calc_max_cost(order, conflict_map, preferred) {
	var res = 0;
	for (var i = 0;i < order.length;i++) {
		// conflicts
		if (i - 6 >= 0) {
			res += 100 * conflict_map[order[i]][order[i - 3]];
		}
		if (i - 5 >= 0) {
			res += 1000 * conflict_map[order[i]][order[i - 3]];
		}
		if (i - 6 >= 0) {
			res += 10000 * conflict_map[order[i]][order[i - 3]];
		}
		if (i - 3 >= 0) {
			res += 100000 * conflict_map[order[i]][order[i - 3]];
		}
		if (i - 2 >= 0) {
			res += 1000000 * conflict_map[order[i]][order[i - 2]];
		}
		if (i - 1 >= 0) {
			res += 10000000 * conflict_map[order[i]][order[i - 1]];
		}

		// preferred
		res += Math.abs(i - preferred.indexOf(order[i]));
	}
	return res;
}

function old_cost(order, conflict_map, preferred, d3_cost) {
	if (d3_cost === undefined) {
		throw new Error('Missing d3_cost');
	}

	var res = 0;
	for (var i = 0;i < order.length;i++) {
		// conflicts
		if (i - 3 >= 0) {
			res += d3_cost * conflict_map[order[i]][order[i - 3]];
		}
		if (i - 2 >= 0) {
			res += 10000 * conflict_map[order[i]][order[i - 2]];
		}
		if (i - 1 >= 0) {
			res += 100000 * conflict_map[order[i]][order[i - 1]];
		}

		// preferred order
		res += Math.abs(i - preferred.indexOf(order[i]));
	}
	return res;
}


function run_experiment(tm, cb) {
	const matches = tm.event.matches;
	const preferred = _calc_order(matches, 'HD1-DD-HD2-HE1-DE-GD-HE2');
	const reverse_preferred = _calc_order(matches, 'HE2-GD-DE-HE1-HD2-DD-HD1');
	
	const orders = [
		bup.order.optimize(bup.order.calc_cost, matches, preferred, {}, 0),
		bup.order.optimize(old_cost, matches, preferred, {}, 100),
		bup.order.optimize(bup.order.calc_cost, matches, preferred, {}, 100),
		bup.order.optimize(calc_max_cost, matches, preferred, {}),
		bup.order.optimize(bup.order.calc_cost, matches, preferred, {
			'HD1': true,
			'DD': true,
		}, 100),
		bup.order.optimize(bup.order.calc_cost, matches, preferred, {
			'HD1': true,
			'DD': true,
			'HD2': true,
		}, 100),
		bup.order.optimize(bup.order.calc_cost, matches, preferred, {
			'HD1': true,
			'DD': true,
			'HD2': true,
			'HE1': true,
			'DE': true,
			'GD': true,
			'HE2': true,
		}, 100),
		bup.order.optimize(bup.order.calc_cost, matches, reverse_preferred, {}, 100),
	];

	cb(null, {
		orders: orders.map(o => _calc_names(matches, o)),
		durations: orders.map(o => play(matches, o)),
	});
}

function avg(ar) {
	return ar.reduce((acc, val) => acc + val, 0) / ar.length;
}

function summarize(results, cb) {
	const options_lengths = [];
	for (const r of results) {
		r.durations.forEach((dur, idx) => {
			if (! options_lengths[idx]) {
				options_lengths[idx] = [];
			}

			options_lengths[idx].push(dur);
		});
	}
	return cb(null, {
		avgs: options_lengths.map(avg),
	});
}

function ensure_mkdir(path, cb) {
	fs.mkdir(path, 0x1c0, function(err) {
		if (err && err.code == 'EEXIST') {
			return cb(null);
		}
		cb(err);
	});
}

function download_file(url, fn, cb) {
	// From http://stackoverflow.com/a/22907134/35070
	const file = fs.createWriteStream(fn);
	https.get(url, function(response) {
		if (response.statusCode !== 200) {
			fs.unlink(fn);
			cb(new Error('HTTP ' + response.statusCode));
			return;
		}
		response.pipe(file);
		file.on('finish', function() {
			file.close(cb);
		});
	}).on('error', function(err) {
		fs.unlink(fn);
		cb(err.message);
	});
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

if (require.main === module) {
	main();
}
