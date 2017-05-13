#!/usr/bin/env node
'use strict';

const fs = require('fs');
const fs_walk = require('fs-walk');
const path = require('path');

const script_utils = require('./script_utils');


function main() {
	const args = process.argv.slice(2);
	if (args.length !== 3) {
		console.log('Usage: calc_checksums.js DISTDIR INCLUDE_PATH OUTFILE'); // eslint-disable-line no-console
		process.exit(1);
		return;
	}
	const dist_dir = path.resolve(args[0]);
	const include_path = args[1];
	const outfile = path.resolve(args[2]);

	const checksums = {};
	fs_walk.files(path.join(dist_dir, include_path), function(basedir, filename, _, next) {
		const fn = path.resolve(basedir, filename);
		const vfn = path.relative(dist_dir, fn);

		if (fn === outfile) {
			return next();
		}

		script_utils.hash_file(fn, (err, sha512) => {
			if (err) return next(err);

			checksums[vfn] = {sha512};
			next();
		}, 'sha512');
	}, function(err) {
		if (err) {
			console.log(err);
			process.exit(2);
		}

		const fns = Object.keys(checksums);
		fns.sort();
		const checksums_json = '{' + fns.map(function(fn) {
			return JSON.stringify(fn) + ':' + JSON.stringify(checksums[fn]);
		}).join(',') + '}';
		fs.writeFile(outfile, checksums_json, {encoding: 'utf8'}, function(err) {
			if (err) {
				console.log('Failed to write checksums file', err);
				process.exit(3);
			}
		});
	});
}

main();
