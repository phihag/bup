var p2p = (function(signalling_wsurl, wrtc, WebSocket) {
'use strict';

if (!signalling_wsurl) {
	signalling_wsurl = 'wss://live.aufschlagwechsel.de/ws/bup-p2p';
}

if (!wrtc) {
	wrtc = window;
}
if (!WebSocket) {
	WebSocket = window.WebSocket;
}

var RTCPeerConnection = wrtc.RTCPeerConnection || wrtc.mozRTCPeerConnection || wrtc.webkitRTCPeerConnection;

var events = {};
var candidates = [];
var signalling_sock;

function signalling_connect() {
	signalling_sock = new WebSocket(signalling_wsurl, 'bup-p2p');
	signalling_sock.onmessage = function(data, flags) {
		console.log('got message: ', data, flags);
	};
	// TODO on connected send all candidates
	// TODO on close renew
}

function send_candidates() {
	if (!signalling_sock) {
		return;
	}
	signalling_sock.send({
		type: 'set-candidates',
		candidates: candidates,
	});
}

function on_candidate(e) {
	if (! e.candidate) {
		return;  // End of candidate list
	}

	candidates.push(e.candidate);
	send_candidates();
}

function setup() {
	var servers = {
		iceServers: [/*{
			url: 'stun:stun.l.google.com:19302',
		}, {
			urls: 'stun:stun.services.mozilla.com'
		}*/],
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
	setup();
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