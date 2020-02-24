'use strict';

const assert = require('assert');

const puppeteer = require('puppeteer');

const mockserver = require('../mock/mockserver');
const tutils = require('../tutils');
const _describe = tutils._describe;
const _it = tutils._it;

async function is_visible(page, qs) {
	return await page.evaluate((qs) => client_qs_visible(qs), qs);
}

async function eventually_visible(page, qs) {
	return await page.evaluate((qs) => client_eventual_visibility(qs, true), qs);
}

async function eventually_invisible(page, qs) {
	return await page.evaluate((qs) => client_eventual_visibility(qs, false), qs);
}

async function click_qs(page, qs)  {
	const clickable = await page.$(qs);
	await clickable.click();
	await clickable.dispose();
}

_describe('integration tests', () => {
	let base_url;
	let srv;
	base_url = 'http://localhost/bup/';
	tutils._before(async () => {
		base_url = await new Promise((resolve, reject) => {
			srv = mockserver.server({
				start_callback: (err, _base_url) => {
					if (err) return reject(err);
					resolve(_base_url);
				},
				listen: '127.0.0.1', // For some weird reasons, travis-ci does not support IPv6 yet. So go with IPv4 for now
			});
		});
	});

	tutils._after(() => {
		srv.close();
	});

	// returns [browser, page]
	async function start(url_suffix) {
		const browser = await puppeteer.launch({args: ['--no-sandbox'], headless: (process.env.headless !== 'false')});
		const page = await browser.newPage();
		let errs = [];
		page.on('pageerror', (err) => {
			errs.push(err);
			console.error('Client error:', err);
		});
		async function close() {
			if (errs.length > 0) {
				throw new Error(errs.length + ' client-side error(s) occured, first one: ' + errs[0]);
			}
			await browser.close();
		}

		await page.goto(base_url + url_suffix, {waitUntil: 'load'});
		await page.addScriptTag({url: base_url + 'test/integration/client_integration.js'});
		return [page, close];
	}

	_it('event_scoresheets and back', async () => {
		const [page, close] = await start('bup.html#bldemo&court=1');

		assert.strictEqual(await page.evaluate(() =>
			document.querySelector('.setup_network_match_match_name').innerText),
			'1.HD'
		);
		assert(await is_visible(page, '#settings_wrapper'));

		// Click "event scoresheets"
		await click_qs(page, '.setup_event_scoresheets');

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

		await close();
	}).timeout(20000);

	_it('match navigation (with court selection and scoresheet)', async () => {
		const [page, close] = await start('bup.html#bldemo');

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


		// Go into scoresheet by pressing s
		await page.keyboard.press('KeyS');
		assert.strictEqual(await page.evaluate(() =>
			window.location.hash),
			'#bldemo&m=bldemo_HD1&scoresheet');
		assert(await is_visible(page, '.scoresheet_container'));
		assert(! await is_visible(page, '#game'));
		assert.strictEqual(await page.evaluate(() =>
			document.querySelector('.scoresheet_event_name').textContent),
			'TV Refrath - BC Bischmisheim (Demo)'
		);
		assert.strictEqual(await page.evaluate(() =>
			document.querySelector('.scoresheet_match_name').textContent),
			'1.HD'
		);

		assert(/^[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4,}$/.test(await page.evaluate(() =>
			document.querySelector('.scoresheet_date_value').textContent))
		);

		const note_input = await page.$('#scoresheet_note_input');
		await note_input.focus();
		await page.keyboard.type('This is a test note');
		await page.keyboard.press('Enter');
		assert(! await is_visible(page, '#game'));

		assert.strictEqual(await page.evaluate(() =>
			client_find_text('.scoresheet_container text', 'This is a test note').tagName.toLowerCase()),
			'text');
		const last_press = await page.evaluate(() => state.presses[state.presses.length - 1]);
		delete last_press.court_id;
		delete last_press.timestamp;
		assert.deepStrictEqual(last_press, {
			type: 'note',
			val: 'This is a test note',
		});

		// TODO test that going back works!

		await close();
	}).timeout(20000);

	_it('eventsheet preview: initializing extra_data from event by default', async () => {
		const [page, close] = await start('bup.html#intdemo&es_preview=int&court=referee');

		assert.strictEqual(await page.evaluate(() =>
			document.querySelector('svg text#es_svg_team0').textContent),
			'Germany'
		);
		assert.strictEqual(await page.evaluate(() =>
			document.querySelector('svg text#es_svg_1n0_0').textContent),
			'Max Weißkirchen'
		);
		assert.strictEqual(await page.evaluate(() =>
			document.querySelector('svg text#es_svg_date').textContent),
			'11.11.2016'
		);
		assert.strictEqual(await page.evaluate(() =>
			document.querySelector('svg text#es_svg_location').textContent),
			'Barbarossahalle, Ludwig-Thoma-Straße 1, Kaiserslautern'
		);

		// Click back
		const back_btn = await page.$('.eventsheet_preview_back');
		await back_btn.click();

		assert.strictEqual(await page.evaluate(() =>
			window.location.hash),
			'#intdemo&eventsheet=int');

		await page.evaluate(() => {
			uiu.qs('.eventsheet_form input[name="location"]').value = 'SpH Steinbreche';
		});
		const generate_btn = await page.$('.eventsheet_generate_button');
		await generate_btn.click();
		await generate_btn.dispose();

		assert.strictEqual(await page.evaluate(() =>
			window.location.hash),
			'#intdemo&es_preview=int');
		assert.strictEqual(await page.evaluate(() =>
			document.querySelector('svg text#es_svg_location').textContent),
			'SpH Steinbreche'
		);

		await close();
	}).timeout(20000);

	_it('eventsheet minreqs', async () => {
		const [page, close] = await start('bup.html#bldemo&court=referee&lang=de');

		assert(!await is_visible(page, '.eventsheet_container'));
		assert(await is_visible(page, '#settings_wrapper'));

		const minreq_link = await page.evaluateHandle(() =>
			client_find_text('a.eventsheet_link', 'Mindestanforderungen Schiedsrichter')
		);
		await minreq_link.click();
		await minreq_link.dispose();

		assert.strictEqual(await page.evaluate(() =>
			window.location.hash),
			'#bldemo&lang=de&es_preview=buli2019-minsr');
		assert(await is_visible(page, '.eventsheet_container'));
		assert(!await is_visible(page, '#settings_wrapper'));


		const back_btn = await page.evaluateHandle(() =>
			client_find_text('.eventsheet_container a', 'Zurück')
		);
		await back_btn.click();
		await back_btn.dispose();

		assert.strictEqual(await page.evaluate(() =>
			window.location.hash),
			'#bldemo&lang=de&settings');
		assert(!await is_visible(page, '.eventsheet_container'));
		assert(await is_visible(page, '#settings_wrapper'));

		await close();
	}).timeout(20000);

	_it('grand btde integration test', async () => {
		const [upage, uclose] = await start('btde/ticker/bup/bup.html#btde&court=referee&lang=de');

		// Login form present?
		assert(await is_visible(upage, '#settings_wrapper'));
		assert.strictEqual(await upage.evaluate(() =>
			document.querySelector('.setup_network_container .network_error').innerText),
			'Login erforderlich'
		);
		await eventually_visible(upage, '.settings_login');
		assert.strictEqual(await upage.evaluate(() =>
			document.querySelector('.settings_login h2').innerText),
			'Login badmintonticker'
		);

		// Log in with incorrect credentials
		await upage.type('.settings_container .settings_login input[name="user"]', 'invalid_user');
		await upage.type('.settings_container .settings_login input[name="password"]', 'invalid_pw');
		await (await upage.evaluateHandle(() => {
			return client_find_text('.settings_container .settings_login button.login_button', 'Einloggen');
		})).click();
		assert.strictEqual(await upage.evaluate(() => {
				return client_wait_nonempty_text('.settings_container .settings_login .network_error');
			}),
			'Der Benutzername und das Passwort stimmen nicht überein.'
		);

		// Log in with correct credentials (TVR2)
		await upage.evaluate(() => {
			document.querySelector('.settings_container .settings_login input[name="user"]').value = 'TVR2';
			document.querySelector('.settings_container .settings_login input[name="password"]').value = '123456';
		});
		await (await upage.evaluateHandle(() => {
			return client_find_text('.settings_container .settings_login button.login_button', 'Einloggen');
		})).click();

		await eventually_invisible(upage, '.settings_container .settings_login');
		await eventually_invisible(upage, '.setup_network_container .network_error');
		assert(await is_visible(upage, '.setup_network_container .setup_network_heading .setup_network_event'));
		assert.strictEqual(await upage.evaluate(() =>
			document.querySelector('.setup_network_container .setup_network_heading .setup_network_event').innerText),
			'TV Refrath 2 - STC Blau-Weiss Solingen'
		);
		assert.strictEqual(await upage.evaluate(() =>
			document.querySelectorAll('#setup_network_matches button').length),
			7
		);
		assert.strictEqual(await upage.evaluate(() =>
			document.querySelector('#setup_network_matches button:first-child .setup_network_match_match_name').innerText),
			'HD1'
		);
		assert.strictEqual(await upage.evaluate(() =>
			document.querySelector('#setup_network_matches button:first-child .setup_network_match_home_players').innerText),
			'Christoph Offermann / Elias Beckmann'
		);
		assert.strictEqual(await upage.evaluate(() =>
			document.querySelector('#setup_network_matches button:first-child .setup_network_match_away_players').innerText),
			'Niklas Niemczyk / Niclas Lohau'
		);
		assert.strictEqual(await upage.evaluate(() =>
			document.querySelector('#setup_network_matches button:first-child .setup_network_match_score').innerText),
			'14-15 9-11 2-11'
		);

		// Relogin as TVR1
		click_qs(upage, 'a[data-i18n="login:link"]');

		await eventually_visible(upage, '.settings_network_login_container>.settings_login');
		await eventually_visible(upage, '.settings_network_login_container>.settings_login button.login_button');
		await upage.evaluate(() => {
			uiu.qs('.settings_network_login_container>.settings_login input[name="user"]').value = 'TVR';
		});
		await upage.evaluate(() => {
			uiu.qs('.settings_network_login_container>.settings_login input[name="password"]').value = 'secret_TVR';
		});
		await click_qs(upage, '.settings_network_login_container>.settings_login button.login_button');

		await eventually_invisible(upage, '.settings_container .settings_login');
		await eventually_invisible(upage, '.setup_network_container .network_error');
		assert(await is_visible(upage, '.setup_network_container .setup_network_heading .setup_network_event'));
		assert.strictEqual(await upage.evaluate(() =>
			document.querySelector('.setup_network_container .setup_network_heading .setup_network_event').innerText),
			'TV Refrath - TSV Neuhausen-Nymphenburg'
		);
		assert.strictEqual(await upage.evaluate(() =>
			document.querySelector('#setup_network_matches button:first-child .setup_network_match_match_name').innerText),
			'HD1'
		);
		assert.strictEqual(await upage.evaluate(() =>
			document.querySelector('#setup_network_matches button:first-child .setup_network_match_home_players').innerText),
			'N.N. / N.N.'
		);
		assert.strictEqual(await upage.evaluate(() =>
			document.querySelector('#setup_network_matches button:first-child .setup_network_match_away_players').innerText),
			'N.N. / N.N.'
		);

		await uclose();
	}).timeout(20000);
});
