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
	header('Content-Type: application/json');
	header('Cache-Control: no-cache, no-store, must-revalidate');
	header('Pragma: no-cache');
	header('Expires: 0');
	$send = [
		'status' => 'error',
		'description' => $description,
	];
	die(\json_encode($send));
}
