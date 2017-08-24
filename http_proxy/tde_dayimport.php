<?php
require 'utils.php';
setup_error_handler();

if (!isset($_GET['url'])) {
	throw new \Exception('Missing URL');
}
$match_url = $_GET['url'];
main($match_url);

function main($match_url) {
	// TODO add this check
	/*if (! \preg_match('/^https?:\/\/www\.turnier\.de\/sport\/teammatch\.aspx\?id=([a-fA-F0-9-]+)&match=([0-9]+)$/', $match_url)) {
		throw new \Exception('Unsupported URL');
	}*/

	$day_html = \file_get_contents($match_url);
	$data = parse_day($day_html);
	$data['status'] = 'ok';

	header('Content-Type: application/json');
	header('Cache-Control: no-cache, no-store, must-revalidate');
	header('Pragma: no-cache');
	header('Expires: 0');

	echo \json_encode($data, \JSON_PRETTY_PRINT);
}

function parse_day($tm_html) {
	if (!preg_match('/<table class="ruler matches">(.*?)<\/tbody>\s*<\/table>/s', $tm_html, $matches)) {
		throw new \Exception('Could not find table');
	}
	$table_html = $matches[1];

	die($table_html);

	return $res;
}
