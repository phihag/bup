'use strict';

const os = require('os');

const node_crypto = require('crypto');
const ws_module = require('ws');

const bup = require('../js/bup.js');

const DEFAULT_CONFIG = {
	port: 3001,
	keepalive: 180000, // (keepalive as a satellite) 3 minutes
};

function verify_client(info) {
	const proto = info.req.headers['sec-websocket-protocol'];
	return ['bup-refmode', 'bup-refmode-hub2hub'].includes(proto);
}

function send(ws, msg) {
	const msg_json = JSON.stringify(msg);
	try {
		ws.send(msg_json);
	} catch(e) {
		console.error('Could not send: ' + e.message);
	}
}

function send_error(ws, emsg) {
	console.log('Error: ', emsg);
	send(ws, {
		type: 'error',
		message: emsg,
	});
}

function send_referee_list(wss, clients) {
	var referees = [];
	wss.clients.forEach(function(c) {
		var cd = c.conn_data;
		if (!cd.is_referee) {
			return;
		}

		referees.push({
			fp: cd.fp,
		});
	});

	clients.forEach(function(ws) {
		send(ws, {
			type: 'referee-list',
			referees: referees,
		});
	});
}

function on_referees_change(wss) {
	var interested = Array.from(wss.clients).filter(function(c) {
		return c.subscribed_list_referees;
	});
	send_referee_list(wss, interested);
}

function connect(referee, client) {
	var rd = referee.conn_data;
	var cd = client.conn_data;

	if (cd.connected_to.includes(rd.id)) {
		return; // Already connected
	}
	cd.connected_to.push(rd.id);
	rd.connected_to.push(cd.id);
	send(client, {
		type: 'connected',
		id: rd.id,
		fp: rd.fp,
		all: cd.connected_to,
	});
	send(referee, {
		type: 'connected',
		id: cd.id,
		all: rd.connected_to,
	});
}

function register_hub(wss, ws, msg) {
	const ip = ws.conn_data.ip;
	if (! /^wss?:\/\//.test(msg.local_addr)) {
		send_error(ws, 'Missing or invalid local_addr ' + JSON.stringify(msg.local_addr));
		return;
	}
	wss.hub_map.set(ip, {local_addr: msg.local_addr, conn_id: ws.conn_data.id});
	send(ws, {
		type: 'hub-registered',
		public_ip: ip,
		local_addr: msg.local_addr,
	});

	wss.clients.forEach(function(cws) {
		if (cws === ws) return;
		if (cws.conn_data.ip === ip) {
			send(cws, {
				type: 'redirected',
				redirect: msg.local_addr,
			});
		}
	});
}

function list_hubs(wss, ws, msg) {
	const hub_list = [];
	for (const [ip, hub_info] of wss.hub_map.entries()) {
		hub_list.push({ip, hub_info});
	}
	send(ws, {
		type: 'hub-list',
		hubs: hub_list,
		rid: msg.rid,
	});
}

function _client_by_id(wss, id) {
	for (const c of wss.clients) {
		if (c.conn_data.id === id) {
			return c;
		}
	}
}

