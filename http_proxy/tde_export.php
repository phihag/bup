<?php
require 'utils.php';
setup_error_handler();

function _param($name) {
	if (!isset($_GET[$name])) {
		header('HTTP/1.1 400 Bad Request');
		header('Content-Type: text/plain');
		echo 'Missing ' . $name;
		exit();
	}
	return $_GET[$name]; // TODO switch back to POST
}

if (!isset($_GET['action'])) {
	throw new \Exception('Missing action');
}

function login($jar, $user, $password) {
	// Download login form
	$login_url = 'https://www.turnier.de/member/login.aspx';
	$f = fopen($login_url, 'r');
	if ($f === false) {
		return json_err('Failed to download login form');
	}
	$jar->read_from_stream($f);
	$login_page = stream_get_contents($f);
	fclose($f);

	$LOGIN_RE = '/<form method="post" action="[^"]*login\.aspx"[^>]*>(.*?)<\/form>/s';
	if (!preg_match($LOGIN_RE, $login_page, $matches)) {
		json_err('Cannot find login form');
	}
	$login_form = $matches[1];

	if (!preg_match_all('/<input\s+type="(?:hidden|submit)"\s+name="([^"]*)"(?:\s+id="[^"]*")?\s+value="([^"]+)"/', $login_form, $matches, \PREG_SET_ORDER)) {
		json_err('Failed to find hidden login fields');
	}
	$data = [];
	foreach ($matches as $m) {
		$data[$m[1]] = $m[2];
	}
	$data['ctl00$ctl00$ctl00$cphPage$cphPage$cphPage$pnlLogin$UserName'] = $user;
	$data['ctl00$ctl00$ctl00$cphPage$cphPage$cphPage$pnlLogin$Password'] = $password;

	// Perform login
	$header = (
		'Referer:' . $login_url . "\r\n" .
		"Content-type: application/x-www-form-urlencoded\r\n" .
		$jar->make_header()
	);
	$options = [
		'http' => [
			'header'  => $header,
			'method'  => 'POST',
			'content' => \http_build_query($data),
			'follow_location' => 0,
		],
	];
	$context = stream_context_create($options);
	$f = fopen($login_url, 'r', false, $context);
	if ($f === false) {
		return json_err('Failed to perform login');
	}
	$jar->read_from_stream($f);
	$postlogin_page = stream_get_contents($f);
	fclose($f);

	if (\preg_match('/<span class="error">(.*?)<\/span>/', $postlogin_page, $m)) {
		json_err('Login failed: ' . $m[1]);
	}
}

if ($_GET['action'] === 'prepare') {
	$user = _param('user');
	$password = _param('password');
	$url = _param('url');
	if (!\preg_match('/^https:\/\/www\.turnier\.de\/sport\/teammatch\.aspx\?id=([-A-Fa-f0-9]+)&match=([0-9]+)$/', $url, $matches)) {
		json_err('Unsupported URL ' . $url);
	}
	$tde_id = $matches[1];
	$tde_tm = $matches[2];

	$team_names = \json_decode(_param('team_names'));

	$jar = new CookieJar();
	login($jar, $user, $password);

	$input_url = 'https://www.turnier.de/sport/matchresult.aspx?id=' . $tde_id . '&match=' . $tde_tm;
	$options = [
		'http' => [
			'header'  => $jar->make_header(),
			'follow_location' => 0,
		],
	];
	$context = stream_context_create($options);
	$f = fopen($input_url, 'r', false, $context);
	if ($f === false) {
		return json_err('Failed to download input page');
	}
	$jar->read_from_stream($f);
	$input_page = stream_get_contents($f);
	fclose($f);

	// Check team names
	if (!preg_match('/Eingabe Ergebnis für:\s+<a[^>]+>(.*?)\s*<span class="nobreak">[^<]*<\/span><\/a> - <a[^>]+>(.*?)\s*<span class="nobreak">/', $input_page, $m)) {
		json_err('Cannot find team names');
	}
	$real_team_names = [$m[1], $m[2]];
	if (($team_names[0] !== $real_team_names[0]) || ($team_names[1] !== $real_team_names[1])) {
		json_err('Incorrect team names: This match URL points to ' . $real_team_names[0] . ' - ' . $real_team_names[1] . ', but expected ' . $team_names[0] . ' - ' . $team_names[1]);
	}

	json_err('go on');


	// TODO check that all matches present in query
	// TODO check players

	// TODO return extra fields

	die($input_page);
} else {
	throw new \Exeption('Unsupported action');
}
