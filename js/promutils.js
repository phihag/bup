'use strict';
// Helper functions for promises (and integration with callback)
var promutils = (function() {

// Allow throwing errors in promises
function breakout(callback) {
	return function(err) {
		try {
			callback(err);
		} catch(e) {
			setTimeout(function() {
				throw e;
			});
		}
	};
}

return {
	breakout: breakout,
};
})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = promutils;
}
/*/@DEV*/
