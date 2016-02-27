function liveaw(liveaw_event_id, baseurl) {
'use strict';

/*
function liveaw_contact(cb) {
	var wsurl = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.hostname + (location.port ? ':' + location.port: '')  + '/ws/bup';
	var ws = new WebSocket(wsurl, 'liveaw-bup');
	ws.onopen = function() {
		cb(null, ws);
	};
	ws.onmessage = function(ws_message) {
		var msg = JSON.parse(ws_message.data);
		if (! msg.request_id) {
			// Not an answer, ignore for now
			return;
		}
		if (state.liveaw.handlers[msg.request_id]) {
			if (! state.liveaw.handlers[msg.request_id](msg)) {
				delete state.liveaw.handlers[msg.request_id];
			}
		} else {
			control.show_error('No handler for request ' + msg.request_id);
		}
	};
}

function _liveaw_request(msg, cb) {
	msg.request_id = state.liveaw.next_request_id;
	state.liveaw.next_request_id++;
	state.liveaw.handlers[msg.request_id] = cb;
	state.liveaw.ws.send(JSON.stringify(msg));
}

*/

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

function _request(s, component, options, cb) {
	var csrf_token = utils.readCookie('_csrf');
	if (csrf_token) {
		options.url += (
			((options.url.indexOf('?') >= 0) ? '&' : '?') +
			'_csrf=' + encodeURIComponent(csrf_token)
		);
	}
	options.dataType = 'text';
	options.timeout = s.settings.network_timeout;
	network.request(component, options).done(function(res) {
		if (/<div class="login">/.exec(res)) {
			return cb({
				type: 'login-required',
				msg: 'Login erforderlich',
			}, res);
		}
		return cb(null, res);
	}).fail(function(xhr) {
		var msg = ((xhr.status === 0) ?
			'badmintonticker nicht erreichbar' :
			('Netzwerk-Fehler (Code ' + xhr.status + ')')
		);
		return cb({
			type: 'network-error',
			status: xhr.status,
			msg: msg,
		});
	});
}

var outstanding_requests = 0;
function send_score(s) {
	if (s.settings.court_id === 'referee') {
		network.errstate('liveaw.score', null);
		return;
	}

	var netscore = network.calc_score(s);

	if (outstanding_requests > 0) {
		// Another request is currently underway; ours may come to late
		// Send our request anyways, but send it once again as soon as there are no more open requests
		s.remote.liveaw_resend = true;
	}
	outstanding_requests++;
	var match_id = s.metadata.id;

	var post_data = {
		presses: s.presses,
	};

	_request(s, 'liveaw.score', {
		method: 'POST',
		url: baseurl + 'TODO',
		data: JSON.stringify(post_data),
		contentType: 'application/json; charset=utf-8',
	}, function(err) {
		outstanding_requests--;
		if (!s.metadata || (s.metadata.id !== match_id)) { // Match changed while the request was underway
			return;
		}

		if (!err) {
			s.remote.liveaw_score = netscore;
			s.remote.liveaw_court = s.settings.court_id;
		}
		network.errstate('liveaw.score', err);

		if (s.remote.liveaw_resend && outstanding_requests === 0) {
			s.remote.liveaw_resend = false;
			send_score(s);
		}
	});
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

function list_matches(s, cb) {
	_request(s, 'liveaw.list', {
		url: baseurl + 'e/' + liveaw_event_id + '/json',
	}, function(err, json) {
		if (err) {
			return cb(err);
		}

		var data;
		try {
			data = JSON.parse(json);
		} catch (e) {
			return cb({
				msg: 'Aktualisierung fehlgeschlagen: Server-Fehler erkannt',
			});
		}
		return cb(null, data.event);
	});
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
	if (!baseurl) {
		baseurl = '../';
	}
	var m = window.location.pathname.match(/^(.*\/)bup\/(?:bup\.html|index\.html)?$/);
	if (m) {
		baseurl = m[1];
	}
}

function service_name() {
	return 'liveaw';
}

/* Parameter: s */
function editable() {
	return true;
}

function on_edit_event(s) {
	// TODO send something
	var post_data = {
		event: s.event,
	};

	_request(s, 'liveaw.editevent', {
		method: 'POST',
		url: baseurl + 'e/' + liveaw_event_id + '/editevent',
		data: JSON.stringify(post_data),
		contentType: 'application/json; charset=utf-8',
	}, function(err) {
		network.errstate('liveaw.editevent', err);
	});
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
