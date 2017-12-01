#!/usr/bin/env node
'use strict';

const async = require('async');
const fs = require('fs');
const path = require('path');
const xmldom = require('xmldom');

const svg2pdf = require('./svg2pdf');
const vdom = require('../vdom');

const svg_utils = require('../../js/svg_utils');

function usage() {
	console.log('Usage: all_logos.js [DIR [OUT.svg [OUT.pdf]]]');
	console.log('Renders all SVG files from the specified directory to one PDF file');
	process.exit(1);
}

function read_svgs(in_dir, callback) {
	fs.readdir(in_dir, (err, filenames) => {
		if (err) return callback(err);

		async.map(filenames, (filename, cb) => {
			fs.readFile(path.join(in_dir, filename), {encoding: 'utf8'},
				(err, contents) => {
					return cb(err, {
						filename,
						contents,
					});
				});
		}, callback);
	});
}

function main() {
	const argv = process.argv.slice(2);
	if ((argv.length > 3) || (argv[0] === '--help')) {
		usage();
	}

	const in_dir = argv[0] || path.normalize(path.join(__dirname, '..', '..', 'div', 'logos'));
	const svg_out_fn = argv[1] || 'logos.svg';
	const pdf_out_fn = argv[1] || 'logos.pdf';

	const DOC_WIDTH = 297;
	const DOC_HEIGHT = 210;

	const COLS = 7;

	read_svgs(in_dir, (err, svg_files) => {
		if (err) throw err;

		const cell_size_h = Math.floor(DOC_HEIGHT / Math.ceil(svg_files.length / COLS));
		const cell_size_w = Math.floor(DOC_WIDTH / COLS);
		const cell_size = Math.min(cell_size_w, cell_size_h);

		const doc = new vdom.Document('svg');
		const root = doc.documentElement;
		root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		root.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
		root.setAttribute('viewBox', '0 0 ' + DOC_WIDTH + ' ' + DOC_HEIGHT);

		svg_files.forEach((svg_file, num) => {
			const club_name = svg_file.filename.replace('.svg', '');
			const g = svg_utils.el(root, 'g', {
				'id': club_name,
			});
			const svg_doc = (new xmldom.DOMParser()).parseFromString(svg_file.contents, 'image/svg+xml');

			const col = num % COLS;
			const row = Math.floor(num / COLS);

			const x = col * cell_size + 0.2 * cell_size;
			const y = row * cell_size + 0.2 * cell_size;
			const width = 0.6 * cell_size;

			svg_utils.copy(g, svg_doc.documentElement, x, y, width);
		});

		const svg_xml = doc.toxml('  ');
		fs.writeFileSync(svg_out_fn, svg_xml);

		svg2pdf.convert(svg_xml).then((pdf_u8r) => {
			fs.writeFile(pdf_out_fn, pdf_u8r, (err) => {
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
