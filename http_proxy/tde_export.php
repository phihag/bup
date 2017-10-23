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

if ($_GET['action'] === 'prepare') {
	$user = _param('user');
	$password = _param('password');
	$url = _param('url');

	$jar = new CookieJar();

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
	$meta = stream_get_meta_data($f);
	$headers = $meta['wrapper_data'];
	$postlogin_page = stream_get_contents($f);
	fclose($f);

	if (\preg_match('/<span class="error">(.*?)<\/span>/', $postlogin_page, $m)) {
		json_err('Login failed: ' . $m[1]);
	}

	die ();
} else {
	throw new \Exeption('Unsupported action');
}
