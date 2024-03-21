#!/usr/bin/env node
'use strict';
// Download static libraries

const assert = require('assert');
const fs = require('fs');
const https = require('https');
const path = require('path');

const async = require('async');

function download_file_ifneeded(url, fn, cb) {
	fs.stat(fn, (err) => {
		if (err) {
			download_file(url, fn, cb);
		} else {
			cb();
		}
	});
}

function download_file(url, fn, cb) {
	console.log('Downloading ' + url);
	const tmp_fn = fn + '.download';
	const file = fs.createWriteStream(tmp_fn);
	https.get(url, response => {
		if (response.statusCode !== 200) {
			return cb(new Error(url + ' failed with code ' + response.statusCode));
		}
		response.pipe(file);
		file.on('finish', () => {
			file.close((err) => {
				if (err) {
					fs.unlink(tmp_fn);
					return cb(err);
				}

				fs.rename(tmp_fn, fn, cb);
			});
		});
	}).on('error', (err) => {
		fs.unlink(tmp_fn);
		if (cb) {
			cb(err);
		}
	});
}

function main() {
	const args = process.argv.slice(2);
	if (args.length !== 2) {
		console.log('Usage: ' + process.argv[1] + ' LIBCONFIG.json LIB_DIR');
		return process.exit(1);
	}
	const config_fn = args[0];
	const lib_dir = args[1];

	async.waterfall([function(cb) {
		fs.mkdir(lib_dir, (err) => {
			if (err && (err.code === 'EEXIST')) {
				return cb();
			}
			cb(err);
		});
	}, function(cb) {
		fs.readFile(config_fn, (err, libs_json) => {
			if (err) throw err;

			const libs = JSON.parse(libs_json);
			assert(Array.isArray(libs));
			cb(null, libs);
		});
	}, function(libs, cb) {
		async.each(libs, (lib, cb) => {
			let basename = lib.file;
			if (!basename) {
				const m = /\/([-a-z0-9A-Z._]+)$/.exec(lib.url);
				if (!m) {
					return cb(new Error('Cannot determine basename of ' + lib.url));
				}
				basename = m[1];
			}
			download_file_ifneeded(lib.url, path.join(lib_dir, basename), cb);
		}, cb);
	}], function(err) {
		if (err) throw err;
	});
}

main();


