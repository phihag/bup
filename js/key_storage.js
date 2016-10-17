'use strict';

var key_storage = (function() {

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

	key_utils.gen(function(err, store) {
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
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var key_utils = require('./key_utils');

	module.exports = key_storage;
}
/*/@DEV*/