function handle_msg(wss, ws, msg) {
	const cd = ws.conn_data;

	switch(msg.type) {
	case 'register-referee':
		if (!cd.challenge) {
			send_error(ws, 'No challenge posted yet');
			return;
		}
		if (typeof msg.pub_json !== 'string') {
			send_error(ws, 'Invalid key of type ' + typeof msg.pub_json);
			return;
		}
		if (typeof msg.sig !== 'string') {
			send_error(ws, 'Signature missing');
			return;
		}

		var challenge_data = bup.utils.encode_utf8(cd.challenge);
		bup.key_utils.verify(msg.pub_json, challenge_data, msg.sig, function(err, is_valid) {
			if (err) {
				send_error(ws, 'Failed to validate signature: ' + err.message);
				return;
			}

			if (! is_valid) {
				send_error(ws, 'Invalid signature');
				return;
			}

			bup.key_utils.fingerprint(msg.pub_json, function(err, fp) {
				if (err) {
					send_error(ws, 'Could not generate fingerprint');
					return;
				}

				cd.is_referee = true;
				cd.pub_json = msg.pub_json;
				cd.fp = fp;
				on_referees_change(wss);
				send(ws, {
					type: 'referee-registered',
					fp: fp,
				});
				for (const c of wss.clients) {
					const cd = c.conn_data;
					if (!cd.referee_requests) {
						continue;
					}
					if (!cd.referee_requests.includes(fp)) {
						continue;
					}
					connect(ws, c);
				}
			});
		});
		break;
	case 'list-referees':
		send_referee_list(wss, [ws]);
		break;
	case 'subscribe-list-referees':
		cd.subscribed_list_referees = true;
		send_referee_list(wss, [ws]);
		break;
	case 'connect-to-referees':
		if (!Array.isArray(msg.fps)) {
			send_error(ws, 'Missing fps (referee fingerprints) argument');
			return;
		}
		cd.referee_requests = msg.fps;

		// Clean up existing connections
		for (const ref_idx of cd.connected_to) {
			const ref_conn = _client_by_id(wss, ref_idx);
			const rd = ref_conn.conn_data;

			if (! cd.referee_requests.includes(rd.fp)) {
				bup.utils.remove(rd.connected_to, cd.id);
				send(ref_conn, {
					type: 'disconnected',
					id: cd.id,
					all: rd.connected_to,
				});

				bup.utils.remove(cd.connected_to, ref_idx);
				send(ws, {
					type: 'disconnected',
					id: ref_idx,
					all: cd.connected_to,
				});
			}
		}

		// Create new connections
		for (const r of wss.clients) {
			const rd = r.conn_data;
			if (! rd.is_referee) {
				continue;
			}

			if (cd.referee_requests.includes(rd.fp)) {
				connect(r, ws);
			}
		}

		break;
	case 'keepalive':
		send(ws, {
			type: 'keptalive',
			sent: msg.sent,
			rid: msg.rid,
			answered: Date.now(),
		});
		break;
	case 'dmsg':
		if (! cd.connected_to.includes(msg.to)) {
			send(ws, {
				type: 'dmsg-unconnected',
				msg: 'Could not deliver dmsg: not connected to ' + msg.to,
				rid: msg.rid,
			});
			return;
		}

		var receiver = _client_by_id(wss, msg.to);
		msg.from = cd.id;
		send(receiver, msg);
		break;
	case 'register-hub':
		register_hub(wss, ws, msg);
		break;
	case 'list-hubs':
		list_hubs(wss, ws, msg);
		break;
	case 'error':
		console.log('Received error: ', msg.message);
		break;
	default:
		send_error(ws, 'Unsupported message type: ' + msg.type);
	}
}

function determine_local_ip() {
	// Adapted from http://stackoverflow.com/a/8440736/35070
	const ifaces = bup.utils.values(os.networkInterfaces());

	for (const iface of ifaces) {
		for (const addr of iface) {
			if ((addr.family === 'IPv4') && !addr.internal) {
				return addr.address;
			}
		}
	}
	throw new Error('Cannot determine local IP address');
}

