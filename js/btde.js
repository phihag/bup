var btde = (function(baseurl) {
var ALL_COURTS = [{
	label: '1 (links)',
	court_id: '1',
	court_description: 'links'
}, {
	label: '2 (rechts)',
	court_id: '2',
	court_description: 'rechts'
}];

function ui_hide_login() {
	$('.settings_login_container').hide();
}

function ui_show_login() {
	var login_container = $('.settings_login_container');
	login_container.show();
	login_container.empty();

	var login_form = $('<form class="settings_login">');
	login_form.append($('<h2>Login badmintonticker</h2>'));
	var login_error = $('<div class="network_error"></div>');
	login_form.append(login_error);
	login_form.append($('<input name="benutzer" type="text" placeholder="Benutzername">'));
	login_form.append($('<input name="passwort" type="password" placeholder="Passwort">'));
	var login_button = $('<button class="login_button"/>');
	login_form.append(login_button);
	var loading_icon = $('<div class="default-invisible loading-icon" />');
	login_button.append(loading_icon);
	login_button.append($('<span>Anmelden</span>'));
	login_container.append(login_form);
	login_form.on('submit', function(e) {
		e.preventDefault();
		loading_icon.show();
		login_button.attr('disabled', 'disabled');

		$.ajax({
			dataType: 'text',
			url: baseurl + 'login/',
			method: 'POST',
			data: login_form.serializeArray(),
			contentType: 'application/x-www-form-urlencoded',
			timeout: settings.network_timeout,
		}).done(function(res) {
			loading_icon.hide();
			login_button.removeAttr('disabled');

			var m = /<div class="login">\s*<p class="rot">([^<]*)</.exec(res);
			var msg = 'Login fehlgeschlagen';
			if (m) {
				msg = m[1];
			} else if (/<div class="logout">/.exec(res)) {
				// Successful
				ui_hide_login();

				// resend pending requests
				$('#setup_network_matches .network_error').remove();
				ui_network_list_matches(state);

				return;
			}

			login_error.text(msg);
		}).fail(function(xhr) {
			var code = xhr.status;
			loading_icon.hide();
			login_button.removeAttr('disabled');
			login_error.text('Login fehlgeschlagen (Fehler ' + code + ')');
		});

		return false;
	});
}

function _request(options, cb) {
	options.dataType = 'text';
	options.timeout = settings.network_timeout;
	$.ajax(options).done(function(res) {
		if (/<div class="login">/.exec(res)) {
			ui_show_login();
			// TODO redo requests
			return cb('Login erforderlich', res);
		}
		return cb(null, res);
	});
}

function send_press(s, press) {
	if (press.type == '_start_match') {
		var post_data = {
			spiel: s.setup.btde_match_id,
			feld: settings.court_id,
		};
		_request({
			method: 'POST',
			url: baseurl + 'login/write.php',
			data: $.param(post_data),
			contentType: "application/x-www-form-urlencoded",
		}, function() {

		});
		return;
	}

	var netscore = network_calc_score(s);
	var post_data = {
		id: s.setup.btde_match_id,
		feld: settings.court_id,
	};
	netscore.forEach(function(score, game_idx) {
		post_data['satz' + (game_idx + 1)] = score[0];
		post_data['satz' + (3 + game_idx + 1)] = score[1];
	});
	for (var i = 1;i <= 6;i++) {
		if (post_data['satz' + i] === undefined) {
			post_data['satz' + i] = '';
		}
	}

	_request({
		method: 'POST',
		url: baseurl + 'login/write.php',
		data: JSON.stringify(post_data),
		contentType: "application/json; charset=utf-8",
	}, function() {

	});
}

function list_matches(s, cb) {
	var matches = [];

	_request({
		url: baseurl + 'login/punkte.php',
	}, function(err, html) {
		if (err) {
			return cb(err);
		}

		var m = /<table style="width:720px;">([\s\S]*?)<\/table>/.exec(html);
		if (! m) {
			return cb(null, []);
		}
		var table_html = m[1];

		m = /<td colspan="3">([^<]+?)\s*[0-9]+\s*:\s*[0-9]+\s*([^<]+?)<\/td>/.exec(table_html);
		var home_team_name = null;
		var away_team_name = null;
		if (m) {
			home_team_name = m[1];
			away_team_name = m[2];
		}

		var matches = [];
		var game_re = _multiline_regexp([
			/<td rowspan="2">([^<]+)<\/td>\s*/,
			/<td>([^\/,<]+),\s*([^\/,<]+)(?:\/([^\/,<]+),\s*([^\/,<]+))?<\/td>\s*/,
			/<td><input type="number" name="Satz1([^"]+)" placeholder="([0-9]*)"><\/td>\s*/,
			/<td><input type="number" name="Satz2[^"]+" placeholder="([0-9]*)"><\/td>\s*/,
			/<td><input type="number" name="Satz3[^"]+" placeholder="([0-9]*)"><\/td>\s*/,
			/<\/tr>\s*<tr>\s*/,
			/<td>([^\/,<]+),\s*([^\/,<]+)(?:\/([^\/,<]+),\s*([^\/,<]+))?<\/td>\s*/,
			/<td><input type="number" name="Satz4[^"]+" placeholder="([0-9]*)"><\/td>\s*/,
			/<td><input type="number" name="Satz5[^"]+" placeholder="([0-9]*)"><\/td>\s*/,
			/<td><input type="number" name="Satz6[^"]+" placeholder="([0-9]*)"><\/td>\s*/,
		], 'g');
		while (m = game_re.exec(table_html)) {
			var home_p1 = {
				firstname: m[3],
				lastname: m[2],
			};
			home_p1.name = home_p1.firstname + ' ' + home_p1.lastname;
			var home_team = {
				name: home_team_name,
				players: [home_p1],
			};
			if (m[4]) {
				var home_p2 = {
					firstname: m[5],
					lastname: m[4],
				};
				home_p2.name = home_p2.firstname + ' ' + home_p2.lastname;
				home_team.players.push(home_p2);
			}

			var away_p1 = {
				firstname: m[11],
				lastname: m[10],
			};
			away_p1.name = away_p1.firstname + ' ' + away_p1.lastname;
			var away_team = {
				name: away_team_name,
				players: [away_p1],
			};
			if (m[12]) {
				var away_p2 = {
					firstname: m[13],
					lastname: m[12],
				};
				away_p2.name = away_p2.firstname + ' ' + away_p2.lastname;
				away_team.players.push(away_p2);
			}

			matches.push({
				setup: {
					counting: '3x21',
					match_name: m[1],
					is_doubles: home_team.players.length == 2,
					teams: [home_team, away_team],
					btde_match_id: m[6],
					team_competition: true,
				}
			});
		}
		return cb(null, matches);
	});
}

function ui_init() {
	if (!baseurl) {
		baseurl = '../';
	}
	var m = window.location.pathname.match(/^(.*\/)[^\/]+\/bup(?:\/(?:bup\.html)?)?$/);
	if (m) {
		baseurl = m[1];
	}

	$('.setup_network_container').show();
	show_settings();

	var configured = ALL_COURTS.some(function(c) {
		return settings.court_id == c.court_id && settings.court_description == c.court_description;
	})
	if (! configured) {
		_ui_make_pick('Feld auswählen', ALL_COURTS, function(c) {
			settings.court_id = c.court_id;
			settings.court_description = c.court_description;
			settings_store();
			ui_settings_update();
		}, false, $('body'));
	}
}


return {
	ui_init: ui_init,
	send_press: send_press,
	list_matches: list_matches,
}

});