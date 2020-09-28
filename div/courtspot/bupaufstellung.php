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

if (!function_exists('json_last_error_msg')) {
	// php < 5.5
	function json_last_error_msg() {
		static $ERRORS = array(
			JSON_ERROR_NONE => 'No error',
			JSON_ERROR_DEPTH => 'Maximum stack depth exceeded',
			JSON_ERROR_STATE_MISMATCH => 'State mismatch (invalid or malformed JSON)',
			JSON_ERROR_CTRL_CHAR => 'Control character error, possibly incorrectly encoded',
			JSON_ERROR_SYNTAX => 'Syntax error',
			JSON_ERROR_UTF8 => 'Malformed UTF-8 characters, possibly incorrectly encoded'
		);

		$error = json_last_error();
		return isset($ERRORS[$error]) ? $ERRORS[$error] : 'Unknown error';
	}
}
if (!function_exists('mysqli_begin_transaction')) {
	// php < 5.5
	function mysqli_begin_transaction($link) {
		mysqli_query($link, 'START TRANSACTION');
	}
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	jsonErr('Kein POST-Request!');
}

$setup_json = file_get_contents('php://input');
if (!$setup_json) {
	jsonErr('Keine Eingabe; erwarte JSON-Dokument!');
}

$setup = json_decode($setup_json, true);
if ($setup === NULL) {
	jsonErr('Konnte JSON nicht parsen: ' . json_last_error_msg());
}
if (! is_array($setup)) {
	jsonErr('Ungültiges JSON-Dokument.');	
}

mysqli_autocommit($db, false);
mysqli_begin_transaction($db);

$update_stmt = mysqli_prepare($db, 'UPDATE Spiele SET Heimspieler1VN=?, Heimspieler1NN=?, Heimspieler2VN=?, Heimspieler2NN=?, Gastspieler1VN=?, Gastspieler1NN=?, Gastspieler2VN=?, Gastspieler2NN=? WHERE Spiel=?');
if (!$update_stmt) {
	jsonErr('Failed to prepare update statement');
}

$by_match = $setup['by_match'];
assert(is_array($by_match));
foreach ($by_match as $match_art => $teams) {
	assert(\count($teams) === 2);
	$params = [];
	foreach ($teams as $team) {
		assert(is_array($team));
		for ($player_id = 0;$player_id < 2;$player_id++) {
			$p = isset($team[$player_id]) ? $team[$player_id] : null;
			if (!$p) {
				$p = [
					'firstname' => '',
					'lastname' => '',
				];
			}

			assert(array_key_exists('firstname', $p));
			assert(array_key_exists('lastname', $p));

			$params[] = $p['firstname'];
			$params[] = $p['lastname'];
		}
	}

	mysqli_stmt_bind_param(
		$update_stmt, 'sssssssss',
		$params[0], $params[1], $params[2], $params[3],
		$params[4], $params[5], $params[6], $params[7],
		$match_art);

	if (!mysqli_stmt_execute($update_stmt)) {
		jsonErr('Running update statement failed: ' . mysqli_error($db));
	}
}

if (!mysqli_stmt_close($update_stmt)) {
	jsonErr('Failed to close update statement');
}

mysqli_query($db, 'UPDATE Verwaltung SET lfdnum=lfdnum+1 WHERE ID = "1"');
mysqli_commit($db);

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Content-Type: application/json');

echo json_encode(['status' => 'ok'], JSON_PRETTY_PRINT);
