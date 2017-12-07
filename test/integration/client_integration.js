'use strict';

/* This file gets injected by puppeteer and provides helper functions for the integration tests. */

function client_text(el) {
	let res = '';
	for (let i = 0;i < el.childNodes.length;i++) {
		let c = el.childNodes[i];
		if (c.nodeType === 3) { // Text node
			res += c.data;
		}
	}
	return res;
}

function client_find_text(qs, text) {
	const all_els = document.querySelectorAll(qs);

	for (let i = 0;i < all_els.length;i++) {
		if (client_text(all_els[i]).includes(text)) {
			return all_els[i];
		}
	}

	return null;
}


// The following is more for the benefit of the linter than actually useful
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = {
		client_find_text,
	};
}
