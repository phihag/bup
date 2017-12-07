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

function client_qs_visible(qs) {
	const el = document.querySelector(qs);
	if (!el) return false;
	return client_el_visible(el);
}

function client_el_visible(el) {
	const style = window.getComputedStyle(el);
	return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== 0;
}

function client_find_text(qs, text) {
	const all_els = document.querySelectorAll(qs);

	for (let i = 0;i < all_els.length;i++) {
		const el = all_els[i];
		if (client_text(el).includes(text) && client_el_visible(el)) {
			return el;
		}
	}

	return null;
}



// The following is more for the benefit of the linter than actually useful
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = {
		client_find_text,
		client_qs_visible,
	};
}
