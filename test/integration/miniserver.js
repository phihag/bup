#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const url = require('url');

function _err(res, errcode) {
	res.writeHead(errcode, {'Content-Type': 'text/plain'});
	res.end('Error ' + errcode);
}

// Safely resolves a path, without going into hidden files or path traversal
function resolve_path(root_dir, url_path, cb, path_module, fs_module) {
	path_module = path_module || path;
	fs_module = fs_module || fs;

	const parsed_components = url_path.split('/');
	const components = [];
	for (const c of parsed_components) {
		if (c === '..') {
			if (components.length > 0) {
				components.pop();
			}
			continue;
		} else if (c === '.') {
			continue;
		} else if (!c) { // foo///bar
			continue;
		}

		if (/^[a-zA-Z0-9_][-a-zA-Z_.0-9]*$/.test(c)) {
			components.push(c);
		}
	}

	fs_module.realpath(root_dir, (err, nroot_dir) => {
		if (err) return cb(err);

		const rel_path = path_module.join(nroot_dir, ...components);
		fs_module.realpath(rel_path, (err, res_fn) => {
			if (err) return cb(err);

			if (! nroot_dir.endsWith(path_module.sep)) {
				nroot_dir += path_module.sep;
			}
			if (! res_fn.startsWith(nroot_dir)) {
				return cb(new Error('Path traversal detected'));
			}

			return cb(null, res_fn);
		});
	});
}

// Options should be 
// Callback arguments: (err, url_base) after server start
function server(callback, options) {
	options = options || {};
	const port = options.port || 0;
	const listen = options.listen || '::1';
	const ROOT_DIR = path.dirname(path.dirname(__dirname));

	const serv = http.createServer((req, res) => {
		if (! ['GET', 'HEAD'].includes(req.method)) {
			return _err(res, 405);
		}

		const parsed_url = url.parse(req.url);
		const fn = resolve_path(ROOT_DIR, parsed_url.pathname);
		const stream = fs.createReadStream(fn);
		stream.on('error', (err) => {
			console.log('stream err', err);
		});
		const pipe = stream.pipe(res);
		pipe.on('error', (err) => {
			console.log('pipe err', err);
		});

		// TODO handle file not found errors
		// TODO handle errors after file not found
		// TODO determine MIME type
	});
	serv.listen(port, listen, () => {
		const domain = ((listen === '::') || (listen == '0.0.0.0')) ? 'localhost' : (
			listen.includes(':') ? `[${listen}]` : listen
		);
		callback(null, 'http://' + domain + ':' + serv.address().port + '/');
	});
	serv.on('error', (err) => {
		throw err;
	});
}

module.exports = {
	// Testing only
	resolve_path,
};

function usage() {
	console.log('Usage: miniserver.js [port]');
	process.exit(2);
}

if (require.main === module) {
	// Run in CLI
	const argv = process.argv.slice(2);
	let port = 0;
	if (argv.length === 1) {
		port = parseInt(argv[0]);
		if (isNaN(port)) {
			usage();
		}
	} else if (argv.length > 1) {
		usage();
	}

	server((err, url_base) => {
		if (err) throw err;

		console.log('Server running at ' + url_base);
	}, {port});
}
