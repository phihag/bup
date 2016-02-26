function lawr(lawr_event_id, baseurl) {
'use strict';

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

		network.request('lawr.login', {
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
			network.errstate('lawr.login', {
				msg: 'Login fehlgeschlagen',
			});
		}).fail(function(xhr) {
			var code = xhr.status;
			loading_icon.hide();
			login_button.removeAttr('disabled');
			login_error.text('Login fehlgeschlagen (Fehler ' + code + ')');
			network.errstate('lawr.login', {
				msg: 'Login fehlgeschlagen (Fehler ' + code + ')',
			});
		});

		return false;
	});
}

function _request(s, component, options, cb) {
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
		network.errstate('lawr.score', null);
		return;
	}

	var netscore = network.calc_score(s);

	if (outstanding_requests > 0) {
		// Another request is currently underway; ours may come to late
		// Send our request anyways, but send it once again as soon as there are no more open requests
		s.remote.lawr_resend = true;
	}
	outstanding_requests++;
	var match_id = s.metadata.id;

	var post_data = {
		presses: s.presses,
	};

	_request(s, 'lawr.score', {
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
			s.remote.lawr_score = netscore;
			s.remote.lawr_court = s.settings.court_id;
		}
		network.errstate('lawr.score', err);

		if (s.remote.lawr_resend && outstanding_requests === 0) {
			s.remote.lawr_resend = false;
			send_score(s);
		}
	});
}

function sync(s) {
	var netscore = network.calc_score(s);
	if ((s.settings.court_id != s.remote.lawr_court) || !utils.deep_equal(netscore, s.remote.lawr_score)) {
		send_score(s);
	}
}

/* s, press */
function send_press(s) {
	if (!s.setup.lawr_match_id) {
		// Manually created match
		return;
	}
	sync(s);
}

function list_matches(s, cb) {
	_request(s, 'lawr.list', {
		url: baseurl + 'e/' + lawr_event_id + '/json',
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
	return 'lawr';
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

	_request(s, 'lawr.editevent', {
		method: 'POST',
		url: baseurl + 'e/' + lawr_event_id + '/editevent',
		data: JSON.stringify(post_data),
		contentType: 'application/json; charset=utf-8',
	}, function(err) {
		network.errstate('lawr.editevent', err);
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

	module.exports = lawr;
}
/*/@DEV*/
