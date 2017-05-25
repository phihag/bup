var compat = (function() {

function is_mobile_safari() {
	var ua = navigator.userAgent;
	return ua.match(/AppleWebKit/) && ua.match(/(?:iPod|iPhone|iPad)/);
}

function ui_init() {
	if (is_mobile_safari()) {
		uiu.addClass_qs('html', 'mobile_safari');
	}
}

// Hack for bts
function courtnum(cn) {
	var m = /_([0-9]+)$/.exec(cn);
	return m ? m[1] : cn;
}

// Samsung TVs at DM O35
function is_samsung() {
	return /Chrome\/25\.0\.1349/.test(navigator.userAgent);
}

return {
	ui_init: ui_init,
	courtnum: courtnum,
	is_samsung: is_samsung,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var uiu = require('./uiu');

	module.exports = compat;
}
/*/@DEV*/
