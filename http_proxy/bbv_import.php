<?php
namespace aufschlagwechsel\bup\bbv_import;
use aufschlagwechsel\bup\utils;

require_once './utils.php';

function match_url($url) {
	if (\preg_match(
		'/^(?P<league_url>https?:\/\/badminton-bbv\.de\/site\/liga\/liga\/(?P<year1>[0-9]+)\/(?P<year2>[0-9]+)\/(?P<division_id>[0-9]+)\/)meeting\/(?P<tm_id>[0-9]+)/', $url, $url_m)) {
		return $url_m;
	}
	return false;
}

function player_from_m($m, $player_key) {
	if (!\array_key_exists($player_key, $m)) return false;
	$player_name = utils\decode_html($m[$player_key]);
	if (!$player_name) return false;
	return [
		'name' => $player_name,
	];
}

function players_from_m($m, $team_key) {
	$res = [player_from_m($m, $team_key . '0')];
	$p1 = player_from_m($m, $team_key . '1');
	if ($p1) {
		\array_push($res, $p1);
	}
	return $res;
}

function parse_score($score_str) {
	$game_strs = \explode(' ', $score_str);
	return \array_map(function($game_str) {
		return \array_map('\\intval', \explode(':', $game_str));
	}, $game_strs);
}

function import($httpc, $url) {
	if (!\preg_match('/.*\/$/', $url)) {
		$url .= '/';
	}
$httpc = new \aufschlagwechsel\bup\http_utils\CacheHTTPClient($httpc, '/dev/shm/bupcache/'); // TODO DEBUG
	$url_m = match_url($url);

	$league_url = $url_m['league_url'];
	$league_html = $httpc->request($league_url);
	if (!$league_html) {
		throw new \Exception('Failed to download league info: ' . \json_encode($httpc->get_error_info()));
	}
	if (!\preg_match('/
			<td>\s*
				(?P<date>[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4,})\s*
				<span\s+style="color:\s*\#999">(?P<starttime>[0-9]{1,2}:[0-9]{2})<\/span>\s*
			<\/td>\s*
			<td\s+class="[^"]*">\s*
				<a\s+href="\/site\/liga\/team\/[0-9]+\/[0-9]+\/[0-9]+">(?P<team0>[^<]+)<\/a>\s*
			<\/td>\s*
			<td\s+class="seperator">-<\/td>\s*
			<td\s+class="[^"]*">\s*
				<a\s+href="\/site\/liga\/team\/[0-9]+\/[0-9]+\/[0-9]+">(?P<team1>[^<]+)<\/a>\s*
			<\/td>\s*
			<td\s+class="align-right\sscore">\s*[0-9]+\s*<\/td>\s*
			<td\s+class="seperator">:<\/td>\s*
			<td\s+class="score">\s*[0-9]+\s*<\/td>\s*
			<td>\s*<a\s+href="\/site\/liga\/liga\/[0-9]+\/[0-9]+\/[0-9]+\/meeting\/' . \preg_quote($url_m['tm_id']) . '">
				Details<\/a>
			\s*(?P<confirmed><img[^>]*?title="Spielbericht\sbestätigt"\s*\/?\s*>)?
			\s*(?:<img[^>]*?title="(?!Spielbericht\sbestätigt")[^"]*"\s*\/?\s*>)?\s*<\/td>
			\s*<td>\s*<a\s+href="\/site\/liga\/hall\/[0-9]+">(?P<location>[^<]*?)<\/a>/x', $league_html, $league_m)) {
		throw new \Exception('Failed to find match ' . $url_m['tm_id'] . ' in ' . $league_url);
	}
	$confirmed = \boolval($league_m['confirmed']);
	$location = utils\decode_html($league_m['location']);
	$team_names = [
		utils\decode_html($league_m['team0']),
		utils\decode_html($league_m['team1']),
	];
	$starttime = utils\decode_html($league_m['starttime']);
	$date = utils\decode_html($league_m['date']);

	$tm_html = $httpc->request($url);
	if (!$tm_html) {
		throw new \Exception('Failed to download match info: ' . \json_encode($httpc->get_error_info()));
	}
	if (! \preg_match('/<div id="liga-sub-content">(.*?)<\/article>/s', $tm_html, $main_html_m)) {
		throw new \Exception('Cannot find liga-sub-content');
	}
	$html = $main_html_m[0];

	if (! \preg_match('/<h1>Bayern (?P<year1>[0-9]{2})\/(?P<year2>[0-9]{2})\s*-\s*(?P<tournament_name>.*?)<\/h1>/', $html, $tournament_name_m)) {
		throw new \Exception('Cannot find tournament name');
	}
	$tournament_name = utils\decode_html($tournament_name_m['tournament_name']);
	$series_name = 'Mannschaftsmeisterschaft 20' . $tournament_name_m['year1'] . '/20' . $tournament_name_m['year2'] . ' - Bayern';

	if (!\preg_match_all('/<tr>\s*
		<td\s+class="align-right\s+vertical-middle">(?P<discipline>[^<]+)<\/td>\s*
		<td\s+class="[^"]*">\s*
			<a\s+href="\/site\/liga\/player\/[^"]+">(?P<p00>[^<]+)<\/a>\s*
			<br\s*\/>\s*
			(?:<a\s+href="\/site\/liga\/player\/[^"]+">(?P<p01>[^<]+)<\/a>\s*)?
		<\/td>\s*
		<td\s+class="vertical-middle">\s*-\s*<\/td>\s*
		<td\s+class="[^"]*">\s*
			<a\s+href="\/site\/liga\/player\/[^"]+">(?P<p10>[^<]+)<\/a>\s*
			<br\s*\/>\s*
			(?:<a\s+href="\/site\/liga\/player\/[^"]+">(?P<p11>[^<]+)<\/a>\s*)?
		<\/td>\s*
		<td\s+class="vertical-middle">\s*
			(?P<score_str>[0-9][0-9:\s]+[0-9])\s*
		<\/td>\s*
	<\/tr>/sx', $html, $matches_ms, \PREG_SET_ORDER)) {
		throw new \Exception('Cannot find matches');
	}

	$matches = \array_map(function($match_m) use($url_m) {
		$is_doubles = preg_match('/DD|GD|HD|WD|MX|MD|BD|JD/', $match_m['discipline']) !== 0;
		$match_name = utils\decode_html($match_m['discipline']);
		$match_id = 'bbv:' . utils\decode_html($url_m['division_id']) . '_' . utils\decode_html($url_m['tm_id']) . '_' . $match_name;
		$setup = [
			'match_name' => $match_name,
			'teams' => [
				['players' => players_from_m($match_m, 'p0')],
				['players' => players_from_m($match_m, 'p1')],
			],
			'match_id' => $match_id,
			'is_doubles' => $is_doubles,
		];
		return [
			'setup' => $setup,
			'network_score' => parse_score($match_m['score_str']),
		];
	}, $matches_ms);

	$res = [
		'series_name' => $series_name,
		'tournament_name' => $tournament_name,
		'team_names' => $team_names,
		'matches' => $matches,
		'location' => $location,
		'confirmed' => $confirmed,
		'starttime' => $starttime,
		'date' => $date,
		'report_urls' => [$url],
		'league_key' => 'bayern-2018',
	];

	if (\preg_match('/Bemerkungen:\s*<ul><li>([^<]*)<\/li>/', $html, $notes_m)) {
		$res['notes'] = utils\decode_html($notes_m[1]);
	}

	return $res;
}
