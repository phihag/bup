'use strict';

const assert = require('assert');

const puppeteer = require('puppeteer');

const miniserver = require('./miniserver');
const tutils = require('../tutils');
const _describe = tutils._describe;
const _it = tutils._it;

_describe('integration tests', () => {
	let base_url;
	let srv;
	base_url = 'http://localhost/bup/';
	tutils._before(async () => {
		base_url = await new Promise((resolve, reject) => {
			srv = miniserver.server((err, _base_url) => {
				if (err) return reject(err);
				resolve(_base_url);
			}, {
				listen: '127.0.0.1', // For some weird reasons, travis.ci does not support IPv6 yet. So go with IPv4 for now
			});
		});
	});

	tutils._after(() => {
		srv.close();
	});

	_it('setupsheet UI test', async () => {
		const browser = await puppeteer.launch({args: ['--no-sandbox']});
		const page = await browser.newPage();
		const setupsheet_url = base_url + 'bup.html#bldemo';
		await page.goto(setupsheet_url, {waitUntil: 'load'});
		browser.close();
	}).timeout(20000);

	_it('event_scoresheets and back', async () => {
		const browser = await puppeteer.launch({args: ['--no-sandbox'], headless:true});
		const page = await browser.newPage();
		const bldemo_url = base_url + 'bup.html#bldemo&court=1';
		await page.goto(bldemo_url, {waitUntil: 'load'});

		const match_name1 = await page.evaluate(() =>
			document.querySelector('.setup_network_match_match_name').innerText
		);
		assert.strictEqual(match_name1, '1.HD');

		const scoresheets_link = await page.$('.setup_event_scoresheets');
		await scoresheets_link.click();
		await scoresheets_link.dispose();

		const scoresheets_hash = await page.evaluate(() =>
			window.location.hash
		);
		assert.strictEqual(scoresheets_hash, '#bldemo&event_scoresheets');

		const event_name = await page.evaluate(() =>
			document.querySelector('svg text.scoresheet_event_name').textContent
		);
		assert.strictEqual(event_name, 'TV Refrath - BC Bischmisheim (Demo)');

		const match_name_count = await page.evaluate(() =>
			document.querySelectorAll('svg text.scoresheet_event_name').length
		);
		assert.strictEqual(match_name_count, 7);

		const match1_name = await page.evaluate(() =>
			document.querySelector('svg text.scoresheet_match_name').textContent
		);
		assert.strictEqual(match1_name, '1.HD');

		browser.close();
	}).timeout(20000);
});
