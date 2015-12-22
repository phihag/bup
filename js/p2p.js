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
			// 
			break;
		// TODO display 'error' messages
		}
	};
	signalling_sock.onopen = signalling_update;
	// TODO on close renew
}

function signalling_update() {
	if ((! signalling_sock) || (signalling_sock.readyState != 1)) { // 1 = OPEN
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

function connect_to(node_id, candidates) {
	if (connections[node_id]) {
		return;
	}

	// TODO make connection!
}

function on_candidate(e) {
	if (! e.candidate) {
		return;  // End of candidate list
	}

	candidates.push(e.candidate.candidate);
	signalling_update();
}

function setup_connection() {
	var servers = {
		iceServers: ice_servers,
	};
	var media_constraints = {
		optional: [{
			RtpDataChannels: true,
		}],
	};
	
	var pc = new RTCPeerConnection(servers, media_constraints);
	pc.onicecandidate = on_candidate;

	pc.createDataChannel('bup-p2p-v1', {
		ordered: true,
	});
	pc.createOffer(function(result){
        pc.setLocalDescription(result, function(){}, function(){});
	}, function(){});

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