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

function _request(options, cb) {
	// TODO test for login
	options.dataType = 'text';
	$.ajax(options).done(function(res) {
		return cb(res);
	});
}

function network_calc_score(s) {
	var score = [];
	s.match.finished_games.forEach(function(fg) {
		score.push(fg);
	});
	score.push(s.game.score);
	// TODO resigning/retiring belongs here
	return score;
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
	}, function(html) {
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