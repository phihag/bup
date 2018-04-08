<?php
namespace aufschlagwechsel\bup\league_download;
use \aufschlagwechsel\bup\tde_utils;
use \aufschlagwechsel\bup\http_utils;

require __DIR__ . '/../../http_proxy/http_utils.php';
require __DIR__ . '/../../http_proxy/tde_utils.php';


function _make_url($page, $tournament_id, $suffix) {
	return 'https://www.turnier.de/sport/' . $page . '.aspx?id=' . $tournament_id . $suffix;
}


$loc_cache = [];
function geolocate($httpc, $address, $orig_address=null) {
	global $loc_cache;

	if ($orig_address == null) {
		$orig_address = $address;
	}
	if (\array_key_exists($orig_address, $loc_cache)) {
		return $loc_cache[$orig_address];
	}

	$ADDRESS_ALIAS = [
		'07749 Jena, Sporthalle des Sportgymnasiums Jena' => 'Jena Wöllnitzer Str. 40',
	];
	if (\array_key_exists($address, $ADDRESS_ALIAS)) {
		$address = $ADDRESS_ALIAS[$address];
	}

	$address = \str_replace('SpH', 'Sporthalle', $address);

	$API_KEY = \base64_decode('QUl6YVN5Q2VNS08zZkVFNldCTjhwYzQ1eEFUNURPY09BR2ZtRTlj');
	$geo_json = $httpc->request(
		'https://maps.google.com/maps/api/geocode/json?' .
		'address=' . \urlencode($address) .
		'&key=' . \urlencode($API_KEY)
	);
	$geo = \json_decode($geo_json, true);
	$results = $geo['results'];
	if (\count($results) === 0) {
		// Try stripping ZIP code
		if (\preg_match('/^[0-9]+\s+(.*)$/', $address, $address_m)) {
			return geolocate($httpc, $address_m[1], $orig_address);
		}

		// Try stripping stuff in parens parens
		if (\preg_match('/^(.*)\(.*$/', $address, $address_m)) {
			return geolocate($httpc, $address_m[1], $orig_address);
		}

		// Try stripping location name
		if (\preg_match('/^([^,]+),.*,([^,]+)$/', $address, $address_m)) {
			return geolocate($httpc, $address_m[1] . ' ' . $address_m[2], $orig_address);
		}

		throw new \Exception('Cannot locate ' . $address);
	}

	$coords = $results[0]['geometry']['location'];
	$loc_cache[$orig_address] = $coords;
	return $coords;
}

function download_team($httpc, $tournament_id, $team_id, $team_name, $use_vrl) {
	if ($use_vrl) {
		return buli_download_all_players(
			$httpc, $league_key, 'www.turnier.de', $season_id, $draw_id, $match_id, $team_infos);
	} else {
		throw new \Exception('Non-Bundesliga support not implemented yet!');
	}
}

