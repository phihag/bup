<?php

function setup_error_handler() {
	\set_error_handler('json_error_handler');
	\set_exception_handler('json_exception_handler');
}

function json_exception_handler($exception) {
	json_err($exception->getMessage());
}

function json_error_handler($level, $errstr, $errfile, $errline) {
	if ((error_reporting() & $level) !== 0) {
		json_err('php error: ' . $errstr. ' (Line ' . $errline . ')');
	}
}

function json_err($description) {
	header('HTTP/1.1 500 Internal Server Error');
	header('Content-Type: application/json');
	header('Cache-Control: no-cache, no-store, must-revalidate');
	header('Pragma: no-cache');
	header('Expires: 0');
	$send = [
		'status' => 'error',
		'message' => $description,
	];
	die(\json_encode($send));
}

function decode_html($html) {
	$named = \html_entity_decode($html);
	return preg_replace_callback('/(&#[0-9]+;)/', function($m) {
		return mb_convert_encoding($m[1], 'UTF-8', 'HTML-ENTITIES');
	}, $named);
}


class CookieJar {
	private $jar;

	public function __construct() {
		$this->jar = [];
	}

	public function read_from_stream($f) {
		$meta = stream_get_meta_data($f);
		$headers = $meta['wrapper_data'];
		foreach ($headers as $h) {
			if (\preg_match('/^Set-Cookie:\s*([A-Za-z_0-9.-]+)=(.*?)(?:$|;)/', $h, $m)) {
				$this->jar[$m[1]] = $m[2];
			}
		}
	}

	public function make_header() {
		$res = 'Cookie:';
		foreach ($this->jar as $k => $v) {
			$res .= ' ' . $k . '=' . $v . ';';
		}
		return $res . "\r\n";
	}
}
