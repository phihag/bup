'use strict';

var refmode_referee = (function() {
// TODO add show / hide

/*
function connect() {
	var wsurl = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.hostname + (location.port ? ':' + location.port: '')  + '/ws/bup';
	var new_ws = new WebSocket(wsurl, 'bup-refmode');
	new_ws.onopen = function() {
		ws = new_ws;
		for (var i = 0;i < outstanding_requests.length;i++) {
			_send_request(outstanding_requests[i]);
		}
		network.errstate('refmode.client.ws', null);
	};
	new_ws.onmessage = _handle_response;
	new_ws.onclose = function() {
		network.errstate('refmode.client.ws', state._('refmode:lost connection'));
		ws = null;
		connect();
	};
}
*/

return {

};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = refmode_referee;
}
/*/@DEV*/
