'use strict';

var key_utils = (function() {
var ALGO = {
	name: 'ECDSA',
	namedCurve: 'P-256',
};
var SIGN_ALGO = {
	name: 'ECDSA',
	hash: {name: 'SHA-256'},
	namedCurve: 'P-256',
};

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

function sign(stored_key, data, callback) {
	var subtle = get_subtle();
	if (!subtle) {
		return callback(new Error('Missing crypto.subtle'));
	}

	subtle.importKey('jwk', stored_key.priv, stored_key.algo, false, ['sign']).then(function(priv_key) {
		subtle.sign(SIGN_ALGO, priv_key, data).then(function(sig) {
			promutils.breakout(function() {
				callback(null, utils.hex(sig));
			})();
		}, promutils.breakout(callback));
	}, promutils.breakout(callback));
}

function verify(pub_json, data, sig_hex, callback) {
	var subtle = get_subtle();
	if (!subtle) {
		return callback(new Error('Missing crypto.subtle'));
	}

	var pub_keyd = JSON.parse(pub_json);
	var sig = utils.unhex(sig_hex);
	subtle.importKey('jwk', pub_keyd, SIGN_ALGO, false, ['verify']).then(function(pub_key) {
		subtle.verify(SIGN_ALGO, pub_key, sig, data).then(function(is_valid) {
			promutils.breakout(function() {
				callback(null, is_valid);
			})();
		}, promutils.breakout(callback));
	}, promutils.breakout(callback));
}

return {
	fingerprint: fingerprint,
	gen: gen,
	sign: sign,
	verify: verify,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var utils = require('./utils');
	var promutils = require('./promutils');

	module.exports = key_utils;
}
/*/@DEV*/