function register(config) {
	if (!config.root_hub) {
		return;
	}

	let local_addr = config.local_addr;
	if (!local_addr) {
		let local_ip = determine_local_ip();
		if (local_ip.includes(':')) { // IPv6
			local_ip = `[${local_ip}]`;
		}
		local_addr = 'ws://' + local_ip + ':' + config.port + '/';
	}

	const ws = new ws_module(config.root_hub, 'bup-refmode-hub2hub');
	let keepalive_interval;
	let request_id = 0;
	let err = false;

	console.log('Registering at ' + config.root_hub + ' ...');
	ws.on('open', function() {
		send(ws, {
			type: 'register-hub',
			local_addr: local_addr,
		});
		keepalive_interval = setInterval(function() {
			send(ws, {
				type: 'keepalive',
				rid: request_id++,
				sent: Date.now(),
			});
		}, config.keepalive);
	});
	ws.onerror = function(e) {
		err = true;
		console.log('Error on hub registration: ' + e.message + '. Will retry later.');
	};
	ws.on('message', function(msg_json) {
		const msg = JSON.parse(msg_json);
		switch (msg.type) {
		case 'hub-registered':
			console.log('Registered at ' + config.root_hub + ': ' + msg.public_ip + ' -> ' + msg.local_addr);
			break;
		case 'error':
			console.log('Received error: ', msg.message);
			break;
		case 'keptalive':
		case 'welcome':
			// Ignore
			break;
		default:
			send_error(ws, 'Unsupported message type ' + msg.type);
		}
	});
	ws.on('close', function() {
		if (!err) {
			console.log('Connection to root lost, reconnecting ...');
		}
		setTimeout(register, 10000, config);
		clearInterval(keepalive_interval);
	});
}

function hub(config) {
	if (!config) {
		config = DEFAULT_CONFIG;
	}

	const wss = new ws_module.Server({port: config.port, verifyClient: verify_client});
	let conn_counter = 0;
	wss.hub_map = new Map(); // IP address -> {local_addr:, conn_id:}

	wss.on('connection', function(ws, req) {
		const client_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		const cd = {
			connected_to: [],
			id: conn_counter++,
			ip: client_ip,
		};
		ws.conn_data = cd;

		node_crypto.randomBytes(64, function(err, buffer) {
			cd.challenge = buffer.toString('hex');
			const answer = {
				'type': 'welcome',
				challenge: cd.challenge,
			};
			const redir = wss.hub_map.get(client_ip);
			if (redir) {
				answer.redirect = redir.local_addr;
			}
			send(ws, answer);
		});

		ws.on('message', function(msg_json) {
			try {
				var msg = JSON.parse(msg_json);
			} catch(e) {
				send_error(ws, 'Invalid JSON: ' + e.message);
				return;
			}

			handle_msg(wss, ws, msg);
		});

		ws.on('close', function() {
			const leaving_id = ws.conn_data.id;
			for (const conn of wss.clients) {
				const cd = conn.conn_data;
				if (bup.utils.remove(cd.connected_to, leaving_id)) {
					send(conn, {
						type: 'disconnected',
						id: leaving_id,
						all: cd.connected_to,
					});
				}
			}

			const to_delete = [];
			for (const [ip, hub_data] of wss.hub_map) {
				if (hub_data.conn_id === leaving_id) {
					to_delete.push(ip);
				}
			}
			for (const ip of to_delete) {
				wss.hub_map.delete(ip);
			}
			// Notify clients that satellite hub is now offline
			for (const ip of to_delete) {
				wss.clients.forEach(function(cws) {
					if (cws === ws) return;
					if (cws.conn_data.ip === ip) {
						send(cws, {
							type: 'redirected',
							redirect: null,
						});
					}
				});
			}
		});
	});

	register(config);

	return wss;
}

function parse_args(argv) {
	if (argv.length === 0) {
		return DEFAULT_CONFIG;
	}

	if ((argv.length !== 1) || argv.includes('--help')) {
		console.log('Usage: refmode_hub [JSON_CONFIG]');
		console.log('JSON keys are:');
		console.log('  port        Integer of port to bind to');
		console.log('  root_hub    String of websocket address of root server to register at.');
		console.log('              e.g. "root_hub": "wss://live.aufschlagwechsel.de/refmode_hub/"');
		console.log('  local_addr  String of websocket address of this server in the local network.');
		console.log('              Autodetermined if missing.');
		console.log('  keepalive   Duration in ms when to send keepalive messages');
		process.exit(1);
	}

	const cfg = bup.utils.deep_copy(DEFAULT_CONFIG);
	const cmd_config = JSON.parse(argv[0]);
	bup.utils.obj_update(cfg, cmd_config);
	return cfg;
}

if (require.main === module) {
	const cfg = parse_args(process.argv.slice(2));
	hub(cfg);
}

module.exports = hub;