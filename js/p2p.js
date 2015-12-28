var p2p = (function(s, signalling_wsurl, ice_servers, wrtc, WebSocket) {
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

function signalling_connect() {
	signalling_sock = new WebSocket(signalling_wsurl, 'bup-p2p-signalling');
	signalling_sock.onmessage = function(e) {
		var msg = JSON.parse(e.data);
		console.log('got message: ', msg);
		switch (msg.type) {
		case 'peer-available':
			connect_to(msg.node_id);
			break;
		case 'connection-request':
			handle_connection_request(msg.from_node, msg.candidate);
			break;
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

function connect_to(node_id) {
	if (connections[node_id]) {
		return;
	}

	var pc = new RTCPeerConnection(servers, media_constraints);
	var channel = pc.createDataChannel('bup-p2p', {
		ordered: true,
		reliable: true,
	});
	channel.onopen = function() {
		console.log('cannel opened', arguments);
	};
	channel.onopen = function() {
		console.log('cannel closed', arguments);
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
			console.error('setLocalDescription failed', err);
		});
	}, function(err) {
		console.error('offer creation failed', err);
	});
}

function handle_connection_request(node_id) {

}

function init() {
	signalling_connect();
}

/* Arguments: s (state) */
function ui_init() {
	init();
}

return {
	ui_init: ui_init,
	// testing only
	init: init,
};

});

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = p2p;
}
/*/@DEV*/