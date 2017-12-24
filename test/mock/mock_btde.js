'use strict';

const AsyncLock = require('async-lock');

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const httpd_utils = require('./httpd_utils');
const miniserver = require('./miniserver');
const static_handler = require('./static_handler');

const bup = require('../../js/bup');

const data_dir = path.join(__dirname, 'mockdata');


function _render_login(res, message) {
	httpd_utils.render_html(res, `<!DOCTYPE html>
<html lang="de">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" >
	<title>Login</title>
<style>
html, body {
	font-size: 25px;
}
.fehler {
	color: red;
}
label {display: block;margin: 0.5em 0;}
</style>
</head>
<body>
<h1>BADMINTONTICKER (mocking server)</h1>

<h2>Login</h2>
<form method="post">

` + (message ? ('<p class="fehler">' + message + '</p>') : '') + `

<label>Benutzername: <input name="benutzername" type="text" placeholder="Benutzername" autofocus="autofocus"></label>
<label>Passwort: <input name="password" type="password" placeholder="Passwort"></label>
<button>anmelden</button>
</form>
</form>
</body>
</html>
`);
}

class BTDEMock {

constructor() {
	this.lock = new AsyncLock();
	this.users = [{
		name: 'TVR',
		longname: 'TV Refrath',
		password: 'secret_TVR',
	}, {
		name: 'TVR2',
		longname: 'TV Refrath 2',
		password: '123456',
	}];
	this.data = {};
	this.handler = httpd_utils.multi_handler([
		httpd_utils.redirect_handler('/', 'ticker/login/'),
		(...a) => this.login_handler(...a),
		(...a) => this.logout_handler(...a),
		(...a) => this.start_handler(...a),
		static_handler.file_handler('/ticker/login/bup/', miniserver.ROOT_DIR),

		(req, res, pathname) => {
			console.log('BTDE mock: unhandled ', pathname);
		},
	]);
}

fetch_data (user, callback) {
	if (!/^[a-zA-Z0-9]+$/.test(user)) {
		throw new Error('Invalid user');
	}

	this.lock.acquire(user, (cb) => {
		if (this.data[user]) {
			cb(null, this.data[user]);
			return;
		}

		const user_fn = path.join(data_dir, 'btde_' + path.basename(user) + '.json');
		fs.readFile(user_fn, 'utf8', (err, user_json) => {
			if (err) return cb(err);

			const event = JSON.parse(user_json).event;
			assert(event);
			const user_data = {event};
			this.data[user] = user_data;
			return cb(null, user_data);
		});
	}, callback);
}

login_handler(req, res, pathname) {
	const users = this.users;
	if (! ((pathname === '/ticker/login/') || (pathname === '/ticker/login/index.php'))) return 'unhandled';

	if (req.method === 'POST') {
		httpd_utils.read_post(req, (err, post_data) => {
			const u = bup.utils.find(users, su => su.name === post_data.benutzername);
			if (!u || (u.password !== post_data.password)) {
				return _render_login(res, 'Der Benutzername und das Passwort stimmen nicht überein');
			}

			// Successful login: set cookie
			const cookieval = JSON.stringify({user: u.name});
			httpd_utils.redirect(res, 'start.php', {
				'Set-Cookie': 'btde_mock_session=' + encodeURIComponent(cookieval),
			});
		});
		return;
	}

	const cookies = httpd_utils.parse_cookies(req);
	if (cookies.btde_mock_session) {
		const {user} = JSON.parse(cookies.btde_mock_session);
		this.fetch_data(user, (err) => {
			if (err) throw err;
			httpd_utils.redirect(res, 'start.php');
		});
		return;
	}

	_render_login(res);
}

logout_handler(req, res, pathname) {
	if (pathname != '/ticker/login/logout.php') return 'unhandled';

	this.require_user(req, res, (err) => {
		if (err) throw err;

		httpd_utils.render_html(res, `<!DOCYTPE html>

<p><b>Die Abmeldung war erfolgreich.</b></p>

<p><a href="index.php">Zur Anmeldung</a></p>
`, {
			'Set-Cookie': 'btde_mock_session=',
		});
	});
}


start_handler(req, res, pathname) {
	if (pathname !== '/ticker/login/start.php') return 'unhandled';

	this.require_user(req, res, (err, user_info) => {
		if (err) throw err;

		httpd_utils.render_html(res, `<!DOCTYPE html>
<html lang="de">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body>

<h1>badmintonticker: ` + httpd_utils.encode_html(user_info.longname || user_info.name) + `</h1>

<div class="logout">
<a href="logout.php">Abmelden</a>
</div>

</body>
</html>
`);
	});
}

write_handler(req, res, pathname) {
	// TODO get_user
	if (!user) {
		redirect(res, 'index.php', {
			'Access-Control-Allow-Origin': '*',
		});
	}
}

// callback gets only called if the user is logged in, with (err, user_info, user_data)
require_user(req, res, callback) {
	this.get_user((err, user_info, user_data) => {
		if (err) throw err;

		if (! user_info) {
			return httpd_utils.redirect(res, '/btde/ticker/login/');
		}

		return callback(err, user_info, user_data);
	});
}

// callback gets called with (err, user_info, user_data)
get_user(req, callback) {
	const cookies = httpd_utils.parse_cookies(req);
	if (!cookies.btde_mock_session) {
		return callback();
	}

	const req_user_name = JSON.parse(cookies.btde_mock_session).user;
	const user_info = bup.utils.find(this.users, su => su.name === req_user_name);
	if (!user_info) {
		return callback();
	}

	this.fetch_data(user_info.name, (err, user_data) => {
		if (err) return callback(err);

		if (user_data) {
			callback(null, user_info, user_data);
		} else {
			callback();
		}
	});
}

}

module.exports = {
	BTDEMock,
};
