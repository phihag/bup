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
	'2BLN-2017': '(002) 2. Bundesliga Nord',
};


function _render_login(res, message, username) {
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

` + (message ? ('<p class="fehler">' + httpd_utils.encode_html(message) + '</p>') : '') + `

<label>Benutzername: <input name="benutzername" type="text" placeholder="Benutzername" autofocus="autofocus"` +
	(username ? ' value="' + httpd_utils.encode_html(username) + '"' : '') +
`></label>
<label>Passwort: <input name="passwort" type="password" placeholder="Passwort"></label>
<button>anmelden</button>
</form>
</form>
</body>
</html>
`);
}

function _btde_players_string(players) {
	return players.map(p => {
		if (p.lastname) {
			return p.lastname + ', ' + p.firstname;
		}

		const m = /^(.*)\s+(\S+)$/.exec(p.name);
		assert(m);
		return m[2] + ', ' + m[1];
	}).join('~');
}

function options_middleware(real_handler) {
	return (req, res, pathname) => {
		const m = /^\/delay=([0-9]+)(\/.*)$/.exec(pathname);
		if (m) {
			req.btde_mock_delay = parseInt(m[1]);
			req.btde_mock_options_url = '/delay=' + m[1];
			pathname = m[2];
		}
		return real_handler(req, res, pathname);
	};
}

function delayed(real_handler) {
	return (req, res, pathname) => {
		if (req.btde_mock_delay) {
			setTimeout(real_handler, req.btde_mock_delay, req, res, pathname);
			return;
		}
		real_handler(req, res, pathname);
	};
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
	this.handler = options_middleware(httpd_utils.multi_handler([
		static_handler.file_handler('/ticker/bup/', miniserver.ROOT_DIR, 'bup.html'),
		delayed(httpd_utils.multi_handler([
			(...a) => this.write_handler(...a),
			httpd_utils.redirect_handler('/', 'ticker/login/'),
			(...a) => this.login_handler(...a),
			(...a) => this.logout_handler(...a),
			(...a) => this.start_handler(...a),

			(req, res, pathname) => {
				console.log('BTDE mock: error 404 ' + pathname);
				return httpd_utils.err(res, 404);
			},
		])),
	]));
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

do_login(req, res) {
	this.get_user(req, (err, user_info) => {
		if (err) return httpd_utils.send_err(res, err);

		if (user_info) {
			// When the user is already logged-in, login does nothing.
			// This is of course totally brain-dead since it prevents logging in as another user.
			// But we're just reproducing the real btde behavior here.
			return httpd_utils.redirect(res, 'start.php');
		}

		httpd_utils.read_post(req, (err, post_data) => {
			const u = bup.utils.find(this.users, su => su.name === post_data.benutzername);
			if (!u || (u.password !== post_data.passwort)) {
				return _render_login(res, 'Der Benutzername und das Passwort stimmen nicht überein.', post_data.benutzername);
			}

			// Successful login: set cookie
			const cookieval = JSON.stringify({user: u.name});
			httpd_utils.redirect(res, 'start.php', {
				'Set-Cookie': 'btde_mock_session=' + encodeURIComponent(cookieval),
			});
		});
	});
}

login_handler(req, res, pathname) {
	if (! ((pathname === '/ticker/login/') || (pathname === '/ticker/login/index.php'))) return 'unhandled';

	if (req.method === 'POST') {
		return this.do_login(req, res);
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
		const max_game_count = bup.calc.max_game_count(counting);
		if (!max_game_count) {
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
			gews: max_game_count,
			url: ev.report_urls[0],
		}];
		const by_court = new Map();
		for (const c of ev.courts) {
			if (c.match_id) {
				by_court.set(c.match_id, c.court_id);
			}
		}

		res.writeHead(200, {
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0',
			'Content-Type': 'text/html; charset=utf-8', // This is what is sent by the actual btde implementation!
			'Expires': 'Thu, 19 Nov 1981 08:52:00 GMT',
			'Pragma': 'no-cache',
		});

		let btde_id = 1;
		for (const m of ev.matches) {
			const court = by_court.get(m.setup.match_id) || 0;
			const btde_match = {
				id: ('' + btde_id),
				heim: _btde_players_string(m.setup.teams[0].players),
				gast: _btde_players_string(m.setup.teams[1].players),
				dis: m.setup.match_name,
				feld: court,
			};
			const netscore = m.network_score || [];
			for (let game_id = 0;game_id < max_game_count;game_id++) {
				const gscore = netscore[game_id] || ['', ''];
				btde_match['satz' + (game_id + 1)] = '' + gscore[0];
				btde_match['satz' + (max_game_count + game_id + 1)] = '' + gscore[1];
			}

			btdev.push(btde_match);

			btde_id++;
		}
		res.end(JSON.stringify(btdev));
	});
}

// callback gets only called if the user is logged in, with (err, user_info, user_data)
require_user(req, res, callback) {
	this.get_user(req, (err, user_info, user_data) => {
		if (err) return httpd_utils.send_err(res, err);

		if (! user_info) {
			return httpd_utils.redirect(res, '/btde' + (req.btde_mock_options_url || '') + '/ticker/login/');
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
