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
	};
	new_ws.onmessage = _handle_response;
	new_ws.onclose = function() {
		ws = null;
		console.log('closing; we should now open up a new conn, maybe wait for timeout?');
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
		_send_request(msg, cb);
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

function _send_request(msg, cb) {
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
	_request({
		type: 'event_set_players',
		event_id: event_id,
		backup_players: s.event.backup_players,
	}, function(response) {
		if (response.type === 'error') {
			report.silent_error('liveaw event_set_players failed: ' + response.msg);
		}
	});
}



function ui_render_login(container) {
	var login_form = $('<form class="settings_login">');
	login_form.append($('<h2>Login liveawr</h2>'));
	var login_error = $('<div class="network_error"></div>');
	login_form.append(login_error);
	login_form.append($('<input name="benutzer" type="text" placeholder="Benutzername">'));
	login_form.append($('<input name="passwort" type="password" placeholder="Passwort">'));
	var login_button = $('<button class="login_button"/>');
	login_form.append(login_button);
	var loading_icon = $('<div class="default-invisible loading-icon" />');
	login_button.append(loading_icon);
	login_button.append($('<span>Anmelden</span>'));
	container.append(login_form);
	login_form.on('submit', function(e) {
		e.preventDefault();
		loading_icon.show();
		login_button.attr('disabled', 'disabled');

		network.request('liveaw.login', {
			dataType: 'text',
			url: baseurl + 'login/',
			method: 'POST',
			data: login_form.serializeArray(),
			contentType: 'application/x-www-form-urlencoded',
			timeout: state.settings.network_timeout,
		}).done(function(res) {
			loading_icon.hide();
			login_button.removeAttr('disabled');

			var m = /<div class="login">\s*<p class="rot">([^<]*)</.exec(res);
			var msg = 'Login fehlgeschlagen';
			if (m) {
				msg = m[1];
			} else if (/<div class="logout">/.exec(res)) {
				// Successful
				network.errstate('all', null);
				return;
			}

			login_error.text(msg);
			network.errstate('liveaw.login', {
				msg: 'Login fehlgeschlagen',
			});
		}).fail(function(xhr) {
			var code = xhr.status;
			loading_icon.hide();
			login_button.removeAttr('disabled');
			login_error.text('Login fehlgeschlagen (Fehler ' + code + ')');
			network.errstate('liveaw.login', {
				msg: 'Login fehlgeschlagen (Fehler ' + code + ')',
			});
		});

		return false;
	});
}

function send_score(s) {
	if (s.settings.court_id === 'referee') {
		network.errstate('liveaw.score', null);
		return;
	}

	// TODO 

}

function sync(s) {
	var netscore = network.calc_score(s);
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
	ui_render_login: ui_render_login,
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
	var utils = require('./utils');
	var network = require('./network');

	module.exports = liveaw;
}
/*/@DEV*/
