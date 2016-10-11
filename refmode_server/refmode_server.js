'use strict';

var ws_module = require('ws');

function verify_client(info) {
	if (info.req.headers['sec-websocket-protocol'] !== 'bup-refmode') {
		return false;
	}
	return true;
}

function main() {
	var wss = new ws_module.Server({port: 3001, verifyClient: verify_client});
	//var active_clients = {};

	wss.on('connection', function connection(ws) {
		ws.on('message', function incoming(message) {
			console.log('received: %s', message);
		});
	});
}

main();