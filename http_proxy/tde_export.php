<?php
namespace aufschlagwechsel\bup\tde_export;
use aufschlagwechsel\bup\utils;
use aufschlagwechsel\bup\tde_utils;

require_once 'utils.php';
require_once 'tde_utils.php';

function login($httpc, $url_base, $user, $password) {
	// Download login form
	$login_page_url = $url_base . 'user/login';
	$login_page = $httpc->request($login_page_url);

	if ($login_page === false) {
		utils\json_err('Failed to download login form: ' . $httpc->get_error_info());
	}

	$LOGIN_RE = '/<form\s+action="\/user"\s+(?:class="auth__body"\s+)?id="form_login"(.*?)<\/form>/s';
	if (!preg_match($LOGIN_RE, $login_page, $matches)) {
		utils\json_err('Cannot find login form at ' . $login_page_url);
	}
	$login_form = $matches[1];

	if (!preg_match_all('/<input\s+name="([^"]*)"\s+type="(?:hidden|submit)"\s+value="([^"]+)"/', $login_form, $matches, \PREG_SET_ORDER)) {
		utils\json_err('Failed to find hidden login fields');
	}
	$data = [];
	foreach ($matches as $m) {
		$data[$m[1]] = $m[2];
	}
	$data['Login'] = $user;
	$data['Password'] = $password;
	$data['ReturnUrl'] = '/';
	$data['LogoUrl'] = '~/Content/images/themes/dbv/logo.png';

	// Perform login
	$login_url = $url_base . 'user';
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
		utils\json_err('Failed to perform login');
	}

	if (\preg_match('/<span class="field-validation-error[^>]*>(.*?)<\/span>/', $postlogin_page, $m)) {
		utils\json_err('Login failed: ' . $m[1]);
	}
}

function parse_team($html, $team_num) {
	if (!\preg_match('/var Team' . $team_num . 'PlayerArray = (\[.*\]);/', $html, $m)) {
		utils\json_err('Cannot find players of team ' . $team_num);
	}
	$team_js = \str_replace("'", '"', $m[1]);
	$team_json = \preg_replace('/([a-zA-z0-9]+):/', '"\1":', $team_js);
	$team_data = \json_decode($team_json, true);
	$players_data = \array_filter($team_data, function($pd) {
		return \strpos($pd['Name'], 'unbekannt') === false;
	});

	$players = \array_map(function($pd) {
		if (!\preg_match('/^
				(?:
					(?P<ranking_team>J?[0-9]+)-(?P<ranking>[0-9]+)
					(?:-D(?P<ranking_d>[0-9]+))?
				)?\s*
				(?P<lastname>[^0-9]+),\s+(?P<firstname>[^0-9,]+?)\s+
				\([^)]+\)$/x', $pd['Name'], $m)) {
			utils\json_err('Cannot parse player spec ' . json_encode($pd['Name']));
		}

		$res = [
			'tde_id' => $pd['ID'],
			'gender' => (($pd['GenderID'] === 1) ? 'm' : 'f'),
			'name' => $m['firstname'] . ' ' . $m['lastname'],
		];
		if (isset($m['ranking_team']) && $m['ranking_team']) {
			$res['ranking_team'] = $m['ranking_team'];
		}
		if (isset($m['ranking_d']) && $m['ranking_d']) {
			$res['ranking_d'] = \intval($m['ranking_d']);
		}
		if (isset($m['ranking']) && $m['ranking']) {
			$res['ranking'] = \intval($m['ranking']);
		}
		return $res;
	}, $players_data);
	return $players;
}

