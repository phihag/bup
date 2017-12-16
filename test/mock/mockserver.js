#!/usr/bin/env node
'use strict';

const assert = require('assert');
const miniserver = require('./miniserver');

const mock_btde = require('./mock_btde');
const httpd_utils = require('./httpd_utils');
const static_handler = require('./static_handler');


function server(options) {
	assert(!options.handlers);

	const btde = new mock_btde.BTDEMock();

	options.handlers = [
		httpd_utils.prefixed('/btde/', btde.handler),
		static_handler.file_handler('/', miniserver.ROOT_DIR),
	];

	return miniserver.server(options);
}

function usage() {
	console.log('Usage: mockserver.js [port]');
	console.log('Combined mocking server for integration tests.');
	console.log('/ : Normal bup');
	console.log('/btde/ : badmintonticker mock');
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

			console.log('testserver running at ' + url_base);
			console.log('go to ' + url_base + 'btde/ for badmintonticker simulation.');
		},
		port,
	});

}

if (require.main === module) {
	main();
}

module.exports = {
	server,
};
