// A pseudo-network interface for an empty event
function staticnet(event) {
'use strict';

/* s, press */
function send_press() {
	// Nothing to do, since we're not an actual network
}

function sync() {
	// Nothing to do, since we're not an actual network	
}

function list_matches(s, cb) {
	cb(null, event);
}

function courts() {
	return null; // No restrictions
}

// Unused param: s
function service_name() {
	return 'staticnet:service_name';
}

return {
	send_press: send_press,
	list_matches: list_matches,
	courts: courts,
	sync: sync,
	service_name: service_name,
};

}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = staticnet;
}
/*/@DEV*/
