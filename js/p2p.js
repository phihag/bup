var p2p = (function(s, on_connect, signalling_wsurl, ice_servers, wrtc, WebSocket) {
'use strict';	

if (!s) {
	s = state;
}

if (!signalling_wsurl) {
	signalling_wsurl = 'wss://live.aufschlagwechsel.de/ws/bup-p2p';
}
if (!wrtc) {
	wrtc = window;
}
if (!WebSocket) {
	WebSocket = window.WebSocket;
}
if (!ice_servers) {
	ice_servers = [/*{
		url: 'stun:stun.l.google.com:19302',
	}*/];
}

var servers = {
	iceServers: ice_servers,
};
var media_constraints = {
	optional: [{
		RtpDataChannels: true,
	}],
};


var RTCPeerConnection = wrtc.RTCPeerConnection || wrtc.mozRTCPeerConnection || wrtc.webkitRTCPeerConnection;

var request_id = 1;
var signalling_sock;
var connections = {};

function on_error(msg, e) {
	// TODO do something useful here
	console.error(msg, e); // eslint-disable-line no-console
}

function signalling_connect() {
	signalling_sock = new WebSocket(signalling_wsurl, 'bup-p2p-signalling');
	signalling_sock.onmessage = function(e) {
		var msg = JSON.parse(e.data);
		switch (msg.type) {
		case 'peer-available':
			connect_to(msg.node_id);
			break;
		case 'connection-request':
			handle_connection_request(msg.from_node, msg.desc);
			break;
		case 'connection-response':
			handle_connection_response(msg.from_node, msg.desc);
			break;
		case 'ice-candidate':
			handle_ice_candidate(msg.from_node, msg.candidate);
			break;
		default:
			on_error('unhandled message', msg);
		// TODO display 'error' messages
		}
	};
	signalling_sock.onopen = signalling_update_events;
	// TODO on close renew
}

function signalling_ready() {
	return signalling_sock && (signalling_sock.readyState == 1); // 1 = OPEN
}

function signalling_update_events() {
	if (! signalling_ready()) {
		// As soon as the connection is open we will send the current state
		return;
	}

	request_id++;
	var events_ar = [];
	if (s.event && s.event.id) {
		events_ar = [s.event.id];
	}

	var d = JSON.stringify({
		type: 'set-events',
		request_id: request_id,
		event_ids: events_ar,
	});
	signalling_sock.send(d);
}

function signalling_send(msg) {
	if (! signalling_ready()) {
		// Not connected, try again later
		return false;
	}

	request_id++;
	msg.request_id = request_id;

	signalling_sock.send(JSON.stringify(msg));
}

function handle_message(info, e) {
	var msg = JSON.parse(e.data);
	// TODO correct this
	console.log('got message', e.data); // eslint-disable-line no-console
	switch (msg.type) {
	case 'status-request':
		break;
	}
}

function send_message(info, msg) {
	info.channel.send(JSON.stringify(msg));
}

function connect_to(node_id) {
	if (connections[node_id]) {
		return;
	}

	var pc = new RTCPeerConnection(servers, media_constraints);
	var info = {
		node_id: node_id,
		pc: pc,
	};
	connections[node_id] = info;
	var channel = pc.createDataChannel('bup-p2p', {
		ordered: true,
		reliable: true,
	});
	channel.onopen = function() {
		info.channel = channel;
		on_connect(info);
	};
	channel.onclose = function() {
		// TODO do something useful here
		on_error('channel closed');
	};
	channel.onmessage = function(e) {
		handle_message(info, e);
	};
	pc.onicecandidate = function(e) {
		if (!e.candidate) {
			return;
		}
		signalling_send({
			type: 'ice-candidate',
			to_node: node_id,
			candidate: e.candidate,
		});
	};

	pc.createOffer(function(desc){
        pc.setLocalDescription(desc, function() {
			signalling_send({
				type: 'connection-request',
				to_node: node_id,
				desc: desc,
			});
		}, function(err) {
			on_error('setLocalDescription failed', err);
		});
	}, function(err) {
		on_error('offer creation failed', err);
	});
}

function handle_connection_request(node_id, desc) {
	var pc = new RTCPeerConnection(servers, media_constraints);
	var info = {
		node_id: node_id,
		pc: pc,
	};
	connections[node_id] = info;

	pc.onicecandidate = function(e) {
		if (!e.candidate) {
			return;
		}
		signalling_send({
			type: 'ice-candidate',
			to_node: node_id,
			candidate: e.candidate,
		});
	};
	pc.ondatachannel = function(e) {
		var channel = e.channel;
		channel.onmessage = function(e) {
			handle_message(info, e);
		};
		channel.onopen = function() {
			info.channel = channel;
			on_connect(info);
		};
		channel.onclose = function() {
			on_error('receiver cannel closed', arguments);
		};
	};
	pc.setRemoteDescription(desc);
	pc.createAnswer(function(local_desc) {
		pc.setLocalDescription(local_desc);
		signalling_send({
			type: 'connection-response',
			to_node: node_id,
			desc: local_desc,
		});
	}, function(err) {
		on_error('answer creation failed', err);
	});
}

function handle_connection_response(node_id, desc) {
	var conn = connections[node_id];
	if (!conn) {
		on_error('cannot deal with response!');
		return;
	}
	conn.pc.setRemoteDescription(desc);
}

function handle_ice_candidate(node_id, candidate) {
	var conn = connections[node_id];
	if (!conn) {
		on_error('cannot deal with ice!');
		return;
	}
	conn.pc.addIceCandidate(candidate, function() {
		// Successfully added ICE candidate.
		// We're fine with that.
	}, function(err) {
		on_error('could not add ice candidate', err);
	});
}

// Ask all connected nodes for their state
function request_node_status(callback) {
	connections.forEach(function(info) {
		if (!info.channel) {
			callback({
				info: info,
				connectivity: 'connecting',
			});
			return;
		}

		send_message(info, {type: 'status-request'});
	});
}

function init() {
	signalling_connect();
}

function ui_init() {
	init();
}
return {
	ui_init: ui_init,
/*@DEV*/
	// testing only
	init: init,
	request_node_status: request_node_status,
/*/@DEV*/
};

});

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = p2p;
}
/*/@DEV*/