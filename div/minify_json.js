'use strict';

const async = require('async');
const fs = require('fs');
const path = require('path');
const process = require('process');

const utils = require('../js/utils.js');


function usage() {
	console.log('Usage: ' + process.argv[1] + ' [--dir] IN OUT');
	console.log('  --dir IN and OUT are directories instead of JSON files');
	process.exit(1);
}

function main(cb) {
	const args = process.argv.slice(2);

	const dir_flag = args.includes('--dir');
	if (dir_flag) {
		utils.remove(args, '--dir');
	}

	if (args.length != 2) {
		return usage();
	}
	const [in_fn, out_fn] = args;

	if (dir_flag) {
		fs.readdir(in_fn, (err, files) => {
			const json_files = files.filter(f => f.endsWith('.json'));
			async.each(json_files, (basename, cb) => {
				const json_in_fn = path.join(in_fn, basename);
				const json_out_fn = path.join(out_fn, basename);

				minify_json(json_in_fn, json_out_fn, cb);
			});
		});
	} else {
		minify_json(in_fn, out_fn, cb);
	}
}

function minify_json(in_fn, out_fn, cb) {
	fs.readFile(in_fn, {encoding: 'utf8'}, (err, content) => {
		if (err) return cb(err);

		const minified = JSON.stringify(JSON.parse(content));
		fs.writeFile(out_fn, minified, {encoding: 'utf8'}, (err) => {
			return cb(err);
		});
	});
}

main((err) => {
	if (err) throw err;
});
