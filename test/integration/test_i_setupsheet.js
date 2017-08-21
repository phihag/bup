'use strict';

const assert = require('assert');

const puppeteer = require('puppeteer');

const tutils = require('./tutils');
const _describe = tutils._describe;
const _it = tutils._it;
const bup = tutils.bup;

_describe('integration tests', () => {
	tutils._before(async () => {
		
	});

	_it('setupsheet', async () => {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();

		browser.close();

		done();
	});
});
