<?php
require 'utils.php';
setup_error_handler();

if (!isset($_GET['action'])) {
	throw new \Exception('Missing action');
}

if ($_GET['action'] === 'prepare') {

} else {
	throw new \Exeption('Unsupported action');
}
