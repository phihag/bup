'use strict';

/* This file gets injected by puppeteer and provides helper functions for the integration tests. */

function client_find_text(qs, text) {
	const all_els = document.querySelectorAll(qs);

	for (let i = 0;i < all_els.length;i++) {
		if (all_els[i].textContent.includes(text)) {
			return all_els[i];
		}
	}

	return null;
}
