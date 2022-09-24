<?php
namespace aufschlagwechsel\bup\tde_import;
use aufschlagwechsel\bup\tde_utils;
use aufschlagwechsel\bup\utils;

require_once './tde_utils.php';
require_once './utils.php';

function parse_teammatch($httpc, $tm_html, $domain, $match_id, $match_url) {
	$league_keys_filename = __DIR__ . \DIRECTORY_SEPARATOR . 'tde_league_keys.json';
	$league_json = \file_get_contents($league_keys_filename);
	$LEAGUE_KEYS = \json_decode($league_json, true);

	if (!\preg_match('/
			<h2\s+class="media__title[^"]*"\s+title="(?P<name>[^"]+)"
			/xs', $tm_html, $header_m)) {
		throw new \Exception('Cannot find league name in ' . $match_url . '!');
	}
	if (\preg_match('/<th>Staffel:<\/th><td><a\s+href="[^"]*&draw=([0-9]+)">([^<]+)<\/a><\/td>/sx', $tm_html, $division_m)) {
		$draw_id = $division_m[1];

		$league_key = null;
		if (\preg_match('/^Ligen NRW/', $header_m[1])) {
			if (\preg_match('/^O19-NRW\s+(?:–\s+)?(O19-(?:RL|OL))\s*[–-]\s*\(([0-9]+)\)/', $division_m[2], $nrw_olrl_m)) { // OL/RL West until 2017/2018
				$league_key = 'NRW-' . $nrw_olrl_m[1] . '-' . $nrw_olrl_m[2] . '-2016';
			} else if (\preg_match('/^[UO]19-(?:GW|[NS][12])\s+(?:–\s+)?([UO]19-(?:GW|[NS][12])-(?:RL|OL|VL|LL|BL|BK|KL|KK))\s*(?:–|-)\s*\(([0-9]+)\)/', $division_m[2], $nrw_m)) {

				$league_key = 'NRW-' . $nrw_m[1] . '-' . $nrw_m[2] . '-2016';
			}
		}

		if ($league_key === null) {
			$long_league_id = $header_m[1] . ':' . $division_m[2];
			if (!\array_key_exists($long_league_id, $LEAGUE_KEYS)) {
				throw new \Exception('Cannot find league \'' . $long_league_id . '\'');
			}
			$league_key = $LEAGUE_KEYS[$long_league_id];
		}

		if (!\preg_match('/<h3>
				<a\s*href="\/sport\/team\.aspx\?id=(?P<season0>[-A-Za-z0-9]+)&team=(?P<id0>[0-9]+)">\s*
				(?P<team0>[^<]+?)(?:\s*\([0-9-]+\))?<\/a>
				\s*-\s*
				<a\s*href="\/sport\/team\.aspx\?id=(?P<season1>[-A-Za-z0-9]+)&team=(?P<id1>[0-9]+)">\s*
				(?P<team1>[^<]+?)(?:\s*\([0-9a-zA-Z-]+\))?<\/a>
				/xs', $tm_html, $teamnames_m)) {

			throw new \Exception('Cannot find team names!');
		}

		$res = [
			'league_key' => $league_key,
		];
		$res['team_names'] = [
			tde_utils\unify_team_name(utils\decode_html($teamnames_m['team0'])),
			tde_utils\unify_team_name(utils\decode_html($teamnames_m['team1']))
		];
		$team_infos = [[
			'season' => $teamnames_m['season0'],
			'id' => $teamnames_m['id0'],
			'name' => $res['team_names'][0],
		], [
			'season' => $teamnames_m['season1'],
			'id' => $teamnames_m['id1'],
			'name' => $res['team_names'][1],
		]];
	} else if (\preg_match('/<th>Disziplin:<\/th><td><a href="draw\.aspx\?id=(?P<season_id>[-a-fA-F0-9]+)&draw=(?P<draw_id>[0-9]+)">(?P<team0>.*?)\s*-\s*(?P<team1>.*?)<\/a><\/td>/', $tm_html, $international_m)) {

		if (! \preg_match('/
			<h3>
			<a\s+href="\/sport\/team\.aspx\?id=[-a-fA-F0-9]+&team=(?P<id0>[0-9]+)">[^<]+<\/a>\s*
			<img[^<>]+>\s*
			<span\s+class="printonly\sflag">\[[A-Z]+\]\s*<\/span>\s*
			-\s*
			<img[^<>]+>\s*
			<span\s+class="printonly\sflag">\[[A-Z]+\]\s*<\/span>\s*
			<a\s+href="\/sport\/team\.aspx\?id=[-a-fA-F0-9]+&team=(?P<id1>[0-9]+)">[^<]+<\/a>\s*
			/x', $tm_html, $team_names_m)) {
			throw new \Exception('Cannot find international team IDs');
		}

		$draw_id = $international_m['draw_id'];
		$long_league_id = 'international:' . $international_m['team0'] . ' - ' . $international_m['team1'];
		$league_key = 'international-2017';
		$res = [
			'league_key' => $league_key,
		];
		$res['team_names'] = [
			tde_utils\unify_team_name(utils\decode_html($international_m['team0'])),
			tde_utils\unify_team_name(utils\decode_html($international_m['team1']))
		];
		$season_id = $international_m['season_id'];
		$team_infos = [[
			'season' => $season_id,
			'id' => $team_names_m['id0'],
			'name' => $res['team_names'][0],
		], [
			'season' => $season_id,
			'id' => $team_names_m['id1'],
			'name' => $res['team_names'][1],
		]];
	} else {
		throw new \Exception('Cannot find division!');
	}

	$is_buli = \preg_match('/^[12]BL[NS]?-/', $league_key);
	if ($is_buli) {
		$res['all_players'] = buli_download_all_players(
			$httpc, $league_key, $domain, $teamnames_m['season0'], $draw_id, $match_id, $team_infos);
	} else {
		$res['all_players'] = \array_map(function($ti) use ($httpc, $domain, $league_key) {
			$ap = tde_utils\download_team_players($httpc, $domain, $league_key, $ti['season'], $ti['id']);
			return $ap ? $ap : [];
		}, $team_infos);
	}

	$res['team_competition'] = true;

	if (\preg_match('/<th>Spieltermin:<\/th><td>(?:<img\s+class="icon_planningchanged"[^>]*>)?\s*[A-Za-z]+\s*([0-9]{1,2}\.[0-9]{1,2}.[0-9]{4,})\s*<span class="time">([0-9]{2}:[0-9]{2})<\/span>/', $tm_html, $time_m)) {
		$res['date'] = $time_m[1];
		$res['starttime'] = $time_m[2];
	} else {
		throw new \Exception('Cannot find starttime');
	}

	if (\preg_match('/<th>Spielort:<\/th><td><a[^<]*>([^<]+)<\/a><\/td>/', $tm_html, $location_m)) {
		$res['location'] = $location_m[1];
	}

	if (\preg_match('/<th>[^><]*Schiedsrichter[^><]*<\/th><td>([^<]+)<\/td>/', $tm_html, $umpire_m)) {
		$res['umpires'] = $umpire_m[1];
	}

	if (\preg_match('/<th>[^><]*besondere Vorkommnisse[^><]*<\/th><td>([^<]+)<\/td>/', $tm_html, $notes_m)) {
		$res['notes'] = $notes_m[1];
	}

	if (\preg_match('/<th>[^><]*Bemerkungen[^><]*<\/th><td>\s*([0-9]+)\s*Zuschauer\s*<\/td>/', $tm_html, $spectators_m)) {
		$res['spectators'] = $spectators_m[1];
	}

	// Matches
	if (!\preg_match('/<table\s+class="ruler matches">(?P<html>.+?)<\/tbody>\s*<\/table>/s', $tm_html, $table_m)) {
		throw new \Exception('Cannot find table in teammatch HTML');
	}
	$matches_table_html = $table_m['html'];
	\preg_match_all('/
		<tr>\s*
		(?:<td>\s*[0-9]*\s*<\/td>)? # match order
		<td>(?P<match_name>[A-Z\.0-9\s]+)<\/td>
		\s*<td[^>]*>(?:<table[^>]*>(?P<players_html0>.*?)<\/table>)?
		<\/td><td[^>]*>-<\/td>
		<td[^>]*>(?:<table[^>]*>(?P<players_html1>.*?)<\/table>)?<\/td>
		<td>(?P<score_html>.*?)<\/td>
		/xs', $matches_table_html, $matches_m, \PREG_SET_ORDER);
	$matches = [];
	foreach ($matches_m as $mm) {
		$match_name = $mm['match_name'];
		$is_doubles = preg_match('/DD|GD|HD|WD|MX|MD|BD|JD/', $match_name) !== 0;
		$expect_players = $is_doubles ? 2 : 1;

		$teams = [
			tde_utils\parse_match_players(isset($mm['players_html0']) ? $mm['players_html0'] : ''),
			tde_utils\parse_match_players(isset($mm['players_html1']) ? $mm['players_html1'] : ''),
		];
		$incomplete = (
			(\count($teams[0]['players']) !== $expect_players) ||
			(\count($teams[1]['players']) !== $expect_players)
		);
		$match_id = (
			'tde:' .
			$res['team_names'][0] . '-' . $res['team_names'][1] .
			'_' . $res['date'] .
			'_' . $match_name
		);
		$setup = [
			'match_name' => $match_name,
			'match_id' => $match_id,
			'is_doubles' => $is_doubles,
			'teams' => $teams,
			'incomplete' => $incomplete,
		];

		if (\preg_match('/^(?P<discipline>[A-Z]+)(?P<num>[1-5])$/', $match_name, $eid_m)) {
			$setup['eventsheet_id']	= $eid_m['num'] . '.' . $eid_m['discipline'];
		}

		$match = [
			'setup' => $setup,
		];
		if (isset($mm['score_html'])) {
			$match['network_score'] = tde_utils\parse_score($mm['score_html']);
		}

		$matches[] = $match;
	}
	$res['matches'] = $matches;

	return $res;
}


function buli_download_all_players($httpc, $league_key, $domain, $season_id, $draw_id, $match_id, $team_infos) {
	// Determine whether Hinrunde / Rückrunde
	$allmatches_url = 'https://' . $domain . '/sport/drawmatches.aspx?id=' . $season_id . '&draw=' . $draw_id;
	$allmatches_page = $httpc->request($allmatches_url);
	if (!$allmatches_page) {
		throw new \Exception('Cannot download allmatch list');
	}

	if (!preg_match('/
		<td\s+class="plannedtime"[^>]*>.*?<\/td>\s*
		<td\s+align="right">[^<]*<\/td>\s*
		<td\s+align="right">\s*(?P<round>[^<]*?)\s*<\/td>\s*
		<td[^>]*>[^<]*<\/td>\s*
		<td\s+class="nowrap"\s+align="right">\s*
		(?:<strong>)?\s*
		<a\s+class="teamname"\s*href="teammatch\.aspx\?id=[A-Z0-9-]*&match=' . \preg_quote($match_id). '">
	/x', $allmatches_page, $allmatches_m)) {
		throw new \Exception('Cannot find match ' . $match_id . ' in list of all matches at ' . $allmatches_url);
	}

	$round_str = $allmatches_m['round'];
	if ($round_str === 'H') {
		$is_hr = true;
	} else if ($round_str === 'R') {
		$is_hr = false;
	} else {
		throw new \Exception('Cannot parse round ' . \json_encode($round_str));
	}

	// Parse VRLs
	$all_players = \array_map(function($ti) use($httpc, $domain, $season_id, $league_key, $is_hr) {
		return tde_utils\download_team_vrl($httpc, $domain, $season_id, $league_key, $ti['id'], $is_hr);
	}, $team_infos);

	return $all_players;
}
