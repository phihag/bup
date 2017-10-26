<?php
require 'utils.php';
setup_error_handler();
require 'http_utils.php';

function _param($name) {
	if (isset($_POST[$name])) {
		return $_POST[$name];
	}

	// For debugging, we offer GET too
	if (isset($_GET[$name])) {
		return $_GET[$name];
	}

	header('HTTP/1.1 400 Bad Request');
	header('Content-Type: text/plain');
	echo 'Missing ' . $name;
	exit();
}

function login($httpc, $url_base, $user, $password) {
	// Download login form
	$login_url = $url_base . 'member/login.aspx';
	$login_page = $httpc->request($login_url);
	if ($login_page === false) {
		return json_err('Failed to download login form');
	}
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
	$postlogin_page = $httpc->request(
		$login_url,
		[
			'Content-Type: application/x-www-form-urlencoded',
			'Referer:' . $login_url
		],
		'POST',
		\http_build_query($data)
	);
	if ($postlogin_page === false) {
		json_err('Failed to perform login');
	}

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
	if (!\preg_match('/^(https:\/\/www\.turnier\.de\/)sport\/teammatch\.aspx\?id=([-A-Fa-f0-9]+)&match=([0-9]+)$/', $url, $m)) {
		json_err('Unsupported URL ' . $url);
	}
	$url_base = $m[1];
	$tde_id = $m[2];
	$tde_tm = $m[3];
	$team_names = \json_decode(_param('team_names'), true);
	$matches = \json_decode(_param('matches_json'), true);
	$max_game_count = \intval(_param('max_game_count'));

	$httpc = AbstractHTTPClient::make();
	$cookies_json = (
		isset($_POST['cookies_json']) ? $_POST['cookies_json'] :
		(isset($_GET['cookies_json']) ? $_GET['cookies_json'] : false
	));
	$cookies = $cookies_json ? json_decode($cookies_json) : null;
	if ($cookies) {
		$httpc->set_all_cookies($cookies);
	} else {
		login($httpc, $url_base, $user, $password);
	}
	// TODO test that login was successful

	$input_url = $url_base . 'sport/matchresult.aspx?id=' . $tde_id . '&match=' . $tde_tm;
	$input_page = $httpc->request($input_url);
	if ($input_page === false) {
		return json_err('Failed to download input page');
	}

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
			if (isset($match['score']) && \array_key_exists($i, $match['score'])) {
				$score = $match['score'][$i];
				$score_strs[] = $score[0] . '-' . $score[1];
			}
		}
		$match['score_strs'] = $score_strs;
	}

	// Collect extra_fields
	if (! preg_match_all('/<th\s+class="right"\s+colspan="6">([^<]+)<\/th><td\s+colspan="7"><input\s+id="matchfield_([0-9]+)" type="text" class="textfield matchfield"/', $input_page, $ms, \PREG_SET_ORDER)) {
		json_err('could not find extra fields');
	}
	$extra_fields = array_map(function($m) {
		return [
			'label' => $m[1],
			'tde_id' => $m[2],
		];
	}, $ms);

	if ($action === 'prepare') {
		send_json([
			'matches' => $matches,
			'extra_fields' => $extra_fields,
			'cookies' => $httpc->get_all_cookies(),
		]);
	} else { // submit
		$sub_matches = \array_map(function($rm) use($matches) {
			$match = _find($matches, function($m) use ($rm) {
				return $m['name'] === $rm['name'];
			});
			if (!$match) {
				json_err('Cannot find match ' . $rm['name']);
			}

			$sets = \array_map(function($score_str, $game_id) use($match) {
				if (! preg_match('/^(?:[0-9]+-[0-9]+)?$/', $score_str)) {
					json_err(
						'Invalid score string ' . json_encode($score_str) .
						' in match ' . $match['name']);
				}
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

		$submit_url = $url_base . 'extension/matchvalidation.aspx/ValidateMatch';
		$validate_page = $httpc->request(
			$submit_url,
			['Content-Type: application/json; charset=UTF-8'],
			'POST',
			\json_encode($data)
		);
		if ($validate_page === false) {
			return json_err('Failed to send ValidateMatch');
		}

		$user_extra_fields_json = _param('extra_fields_json');
		$user_extra_fields = json_decode($user_extra_fields_json, true);

		// Save whole result
		$extra_items = [];
		foreach ($user_extra_fields as $ef) {
			$extra_items[] = [
				'ID' => intval($ef['tde_id']),
				'ValueString' => $ef['val'],
			];
		}

		$save_url = $url_base . 'extension/matchvalidation.aspx/SaveMatch';
		$data = [
			'ACode' => $tde_id,
			'AExtraItemList' => $extra_items,
			'AShootOutWinner' => 0,
			'AYear' => 0,
			'AMonth' => 0,
			'ADay' => 0,
			'AHour' => 0,
			'AMinute' => 0,
			'AMatchID' => $tde_tm,
		];
		$save_page = $httpc->request(
			$save_url,
			['Content-Type: application/json; charset=UTF-8'],
			'POST',
			\json_encode($data)
		);
		if ($save_page === false) {
			return json_err('Failed to send SaveMatch');
		}

		send_json([
			'status' => 'saved',
			'result_url' => $url,
		]);
	}
} else {
	throw new \Exeption('Unsupported action');
}
