'use strict';

var ws_module = require('ws');

const DEFAULT_CONFIG = {
	port: 3001,
};

function verify_client(info) {
	if (info.req.headers['sec-websocket-protocol'] !== 'bup-refmode') {
		return false;
	}
	return true;
}

function hub(config) {
	if (!config) {
		config = DEFAULT_CONFIG;
	}

	var wss = new ws_module.Server({port: config.port, verifyClient: verify_client});

	//var active_clients = {};

	wss.on('connection', function(ws) {
		ws.on('message', function(message) {
			console.log('received: %s', message);
		});
	});
	return wss;
}

if (require.main === module) {
	hub();
}

module.exports = hub;