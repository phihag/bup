<?php

define('DOWNLOAD_METHOD', 'php'); // Possible values: 'php', 'curl', 'cli-curl', 'cli-wget'
define('ZIP_METHOD', 'phar'); // Possible values: 'phar', 'php', 'cli-unzip'
define('TARGET_DIR', __DIR__);
define('DOWNLOAD_URL', 'https://aufschlagwechsel.de/bup.zip');

// Be very conservative: assume errors in our code (development only)
\set_error_handler(function ($errno, $errstr, $errfile, $errline) {
	if (error_reporting() === 0) {
		return; // Suppressed reporting
	}
	error($errline . ': ' . $errstr);
	throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
});

\set_time_limit(0);

function error($msg) {
	\header('HTTP/1.1 500 Internal Server Error');
	\header('Content-Type: text/plain');
	echo $msg;
	die();
}

function compat_rename($src, $dst) {
	if (@\rename($src, $dst)) {
		return true;
	}

	// On AUFS (e.g. docker), rename is not supported:
	// https://docs.docker.com/engine/userguide/storagedriver/aufs-driver/#modifying-files-or-directories
	// Fall back to mv instead.
	\exec('mv -T -- ' . \escapeshellarg($src) . ' ' . \escapeshellarg($dst), $mv_output, $mv_ret);
	return $mv_ret === 0;
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
		if (\preg_match('/\.\./', $p)) {
			throw new \ErrorException('Dots check failed, refusing to delete ' . $p);
		}

		if ($fileinfo->isDir()) {
			\rmdir($p);
		} else {
			\unlink($p);
		}
	}

	\rmdir($dir);
}

$tmp_root = TARGET_DIR . '/bupdate_tmp';
if (! \file_exists($tmp_root)) {
	if (! \mkdir($tmp_root)) {
		error('failed to create temporary directory');
	}
}

$tmp_id = \uniqid('bup_update');
$tmp_dir = $tmp_root . '/' . $tmp_id;
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
} elseif (DOWNLOAD_METHOD === 'curl') {
	$zip_fp = \fopen($zip_fn, 'w');
	if (! $zip_fp) {
		error('Failed to open file for curl downloading');
	}
	$ch = \curl_init(DOWNLOAD_URL);
	\curl_setopt($ch, \CURLOPT_RETURNTRANSFER, 1);
	\curl_setopt($ch, \CURLOPT_FILE, $zip_fp);
	$zip_contents = \curl_exec($ch);
	if($curl_errno = \curl_errno($ch)) {
		$curl_error_message = \curl_strerror($errno);
		error('Failed to download via curl: ' . $curl_error_message);
	} else {
		$curl_http_code = \curl_getinfo($ch, \CURLINFO_HTTP_CODE);
		if ($curl_http_code !== 200) {
			error('Failed to download via curl: HTTP ' . $curl_http_code);
		}
	}
	\curl_close($ch);
} elseif (DOWNLOAD_METHOD === 'cli-curl') {
	$cmd = 'curl -w "%{http_code}" -s -o ' . \escapeshellarg($zip_fn) . ' ' . \escapeshellarg(DOWNLOAD_URL);
	$errline = \exec($cmd, $_output, $retcode);
	if ($retcode !== 0) {
		error('Failed to download via cli-curl: ' . $retcode);
	}
	if ($errline !== '200')  {
		error('Failed to download via cli-curl: HTTP ' . $errline);
	}
} elseif (DOWNLOAD_METHOD === 'cli-wget') {
	$cmd = 'wget -q -O ' . \escapeshellarg($zip_fn) . ' ' . \escapeshellarg(DOWNLOAD_URL);
	\exec($cmd, $_output, $retcode);
	if ($retcode !== 0) {
		error('Failed to download via cli-wget: ' . $retcode);
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
     // Release zip file object, this causes the zipe file to close so we can delete it later.
    $phar = null;
} elseif (ZIP_METHOD === 'php') {
	$zip = new \ZipArchive();
	if (!$zip->open($zip_fn)) {
		error('Failed to open zip file');
	}
	$zip->extractTo($new_dir);
	$zip->close();
} elseif (ZIP_METHOD === 'cli-unzip') {
	$cmd = 'unzip ' . \escapeshellarg($zip_fn) . ' -d ' . \escapeshellarg($new_dir);
	$errline = \exec($cmd, $_output, $retcode);
	if ($retcode !== 0) {
		error('Failed to unzip: code ' . $retcode);
	}
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
	$oldbup_dir = tmp_dir . '/oldbup.' . $tmp_id;
	if (! compat_rename($bup_dir, $oldbup_dir)) {
		error('Failed to move old bup dir ' . $bup_dir . ' to ' . $oldbup_dir);
	}
}

if (! compat_rename($new_bup, $bup_dir)) {
	error('Failed to move in new bup dir');
}

$new_version = \file_get_contents($bup_dir . '/VERSION');
if ($new_version === false) {
	error('Failed to read new bup version');
}

rmrf($tmp_dir);
@\rmdir($tmp_root);

if (php_sapi_name() === 'cli') {
	echo 'Updated to bup ' . $new_version . "\n";
	exit();
}


header('Content-Type: text/html');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

?><!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>bupdate</title>
<style>
html, body {font-size: 30px;}
</style>
</head><body>
<p>
Update erfolgreich!<br/>
Jetzt installiert: bup <strong><?php echo $new_version; ?></strong>
</p>

<a href="../">Zurück</a>
</body>
</html>
