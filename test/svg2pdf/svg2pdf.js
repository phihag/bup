#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const puppeteer = require('puppeteer');


async function convert(svg) {
	const browser = await puppeteer.launch({args: ['--no-sandbox'], headless: true});
	const page = await browser.newPage();
	page.on('console', (...args) => console.log('error:', ...args));
	const url = 'file://' + path.join(__dirname, 'host.html');
	await page.goto(url, {waitUntil: 'networkidle2'});

	const int_ar = await page.evaluate((svg) => {
		// This runs in the browser
		return convert_client(svg); // eslint-disable-line no-undef
	}, svg);
	browser.close();
	const u8r = new Uint8Array(int_ar);
	return u8r;
}

function usage() {
	console.log('Usage: svg2pdf.js SVG_FILE PDF_FILE');
	process.exit(1);
}

function main() {
	const argv = process.argv.slice(2);

	if ((argv.length !== 2) || argv[0].startsWith('-') || argv[1].startsWith('-')) {
		usage();
	}

	const in_fn = argv[0];
	const out_fn = argv[1];

	fs.readFile(in_fn, 'utf8', (err, svg) => {
		if (err) throw err;

		convert(svg).then((pdf_u8r) => {
			fs.writeFile(out_fn, pdf_u8r, (err) => {
				if (err) throw err;
			});
		}).catch(err => {
			console.error(err.stack);
			process.exit(2);
		});
	});
}

if (require.main === module) {
	main();
}

module.exports = {
	convert,
};
