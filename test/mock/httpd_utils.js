'use strict';

const assert = require('assert');

function prefixed(prefix, handler) {
	assert(prefix.endsWith('/'));
	return (req, res, pathname) => {
		if (! pathname.startsWith(prefix)) {
			return 'unhandled';
		}
		return handler(req, res, pathname.substring(prefix.length - 1));
	};
}

function err(res, errcode) {
	res.writeHead(errcode, {'Content-Type': 'text/plain'});
	res.end('Error ' + errcode);
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

function redirect(res, location) {
	res.writeHead(302, {
		Location: location,
		'Content-Type': 'text/plain',
	});
	res.end('Redirect to ' + location);
}

function redirect_handler(from, to) {
	return (req, res, pathname) => {
		if (pathname !== from) return 'unhandled';

		let location = to;
		if (!location.startsWith('/')) {
			// TODO calculate new location from relative path!

		}

		redirect(res, location);
	};
}

module.exports = {
	err,
	prefixed,
	multi_handler,
	redirect,
	redirect_handler,
};
