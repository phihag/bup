<?php
set_error_handler('json_error_handler');

$COURTSPOT_ROOT = __DIR__ . \DIRECTORY_SEPARATOR . '..' . \DIRECTORY_SEPARATOR . '..' . \DIRECTORY_SEPARATOR . '..' . \DIRECTORY_SEPARATOR . '..' . \DIRECTORY_SEPARATOR;

$config_fn = $COURTSPOT_ROOT . 'DB_connection.php';
if (!@include($config_fn)) {
	jsonErr('CourtSpot-Datenbankkonfiguration kann nicht geladen werden von ' . $config_fn);
}

$COURTSPOT_DB = isset($CS_name) ? $CS_name : 'CourtSpot';
$db = @mysqli_connect($DB_adress, $DB_name, $DB_pass, $COURTSPOT_DB, $DB_port);
if (!$db) {
	jsonErr('Verbindungsfehler: ' . mysqli_connect_error());
}
mysqli_set_charset($db, 'utf8');


function json_error_handler($level, $errstr, $errfile, $errline) {
	if ((error_reporting() & $level) !== 0) {
		jsonErr('php-Fehler: ' . $errstr. ' (Zeile ' . $errline . ')');
	}
}

function make_player($name, $row) {
	$p = [
		'firstname' => $row[$name . 'VN'],
		'lastname' => $row[$name . 'NN'],
	];

	if ($p['firstname'] && $p['lastname']) {
		$p['name'] = $p['firstname'] . ' ' . $p['lastname'];
	} else if ($p['firstname']) {
		$p['name'] = $p['firstname'];
	} else if ($p['lastname']) {
		$p['name'] = $p['lastname'];
	} else {
		$p['name'] = null;
	}
	return $p;
}

function make_team($name, $row, $verwaltung) {
	$players = [];
	$p1 = make_player($name . 'spieler1', $row);
	if ($p1['name']) {
		array_push($players, $p1);
	}
	$p2 = make_player($name . 'spieler2', $row);
	if ($p2['name']) {
		array_push($players, $p2);
	}
	return [
		'short_name' => $verwaltung[$name . 'Court'],
		'players' => $players,
	];
}

function jsonErr($description) {
	header('Content-Type: application/json');
	header('Cache-Control: no-cache, no-store, must-revalidate');
	header('Pragma: no-cache');
	header('Expires: 0');
	$send = [
		'status' => 'error',
		'description' => $description,
	];
	die(json_encode($send));
}


$result = mysqli_query($db, 'SELECT * FROM Verwaltung WHERE ID=1');
if (! $result) {
	jsonErr(mysqli_error($db));
}
$verwaltung = mysqli_fetch_assoc($result);
mysqli_free_result($result);

$league_key = null;
$tournament_name = null;
$counting = null;

switch ($verwaltung['Liga']) {
case 1:
	$league_key = '1BL-2020';
	break;
case 2:
	$league_key = '2BLN-2020';
	break;
case 3:
	$league_key = '2BLS-2020';
	break;
case 4:
	$league_key = 'RLW-2016';
	break;
case 5:
	$league_key = 'RLN-2016';
	break;
case 6:
	$league_key = 'RLM-2016';
	break;
case 7:
	$league_key = 'RLSO-2019';
	break;
case 8:
	$league_key = 'OLSW-2020';
	break;
case 9:
	$league_key = 'NRW-O19-GW-OL-002-2016';
	break;
case 10:
	$league_key = 'NRW-O19-GW-OL-003-2016';
	break;
case 11:
	$league_key = '1BL-2020';
	break;
case 12:
	$league_key = '1BL-2020';
	break;
case 13:
	$league_key = '1BL-2020';
	break;
case 14:
	$league_key = '1BL-2020';
	break;


}

if ($league_key === null) {
	$counting = (isset($verwaltung['Bundesliga']) && $verwaltung['Bundesliga']) ? '5x11_15' : '3x21';
}


