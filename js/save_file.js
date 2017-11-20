'use strict';

function save_file(blob, filename) {
	if (navigator.msSaveOrOpenBlob) {
		navigator.msSaveBlob(blob, filename);
		return;
	}

	var URL = window.URL || window.webkitURL;
	var body = document.body;

	var a = uiu.el(body, 'a', {
		href: URL.createObjectURL(blob),
		download: filename,
	});
	a.click();        
	body.removeChild(a);
}


/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var uiu = require('./uiu');

	module.exports = save_file;
}
/*/@DEV*/
