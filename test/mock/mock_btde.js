'use strict';

const AsyncLock = require('async-lock');

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const httpd_utils = require('./httpd_utils');

const data_dir = path.join(__dirname, 'mockdata');

class BTDEMock {

constructor() {
	this.lock = new AsyncLock();
	this.users = [{
		name: 'TVR',
		password: 'secret_TVR',
	}, {
		name: 'TVR2',
		password: '123456',
	}];
	this.data = {};
	this.handler = httpd_utils.multi_handler([
		httpd_utils.redirect_handler('/', 'ticker/login/'),
		this.login_handler,

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
	if (pathname != '/ticker/login/') return 'unhandled';

	const cookies = httpd_utils.parse_cookies(req);
	if (cookies.btde_mock_session) {
		const {user} = JSON.parse(cookies.btde_mock_session);
		this.fetch_data(user, (err) => {
			if (err) throw err;
			httpd_utils.redirect(res, 'start.php');
		});
		return;
	}

	httpd_utils.render_html(res, `<!DOCTYPE html>
<html lang="de">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" >
	<title>Login</title>
<style>
html, body {
	font-size: 25px;
}
label {display: block;margin: 0.5em 0;}
</style>
</head>
<body>
<h1>BADMINTONTICKER (mocking server)</h1>

<h2>Login</h2>

<form method="post">
<label>Benutzername: <input name="benutzername" type="text" placeholder="Benutzername" autofocus="autofocus"></label>
<label>Passwort: <input name="password" type="text" placeholder="Passwort"></label>
<button>anmelden</button>
</form>
</form>
</body>
</html>
`);

}


}

module.exports = {
	BTDEMock,
};
