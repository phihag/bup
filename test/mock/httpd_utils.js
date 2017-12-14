'use strict';

const assert = require('assert');
const url_module = require('url');

function prefixed(prefix, handler) {
	assert(prefix.endsWith('/'));
	return (req, res, pathname) => {
		if (! pathname.startsWith(prefix)) {
			return 'unhandled';
		}
		return handler(req, res, pathname.substring(prefix.length - 1));
	};
}

function err(res, errcode, message) {
	res.writeHead(errcode, {'Content-Type': 'text/plain'});
	res.end('Error ' + errcode + (message ? ': ' + message : ''));
}

function multi_handler(handlers) {
	return (req, res, pathname) => {
		for (const h of handlers) {
			const handler_result = h(req, res, pathname);
			if (handler_result !== 'unhandled') {
				return handler_result;
			}
		}
		return 'unhandled';
	};
}

function redirect(req, res, location) {
	if (!location.startsWith('/')) {
		const full_pathname = url_module.parse(req.url).pathname;
		const m = /^(.*\/)[^\/]*/.exec(full_pathname);
		if (!m) {
			return err(res, 400, 'URL without slash');
		}
		location = m[1] + to;
	}

	res.writeHead(302, {
		Location: location,
		'Content-Type': 'text/plain',
	});
	res.end('Redirect to ' + location);
}

function redirect_handler(from, to) {
	return (req, res, pathname) => {
		if (pathname !== from) return 'unhandled';
		redirect(req, res, to);
	};
}

function parse_cookies(req) {
    const res = {};
    const cookie_header = req.headers.cookie;

    if (!cookie_header) return res;

	for (const cookie_str of cookie_header.split(';')) {
		const m = /^([^=]+)=(.*)$/.exec(cookie_str);
		if (m) {
			res[m[1]] = decodeURIComponent(m[2]);
		}
	}
	return res;
}

function render_html(res, html) {
	res.writeHead(200, {
		'Cache-Control': 'no-cache, no-store, must-revalidate',
		'Pragma': 'no-cache',
		'Content-Type': 'text/html; charset=UTF-8',
	});
	res.end(html);
}

module.exports = {
	err,
	prefixed,
	multi_handler,
	parse_cookies,
	redirect,
	render_html,
	redirect_handler,
};
