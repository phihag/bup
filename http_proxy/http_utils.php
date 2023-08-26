<?php
namespace aufschlagwechsel\bup\http_utils;

define('BUP_USER_AGENT', 'bup (phihag@phihag.de)');

class CookieJar {
	private $jar;

	public function __construct() {
		$this->jar = [];
	}

	public function read_from_stream($f) {
		$meta = \stream_get_meta_data($f);
		$headers = $meta['wrapper_data'];
		foreach ($headers as $h) {
			$this->read_from_header($h);
		}
	}

	public function read_from_header($header) {
		if (\preg_match('/^Set-Cookie:\s*([A-Za-z_0-9.-]+)=(.*?)(?:$|;)/i', $header, $m)) {
			$this->jar[$m[1]] = $m[2];
		}
	}

	public function make_header() {
		return 'Cookie: ' . $this->get_line() . "\r\n";
	}

	public function get_line() {
		$res = '';
		$first = true;
		foreach ($this->jar as $k => $v) {
			if ($first) {
				$first = false;
			} else {
				$res .= ' ';
			}
			$res .= $k . '=' . $v . ';';
		}
		return $res;
	}

	public function get($name) {
		return $this->jar[$name];
	}

	public function set($name, $val) {
		$this->jar[$name] = $val;
	}

	public function get_all() {
		return $this->jar;
	}

	public function set_all($cookies) {
		foreach ($cookies as $k => $v) {
			$this->set($k, $v);
		}
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
	abstract public function set_cookie($name, $val);
	abstract public function get_all_cookies();

	/**
	* Returns the response body, or false if the request failed.
	*/
	abstract public function request($url, $headers=null, $method='GET', $body=null);

	abstract public function get_error_info();

	abstract public function request_as_curl($url, $headers=null, $method='GET', $body=null);
}

abstract class JarHTTPClient extends AbstractHTTPClient {
	protected $cjar;

	public function __construct() {
		parent::__construct();
		$this->cjar = new CookieJar();
	}

	public function get_cookie($name) {
		return $this->cjar->get($name);
	}

	public function set_cookie($name, $val) {
		$this->cjar->set($name, $val);
	}

	public function get_all_cookies() {
		return $this->cjar->get_all();
	}

	public function set_all_cookies($cookies) {
		$this->cjar->set_all($cookies);
	}

	public function request_as_curl($url, $headers=null, $method='GET', $body=null) {
		$res = 'curl';
		$cline = $this->cjar->get_line();
		$res .= ' --user-agent ' . \escapeshellarg(BUP_USER_AGENT);
		if ($cline) {
			$res .= ' --cookie ' . \escapeshellarg($cline);
		}
		if ($method !== 'GET') {
			$res .= ' -X ' . \escapeshellarg($method);
		}

		if ($headers) {
			foreach ($headers as $header) {
				$res .= ' -H ' . \escapeshellarg($header);
			}
		}
		if ($body) {
			$res .= ' -d ' . \escapeshellarg($body);
		}

		$res .= ' ' . $url;
		return $res;
	}
}

class PhpHTTPClient extends JarHTTPClient {
	public function __construct() {
		parent::__construct();
	}

	public function request($url, $headers=null, $method='GET', $body=null) {
		$header = (
			($headers ? \implode("\r\n", $headers) . "\r\n" : '') .
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
		if (isset($_SERVER['HTTP_HOST']) && $_SERVER['HTTP_HOST'] === 'aufschlagwechsel.de') {
			$options['ssl'] = ['verify_peer' => false];
		}

		if ($body) {
			$options['http']['content'] = $body;
		}

		$context = \stream_context_create($options);
		$f = \fopen($url, 'r', false, $context);
		if ($f === false) {
			return false;
		}
		$this->cjar->read_from_stream($f);
		$page = \stream_get_contents($f);
		\fclose($f);
		return $page;
	}

	public function get_error_info() {
		return \json_encode($http_response_header);
	}
}

class CurlHTTPClient extends JarHTTPClient {
	private $ch;

	public function __construct() {
		parent::__construct();
		$this->ch = \curl_init();
		\curl_setopt($this->ch, \CURLOPT_RETURNTRANSFER, true);
		\curl_setopt($this->ch, \CURLOPT_FAILONERROR, true);
	}

	public function request($url, $headers=null, $method='GET', $body=null) {
		$cjar = $this->cjar;
		\curl_setopt($this->ch, \CURLOPT_HEADERFUNCTION, function($ch, $header_line) use ($cjar) {
			$cjar->read_from_header($header_line);
			return \strlen($header_line);
		});
		\curl_setopt($this->ch, \CURLOPT_COOKIE, $cjar->get_line());
		\curl_setopt($this->ch, \CURLOPT_USERAGENT, BUP_USER_AGENT);
		\curl_setopt($this->ch, \CURLOPT_URL, $url);
		\curl_setopt($this->ch, \CURLOPT_CUSTOMREQUEST, $method);
		if ($headers) {
			\curl_setopt($this->ch, \CURLOPT_HTTPHEADER, $headers);
		}
		if ($body) {
			\curl_setopt($this->ch, \CURLOPT_POSTFIELDS, $body);
		}
		return \curl_exec($this->ch);
	}

	public function get_error_info() {
		return \curl_error($this->ch);
	}

	public static function is_supported() {
		return \function_exists('curl_version');
	}
}

abstract class AbstractExtensionHTTPClient extends AbstractHTTPClient {
	protected $httpc;

	public function __construct($httpc) {
		parent::__construct();
		$this->httpc = $httpc;
	}

	public function get_cookie($name) {
		return $this->httpc->get_cookie($name);
	}

	public function set_cookie($name, $val) {
		return $this->httpc->set_cookie($name, $val);
	}

	public function get_all_cookies() {
		return $this->httpc->get_all_cookies();
	}

	public function get_error_info() {
		return $this->httpc->get_error_info();
	}

	public function request_as_curl($url, $headers=null, $method='GET', $body=null) {
		return $this->httpc->request_as_curl($url, $headers, $method, $body);
	}
}

class CacheHTTPClient extends AbstractExtensionHTTPClient {
	private $cache_dir;

	public function __construct($httpc, $cache_dir) {
		parent::__construct($httpc);
		$this->cache_dir = $cache_dir;
		if (!\is_dir($cache_dir)) {
			\mkdir($cache_dir);
		}
	}

	public function request($url, $headers=null, $method='GET', $body=null) {
		if ($method !== 'GET') {
			return $this->httpc->request($url, $headers, $method, $body);
		}

		$cache_fn = $this->cache_dir . '/' . \preg_replace('/[^a-zA-Z0-9\.]+/', '_', $url) . '.html';
		if (\file_exists($cache_fn)) {
			return \file_get_contents($cache_fn);
		}

		$res = $this->httpc->request($url, $headers, $method, $body);
		if ($res && !preg_match('/^{"error/', $res)) {
			\file_put_contents($cache_fn, $res);
		}
		return $res;
	}
}


class DebugHTTPClient extends AbstractExtensionHTTPClient {
	public function request($url, $headers=null, $method='GET', $body=null) {
		echo $this->request_as_curl($url, $headers, $method, $body) . "\n";

		return $this->httpc->request($url, $headers, $method, $body);
	}
}
