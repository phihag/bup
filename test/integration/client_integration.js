'use strict';

/* This file gets injected by puppeteer and provides helper functions for the integration tests. */

const DEFAULT_MAX_WAIT = 10000;

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

function client_eventual_visibility(qs, val) {
	if (client_qs_visible(qs) === val) {
		return;
	}

	const start = window.performance.now();

	function _wait(resolve, reject) {
		if (client_qs_visible(qs) === val) {
			return resolve();
		}

		const elapsed = window.performance.now();
		if (elapsed - start > DEFAULT_MAX_WAIT) {
			return reject(new Error(
				'Timeout while waiting for ' + JSON.stringify(qs) +
				' to turn ' + (val ? 'visible' : 'invisible')));
		}

		window.requestAnimationFrame(() => _wait(resolve, reject));
	}

	return new Promise(_wait);
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

// Wait for an element (as a promise), until it contains text
function client_wait_nonempty(qs) {
	const start = window.performance.now();

	function _wait(resolve, reject) {
		const el = document.querySelector(qs);
		if (el && el.innerText) {
			return resolve(el);
		}

		const elapsed = window.performance.now();
		if (elapsed - start > DEFAULT_MAX_WAIT) {
			return reject(new Error('Cannot find non-empty ' + qs + (el ? '(currently empty)' : '')));
		}

		window.requestAnimationFrame(() => _wait(resolve, reject));
	}

	return new Promise(_wait);
}

function client_wait_nonempty_text(qs) {
	return new Promise((resolve, reject) => {
		client_wait_nonempty(qs).then((el) => {
			resolve(el.innerText);
		}, (err) => reject(err));
	});
}

// The following is more for the benefit of the linter than actually useful
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = {
		client_eventual_visibility,
		client_find_text,
		client_qs_visible,
		client_wait_nonempty,
		client_wait_nonempty_text,
	};
}
