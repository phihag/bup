// WebSocket connection to BTS (https://github.com/phihag/bts/)
// (alpha)

var btsws = (function() {
var RECONNECT_TIMEOUT = 5000;

// Server might have vanished without a close event, force reconnect if no message for this amount of time
var INACTIVITY_TIMEOUT = 30 * 1000;

var socket;
var inactivityTimeout;

var battery;
if (!battery && (typeof navigator != 'undefined') && navigator.getBattery) {
	navigator.getBattery().then(function(bat) {
		battery = bat;
	});
}

function _bat_status() {
	if (!battery) {
		return undefined;
	}
	return {
		charging: battery.charging,
		level: battery.level,
		chargingTime: battery.chargingTime,
		dischargingTime: battery.dischargingTime,
	};
}

function init(s, baseurl) {
	s.btsws_base_url = baseurl;
	reconnect();
}

function rescheduleInactivityTimeout() {
	if (inactivityTimeout) {
		window.clearTimeout(inactivityTimeout);
	}
	inactivityTimeout = setTimeout(function() {
		console.log('No messages from BTS server for ' + INACTIVITY_TIMEOUT + ' ms, forcing reconnect');
		reconnect();
	}, INACTIVITY_TIMEOUT);
}

function reconnect() {
	if (socket) {
		socket.onclose = undefined;
		socket.close();
		socket = undefined;
	}

	var wsUrl = state.btsws_base_url.replace(/^http(s):/, 'ws$1:') + 'ws/bup';
	var newSock = new WebSocket(wsUrl, 'bts-bup');
	newSock.onclose = function() {onClose(newSock);};
	newSock.onopen = function() {onOpen(newSock);};
	newSock.onmessage = function(event) {onMessage(newSock, event);};
	socket = newSock;
	rescheduleInactivityTimeout();
}

function onClose(/*sock*/) {
	setTimeout(reconnect, RECONNECT_TIMEOUT);
	// While this is in beta, no display of errors yet.
	// network.errstate('btsh.ws', new Error('Lost WS connection to BTS'));
}

function onOpen(/*sock*/) {
	// While this is in beta, no display of errors yet.
	// network.errstate('btsh.ws', null); // TODO avoid resync
}

function send(sock, msg) {
	sock.send(JSON.stringify(msg));
}

function onMessage(sock, event) {
	try {
		var msg = JSON.parse(event.data);
	} catch(e) {
		send(sock, {
			type: 'error',

		});
		return;
	}
	switch (msg.type) {
	case 'error':
		report_problem.silent_error('BTS WebSocket received error report: ' + JSON.stringify(msg));
		break;
	case 'ping':
		var response = {
			type: 'pong',
		};
		if (msg.payload) {
			response.payload = msg.payload;
		}
		if (msg.battery) {
			response.battery = _bat_status();
		}
		send(response);
		break;
	default:
		report_problem.silent_error('Unhandled BTS WebSocket message ' + msg.type);
	}
}

return {
	init: init,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var report_problem = require('./report_problem');

	module.exports = btsws;
}
/*/@DEV*/
