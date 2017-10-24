<?php
require 'utils.php';
setup_error_handler();

function _param($name) {
	if (!isset($_GET[$name])) {
		header('HTTP/1.1 400 Bad Request');
		header('Content-Type: text/plain');
		echo 'Missing ' . $name;
		exit();
	}
	return $_GET[$name]; // TODO switch back to POST
}

function login($jar, $user, $password) {
	// Download login form
	$login_url = 'https://www.turnier.de/member/login.aspx';
	$f = fopen($login_url, 'r');
	if ($f === false) {
		return json_err('Failed to download login form');
	}
	$jar->read_from_stream($f);
	$login_page = stream_get_contents($f);
	fclose($f);

	$LOGIN_RE = '/<form method="post" action="[^"]*login\.aspx"[^>]*>(.*?)<\/form>/s';
	if (!preg_match($LOGIN_RE, $login_page, $matches)) {
		json_err('Cannot find login form');
	}
	$login_form = $matches[1];

	if (!preg_match_all('/<input\s+type="(?:hidden|submit)"\s+name="([^"]*)"(?:\s+id="[^"]*")?\s+value="([^"]+)"/', $login_form, $matches, \PREG_SET_ORDER)) {
		json_err('Failed to find hidden login fields');
	}
	$data = [];
	foreach ($matches as $m) {
		$data[$m[1]] = $m[2];
	}
	$data['ctl00$ctl00$ctl00$cphPage$cphPage$cphPage$pnlLogin$UserName'] = $user;
	$data['ctl00$ctl00$ctl00$cphPage$cphPage$cphPage$pnlLogin$Password'] = $password;

	// Perform login
	$header = (
		'Referer:' . $login_url . "\r\n" .
		"Content-type: application/x-www-form-urlencoded\r\n" .
		$jar->make_header()
	);
	$options = [
		'http' => [
			'header'  => $header,
			'method'  => 'POST',
			'content' => \http_build_query($data),
			'follow_location' => 0,
		],
	];
	$context = stream_context_create($options);
	$f = fopen($login_url, 'r', false, $context);
	if ($f === false) {
		return json_err('Failed to perform login');
	}
	$jar->read_from_stream($f);
	$postlogin_page = stream_get_contents($f);
	fclose($f);

	if (\preg_match('/<span class="error">(.*?)<\/span>/', $postlogin_page, $m)) {
		json_err('Login failed: ' . $m[1]);
	}
}

function parse_team($html, $team_num) {
	if (!preg_match('/var Team' . $team_num . 'PlayerArray = (\[.*\]);/', $html, $m)) {
		json_err('Cannot find players of team ' . $team_num);
	}
	$team_js = str_replace("'", '"', $m[1]);
	$team_json = preg_replace('/([a-zA-z0-9]+):/', '"\1":', $team_js);
	$team_data = json_decode($team_json, true);
	$players_data = array_filter($team_data, function($pd) {
		return strpos($pd['Name'], 'unbekannt') === false;
	});

	$players = array_map(function($pd) {
		if (!preg_match('/^([0-9]+)-([0-9]+)(?:-(D[0-9]+))? ([^,]+), ([^(]+?) \([^)]+\)$/', $pd['Name'], $m)) {
			json_err('Cannot parse player spec ' . json_encode($pd['Name']));
		}

		$res = [
			'ranking_team' => $m[1],
			'ranking' => $m[2],
			'tde_id' => $pd['ID'],
			'gender' => (($pd['GenderID'] === 1) ? 'm' : 'f'),
			'name' => $m[5] . ' ' . $m[4],
		];
		if ($m[3]) {
			$res['ranking_d'] = $m[3];
		}
		return $res;
	}, $players_data);
	return $players;
}

function _find($ar, $cb) {
	foreach ($ar as $el) {
		if (call_user_func($cb, $el)) {
			return $el;
		}
	}
	return null;
}

if (!isset($_GET['action'])) {
	throw new \Exception('Missing action');
}
$action = $_GET['action'];

