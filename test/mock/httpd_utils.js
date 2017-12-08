'use strict';

const assert = require('assert');

function prefixed(prefix, handler) {
	assert(prefix.endsWith('/'));
	return (req, res, pathname) => {
		if (! pathname.startsWith(prefix)) {
			return 'unhandled';
		}
		const remaining_pathname = pathname.substring(prefix.length - 1);
		return handler(req, res, remaining_pathname);
	};
}

function err(res, errcode) {
	res.writeHead(errcode, {'Content-Type': 'text/plain'});
	res.end('Error ' + errcode);
}

/*
function redirect_handler(from, to) {
	// TODO implement this
}
*/

module.exports = {
	err,
	prefixed,
};
