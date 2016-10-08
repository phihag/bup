'use strict';

var ws_module = require('ws');

function main() {
	var wss = new ws_module.Server({port: 3001});
	//var active_clients = {};

	wss.on('connection', function connection(ws) {
		ws.on('message', function incoming(message) {
			console.log('received: %s', message);
		});
	});
}

main();