if (($action === 'prepare') || ($action === 'submit')) {
	$user = _param('user');
	$password = _param('password');
	$url = _param('url');
	if (!\preg_match('/^https:\/\/www\.turnier\.de\/sport\/teammatch\.aspx\?id=([-A-Fa-f0-9]+)&match=([0-9]+)$/', $url, $m)) {
		json_err('Unsupported URL ' . $url);
	}
	$tde_id = $m[1];
	$tde_tm = $m[2];
	$team_names = \json_decode(_param('team_names'), true);
	$matches = \json_decode(_param('matches_json'), true);
	$max_game_count = \intval(_param('max_game_count'));

	$jar = new CookieJar();
	login($jar, $user, $password);

	$input_url = 'https://www.turnier.de/sport/matchresult.aspx?id=' . $tde_id . '&match=' . $tde_tm;
	$options = [
		'http' => [
			'header'  => $jar->make_header(),
			'follow_location' => 0,
		],
	];
	$context = stream_context_create($options);
	$f = fopen($input_url, 'r', false, $context);
	if ($f === false) {
		return json_err('Failed to download input page');
	}
	$jar->read_from_stream($f);
	$input_page = stream_get_contents($f);
	fclose($f);

	if (!preg_match('/"ALCID":([0-9]+)/', $input_page, $m)) {
		json_err('Cannot find ALCID');
	}
	$alcid = $m[1];

	// Check team names
	if (!preg_match('/Eingabe Ergebnis für:\s+<a[^>]+>(.*?)\s*<span class="nobreak">[^<]*<\/span><\/a> - <a[^>]+>(.*?)\s*<span class="nobreak">/', $input_page, $m)) {
		json_err('Cannot find team names');
	}
	$real_team_names = [$m[1], $m[2]];
	if (($team_names[0] !== $real_team_names[0]) || ($team_names[1] !== $real_team_names[1])) {
		json_err('Incorrect team names: This match URL points to ' . $real_team_names[0] . ' - ' . $real_team_names[1] . ', but expected ' . $team_names[0] . ' - ' . $team_names[1]);
	}

	$real_players = [
		parse_team($input_page, '1'),
		parse_team($input_page, '2')
	];
	if (! preg_match_all('/<th class="valign_middle">([A-Z0-9]+)<\/th><td[^>]*><select id="match_([0-9]+)_t1p1"/', $input_page, $ms, \PREG_SET_ORDER)) {
		json_err('Canot find matches');
	}
	$real_matches = array_map(function($m) {
		return [
			'name' => $m[1],
			'tde_id' => $m[2],
		];
	}, $ms);

	if (\count($real_matches) !== \count($matches)) {
		json_err('Expected to write ' . \count($matches) . ', but the service expects ' . \count($real_matches));
	}

	// Check that all matches are correct
	foreach ($matches as &$match)  {
		if (!$match['name']) {
			json_err('Missing match name');
		}
		$rm = _find($real_matches, function($rm) use($match) {
			return $rm['name'] === $match['name'];
		});
		if (!$rm) {
			json_err('Could not find match ' . $match['name'] . ' online');
		}
		$match['tde_id'] = $rm['tde_id'];
		if (! $match['winner_code']) {
			json_err('Invalid winner_code for ' . $match['name']);
		}

		foreach ($match['players'] as $team_id=>&$team) {
			foreach ($team as &$player) {
				$rp = _find($real_players[$team_id], function($rp) use ($player) {
					return $rp['name'] === $player['name'];
				});
				if (!$rp) {
					$avp = implode(', ', array_map(function($rp) {
						return $rp['name'];
					}, $real_players[$team_id]));
					json_err('Cannot find player ' . $player['name'] . ' in team ' . $team_id . ' . All known players are ' . $avp);
				}
				$player['tde_id'] = $rp['tde_id'];
			}
		}

		$score_strs = [];
		for ($i = 0;$i < $max_game_count;$i++) {
			if (\array_key_exists($i, $match['score'])) {
				$score = $match['score'][$i];
				$score_strs[] = $score[0] . '-' . $score[1];
			}
		}
		$match['score_strs'] = $score_strs;
	}

	if ($action === 'prepare') {
		// TODO return extra fields
		send_json([
			'matches' => $matches,
		]);
	} else { // submit
		$sub_matches = \array_map(function($rm) use($matches) {
			$match = _find($matches, function($m) use ($rm) {
				return $m['name'] === $rm['name'];
			});
			if (!$match) {
				json_err('Cannot find match ' . $rm['name']);
			}

			$sets = \array_map(function($game_id, $score_str) {
				return [
					'SetID' => ($game_id + 1),
					'SetValue' => $score_str,
				];
			}, $match['score_strs'], \array_keys($match['score_strs']));

			$players = $match['players'];
			return [
				'ID' => intval($match['tde_id']),
				'Winner' => $match['winner_code'],
				'DisableScoreValidation' => false,
				'Sets' => $sets,
				'Team1Player1ID' => strval($players[0][0]['tde_id']),
				'Team1Player2ID' => strval(isset($players[0][1]) ? $players[0][1]['tde_id'] : 0),
				'Team2Player1ID' => strval($players[1][0]['tde_id']),
				'Team2Player2ID' => strval(isset($players[1][1]) ? $players[1][1]['tde_id'] : 0),
			];
		}, $real_matches);
		$data =  [
			'ACode' => $tde_id,
			'AMatchID' => $tde_tm,
			'AOnlyValidatePlayerSetup' => false,
			'ASubMatches' => $sub_matches,
			'AShootoutWinner' => 0,
			'ALCID' => $alcid,
		];

		$submit_url = 'https://www.turnier.de/extension/matchvalidation.aspx/ValidateMatch';
		$options = [
			'http' => [
				'header' => (
					"Content-Type: application/json; charset=UTF-8\r\n" .
					$jar->make_header()
				),
				'follow_location' => 0,
				'method' => 'POST',
				'content' => \json_encode($data),
			],
		];
		$context = stream_context_create($options);
		$f = fopen($submit_url, 'r', false, $context);
		if ($f === false) {
			return json_err('Failed to send ValidateMatch');
		}
		$jar->read_from_stream($f);
		$validate_page = stream_get_contents($f);
		fclose($f);

		// Save whole result
		// TODO determine these automatically
		$extra_fields = [
			["ID" => 1, "ValueString" => "TODO: value goes here"],
			["ID" => 2, "ValueString" => ""],
			["ID" => 3, "ValueString" => ""],
			["ID" => 4, "ValueString" => ""],
			["ID" => 5, "ValueString" => ""],
			["ID" => 6, "ValueString" => "CHANGED / Andrea Vlach"],
			["ID" => 7, "ValueString" => ""],
			["ID" => 8, "ValueString" => ""],
			["ID" => 9, "ValueString" => "1234 Zuschauer"]
		];
		$save_url = 'https://www.turnier.de/extension/matchvalidation.aspx/SaveMatch';
		$data = [
			'ACode' => $tde_id,
			'AExtraItemList' => $extra_fields,
			'AShootOutWinner' => 0,
			'AYear' => 0,
			'AMonth' => 0,
			'ADay' => 0,
			'AHour' => 0,
			'AMinute' => 0,
			'AMatchID' => $tde_tm,
		];
		$options = [
			'http' => [
				'header' => (
					"Content-Type: application/json; charset=UTF-8\r\n" .
					$jar->make_header()
				),
				'follow_location' => 0,
				'method'  => 'POST',
				'content' => \json_encode($data),
			],
		];
		$context = stream_context_create($options);
		$f = fopen($save_url, 'r', false, $context);
		if ($f === false) {
			return json_err('Failed to send SaveMatch');
		}
		$jar->read_from_stream($f);
		$save_page = stream_get_contents($f);
		fclose($f);

		send_json([
			'status' => 'saved',
			'result_url' => $url,
		]);
	}
} else {
	throw new \Exeption('Unsupported action');
}
