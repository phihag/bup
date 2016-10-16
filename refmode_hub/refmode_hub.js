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

function send(ws, msg) {
	ws.send(JSON.stringify(msg));
}

function send_error(ws, emsg) {
	send(ws, {
		type: 'error',
		message: emsg,
	});
}

function hub(config) {
	if (!config) {
		config = DEFAULT_CONFIG;
	}

	var wss = new ws_module.Server({port: config.port, verifyClient: verify_client});

	wss.on('connection', function(ws) {
		var cd = {};
		ws.conn_data = cd;

		ws.on('message', function(msg_json) {
			try {
				var msg = JSON.parse(msg_json);
			} catch(e) {
				send_error(ws, 'Invalid JSON: ' + e.message);
				return;
			}

			switch(msg.type) {
			case 'register-referee':
				if (typeof msg.pub_json !== 'string') {
					send_error(ws, 'Invalid key');
					return;
				}

				// TODO calculate fingerprint
				// TODO copy over key info
				cd.is_referee = true;
				send(ws, {
					type: 'referee-registered',
				});
				// TODO challenge instead
				break;
			case 'list-referees':
				var referees = [];
				wss.clients.forEach(function(c) {
					var cd = c.conn_data;
					if (!cd.is_referee) {
						return;
					}

					referees.push({
						key: cd.key,
					});
				});
				send(ws, {
					type: 'referee-list',
					referees: referees,
				});
				break;
			default:
				send_error(ws, 'Unsupported message type: ' + msg.type);
			}
		});
	});
	return wss;
}

if (require.main === module) {
	hub();
}

module.exports = hub;