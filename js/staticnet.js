// A pseudo-network interface for an event that is only changed locally
function staticnet(event, url) {
'use strict';

/* s, press */
function send_press(s) {
	sync(s);
}

function sync(s) {
	if (!event) {
		return;
	}

	var all_matches = event.matches;
	var nmatch;
	for (var i = 0;i < all_matches.length;i++) {
		var m = all_matches[i];
		if (s.setup.match_id === m.setup.match_id) {
			nmatch = all_matches[i];
		}
	}
	if (! nmatch) {
		// Manually created match
		return;
	}

	nmatch.network_score = calc.netscore(s);
	nmatch.presses_json = JSON.stringify(s.presses);
}

function list_matches(s, cb) {
	if (event) {
		cb(null, utils.deep_copy(event));
		return;
	}
	if (!event && url) {
		network.request('staticnet.download', {
			url: url,
			dataType: 'json',
		}).done(function(data) {
			var imported = importexport.load_data(s, data);
			event = imported.event;
			on_load_data(s);
			return cb(null, utils.deep_copy(event));
		}).fail(function(xhr) {
			var msg = s._('staticnet:error', {code: xhr.status});
			return cb({
				type: 'network-error',
				status: xhr.status,
				msg: msg,
			});
		});
	}
}

function courts(s) {
	return [{
		id: '1',
		description: s._('court:left'),
	}, {
		id: '2',
		description: s._('court:right'),
	}, {
		id: 'referee',
		description: s._('court:referee'),
	}];
}

function editable(s) {
	return s.event.editable !== false;
}

function on_edit_event(s) {
	event = s.event;
}

function service_name(s) {
	return s._('staticnet:service_name');
}

function staticnet_message(s) {
	if (event && event.staticnet_message) {
		return event.staticnet_message;
	}

	return s._('staticnet:switch back message');
}

function ui_init(s) {
	uiu.visible_qs('.setup_network_container', true);
	if (event) {
		on_load_data(s);
	}
}

function on_load_data(s) {
	var msg_container = uiu.qs('.setup_network_message');
	uiu.empty(msg_container);

	var snet_container = uiu.create_el(msg_container, 'div', {
		'class': 'staticnet_message',
	});

	uiu.create_el(snet_container, 'span', {}, staticnet_message(s));
	var real_netw = network.get_real_netw();
	if (!url && real_netw) {
		var button = uiu.create_el(snet_container, 'button', {
			role: 'button',
			'class': 'staticnet_switch_button',
		}, s._('staticnet:switch back button', {
			service: real_netw.service_name(s),
		}));
		click.on(button, function() {
			network.ui_uninstall_staticnet(s);
		});
	}
}

return {
	send_press: send_press,
	list_matches: list_matches,
	courts: courts,
	sync: sync,
	service_name: service_name,
	staticnet_message: staticnet_message,
	ui_init: ui_init,
	editable: editable,
	on_edit_event: on_edit_event,
};

}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc.js');
	var click = require('./click');
	var importexport = require('./importexport.js');
	var network = require('./network.js');
	var uiu = require('./uiu.js');
	var utils = require('./utils.js');

	module.exports = staticnet;
}
/*/@DEV*/
