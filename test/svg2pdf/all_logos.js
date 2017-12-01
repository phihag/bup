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

	const DOC_WIDTH = 210;
	const DOC_HEIGHT = 297;

	const COLS = 4;

	read_svgs(in_dir, (err, svg_files) => {
		if (err) throw err;

		const cell_size = Math.floor(DOC_HEIGHT * COLS / svg_files.length);

		var doc = new vdom.Document('svg');
		var root = doc.documentElement;
		root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		root.setAttribute('viewBox', '0 0 ' + DOC_WIDTH + ' ' + DOC_HEIGHT);

		svg_files.forEach((svg_file, num) => {
			var g = svg_utils.el(root, 'g', {
				'data-filename': svg_file.filename,
			});
			var svg_doc = (new xmldom.DOMParser()).parseFromString(svg_file.contents, 'image/svg+xml');

			const col = num % COLS;
			const row = Math.floor(num / COLS);

			const x = col * cell_size + 0.1 * cell_size;
			const y = row * cell_size + 0.1 * cell_size;
			const width = 0.8 * cell_size;

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