function download_league($httpc, $url, $league_key, $use_vrl, $use_hr) {
	$m = \preg_match('/https?:\/\/www\.turnier\.de\/sport\/[a-z0-9_]+\.aspx\?id=(?P<id>[0-9A-F-]+)&draw=(?P<draw>[0-9]+)/', $url, $groups);
	if (!$m) {
		throw new \Exception('Cannot parse URL ' . $url);
	}
	$tournament_id = $groups['id'];
	$draw = $groups['draw'];

	$teams_url = _make_url('draw', $tournament_id, '&draw=' . $draw);
	$teams_html = $httpc->request($teams_url);

	if (!\preg_match('/
			<div\s*class="title">\s*<h3>\s*(?P<name>[^<(]+)
			/xs', $teams_html, $header_m)) {
		throw new \Exception('Cannot find league name!');
	}
	$league_name = \html_entity_decode($header_m['name']);

	if (!\preg_match('/<table\s+class="ruler">(?P<html>.+?)<\/table>/s', $teams_html, $team_table_m)) {
		throw new \Exception('Cannot find table in ' . $team_url);
	}
	$team_table_html = $team_table_m['html'];

	if (\preg_match_all('/
			<td\s+class="standingsrank">[0-9]+<\/td>
			<td><a\s+href="\/sport\/team.aspx\?id=[A-Z0-9-]+&team=(?P<team_id>[0-9]+)">(?P<name>[^<]+)<\/a>
			/x', $team_table_html, $team_name_m, \PREG_SET_ORDER) === false) {
		throw new \Exception('Failed to match teams in ' . $teams_url);
	}
	$teams = \array_map(function($m) {
		return [
			'name' => tde_utils\unify_team_name($m['name']),
			'team_id' => $m['team_id'],
		];
	}, $team_name_m);
	$teams_by_name = [];
	foreach ($teams as &$t) {
		$teams_by_name[$t['name']] = $t;
	}

	$matches_url = _make_url('drawmatches', $tournament_id, '&draw=' . $draw);
	$matches_html = $httpc->request($matches_url);

	if (!\preg_match('/<table\s+class="ruler matches">(?P<html>.+?)<\/table>/s', $matches_html, $table_m)) {
		throw new \Exception('Cannot find table in ' . $matches_url);
	}
	$match_table_html = $table_m['html'];

	if (\preg_match_all('/
		<td><\/td>
		<td\s+class="plannedtime"\s+align="right">
			\s*[A-Za-z]{2}\s*(?P<date>[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4})\s*
			<span\s+class="time">\s*(?P<starttime>[0-9]{2}:[0-9]{2})\s*<\/span>
		<\/td>
		<td\s+align="right">(?P<matchday>[0-9]+)<\/td>
		<td\s+align="right">(?P<round>[HR])<\/td>
		<td>(?P<matchnum>[0-9]+)<\/td>
		<td[^>]*>(?:<strong>)?<a\s+class="teamname"[^>]+>(?P<name1>[^<]+)<\/a>(?:<\/strong>)?<\/td>
		<td\s+align="center">-<\/td>
		<td[^>]*>(?:<strong>)?<a\s+class="teamname"[^>]+>(?P<name2>[^<]+)<\/a>(?:<\/strong>)?<\/td>
		<td>(?:<span\s+class="score"><span>[^<]*<\/span>(?:\s*U)?<\/span>)?<\/td>
		<td><a\s+href="\.\/location\.aspx\?id=[A-F0-9-]+&lid=[0-9]+">
			(?P<location>[^<]+)<\/a>
		<\/td>
		/x', $match_table_html, $matches_m, \PREG_SET_ORDER) === false) {
		throw new \Exception('Failed to match matches in ' . $matches_url);
	}
	if (\count($matches_m) === 0) {
		throw new \Exception('Could not find any matches in ' . $matches_url);
	}

	$tms = [];
	foreach ($matches_m as $m) {
		$team1_name = tde_utils\unify_team_name($m['name1']);
		$team1 = $teams_by_name[$team1_name];
		if (!$team1) {
			throw new Exception('Cannot find team ' . $team1_name);
		}
		$team2_name = tde_utils\unify_team_name($m['name2']);
		$team2 = $teams_by_name[$team2_name];
		if (!$team2) {
			throw new Exception('Cannot find team ' . $team2_name);
		}

		$location = \html_entity_decode($m['location']);
		$tms[] = [
			'date' => $m['date'],
			'starttime' => $m['starttime'],
			'matchday' => $m['matchday'],
			'round' => $m['round'],
			'matchnum' => $m['matchnum'],
			'location' => $location,
			'loc_coords' => geolocate($httpc, $location),
			'team_ids' => [$team1['team_id'], $team2['team_id']],
		];
	}

	if ($use_vrl) {
		$teams_info = \array_map(function($t) use ($httpc, $tournament_id, $league_key, $use_hr) {
			$all_players = tde_utils\download_team_vrl(
				$httpc, 'www.turnier.de', $tournament_id, $league_key, $t['team_id'], $use_hr);

			return [
				'id' => $t['team_id'],
				'name' => $t['name'],
				'players' => $all_players,
			];
		}, $teams);
	} else {
		$teams_info = \array_map(function($t) use ($httpc, $tournament_id, $league_key, $use_hr) {
			$all_players = tde_utils\download_team_vrl(
				$httpc, 'www.turnier.de', $tournament_id, $league_key, $t['team_id'], $use_hr);

			return [
				'id' => $t['team_id'],
				'name' => $t['name'],
				'players' => $all_players,
			];
		}, $teams);
	}

	$res = [
		'name' => $league_name,
		'league_key' => $league_key,
		'matches' => $tms,
		'teams' => $teams_info,
		'draw_id' => $draw,
	];

	return $res;
}

function download_leagues($config) {
	$httpc = http_utils\AbstractHTTPClient::make();
	if ($config['use_cache']) {
		$httpc = new http_utils\CacheHTTPClient($httpc, __DIR__ . '/cache');
	}

	$leagues = [];
	foreach ($config['leagues'] as $l) {
		$leagues[] = download_league($httpc, $l['url'], $l['league_key'], $l['use_vrl'], $l['use_hr']);
	}
	return $leagues;
}