$result = mysqli_query($db, '
SELECT sv_first.first_timestamp AS first_timestamp, Spiele.*, svf.*, UNIX_TIMESTAMP(svf.ts) AS last_timestamp
FROM Spiele

INNER JOIN (
	SELECT sv.*, svmax.max_Spielstep AS max_Spielstep
	FROM (
		SELECT svs.Art, MAX(svs.Spielstep) AS max_Spielstep
		FROM Spielverlauf svs
		GROUP BY svs.Art
	) svmax
	INNER JOIN Spielverlauf sv
		ON sv.Art = svmax.Art AND sv.Spielstep = svmax.max_Spielstep
) svf
ON Spiele.Spiel = svf.Art

INNER JOIN (
	SELECT sv2.Art AS Art, UNIX_TIMESTAMP(MIN(sv2.ts)) AS first_timestamp
	FROM Spielverlauf sv2
	GROUP BY sv2.Art
) sv_first
ON Spiele.Spiel = sv_first.Art

ORDER BY Spiele.Reihenfolge
;');
if (! $result) {
	jsonErr(mysqli_error($db));
}

$matches = [];
$today = @date('Y-m-d');
$preferred_order = [];
while ($row = $result->fetch_assoc()) {
	$network_score = [];
	for ($i = 1;array_key_exists('HeimSatz' . $i, $row);$i++) {
		$score_home = intval($row['HeimSatz' . $i]);
		$score_away = intval($row['GastSatz' . $i]);
		if (($score_home < 0) || ($score_away < 0)) {
			break;
		}
		array_push($network_score, [$score_home, $score_away]);
	}

	$home_team = make_team('Heim', $row, $verwaltung);
	$away_team = make_team('Gast', $row, $verwaltung);
	$is_doubles = preg_match('/HD|DD|GD/', $row['Art']);
	$player_count = $is_doubles ? 2 : 1;
	$incomplete = (
		(count($home_team['players']) !== $player_count) ||
		(count($away_team['players']) !== $player_count)
	);
	$home_team_name = $verwaltung['Heim'];
	$away_team_name = $verwaltung['Gast'];
	$match_id = 'courtspot_' . $today . '_' . $row['Art'] . '_' . $home_team_name . '-' . $away_team_name;

	$setup = [
		'match_name' => $row['Art'],
 		'teams' => [
			$home_team,
			$away_team,
		],
		'is_doubles' => $is_doubles,
		'incomplete' => $incomplete,
		'courtspot_match_id' => $row['Art'],
		'match_id' => $match_id,
	];
	$preferred_order[] = $setup['match_name'];

	if ($counting) {
		$setup['counting'] = $counting;
	}

	$team1_serving = (
		($row['lastPoint'] == 'heim') ? true :
		(($row['lastPoint'] == 'gast') ? false : null));
	$m = [
		'setup' => $setup,
		'network_score' => $network_score,
		'network_team1_serving' => $team1_serving,
		'network_teams_player1_even' => [
			$row['linksheim'] ? (($row['linksheim'] == 'Spieler1') == ($row['oben'] == 'heim')) : null,
			$row['linksgast'] ? (($row['linksgast'] == 'Spieler1') == ($row['oben'] == 'gast')) : null,
		],
		'network_last_update' => intval($row['last_timestamp']) * 1000,
		'network_match_start' => intval($row['first_timestamp']),
		'courtspot' => [
			'heim_oben' => ($row['oben'] == 'heim'),
			'detail' => $row['Detail'],
			'ts' => $row['ts'],
			'aufschlag_num' => intval($row['Aufgabe']),
			'step' => intval($row['max_Spielstep']),
		],
	];
	if (array_key_exists('presses_json', $row)) {
		$m['presses_json'] = $row['presses_json'];
	}
	$matches[] = $m;
}
mysqli_free_result($result);

function _find_match($matches, $courtspot_id) {
	foreach ($matches as $m) {
		if ($m['setup']['courtspot_match_id'] === $courtspot_id) {
			return $m;
		}
	}
	return null;
}

$court_result = mysqli_query($db, '
SELECT AnzeigeID, Anzeige, Detail
FROM Courts;');
if (! $court_result) {
	jsonErr(mysqli_error($db));
}
$courts = [];
while ($row = $court_result->fetch_assoc()) {
	$match = _find_match($matches, $row['Anzeige']);
	$match_id = $match ? $match['setup']['match_id'] : null;
	$courts[] = [
		'court_id' => $row['AnzeigeID'],
		'match_id' => $match_id,
		'courtspot_detail' => $row['Detail'],
		'chair' => ((count($courts) % 2 === 0) ? 'west' : 'east'),
	];
}
mysqli_free_result($court_result);

$cs_version = isset($verwaltung['Version']) ? $verwaltung['Version'] : '0.9';
$res = [
	'status' => 'ok',
	'matches' => $matches,
	'courts' => $courts,
	'id' => 'Courtspot:' . $verwaltung['Heim'] . '-' . $verwaltung['Gast'] . '-2017',
	'team_names' => [$verwaltung['Heim'], $verwaltung['Gast']],
	'league_key' => $league_key,
	'team_competition' => true,
	'courtspot_version' => $cs_version,
	'preferred_order' => $preferred_order,
];
if ($tournament_name) {
	$res['tournament_name'] = $tournament_name;
}
if ($counting) {
	$res['counting'] = $counting;
}
if ($verwaltung['Startzeit']) {
	$res['starttime'] = $verwaltung['Startzeit'];
}
if ($verwaltung['Datum']) {
	$res['date'] = $verwaltung['Datum'];
}

if ($verwaltung['Spieltag']) {
	$res['matchday'] = $verwaltung['Spieltag'];
}
if ($verwaltung['Ort']) {
	$res['location'] = $verwaltung['Ort'];
}
if ($verwaltung['URL']) {
	$tde_url = $verwaltung['URL'];
	if (preg_match('/^teammatch/', $tde_url)) {
		$tde_url = 'https://www.turnier.de/sport/' . $tde_url;
	}
	if (preg_match('/^sport\/league/', $tde_url)) {
		$tde_url = 'https://dbv.turnier.de/' . $tde_url;
	}
	$res['report_urls'] = [$tde_url];
}

if (array_key_exists('all_players', $_GET)) {
	$since_teams = [0, 0];
	for ($team_idx = 0;$team_idx <= 1;$team_idx++) {
		$team_name = $res['team_names'][$team_idx];
		if (preg_match('/\s([2-9])$/', $team_name, $matches)) {
			$since_teams[$team_idx] = \intval($matches[0][1]);
		}
	}

	$all_players_result = mysqli_query($db, '
	SELECT Art, Vorname, Nachname, Rangliste
	FROM Spieler ORDER BY Art DESC;');
	if (! $court_result) {
		jsonErr(mysqli_error($db));
	}
	$all_players = [[], []];
	while ($row = $all_players_result->fetch_assoc()) {
		if (! preg_match('/^(Heim|Gast)(Herr|Dame)$/', $row['Art'], $art_m)) {
			jsonErr('Cannot parse Spieler.Art = ' . $row['Art']);
		}
		$team_id = ($art_m[1] === 'Heim') ? 0 : 1;
		$gender = ($art_m[2] === 'Herr') ? 'm' : 'f';
		$name = $row['Vorname'] . ' ' . $row['Nachname'];

		$p = [
			'gender' => $gender,
			'firstname' => $row['Vorname'],
			'lastname' => $row['Nachname'],
			'name' => $name,
		];

		if (\preg_match('/^([SMJ]?[0-9]+)-([0-9]+)$/', $row['Rangliste'], $m)) {
			$p['ranking_team'] = $m[1];
			$p['ranking'] = \intval($m[2]);
		} else if (\preg_match('/^([SMJ]?[0-9]+)-([0-9]+)-D([0-9]+)$/', $row['Rangliste'], $m)) {
			$p['ranking_team'] = $m[1];
			$p['ranking'] = \intval($m[2]);
			$p['ranking_d'] = \intval($m[3]);
		} else if (\preg_match('/^([0-9]+)$/', $row['Rangliste'], $m)) {
			$p['ranking'] = \intval($m[1]);
		} else if (\preg_match('/^([0-9]+)-D([0-9]+)$/', $row['Rangliste'], $m)) {
			$p['ranking'] = \intval($m[1]);
			$p['ranking_d'] = \intval($m[2]);
		}

		if (\array_key_exists('ranking_team', $p)) {
			if (is_numeric($p['ranking_team'])) {
				$team_number = \intval($p['ranking_team']);
				if ($since_teams[$team_id] > $team_number) {
					continue;
				}
			}

		}


		$all_players[$team_id][] = $p;
	}
	mysqli_free_result($all_players_result);
	$res['all_players'] = $all_players;
}

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Content-Type: application/json');

echo json_encode($res, JSON_PRETTY_PRINT);
