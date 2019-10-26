<?php
namespace aufschlagwechsel\bup\export2url;
use aufschlagwechsel\bup\utils;
use aufschlagwechsel\bup\http_utils;
use aufschlagwechsel\bup\tde_export;

require_once 'utils.php';
utils\setup_error_handler();
require_once 'http_utils.php';
require_once 'tde_export.php';

if (!isset($_GET['action'])) {
	throw new \Exception('Missing action');
}
$action = $_GET['action'];

$url = utils\param('url');
$user = utils\param('user');
$password = utils\param('password');
$team_names = \json_decode(utils\param('team_names'), true);
$matches = \json_decode(utils\param('matches_json'), true);
$max_game_count = \intval(utils\param('max_game_count'));
$cookies_json = (
	isset($_POST['cookies_json']) ? $_POST['cookies_json'] :
	(isset($_GET['cookies_json']) ? $_GET['cookies_json'] : false
));
$cookies = $cookies_json ? \json_decode($cookies_json) : null;


$httpc = http_utils\AbstractHTTPClient::make();
$url = \preg_replace('/^https:\/\/(?:www\.)?turnier\.de\//', 'https://dbv.turnier.de/', $url);

if ($action === 'prepare') {
	$prepared = tde_export\prepare(
		$httpc, $url, $user, $password, $team_names, $matches, $max_game_count, $cookies);
	utils\send_json($prepared);
} else if ($action === 'submit') {
	$user_extra_fields_json = utils\param('extra_fields_json');
	$user_extra_fields = \json_decode($user_extra_fields_json, true);

	tde_export\submit(
		$httpc, $url, $user, $password, $team_names, $matches, $max_game_count, $cookies, $user_extra_fields);
	utils\send_json([
		'status' => 'saved',
		'result_url' => $url,
	]);

} else {
	throw new \Exeption('Unsupported action');
}
