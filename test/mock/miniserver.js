#!/usr/bin/env node
'use strict';

const http = require('http');
const path = require('path');
const url = require('url');

const ROOT_DIR = path.dirname(path.dirname(__dirname));

const static_handler = require('./static_handler');


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
	const handlers = options.handlers || [static_handler.file_handler('/', ROOT_DIR)];

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
	ROOT_DIR,
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
