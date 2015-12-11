var p2p = (function() {
'use strict';

var SIGNALLING_WSURL = 'wss://live.aufschlagwechsel.de/ws/bup-p2p';
var events = {};

function register() {
	var exampleSocket = new WebSocket(SIGNALLING_WSURL, 'bup-p2p');
	
}

/* Arguments: s (state) */
function ui_init() {
	register();
}

return {
	ui_init: ui_init,
};

});

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = p2p;
}
/*/@DEV*/