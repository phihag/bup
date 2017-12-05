'use strict';

//const assert = require('assert');

const puppeteer = require('puppeteer');

const miniserver = require('./miniserver');
const tutils = require('../tutils');
const _describe = tutils._describe;
const _it = tutils._it;

_describe('integration tests', () => {
	let base_url;
	tutils._before(async () => {
		base_url = await new Promise((resolve, reject) => {
			miniserver.server((err, _base_url) => {
				if (err) return reject(err);
				resolve(_base_url);
			}, {
				listen: '127.0.0.1', // For some weird reasons, travis.ci does not support IPv6 yet. So go with IPv4 for now
			});
		});
	});

	_it('setupsheet UI test', async () => {
		const start = Date.now();
		const browser = await puppeteer.launch({args: ['--no-sandbox']}	);
console.log('started browser', Date.now() - start);
		const page = await browser.newPage();
console.log('new page', Date.now() - start);
		const setupsheet_url = base_url + 'bup.html#bldemo';
		await page.goto(setupsheet_url, {waitUntil: 'networkidle'});
console.log('goto', Date.now() - start);
		browser.close();
	}).timeout(20000);
});
