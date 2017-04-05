<?php

set_error_handler('json_error_handler');

include '../../DB_connection.php';
$db = @mysqli_connect($DB_adress, $DB_name, $DB_pass, 'CourtSpot', $DB_port);
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
	$p['name'] = $p['firstname'] . ' ' . $p['lastname'];
	return $p;
}

function make_team($name, $row, $verwaltung) {
	$players = [];
	$p1 = make_player($name . 'spieler1', $row);
	if ($p1['firstname'] && $p1['lastname']) {
		array_push($players, $p1);
	}
	$p2 = make_player($name . 'spieler2', $row);
	if ($p2['firstname'] && $p2['lastname']) {
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
$neutral_ground = false;
switch ($verwaltung['Liga']) {
case 1:
	$league_key = '1BL-2016';
	break;
case 2:
	$league_key = '2BLN-2016';
	break;
case 3:
	$league_key = '2BLS-2016';
	break;
case 4: // Aufstiegsrunde
	$league_key = '1BL-2016';
	$neutral_ground = true;
	break;
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
;');
if (! $result) {
	jsonErr(mysqli_error($db));
}

$matches = [];
$today = @date('Y-m-d');
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
		'counting' => '5x11_15',
		'courtspot_match_id' => $row['Art'],
		'match_id' => $match_id,
	];
	$m = [
		'setup' => $setup,
		'network_score' => $network_score,
		'network_team1_serving' => ($row['lastPoint'] == 'heim'),
		'network_teams_player1_even' => [
			($row['linksheim'] == 'Spieler1') == ($row['oben'] == 'heim'),
			($row['linksgast'] == 'Spieler1') == ($row['oben'] == 'gast'),
		],
		'network_last_update' => intval($row['last_timestamp']),
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

$res = [
	'status' => 'ok',
	'matches' => $matches,
	'courts' => $courts,
	'id' => 'Courtspot:' . $verwaltung['Heim'] . ' - ' . $verwaltung['Gast'],
	'event_name' => $verwaltung['Heim'] . ' - ' . $verwaltung['Gast'],
	'team_names' => [$verwaltung['Heim'], $verwaltung['Gast']],
	'league_key' => $league_key,
	'team_competition' => true,
	'neutral_ground' => $neutral_ground,
];

if (array_key_exists('all_players', $_GET)) {
	$all_players_result = mysqli_query($db, '
	SELECT Art, Vorname, Nachname
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

		$all_players[$team_id][] = [
			'gender' => $gender,
			'firstname' => $row['Nachname'],
			'lastname' => $row['Vorname'],
			'name' => $name,
		];
	}
	mysqli_free_result($all_players_result);
	$res['all_players'] = $all_players;
}


header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Content-Type: application/json');

echo json_encode($res, JSON_PRETTY_PRINT);
