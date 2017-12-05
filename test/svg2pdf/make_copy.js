#!/usr/bin/env node
'use strict';

const fs = require('fs');

const xmldom = require('xmldom');

const vdom = require('../vdom');
const svg_utils = require('../../js/svg_utils');


function usage() {
	console.log('Usage: svg2pdf.js IN_FILE OUT_FILE');
	console.log('Demonstrates svg_utils.copy');
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

		const container_doc = new vdom.Document('svg');
		const container_root = container_doc.documentElement;
		container_root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		container_root.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
		container_root.setAttribute('viewBox', '0 0 297 210');

		const insert_doc = (new xmldom.DOMParser()).parseFromString(svg, 'image/svg+xml');
		svg_utils.copy(container_root, insert_doc.documentElement, 20, 20, 200);

		svg = container_doc.toxml();

		fs.writeFile(out_fn, svg, (err) => {
			if (err) throw err;
		});
	});
}

if (require.main === module) {
	main();
}

module.exports = {

};
