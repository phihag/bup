'use strict';

const assert = require('assert');
const querystring = require('querystring');

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

function send_err(res, err_obj) {
	console.error(err_obj.stack);
	err(res, 500, 'Internal Server Error');
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

function redirect(res, location, extra_headers) {
	const headers = {
		Location: location,
		'Content-Type': 'text/plain',
	};
	if (extra_headers) {
		Object.assign(headers, extra_headers);
	}

	res.writeHead(302, headers);
	res.end('Redirect to ' + location);
}

function redirect_handler(from, to) {
	return (req, res, pathname) => {
		if (pathname !== from) return 'unhandled';
		redirect(res, to);
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

function render_html(res, html, extra_headers) {
	const headers = {
		'Cache-Control': 'no-cache, no-store, must-revalidate',
		'Pragma': 'no-cache',
		'Content-Type': 'text/html; charset=UTF-8',
	};
	if (extra_headers) {
		Object.assign(headers, extra_headers);
	}
	res.writeHead(200, headers);
	res.end(html);
}

function read_post(req, cb) {
	let body = '';
	req.on('data', function (data) {
		body += data;
	});
	req.on('end',function(){
		return cb(null, querystring.parse(body));
	});
}

function encode_html(text) {
	return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/&/g, '&amp;').replace(/'/g, '&#39;');
}

module.exports = {
	encode_html,
	err,
	multi_handler,
	parse_cookies,
	prefixed,
	read_post,
	redirect,
	redirect_handler,
	render_html,
	send_err,
};
