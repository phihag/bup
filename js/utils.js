'use strict';

var utils = (function() {

function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
}

function on_click(node, callback) {
	node.on('click', callback);
}

return {
	uuid: uuid,
	on_click: on_click,
}
})();

if (typeof module !== 'undefined') {
	module.exports = utils;
}
