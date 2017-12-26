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

const BTDE_LEAGUE_NAME = {
	'1BL-2017': '(001) 1. Bundesliga',
};


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
<label>Passwort: <input name="passwort" type="password" placeholder="Passwort"></label>
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
		(...a) => this.write_handler(...a),
		httpd_utils.redirect_handler('/', 'ticker/login/'),
		(...a) => this.login_handler(...a),
		(...a) => this.logout_handler(...a),
		(...a) => this.start_handler(...a),
		static_handler.file_handler('/ticker/bup/', miniserver.ROOT_DIR, 'bup.html'),

		(req, res, pathname) => {
			console.log('BTDE mock: unhandled ', pathname);
		},
	]);
}

fetch_data(user, callback) {
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
			if (!u || (u.password !== post_data.passwort)) {
				return _render_login(res, 'Der Benutzername und das Passwort stimmen nicht überein.');
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
			if (err) return httpd_utils.send_err(res, err);
			httpd_utils.redirect(res, 'start.php');
		});
		return;
	}

	_render_login(res);
}

logout_handler(req, res, pathname) {
	if (pathname != '/ticker/login/logout.php') return 'unhandled';

	this.require_user(req, res, (err) => {
		if (err) return httpd_utils.send_err(res, err);

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
		if (err) return httpd_utils.send_err(res, err);

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

<a id="bup" class="button" href="../bup/#btde" target="_blank">Badminton Umpire Panel</a>

</body>
</html>
`);
	});
}

write_handler(req, res, pathname) {
	if (pathname !== '/ticker/login/write.php') return 'unhandled';

	this.get_user(req, (err, user_info, user_data) => {
		if (err) return httpd_utils.send_err(res, err);

		if (! user_info) {
			return httpd_utils. redirect(res, 'index.php', {
				'Access-Control-Allow-Origin': '*',
			});
		}

		const ev = user_data.event;
		const btde_league_name = BTDE_LEAGUE_NAME[ev.league_key];
		if (!btde_league_name) {
			return httpd_utils.send_err(res,
				new Error(
					'Invalid league key of user ' + user_info.name + ': ' + JSON.stringify(ev.league_key)));
		}

		const counting = ev.counting || bup.eventutils.default_counting(ev.league_key);
		const btde_gews = bup.calc.max_game_count(counting);
		if (!btde_gews) {
			return httpd_utils.send_err(res,
				new Error(
					'Invalid counting ' + counting + ', derived from ' + ev.league_key));
		}

		const btdev = [{
			liga: btde_league_name,
			spieltag: ('' + ev.matchday),
			datum: ev.date + ' ' + ev.starttime,
			heim: ev.team_names[0],
			gast: ev.team_names[1],
			ort: ev.location,
			gews: btde_gews,
			url: ev.report_urls[0],
		}];

		res.writeHead(200, {
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0',
			'Content-Type': 'text/html; charset=utf-8', // This is what is sent by the actual btde implementation!
			'Expires': 'Thu, 19 Nov 1981 08:52:00 GMT',
			'Pragma': 'no-cache',
		});
		res.end(JSON.stringify(btdev));

		// [{"id":"1","dis":"HD1","heim":"Beck, Raphael~V\u00f6lker, Jan-Colin","gast":"Krasimir, Yankov~Heumann, Manuel","satz1":"11","satz2":"11","satz3":"12","satz4":"","satz5":"","satz6":"2","satz7":"8","satz8":"10","satz9":"","satz10":"","feld":"0"},{"id":"2","dis":"DD","heim":"Nelte, Carla~Svensson, Elin","gast":"Voytsekh, Natalya~Stankovic, Kaja","satz1":"11","satz2":"5","satz3":"11","satz4":"4","satz5":"11","satz6":"8","satz7":"11","satz8":"8","satz9":"11","satz10":"4","feld":"0"},{"id":"3","dis":"HD2","heim":"Schwenger, Max~Nyenhuis, Denis","gast":"Wadenka, Tobias~Beier, Daniel","satz1":"12","satz2":"11","satz3":"8","satz4":"11","satz5":"11","satz6":"14","satz7":"3","satz8":"11","satz9":"2","satz10":"3","feld":"0"},{"id":"4","dis":"HE1","heim":"Waldenberger, Kai","gast":"Wadenka, Tobias","satz1":"10","satz2":"5","satz3":"11","satz4":"11","satz5":"8","satz6":"12","satz7":"11","satz8":"5","satz9":"7","satz10":"11","feld":"0"},{"id":"5","dis":"DE","heim":"Svensson, Elin","gast":"Voytsekh, Natalya","satz1":"12","satz2":"4","satz3":"6","satz4":"11","satz5":"","satz6":"10","satz7":"11","satz8":"11","satz9":"13","satz10":"","feld":"0"},{"id":"6","dis":"GD","heim":"Nelte, Carla~Schwenger, Max","gast":"Stankovic, Kaja~Heumann, Manuel","satz1":"11","satz2":"11","satz3":"11","satz4":"","satz5":"","satz6":"9","satz7":"9","satz8":"5","satz9":"","satz10":"","feld":"1"},{"id":"7","dis":"HE2","heim":"V\u00f6lker, Jan-Colin","gast":"Krasimir, Yankov","satz1":"6","satz2":"2","satz3":"8","satz4":"","satz5":"","satz6":"11","satz7":"11","satz8":"11","satz9":"","satz10":"","feld":"2"}]
	});
}

// callback gets only called if the user is logged in, with (err, user_info, user_data)
require_user(req, res, callback) {
	this.get_user(req, (err, user_info, user_data) => {
		if (err) return httpd_utils.send_err(res, err);

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
