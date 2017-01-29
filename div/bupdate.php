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

function rmrf($dir) {
	if (\strpos($dir, 'bup_update') === false) {
		throw new \ErrorException('Sanity check failed, refusing to rmrf ' . $dir);
	}

	// http://stackoverflow.com/a/3352564/35070
	$files = new \RecursiveIteratorIterator(
		new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
		\RecursiveIteratorIterator::CHILD_FIRST
	);

	foreach ($files as $fileinfo) {
		$p = $fileinfo->getRealPath();
		if (! \preg_match('/bup_update/', $p)) {
			throw new \ErrorException('Sanity check failed, refusing to delete ' . $p);
		}

		if ($fileinfo->isDir()) {
			\rmdir($p);
		} else {
			\unlink($p);
		}
	}

	\rmdir($dir);
}

$tmp_id = uniqid('bup_update');
$tmp_dir = sys_get_temp_dir() . '/' . $tmp_id;
if (! \mkdir($tmp_dir)) {
	error('Cannot create tmp dir ' . $tmp_dir);
}

$bup_dir = TARGET_DIR . '/bup';
$zip_fn = $tmp_dir . '/bup.zip';

// Download bup
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

$new_dir = $tmp_dir . '/new';
if (! \mkdir($new_dir)) {
	error('cannot create tmp new dir ' . $new_dir);
}
$new_bup = $new_dir . '/bup';

// Unpack zip
if (ZIP_METHOD === 'phar') {
	// Work around https://bugs.php.net/bug.php?id=69279
	$phar_checksums_json = \file_get_contents('phar://' . $zip_fn . '/bup/checksums.json');
	if (! $phar_checksums_json) {
		error('Cannot read phar checksums');
	}
	$phar_checksums = \json_decode($phar_checksums_json, true);
	if (! $phar_checksums) {
		error('Failed to parse phar checksums: ' . \json_last_error_msg());
	}
	foreach (\array_keys($phar_checksums) as $phar_fn) {
		if (\file_get_contents('phar://' . $zip_fn . '/' . $phar_fn) === false) {
			error('Failed to work around phar bug');
		}
	}

	$phar = new \PharData($zip_fn);
    $phar->extractTo($new_dir);
} else {
	error('Unsupported zip method ' . ZIP_METHOD);
}

// Test checksums
$checksums_fn = $new_bup . '/checksums.json';
$checksums_json = \file_get_contents($checksums_fn);
if (! $checksums_json) {
	error('Cannot read checksums file ' . $checksums_fn);
}
$checksums = \json_decode($checksums_json, true);
if (! $checksums) {
	error('Failed to parse checksums: ' . \json_last_error_msg());
}
foreach ($checksums as $vfn => $cs) {
	$fn = $new_dir . '/' . $vfn;
	$h = \hash_file('sha512', $fn);
	if ($h !== $cs['sha512']) {
		error('Incorrect checksum for ' . $vfn . ': Expected ' . $cs['sha512'] . ', got ' . $h);
	}
}

// Switch new and old version.
// This is not quite atomically since we're not using a symlink
if (\file_exists($bup_dir)) {
	if (! \rename($bup_dir, $tmp_dir . '/oldbup.' . $tmp_id)) {
		error('Failed to move old bup dir');
	}
}
if (! \rename($new_bup, $bup_dir)) {
	error('Failed to move in new bup dir');
}

rmrf($tmp_dir);
