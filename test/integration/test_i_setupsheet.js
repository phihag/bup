'use strict';

const assert = require('assert');

const puppeteer = require('puppeteer');

const tutils = require('../tutils');
const _describe = tutils._describe;
const _it = tutils._it;

_describe('integration tests', () => {
	tutils._before(async () => {
		// TODO start miniserver		
	});

	_it('setupsheet', async () => {
		const browser = await puppeteer.launch({args: ['--no-sandbox']}	);
		const page = await browser.newPage();

		browser.close();
	});
});
