<?php

function setup_error_handler() {
	\set_error_handler('json_error_handler');
	\set_exception_handler('json_exception_handler');
}

function json_exception_handler($exception) {
	json_err(
		'php exception: ' .
		$exception->getMessage() .
		' at ' . $exception->getFile() . ':' . $exception->getLine()
	);
}

function json_error_handler($level, $errstr, $errfile, $errline) {
	if ((error_reporting() & $level) !== 0) {
		json_err('php error: ' . $errstr. ' (' . $errfile . ':' . $errline . ')');
	}
}

function json_err($description, $haystack=false) {
	header('HTTP/1.1 500 Internal Server Error');
	header('Content-Type: application/json');
	header('Cache-Control: no-cache, no-store, must-revalidate');
	header('Pragma: no-cache');
	header('Expires: 0');
	$send = [
		'status' => 'error',
		'message' => $description,
	];
	if ($haystack) {
		$send['haystack'] = $haystack;
	}
	die(\json_encode($send));
}

function send_json($data) {
	header('HTTP/1.1 200 OK');
	header('Content-Type: application/json');
	header('Cache-Control: no-cache, no-store, must-revalidate');
	header('Pragma: no-cache');
	header('Expires: 0');
	echo \json_encode($data);
}

function decode_html($html) {
	$named = \html_entity_decode($html);
	return preg_replace_callback('/(&#[0-9]+;)/', function($m) {
		return mb_convert_encoding($m[1], 'UTF-8', 'HTML-ENTITIES');
	}, $named);
}
