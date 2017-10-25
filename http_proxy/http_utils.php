<?php

define('BUP_USER_AGENT', 'bup (phihag@phihag.de)');

class CookieJar {
	private $jar;

	public function __construct() {
		$this->jar = [];
	}

	public function read_from_stream($f) {
		$meta = stream_get_meta_data($f);
		$headers = $meta['wrapper_data'];
		foreach ($headers as $h) {
			$this->read_from_header($h);
		}
	}

	public function read_from_header($header) {
		if (\preg_match('/^Set-Cookie:\s*([A-Za-z_0-9.-]+)=(.*?)(?:$|;)/', $header, $m)) {
			$this->jar[$m[1]] = $m[2];
		}
	}

	public function make_header() {
		return 'Cookie: ' . $this->get_line() . "\r\n";
	}

	public function get_line() {
		$res = '';
		foreach ($this->jar as $k => $v) {
			$res .= $k . '=' . $v . ';';
		}
		return $res;
	}

	public function get($name) {
		return $this->jar[$name];
	}
}

abstract class AbstractHTTPClient {
	public function __construct() {

	}

	public static function make() {
		if (CurlHTTPClient::is_supported()) {
			return new CurlHTTPClient();
		}
		return new PhpHTTPClient();
	}

	abstract public function get_cookie($name);

	/**
	* Returns the response body, or false if the request failed.
	*/
	abstract public function request($url, $headers=null, $method='GET', $body=null);
}

class PhpHTTPClient extends AbstractHTTPClient {
	private $cjar;

	public function __construct() {
		parent::__construct();
		$this->cjar = new CookieJar();
	}

	public function request($url, $headers=null, $method='GET', $body=null) {
		$header = (
			($headers ? implode("\r\n", $headers) . "\r\n" : '') .
			$this->cjar->make_header()
		);
		$options = [
			'http' => [
				'header' => $header,
				'method' => $method,
				'follow_location' => 0,
				'user_agent' => BUP_USER_AGENT,
			],
		];
		if ($body) {
			$options['http']['content'] = $body;
		}

		$context = stream_context_create($options);
		$f = fopen($url, 'r', false, $context);
		if ($f === false) {
			return false;
		}
		$this->cjar->read_from_stream($f);
		$page = stream_get_contents($f);
		fclose($f);
		return $page;
	}

	public function get_cookie($name) {
		return $this->cjar->get($name);
	}
}

class CurlHTTPClient extends AbstractHTTPClient {
	private $ch;
	private $cjar;

	public function __construct() {
		parent::__construct();
		$this->cjar = new CookieJar();
		$this->ch = curl_init();
		curl_setopt($this->ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($this->ch, CURLOPT_FAILONERROR, true);
	}

	public function request($url, $headers=null, $method='GET', $body=null) {
		$cjar = $this->cjar;
		curl_setopt($this->ch, CURLOPT_HEADERFUNCTION, function($ch, $header_line) use ($cjar) {
			$cjar->read_from_header($header_line);
			return strlen($header_line);
		});
		curl_setopt($this->ch, CURLOPT_COOKIE, $cjar->get_line());
		curl_setopt($this->ch, CURLOPT_USERAGENT, BUP_USER_AGENT);
		curl_setopt($this->ch, CURLOPT_URL, $url);
		curl_setopt($this->ch, CURLOPT_CUSTOMREQUEST, $method);
		if ($headers) {
			curl_setopt($this->ch, CURLOPT_HTTPHEADER, $headers);
		}
		if ($body) {
			curl_setopt($this->ch, CURLOPT_POSTFIELDS, $body);
		}
		return curl_exec($this->ch);
	}

	public static function is_supported() {
		return function_exists('curl_version');
	}

	public function get_cookie($name) {
		return $this->cjar->get($name);
	}
}
