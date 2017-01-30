#!/usr/bin/env node
'use strict';

const ws_module = require('ws');


function main(argv) {
	if ((argv.length > 1) || argv.includes('--help')) {
		console.log('Usage: list_sats [ROOT_HUB]');
		process.exit(1);
	}

	const root_hub = (argv.length > 0) ? argv[0] : 'wss://live.aufschlagwechsel.de/refmode_hub/';

	const ws = new ws_module(root_hub, 'bup-refmode-hub2hub');
	ws.on('open', function() {
		ws.send(JSON.stringify({
			type: 'list-hubs',
		}));
	});
	ws.onerror = function(e) {
		console.error('Failed to list sat-hubs:', e.message);
		process.exit(2);
	};
	ws.on('message', function(msg_json) {
		try {
			var msg = JSON.parse(msg_json);
		} catch(e) {
			console.error(ws, 'Invalid JSON: ' + e.message);
			process.exit(3);
		}

		switch(msg.type) {
		case 'hub-list':
			console.log('Registered satelliste hubs:');
			for (const h of msg.hubs) {
				console.log(h.ip + ' => ' + JSON.stringify(h.hub_info));
			}
			process.exit(0);
			break;
		case 'welcome':
			// Ignore
			break;
		default:
			console.log('Unexpected message: ' + msg_json);
		}
	});

}

if (require.main === module) {
	main(process.argv.slice(2));
}
