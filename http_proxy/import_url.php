<?php
namespace aufschlagwechsel\bup\import_url;
use aufschlagwechsel\bup\bbv_import;
use aufschlagwechsel\bup\http_utils;
use aufschlagwechsel\bup\tde_dayimport;
use aufschlagwechsel\bup\tde_import;
use aufschlagwechsel\bup\utils;

require 'utils.php';
utils\setup_error_handler();
require 'http_utils.php';
require 'bbv_import.php';
require 'tde_import.php';
require 'tde_dayimport.php';

if (!isset($_GET['url'])) {
	throw new \Exception('Missing URL');
}
$match_url = $_GET['url'];
main($match_url);

function main($match_url) {
	$httpc = http_utils\AbstractHTTPClient::make();

	if (\preg_match('/^https?:\/\/(?P<domain>www\.turnier\.de|[a-z]+\.tournamentsoftware\.com)\/sport\/teammatch\.aspx\?id=([a-fA-F0-9-]+)&match=(?P<match_id>[0-9]+)$/', $match_url, $matches)) {

		$domain = $matches['domain'];
		$match_id = $matches['match_id'];
		$tm_html = $httpc->request($match_url);
		if ($tm_html === false) {
			throw new \Exception('Failed to download ' . $match_url . ': ' . $httpc->get_error_info());
		}
		$event = tde_import\parse_teammatch($httpc, $tm_html, $domain, $match_id);
		$event['report_urls'] = [$match_url];
	} else if (\preg_match('/^http:\/\/localhost\/test\/matches(?:[0-9]*)\.html$|https?:\/\/www\.(?:turnier\.de|tournamentsoftware\.com)\/sport\/matches\.aspx\?id=([a-fA-F0-9-]+)/', $match_url)) {

		$day_html = $httpc->request($match_url);
		$event = tde_dayimport\parse_day($day_html);
	} else if (bbv_import\match_url($match_url)) {
		$event = bbv_import\import($httpc, $match_url);
	} else {
		throw new \Exception('Unsupported URL');
	}

	$data = $event;
	if (isset($_GET['format'])) {
		switch($_GET['format']) {
		case 'export':
			$data = [
				'type' => 'bup-export',
				'version' => 2,
				'event' => $event,
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

