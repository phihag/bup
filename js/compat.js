var compat = (function() {

function is_mobile_safari() {
	var ua = navigator.userAgent;
	return ua.match(/AppleWebKit/) && ua.match(/(?:iPod|iPhone|iPad)/);
}

function ui_init() {
	if (is_mobile_safari()) {
		$('html').addClass('mobile_safari');
	}
}

return {
	ui_init: ui_init,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = compat;
}
/*/@DEV*/