function prepare($httpc, $url, $user, $password, $team_names, $matches, $max_game_count, $cookies) {
	if (!\preg_match('/^(https:\/\/(?:dbv\.|www\.|)turnier\.de\/)sport\/(?:league\/match|teammatch\.aspx)\?id=([-A-Fa-f0-9]+)&match=([0-9]+)$/', $url, $m)) {
		utils\json_err('Unsupported URL ' . $url);
	}

	tde_utils\accept_cookies($httpc, $m[1]);

	$url_base = $m[1];
	$tde_id = $m[2];
	$tde_tm = $m[3];
	$team_names = \array_map(function($tn) {
		return tde_utils\unify_team_name($tn);
	}, $team_names);

	if ($cookies) {
		$httpc->set_all_cookies($cookies);
	} else {
		login($httpc, $url_base, $user, $password);
	}
	// TODO test that login was successful
	$input_url = $url_base . 'sport/matchresult.aspx?id=' . $tde_id . '&match=' . $tde_tm;
	$input_page = $httpc->request($input_url);
	if ($input_page === false) {
		return utils\json_err('Failed to download input page');
	}

	if (!preg_match('/"ALCID":([0-9]+)/', $input_page, $m)) {
		utils\json_err('Cannot parse input page ' . $input_url . ' (can the account ' . $user . ' access it?)', $input_page);
	}
	$alcid = $m[1];

	// Check team names
	if (!preg_match('/Eingabe Ergebnis für:\s+<a[^>]+>(.*?)\s*<span class="nobreak">[^<]*<\/span><\/a> - <a[^>]+>(.*?)\s*<span class="nobreak">/', $input_page, $m)) {
		utils\json_err('Cannot find team names', $input_page);
	}
	$real_team_names = [
		tde_utils\unify_team_name($m[1]),
		tde_utils\unify_team_name($m[2])
	];
	if (($team_names[0] !== $real_team_names[0]) || ($team_names[1] !== $real_team_names[1])) {
		utils\json_err('Incorrect team names: This match URL points to ' . $real_team_names[0] . ' - ' . $real_team_names[1] . ', but expected ' . $team_names[0] . ' - ' . $team_names[1], $input_page);
	}

	$real_players = [
		parse_team($input_page, '1'),
		parse_team($input_page, '2')
	];
	if (! preg_match_all('/<th class="valign_middle">([A-Z0-9]+)<\/th><td[^>]*><select id="match_([0-9]+)_t1p1"/', $input_page, $ms, \PREG_SET_ORDER)) {
		utils\json_err('Canot find matches', $input_page);
	}
	$real_matches = array_map(function($m) {
		return [
			'name' => $m[1],
			'tde_id' => $m[2],
		];
	}, $ms);

	if (\count($real_matches) !== \count($matches)) {
		utils\json_err('Expected to write ' . \count($matches) . ', but the service expects ' . \count($real_matches));
	}

	// Check that all matches are correct
	foreach ($matches as &$match)  {
		if (!$match['name']) {
			utils\json_err('Missing match name');
		}
		$rm = utils\find($real_matches, function($rm) use($match) {
			return $rm['name'] === $match['name'];
		});
		if (!$rm) {
			utils\json_err('Could not find match ' . $match['name'] . ' online', $input_page);
		}
		$match['tde_id'] = $rm['tde_id'];

		foreach ($match['players'] as $team_id=>&$team) {
			foreach ($team as &$player) {
				$rp = utils\find($real_players[$team_id], function($rp) use ($player) {
					return $rp['name'] === $player['name'];
				});
				if (!$rp) {
					$avp = implode(', ', array_map(function($rp) {
						return $rp['name'];
					}, $real_players[$team_id]));
					utils\json_err('Cannot find player ' . $player['name'] . ' in team ' . $team_id . ' . All known players are ' . $avp, $input_page);
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
	if (! preg_match_all('/<th\s+class="right"\s+colspan="[0-9]+">([^<]+)<\/th><td\s+colspan="[0-9]+"><input\s+id="matchfield_([0-9]+)" type="text" class="textfield matchfield"/', $input_page, $ms, \PREG_SET_ORDER)) {
		utils\json_err('could not find extra fields', $input_page);
	}
	$extra_fields = array_map(function($m) {
		return [
			'label' => $m[1],
			'tde_id' => $m[2],
		];
	}, $ms);

	return [
		'matches' => $matches,
		'extra_fields' => $extra_fields,
		'cookies' => $httpc->get_all_cookies(),
		'_real_matches' => $real_matches,
		'_tde_id' => $tde_id,
		'_tde_tm' => $tde_tm,
		'_alcid' => $alcid,
		'_url_base' => $url_base,
	];
}

function submit($httpc, $url, $user, $password, $team_names, $matches, $max_game_count, $cookies, $user_extra_fields) {

	$prepared = prepare($httpc, $url, $user, $password, $team_names, $matches, $max_game_count, $cookies);
	$matches = $prepared['matches'];
	$real_matches = $prepared['_real_matches'];
	$tde_id = $prepared['_tde_id'];
	$tde_tm = $prepared['_tde_tm'];
	$alcid = $prepared['_alcid'];
	$url_base = $prepared['_url_base'];

	$sub_matches = \array_map(function($rm) use($matches) {
		$match = utils\find($matches, function($m) use ($rm) {
			return $m['name'] === $rm['name'];
		});
		if (!$match) {
			utils\json_err('Cannot find match ' . $rm['name']);
		}

		$sets = \array_map(function($score_str, $game_id) use($match) {
			if (! preg_match('/^(?:[0-9]+-[0-9]+)?$/', $score_str)) {
				utils\json_err(
					'Invalid score string ' . json_encode($score_str) .
					' in match ' . $match['name']);
			}
			return [
				'SetID' => ($game_id + 1),
				'SetValue' => $score_str,
			];
		}, $match['score_strs'], \array_keys($match['score_strs']));

		$players = $match['players'];

		if (\count($players[0]) < 1) {
			throw new \Exception('No players in home team in ' . $match['name']);
		}
		if (\count($players[1]) < 1) {
			throw new \Exception('No players in away team in ' . $match['name']);
		}

		return [
			'ID' => \intval($match['tde_id']),
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
		return utils\json_err('Failed to send ValidateMatch');
	}

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
		return utils\json_err('Failed to send SaveMatch');
	}
}
