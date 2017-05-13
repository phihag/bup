'use strict';

var refmode_push_netw = (function(initial_event) {
var ev = {};

function send_press(s) {
	sync(s);
}

function sync() {
	// Do nothing, this is already handled by the referee subscribing to us
}

function list_matches(s, cb) {
	cb(null, utils.deep_copy(ev));
}

function service_name() {
	return 'refmode push';
}

function editable() {
	return false; // edit on the referee
}

function courts(s) {
	var res;
	if (ev.courts) {
		res = ev.courts.map(function(c) {
			return {
				id: c.court_id,
				description: c.description,
			};
		});
	} else {
		res = [{
			id: '1',
			description: s._('court:left'),
		}, {
			id: '2',
			description: s._('court:right'),
		}];
	}

	res.push({
		id: 'referee',
		description: s._('court:referee'),
	});
	return res;
}

function ui_init() {
	// Nothing to do, it's all already initialized
}

function set_from_event(sent_ev) {
	eventutils.set_metadata(sent_ev);
	ev = sent_ev;
}

function update(msg) {
	if (msg.dtype === 'push_event') {
		set_from_event(msg.event);
	} else if (msg.dtype === 'push_presses') {
		var m = utils.find(ev.matches, function (m) {
			return m.setup.match_id === msg.match_id;
		});
		if (m) {
			m.presses = msg.presses;
			eventutils.set_metadata(ev);
		}
	}
}

set_from_event(initial_event);

return {
	send_press: send_press,
	list_matches: list_matches,
	courts: courts,
	sync: sync,
	service_name: service_name,
	ui_init: ui_init,
	editable: editable,
	update: update,
};

});

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var eventutils = require('./eventutils');
	var utils = require('./utils');

	module.exports = refmode_push_netw;
}
/*/@DEV*/
