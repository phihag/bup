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

// Callback arguments: (err, url_base)
function server(callback) {
	const ROOT_DIR = path.dirname(path.dirname(__DIR));

	const serv = http.createServer((req, res) => {
		if (! ['GET', 'HEAD'].includes(req.method)) {
			return _err(res, 405);
		}

		const parsed_url = url.parse(req.url);
		console.log(parsed_url);
		// TODO: prevent recursing into hidden files/dirs
		// TODO determine filename
		// TODO determine MIME type
	});
	serv.listen(0, '::1', () => {
		callback(null, 'http://[::1]:' + serv.address().port + '/');
	});
	serv.on('error', (err) => {
		throw err;
	});
}


if (require.main === module) {
	// Run in CLI
	
}
