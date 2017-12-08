#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const url = require('url');

const ROOT_DIR = path.dirname(path.dirname(__dirname));

const httpd_utils = require('./httpd_utils');


function mimetype(pathname) {
	const parsed_path = path.parse(pathname);
	return {
		'.appcache': 'text/cache-manifest',
		'.css': 'text/css',
		'.gif': 'image/gif',
		'.html': 'text/html',
		'.jpg': 'image/jpeg',
		'.js': 'application/javascript',
		'.json': 'application/json',
		'.md': 'text/markdown',
		'.mp4': 'video/mp4',
		'.pdf': 'application/pdf',
		'.png': 'image/png',
		'.svg': 'image/svg+xml',
		'.txt': 'text/plain',
		'.xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
		'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'.xltm': 'application/vnd.ms-excel.template.macroEnabled.12',
	}[parsed_path.ext];
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
		} else if (c.startsWith('.')) {
			// Intentionally redundant with the above and below regexp: strip any secret files
			continue;
		} else if (c === 'node_modules') { // Not terribly secret, but not relevant for clients
			continue;
		} else if (!c) { // foo///bar
			continue;
		}

		if (/^[-a-zA-Z0-9_.]+$/.test(c)) {
			components.push(c);
		}
	}

	fs_module.realpath(root_dir, (err, nroot_dir) => {
		if (err) return cb(err);

		const rel_path = path_module.join(nroot_dir, ...components);
		fs_module.realpath(rel_path, (err, res_fn) => {
			if (err) return cb(err);

			const cmp_dir = nroot_dir + nroot_dir.endsWith(path_module.sep) ? '' : path_module.sep;
			if ((!res_fn.startsWith(cmp_dir)) || (cmp_dir === nroot_dir)) {
				return cb(new Error('Path traversal detected'));
			}

			return cb(null, res_fn);
		});
	});
}

function file_handler(prefix, root_dir) {
	return httpd_utils.prefixed(prefix, (req, res, pathname) => {
		if (! ['GET', 'HEAD'].includes(req.method)) {
			return httpd_utils.err(res, 405);
		}

		resolve_path(root_dir, pathname, (err, fn) => {
			if (err) {
				console.error('Error while trying to resolve ' + pathname + ': ' + err.message);
				return httpd_utils.err(res, 404);
			}

			const stream = fs.createReadStream(fn);
			stream.on('error', (err) => {
				if (err.code === 'EISDIR') {
					return httpd_utils.err(res, 404);
				}
				console.error('failed to create stream: ' + err.message);
				return httpd_utils.err(res, 500);
			});

			const headers = {
				'Cache-Control': 'no-store, must-revalidate',
				'Expires': '0',
			};
			const mt = mimetype(fn);
			if (mt) {
				headers['Content-Type'] = mt;
			}

			res.writeHead(200, headers);

			const pipe = stream.pipe(res);
			pipe.on('error', (err) => {
				console.error('pipe error: ' + err.message);
				return httpd_utils.err(res, 500);
			});
		});
	});
}

// Options can be any of
// - port: integer number (default: a random port)
// - listen: String of address to listen
// - start_callback: (err, url_base) after server start
// - handlers: an array of handlers, each gets called with (req, res, pathname).
//             A handler returns 'unhandled' iff it is not interested in a request.
//             If not specified, a single file handler will be installed.
function server(options) {
	options = options || {};
	const port = options.port || 0;
	const listen = options.listen || '::1';
	const handlers = options.handlers || [file_handler('/', ROOT_DIR)];

	const serv = http.createServer((req, res) => {
		req.socket.setNoDelay(true);

		const pathname = url.parse(req.url).pathname;

		for (const h of handlers) {
			if (h(req, res, pathname) !== 'unhandled') {
				return;
			}
		}
	});
	serv.listen(port, listen, () => {
		const domain = ((listen === '::') || (listen == '0.0.0.0')) ? 'localhost' : (
			listen.includes(':') ? `[${listen}]` : listen
		);
		if (options.start_callback) {
			options.start_callback(null, 'http://' + domain + ':' + serv.address().port + '/');
		}
	});
	serv.on('error', (err) => {
		throw err;
	});
	return serv;
}

module.exports = {
	server,
	file_handler,
	ROOT_DIR,
	// Testing only
	mimetype,
	resolve_path,
};

function usage() {
	console.log('Usage: miniserver.js [port]');
	console.log('Serves the bup root directory');
	process.exit(2);
}

function main() {
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

	server({
		start_callback: (err, url_base) => {
			if (err) throw err;

			console.log('Server running at ' + url_base);
		},
		port,
	});
}

if (require.main === module) {
	// Run in CLI
	main();
}
