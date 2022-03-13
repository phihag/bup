'use strict';

const fs = require('fs');
const crypto = require('crypto');

function hash_file(fn, cb, algo) {
	if (! algo) algo = 'sha512';

	const hash = crypto.createHash(algo);
	const stream = fs.ReadStream(fn);
	let cb_called = false;
	stream.on('data', function(d) {
		hash.update(d);
	});
	stream.on('end', function() {
		if (cb_called) {
			return;
		}
		cb_called = true;

		cb(null, hash.digest('hex'));
	});
	stream.on('error', function(err) {
		if (cb_called) {
			return;
		}
		cb_called = true;
		cb(err);
	});
}

function unique(iterable) {
	const res = [];
	const seen = new Set();

	for (const el of iterable) {
		if (seen.has(el)) continue;

		seen.add(el);
		res.push(el);
	}
	return res;
}

module.exports = {
	hash_file,
	unique,
};