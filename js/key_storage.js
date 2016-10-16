'use strict';

var key_storage = (function() {

function get_subtle() {
	var crypto = (
		/*@DEV*/
		((typeof require !== 'undefined') ?
			// node.js
			(new (require('node-webcrypto-ossl'))())
			: null
		) ||
		/*/@DEV*/
		(window.crypto || window.msCrypto));

	if (!crypto) {
		return null;
	}

	return crypto.subtle || crypto.webkitSubtle;
}

function fingerprint(pub_json, callback) {
	var subtle = get_subtle();
	if (!subtle) {
		return callback(new Error('Missing crypto.subtle'));
	}

	var buf = utils.encode_utf8(pub_json);
	subtle.digest('SHA-256', buf).then(function(digest) {
		promutils.breakout(function() {
			var hex_digest = utils.hex(digest);
			callback(null, hex_digest);
		})();
	}, promutils.breakout(callback));
}

function gen(callback) {
	var subtle = get_subtle();
	if (!subtle) {
		return callback(new Error('Missing crypto.subtle'));
	}

	var ALGO = {
		name: 'ECDSA',
		namedCurve: 'P-256',
	};
	var store = {
		algo: ALGO,
	};

	subtle.generateKey(ALGO, true, ['sign', 'verify']).then(function(key){
		utils.parallel([function(cb) {
			subtle.exportKey('jwk', key.privateKey).then(function(priv_keyd) {
				store.priv = priv_keyd;
				cb();
			}, cb);
		}, function(cb) {
			subtle.exportKey('jwk', key.publicKey).then(function(pub_keyd) {
				var pub_json = JSON.stringify(pub_keyd);
				store.pub_json = pub_json;
				cb();
			}, cb);
		}], promutils.breakout(function(err) {
			if (err) return callback(err);

			fingerprint(store.pub_json, function(err, fp) {
				store.fp = fp;
				callback(err, store);
			});
		}));
	}, promutils.breakout(callback));
}

function retrieve(callback) {
	try {
		var stored_json = window.localStorage.getItem('bup_referee_key');
	} catch(err) {
		return callback(err);
	}
	try {
		var stored = JSON.parse(stored_json);
	} catch(err) {
		return callback(err);
	}
	if (stored) {
		return callback(null, stored);
	}

	gen(function(err, store) {
		if (err) return callback(err);

		try {
			window.localStorage.setItem('bup_referee_key', JSON.stringify(store));
		} catch(err) {
			return callback(err);
		}
		callback(err, store);
	});
}

return {
	retrieve: retrieve,
	fingerprint: fingerprint,
	// Testing only
	gen: gen,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var utils = require('./utils');
	var promutils = require('./promutils');

	module.exports = key_storage;
}
/*/@DEV*/
