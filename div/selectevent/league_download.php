<?php
namespace aufschlagwechsel\bup\league_download;
use \aufschlagwechsel\bup\tde_utils;
use \aufschlagwechsel\bup\http_utils;

require __DIR__ . '/../../http_proxy/http_utils.php';
require __DIR__ . '/../../http_proxy/tde_utils.php';


define('TDE_SERVER_DOMAIN', 'dbv.turnier.de');

function _make_url($page, $tournament_id, $suffix) {
	if (\in_array($page, array('drawmatches'))) {
		return 'https://' . TDE_SERVER_DOMAIN . '/sport/' . $page . '.aspx?id=' . $tournament_id . $suffix;
	}
	// New-style format
	return 'https://' . TDE_SERVER_DOMAIN . '/sport/league/' . $page . '?id=' . $tournament_id . $suffix;
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

	$address = \str_replace('SpH', 'Sporthalle', $address);

	$ADDRESS_ALIAS = [
		'07749 Jena, Sporthalle des Sportgymnasiums Jena' => 'Jena Wöllnitzer Str. 40',
		'51427 Bergisch Gladbach-Refrath, Sporthalle, Steinbreche' => 'Steinbreche 1, 51427 Bergisch Gladbach',
		'67677 Enkenbach, Integrierte Gesamtschule, Am Mühlberg 23-25' => '67677 Enkenbach Am Mühlberg 23',
		'66123 Saarbrücken, Herman-Neuberger-Sportschule 1, Badmintonhalle 72, Herman-Neuberger-Sportschule 1' => '66123 Saarbrücken Herman-Neuberger-Sportschule 1',
		'66123 Saarbrücken, Herman-Neuberger-Sportschule 1, MultiFunkHalle 80, Herman-Neuberger-Sportschule 1' => '66123 Saarbrücken Herman-Neuberger-Sportschule 1',
		'66123 Saarbrücken, Herman-Neuberger-Sportschule 1, Badmintonhalle 72, Herman-Neu' => '66123 Saarbrücken Herman-Neuberger-Sportschule 1',
		'44894 Bochum-Werne, 3-fach TH Willy-Brandt-Gesamtschule, Deutsches Reich 58' => 'Bochum Deutsches Reich 58',
	];
	if (\array_key_exists($address, $ADDRESS_ALIAS)) {
		$address = $ADDRESS_ALIAS[$address];
	}

	$geo_url = 'http://eu1.locationiq.com/v1/search.php?key=1a28e74d8cb421&format=json&' .
		'q=' . \urlencode($address);
	$geo_json = $httpc->request($geo_url);
	if (! $geo_json) {
		throw new \Exception('Failed to download ' . $geo_url);
	}

	$results = \json_decode($geo_json, true);
	if (array_key_exists('error', $results)) {
		throw new \Exception('Failed to download ' . $geo_url . ' error ' . json_encode($results['error']));
	}

	if ((\count($results) === 0) || ($results[0]['importance'] < 0.1)) {
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

	$coords = [
		'lat' => $results[0]['lat'],
		'lng' => $results[0]['lon'],
	];
	$loc_cache[$orig_address] = $coords;
	return $coords;
}

function init_geolocation_cache() {
	global $loc_cache;

	$preset_fn = __DIR__ . '/default_locations.json';
	$locations_json = \file_get_contents($preset_fn);
	if (!$locations_json) {
		throw new Error('Cannot read locations preset file ' . $preset_fn);
	}
	$loc_cache = \json_decode($locations_json, true, 512, \JSON_THROW_ON_ERROR);
}

function download_team($httpc, $tournament_id, $team_id, $team_name, $use_vrl) {
	if ($use_vrl) {
		return buli_download_all_players(
			$httpc, $league_key, TDE_SERVER_DOMAIN, $season_id, $draw_id, $match_id, $team_infos);
	} else {
		throw new \Exception('Non-Bundesliga support not implemented yet!');
	}
}

function _lookup_team($teams_by_name, $team_name) {
	if (! \array_key_exists($team_name, $teams_by_name)) {
		$all_teams = \array_keys($teams_by_name);
		\sort($all_teams);
		$all_teams_str = \implode(', ', $all_teams);
		throw new \Exception('Cannot find team ' . $team_name . ' in list of all teams (' . $all_teams_str . ')');
	}

	return $teams_by_name[$team_name];
}

function download_league($httpc, $url, $league_key, $use_vrl, $use_hr) {
	$m = \preg_match('/(?P<base_url>https?:\/\/(?:dbv|www)\.turnier\.de\/)sport\/league\/draw\?id=(?P<id>[0-9A-F-]+)&draw=(?P<draw>[0-9]+)/', $url, $groups);
	if (!$m) {
		throw new \Exception('Cannot parse URL ' . $url . ' for league download');
	}

	tde_utils\accept_cookies($httpc, $groups['base_url']);

	$tournament_id = $groups['id'];
	$draw = $groups['draw'];
	$teams_url = _make_url('draw', $tournament_id, '&draw=' . $draw);
	$teams_html = $httpc->request($teams_url);

	if (!\preg_match('/
			<div\s*class="title">\s*<h3>\s*(?P<name>[^<(–]+)
			/xs', $teams_html, $header_m)) {
		throw new \Exception('Cannot find league name in ' . $url . ' / ' . $teams_html);
	}
	$league_name = \html_entity_decode($header_m['name']);

	$found_table = \preg_match('/<table\s+class="ruler[^"]*">(?P<html>.+?)<\/table>/s', $teams_html, $team_table_m);
	if ($found_table) {
		$team_table_html = $team_table_m['html'];

		if (\preg_match_all('/
				<td\s+class="standingsrank">[0-9]+<\/td>
				<td><a\s+href="\/sport\/team\.aspx\?id=[A-Z0-9-]+&team=(?P<team_id>[0-9]+)">
				(?P<retracted><s>)?(?P<name>[^<]+)(?:<\/s>)?
				<\/a>
				/x', $team_table_html, $team_name_m, \PREG_SET_ORDER) === false) {
			throw new \Exception('Failed to match teams in ' . $teams_url);
		}
		$teams = \array_map(function($m) {
			return [
				'name' => tde_utils\unify_team_name($m['name']),
				'team_id' => $m['team_id'],
				'retracted' => boolval(isset($m['retracted']) && $m['retracted']),
			];
		}, $team_name_m);
	} else {
		// Maybe a KO tournament?
		$drawsheet_url = _make_url('drawsheet', $tournament_id, '&draw=' . $draw);
		$drawsheet_html = $httpc->request($drawsheet_url);

		if (!\preg_match('/\s*<div\s+class="draw">(.*)<\/table>\s*<\/div>\s*<p>/', $drawsheet_html, $draw_m)) {
			throw new \Exception('Neither table in ' . $teams_url . ' nor draws in ' . $drawsheet_url . ' could be found');
		}
		$draw_html = $draw_m[0];

		if (\preg_match_all('/
				<tr>\s*
				<td\s+class="line_b">[0-9]+[\s\x{00a0}]*<\/td>
				<td\s+class="line_(?:br|b)">\s*
				<a\s+href="team\.aspx\?id=[A-Z0-9-]+&(?:amp;)?team=(?P<team_id>[0-9]+)">(?:<s>)?(?P<name>[^<]+)(?:<\/s>)?<\/a>
				/xu',
				$draw_html, $team_name_m, \PREG_SET_ORDER) === false) {
			throw new \Exception('Failed to match teams in ' . $drawsheet_url);
		}

		$teams = \array_map(function($m) {
			return [
				'name' => tde_utils\unify_team_name($m['name']),
				'team_id' => $m['team_id'],
			];
		}, $team_name_m);
	}

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
			(?:<span\s+class="time">\s*(?P<starttime>[0-9]{2}:[0-9]{2})\s*<\/span>)?
		<\/td>
		<td\s+align="right">(?P<matchday>[0-9]+|)<\/td>
		<td\s+align="right">(?P<round>[HR]|)<\/td>
		<td>(?P<matchnum>[0-9]+|)<\/td>
		<td[^>]*>(?:<strong>)?
			<a\s+class="teamname"[^>]+>(?P<retracted_team1><s>)?(?P<name1>[^<]+)(?:<\/s>)?<\/a>
		(?:<\/strong>)?<\/td>
		<td\s+align="center">-<\/td>
		<td[^>]*>(?:<strong>)?
			<a\s+class="teamname"[^>]+>(?P<retracted_team2><s>)?(?P<name2>[^<]+)(?:<\/s>)?<\/a>
		(?:<\/strong>)?<\/td>
		<td>
			(?P<score_html>
			(?:\s*\[\s*)?
			(?:<s>)?
			<span\s+class="score"><span>[^<]*<\/span>
			(?:\s*U|\s*o\.\s*K\.)?
			<\/span>
			(?:<\/s>)?
			(?:\s*\]\s*)?
			)?
		<\/td>
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
		$team1 = _lookup_team($teams_by_name, $team1_name);

		$team2_name = tde_utils\unify_team_name($m['name2']);
		$team2 = _lookup_team($teams_by_name, $team2_name);

		$location = \html_entity_decode($m['location']);
		$this_tm = [
			'date' => $m['date'],
			'starttime' => $m['starttime'],
			'matchday' => $m['matchday'],
			'round' => $m['round'],
			'matchnum' => $m['matchnum'],
			'location' => $location,
			'loc_coords' => geolocate($httpc, $location),
			'team_ids' => [$team1['team_id'], $team2['team_id']],
		];

		// Only set cancelled when it's true, we want diffs to be reasonably clear
		$score_html = isset($m['score_html']) ? $m['score_html'] : '';
		$cancelled_by_score = \preg_match('/o\.\s*K\.|<s>/', $m['score_html']);
		$retracted_team = (
			(isset($m['retracted_team1']) && $m['retracted_team1']) ||
			(isset($m['retracted_team2']) && $m['retracted_team2'])
		);
		if ($cancelled_by_score || $retracted_team) {
			$this_tm['cancelled'] = true;
		}

		$tms[] = $this_tm;
	}

	if ($use_vrl) {
		$teams_info = \array_map(function($t) use ($httpc, $tournament_id, $league_key, $use_hr) {
			$all_players = tde_utils\download_team_vrl(
				$httpc, TDE_SERVER_DOMAIN, $tournament_id, $league_key, $t['team_id'], $use_hr);

			return [
				'id' => $t['team_id'],
				'name' => $t['name'],
				'players' => $all_players,
			];
		}, $teams);
	} else {
		$teams_info = \array_map(function($t) use ($httpc, $tournament_id, $league_key, $use_hr) {
			$all_players = tde_utils\download_team_players(
				$httpc, 'www.turnier.de', $league_key, $tournament_id, $t['team_id']);

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
		if (\array_key_exists('cache_dir', $config)) {
			$cache_dir = $config['cache_dir'];
		} else {
			$cache_dir = __DIR__ . '/cache';
		}
		$httpc = new http_utils\CacheHTTPClient($httpc, $cache_dir);
	}
	if ($config['debug']) {
		$httpc = new http_utils\DebugHTTPClient($httpc);
	}

	init_geolocation_cache();

	$leagues = [];
	foreach ($config['leagues'] as $l) {
		$leagues[] = download_league($httpc, $l['url'], $l['league_key'], $l['use_vrl'], $l['use_hr']);
	}
	return $leagues;
}
