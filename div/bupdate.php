<?php
// TODO auto modes

// TODO curl
// TODO cli-curl
// TODO cli-wget
// TODO zip
// TODO cli-unzip

define('DOWNLOAD_METHOD', 'php'); // Possible values: 'php'
define('ZIP_METHOD', 'phar'); // Possible values: 'phar'
define('TARGET_DIR', __DIR__);
define('DOWNLOAD_URL', 'https://aufschlagwechsel.de/bup.zip');

\set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
});

function error($msg) {
	\header('HTTP/1.1 500 Internal Server Error');
	\header('Content-Type: text/plain');
	echo $msg;
	die();
}

$tmp_id = uniqid('bup_update');
$tmp_dir = sys_get_temp_dir() . '/' . $tmp_id;
if (! \mkdir($tmp_dir)) {
	error('Cannot create tmp dir ' . $tmp_dir);
}

$bup_dir = TARGET_DIR . '/bup';
$new_dir = $tmp_dir . '/newbup';
$zip_fn = $tmp_dir . '/bup.zip';

if (DOWNLOAD_METHOD === 'php') {
	$zip_contents = \file_get_contents(DOWNLOAD_URL);
	if ($zip_contents === false) {
		error('Failed to download new bup version');
	}
	if (! \file_put_contents($zip_fn, $zip_contents)) {
		error('Could not write zip file to disk');
	}
} else {
	error('Unsupported download method ' . DOWNLOAD_METHOD);
}

// Unpack zip
if (ZIP_METHOD === 'phar') {
	// TODO extract
} else {
	error('Unsupported zip method ' . ZIP_METHOD);
}

// TODO test checksums

// Switch new and old version.
// This is not quite atomically since we're not using a symlink
if (! \rename($bup_dir, $tmp_dir . '/oldbup.' $tmp_id)) {
	error('Failed to move old bup dir');
}
if (! \rename($new_bup, $bup_dir)) {
	error('Failed to move in new bup dir');
}

// TODO Remove old bup files
