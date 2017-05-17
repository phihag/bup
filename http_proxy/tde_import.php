<?php
require 'utils.php';
setup_error_handler();

if (!isset($_GET['url'])) {
	throw new \Exception('Missing URL');
}
$match_url = $_GET['url'];
main($match_url);

function main($match_url) {
	if (! \preg_match('/^https?:\/\/www\.turnier\.de\/sport\/teammatch\.aspx\?id=([a-fA-F0-9-]+)&match=([0-9]+)$/', $match_url)) {
		echo $match_url;
		throw new \Exception('Unsupported URL');
	}

	$tm_url = \file_get_contents($match_url);
	$tm = parse_teammatch($tm_url);

	$data = $tm;
	if (isset($_GET['format'])) {
		switch($_GET['format']) {
		case 'export':
			$data = [
				'type' => 'bup-export',
				'version' => 2,
				'event' => $tm,
			];
			break;
		}
	}

	header('Content-Type: application/json');
	header('Cache-Control: no-cache, no-store, must-revalidate');
	header('Pragma: no-cache');
	header('Expires: 0');

	echo \json_encode($data, \JSON_PRETTY_PRINT);
}

function parse_match_players($players_html) {
	preg_match_all(
		'/<a class="plynk" href="[^"]*">(?P<name>.*?)<\/a>/',
		$players_html, $players_m, \PREG_SET_ORDER);
	$players = \array_map(function($pm) {
		return [
			'name' => $pm['name'],
		];
	}, $players_m);
	return [
		'players' => $players,
	];
}

function parse_teammatch($tm_html) {
	$LEAGUE_KEYS = [
		'Bundesligen 2016/17:1. Bundesliga 1. Bundesliga' => '1BL-2016',
		'Bundesligen 2016/17:1. Bundesliga 1. Bundesliga - Final Four' => '1BL-2016',
	];

	$res = [];

	if (\preg_match('/<h3>
			<a\s*href="\/sport\/team\.aspx\?id=[^"]+">(?P<team0>[^<]+?)\s*\([0-9-]+\)<\/a>
			\s*-\s*
			<a\s*href="\/sport\/team\.aspx\?id=[^"]+">(?P<team1>[^<]+?)\s*\([0-9-]+\)<\/a>
			/xs', $tm_html, $teamnames_m)) {
		$res['team_names'] = [$teamnames_m['team0'], $teamnames_m['team1']];
	} else {
		throw new \Exception('Cannot find team names!');
	}

	if (!\preg_match('/
			<div\s*class="title">\s*<h3>([^<]*)<\/h3>
			/xs', $tm_html, $header_m)) {
		throw new \Exception('Cannot find team names!');
	}
	if (!\preg_match('/<th>Staffel:<\/th><td><a[^<]*>([^<]+)<\/a><\/td>/sx', $tm_html, $division_m)) {
		throw new \Exception('Cannot find division!');
	}
	$long_league_id = $header_m[1] . ':' . $division_m[1];
	if (!\array_key_exists($long_league_id, $LEAGUE_KEYS)) {
		throw new \Exception('Cannot find league ' . $long_league_id);
	}
	$res['league_key'] = $LEAGUE_KEYS[$long_league_id];

	// TODO all_players
	// TODO match date
	// TODO match time
	if (\preg_match('/<th>Spielort:<\/th><td><a[^<]*>([^<]+)<\/a><\/td>/', $tm_html, $location_m)) {
		$res['location'] = $location_m[1];
	}

	if (\preg_match('/<th>[^><]*Schiedsrichter[^><]*<\/th><td>([^<]+)<\/td>/', $tm_html, $umpire_m)) {
		$res['umpires'] = $umpire_m[1];
	}

	// Matches
	if (!\preg_match('/<table\s+class="ruler matches">(?P<html>.+?)<\/tbody>\s*<\/table>/s', $tm_html, $table_m)) {
		throw new \Exception('Cannot find table in teammatch HTML');
	}
	$matches_table_html = $table_m['html'];
	\preg_match_all(
		'/<tr>\s*<td>(?P<match_name>[A-Z\.0-9\s]+)<\/td>
		\s*<td[^>]*><table[^>]*>(?P<players_html0>.*?)<\/table>
		<\/td><td[^>]*>-<\/td>
		<td[^>]*><table[^>]*>(?P<players_html1>.*?)<\/table>
		#<td>(?P<score_html>.*?)<\/td>
		/xs', $matches_table_html, $matches_m, \PREG_SET_ORDER);
	$matches = [];
	foreach ($matches_m as $mm) {
		$match_name = $mm['match_name'];
		$is_doubles = preg_match('/DD|GD|HD|WD|MX|MD|BD|JD/', $match_name) !== 0;

		$teams = [
			parse_match_players($mm['players_html0']),
			parse_match_players($mm['players_html1'])
		];
		// TODO score
		$setup = [
			'match_name' => $match_name,
			'is_doubles' => $is_doubles,
			'teams' => $teams,
		];
		$matches[] = [
			'setup' => $setup,
		];
	}
	$res['matches'] = $matches;

	return $res;
}
