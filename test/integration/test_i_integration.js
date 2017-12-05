'use strict';

const assert = require('assert');

const puppeteer = require('puppeteer');

const miniserver = require('./miniserver');
const tutils = require('../tutils');
const _describe = tutils._describe;
const _it = tutils._it;

async function is_visible(page, qs) {
	return await page.evaluate((qs) => {
		const e = document.querySelector(qs);
		if (!e) return false;
		const style = window.getComputedStyle(e);
		return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== 0;
	}, qs);
}

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
		const browser = await puppeteer.launch({args: ['--no-sandbox']});
		const page = await browser.newPage();
		const bldemo_url = base_url + 'bup.html#bldemo&court=1';
		await page.goto(bldemo_url, {waitUntil: 'load'});

		assert.strictEqual(await page.evaluate(() =>
			document.querySelector('.setup_network_match_match_name').innerText),
			'1.HD'
		);
		assert(await is_visible(page, '#settings_wrapper'));

		// Click "event scoresheets"
		const scoresheets_link = await page.$('.setup_event_scoresheets');
		await scoresheets_link.click();
		await scoresheets_link.dispose();

		assert.strictEqual(await page.evaluate(() =>
			window.location.hash),
			'#bldemo&event_scoresheets');
		
		assert(! await is_visible(page, '#settings_wrapper'));
		assert.strictEqual(await page.evaluate(() =>
			document.querySelector('svg text.scoresheet_event_name').textContent),
			'TV Refrath - BC Bischmisheim (Demo)');

		assert.strictEqual(await page.evaluate(() =>
			document.querySelectorAll('svg text.scoresheet_event_name').length),
			7);
		assert.strictEqual(await page.evaluate(() =>
			document.querySelector('svg text.scoresheet_match_name').textContent),
			'1.HD');

		// Click back to go to main menu
		const back_btn = await page.$('.scoresheet_button_back');
		await back_btn.click();

		assert.strictEqual(
			await page.evaluate(() => window.location.hash),
			'#bldemo&settings'
		);

		assert.strictEqual(
			await page.evaluate(() =>
				document.querySelectorAll('svg text.scoresheet_event_name').length
			), 0
		);

		assert.strictEqual(await page.evaluate(() =>
			document.querySelector('.setup_network_match_match_name').innerText),
			'1.HD'
		);

		assert(await is_visible(page, '#settings_wrapper'));

		browser.close();
	}).timeout(20000);

	_it('entering a match (with court selection)', async () => {
		const browser = await puppeteer.launch({args: ['--no-sandbox']});
		const page = await browser.newPage();
		const bldemo_url = base_url + 'bup.html#bldemo';
		await page.goto(bldemo_url, {waitUntil: 'load'});
		await page.addScriptTag({url: base_url + 'test/integration/client_integration.js'});

		assert.strictEqual(await page.evaluate(() =>
			state.settings.court_id),
			undefined);
		// Select court
		const court1_btn = await page.evaluateHandle(() => {
			const select_court_text = client_find_text('.modal-wrapper .pick_dialog span', 'Select Court');
			return select_court_text.parentNode.querySelector('button');
		});
		await court1_btn.click();

		assert.strictEqual(await page.evaluate(() =>
			state.settings.court_id),
			'1');


		// Click the button for the first match
		assert.strictEqual(await page.evaluate(() =>
			document.querySelector('.setup_network_match .setup_network_match_match_name').innerText),
			'1.HD'
		);
		assert(await is_visible(page, '#settings_wrapper'));
		assert(!await is_visible(page, '#game'));
		const hd1_btn = await page.$('.setup_network_match');
		await hd1_btn.click();
		await hd1_btn.dispose();

		// Evaluate that we are in the correct match
		assert.strictEqual(await page.evaluate(() =>
			window.location.hash),
			'#bldemo&m=bldemo_HD1');
		assert(! await is_visible(page, '#settings_wrapper'));
		assert(await is_visible(page, '#game'));

		browser.close();
	}).timeout(20000);
});
