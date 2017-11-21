'use strict';

function save_file(blob, filename) {
	if (navigator.msSaveOrOpenBlob) {
		navigator.msSaveOrOpenBlob(blob, filename);
		return;
	}

	var URL = window.URL || window.webkitURL;
	var url = URL.createObjectURL(blob);
	var body = document.body;

	if (compat.is_crios()) {
		var reader = new FileReader();
		reader.onload = function(){
			window.location.href = reader.result;
		};
		reader.readAsDataURL(blob);
	} else if (compat.is_mobile_safari()) {
		var win = window.open(url, '_blank');
		setTimeout(function() {
			win.document.title = filename;
		}, 10);
	} else {
		var a = uiu.el(body, 'a', {
			href: url,
			download: filename,
		});
		a.click();
		body.removeChild(a);
	}
}


/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var compat = require('./compat');
	var uiu = require('./uiu');

	module.exports = save_file;
}
/*/@DEV*/
