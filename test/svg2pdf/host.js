'use strict';

function convert_client(xml_str) { // eslint-disable-line no-unused-vars
	const svg_doc = (new DOMParser()).parseFromString(xml_str, 'image/svg+xml');
	const svg = svg_doc.getElementsByTagName('svg')[0];

	const body = uiu.qs('body');
	const container = uiu.el(body, 'div');
	container.appendChild(svg);
	const pdf = svg2pdf.make([svg], {}, 'landscape');
	const ab = pdf.output('arraybuffer');
	const u8r = new Uint8Array(ab);
	const ir = Array.from(u8r.values());
	return ir;
}

var report_problem = (() => { // eslint-disable-line no-unused-vars
function silent_error(msg) {
	throw new Error(msg);
}

return {
	silent_error,
};
})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var svg2pdf = require('../../js/svg2pdf.js');
	var uiu = require('../../js/uiu.js');
}
/*/@DEV*/