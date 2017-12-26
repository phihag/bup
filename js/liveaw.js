function liveaw(event_id) {
'use strict';

var ws;
var handlers = {};
var outstanding_requests = [];

function connect() {
	var wsurl = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.hostname + (location.port ? ':' + location.port: '')  + '/ws/bup';
	var new_ws = new WebSocket(wsurl, 'liveaw-bup');
	new_ws.onopen = function() {
		ws = new_ws;
		for (var i = 0;i < outstanding_requests.length;i++) {
			_send_request(outstanding_requests[i]);
		}
		network.errstate('liveaw.conn', null);
	};
	new_ws.onmessage = _handle_response;
	new_ws.onclose = function() {
		network.errstate('liveaw.conn', state._('liveaw:lost connection'));
		ws = null;
		connect();
	};
}

var next_request_id = 1;
function _request(msg, cb) {
	msg.request_id = next_request_id;
	next_request_id++;
	handlers[msg.request_id] = cb;
	outstanding_requests.push(msg);
	if (ws) {
		_send_request(msg);
	}
}

function _handle_response(ws_message) {
	var msg = JSON.parse(ws_message.data);
	if (! msg.request_id) {
		report_problem.silent_error('liveaw: Response without request_id: ' + ws_message.data);
		return;
	}
	var handler = handlers[msg.request_id];
	if (!handler) {
		report_problem.silent_error('liveaw: No handler for request ' + msg.request_id);
		return;
	}

	for (var i = 0;i < outstanding_requests.length;i++) {
		if (outstanding_requests[i].request_id === msg.request_id) {
			outstanding_requests.splice(i, 1);
			break;
		}
	}

	handler(msg);
	delete handlers[msg.request_id];
}

function _send_request(msg) {
	ws.send(JSON.stringify(msg));
}

function list_matches(s, cb) {
	_request({
		type: 'event_get',
		event_id: event_id,
	}, function(response) {
		if (response.type === 'error') {
			cb(new Error(response.msg));
			return;
		}

		cb(null, response.event);
	});
}

function on_edit_event(s) {
	var match_players = s.event.matches.reduce(function(prev, match) {
		var setup = match.setup;
		prev[setup.liveaw_match_id] = [setup.teams[0].players, setup.teams[1].players];
		return prev;
	}, {});

	_request({
		type: 'event_set_players',
		event_id: event_id,
		match_players: match_players,
		backup_players: s.event.backup_players,
	}, function(response) {
		if (response.type === 'error') {
			report_problem.silent_error('liveaw event_set_players failed: ' + response.msg);
		}
	});
}

function send_score(s) {
	if (s.settings.court_id === 'referee') {
		network.errstate('liveaw.score', null);
		return;
	}

	_request({
		type: 'set-presses',
		match_id: s.setup.liveaw_match_id,
		presses: s.presses,
	}, function(response) {
		var err = (response.type == 'error') ? response : null;
		network.errstate('liveaw.send_score', err);
	});
}

function sync(s) {
	var netscore = calc.netscore(s);
	if ((s.settings.court_id != s.remote.liveaw_court) || !utils.deep_equal(netscore, s.remote.liveaw_score)) {
		send_score(s);
	}
}

/* s, press */
function send_press(s) {
	if (!s.setup.liveaw_match_id) {
		// Manually created match
		return;
	}
	sync(s);
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

function ui_init() {
	connect();
}

function service_name() {
	return 'liveaw';
}

/* Parameter: s */
function editable() {
	return true;
}

return {
	ui_init: ui_init,
	send_press: send_press,
	list_matches: list_matches,
	on_edit_event: on_edit_event,
	sync: sync,
	courts: courts,
	service_name: service_name,
	editable: editable,
};

}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var network = require('./network');
	var report_problem = require('./report_problem');
	var utils = require('./utils');

	module.exports = liveaw;
}
/*/@DEV*/
