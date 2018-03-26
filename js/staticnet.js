'use strict';

// A pseudo-network interface for an event that is only changed locally
function staticnet(event, url, fetcher) {

function swap_event(new_event) {
	event = new_event;
}

/* s, press */
function send_press(s) {
	sync(s);
}

function sync(s) {
	if (!event) {
		return;
	}

	if (s.settings.court_id === 'referee') {
		return;
	}

	if (event.courts) {
		var court = utils.find(event.courts, function(c) {
			return s.settings.court_id == c.court_id;
		});
		if (court) {
			court.match_id = s.setup.match_id;
		}
	}

	var nmatch = utils.find(event.matches, function(m) {
		return s.setup.match_id === m.setup.match_id;
	});
	if (! nmatch) {
		// Manually created match
		return;
	}

	nmatch.network_team1_serving = s.game.team1_serving;
	nmatch.network_score = calc.netscore(s);
	nmatch.presses_json = JSON.stringify(s.presses);
}

function list_matches(s, cb) {
	if (event) {
		cb(null, utils.deep_copy(event));
		return;
	}

	if (fetcher) {
		return fetcher(s, url, function(err, imported_event) {
			if (!err) {
				event = imported_event; 
				on_load_data(s);
			}
			cb(err, imported_event);
		});
	}

	if (url) {
		network.$request('staticnet.download', {
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

function list_all_players(s, cb) {
	list_matches(s, function(err, ev) {
		if (err) {
			return cb(err);
		}
		// TODO handle cases when all_players is missing, i.e. when loading from backup (autocompute)
		return cb(err, ev.all_players);
	});
}

function courts(s) {
	if (s.event && s.event.courts) {
		var res = s.event.courts.map(function(c) {
			return {
				id: c.court_id,
			};
		});
		res.push({
			id: 'referee',
			description: s._('court:referee'),
		});
		return res;
	}

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

function on_edit_event(s, cb) {
	eventutils.set_incomplete(s.event);
	event = s.event;
	cb();
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
	uiu.show_qs('.setup_network_container');
	if (event) {
		on_load_data(s);
	}
}

function on_load_data(s) {
	var msg_container = uiu.qs('.setup_network_message');
	uiu.empty(msg_container);

	var msg = staticnet_message(s);
	if (msg === 'none') {
		return;
	}

	var snet_container = uiu.el(msg_container, 'div', {
		'class': 'staticnet_message',
	});

	uiu.el(snet_container, 'span', {}, msg);
	var real_netw = network.get_real_netw();
	if (!url && real_netw) {
		var button = uiu.el(snet_container, 'button', {
			type: 'button',
			'class': 'staticnet_switch_button',
		}, s._('staticnet:switch back button', {
			service: real_netw.service_name(s),
		}));
		click.on(button, function() {
			network.ui_uninstall_staticnet(s);
		});
	}
}

function save_order(s, matches, cb) {
	var new_order = matches.map(function(m) {
		return m.setup.match_id;
	});
	event.matches.sort(function(m1, m2) {
		return utils.cmp(
			new_order.indexOf(m1.setup.match_id),
			new_order.indexOf(m2.setup.match_id)
		);
	});
	cb();
}

return {
	send_press: send_press,
	list_matches: list_matches,
	list_all_players: list_all_players,
	courts: courts,
	sync: sync,
	service_name: service_name,
	staticnet_message: staticnet_message,
	ui_init: ui_init,
	editable: editable,
	on_edit_event: on_edit_event,
	swap_event: swap_event,
	save_order: save_order,
};

}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc.js');
	var click = require('./click');
	var eventutils = require('./eventutils.js');
	var importexport = require('./importexport.js');
	var network = require('./network.js');
	var uiu = require('./uiu.js');
	var utils = require('./utils.js');

	module.exports = staticnet;
}
/*/@DEV*/
