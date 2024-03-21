#!/usr/bin/env node
'use strict';

const argparse = require('argparse');
const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const process = require('process');

const { optimize } = require('svgo');

const SVGO_CONFIG = {
	multipass: true,
	plugins: [
		'removeComments',
	],
};


async function minify_svg(in_fn, out_fn) {
	const svg = await fs.promises.readFile(in_fn, {encoding: 'utf-8'});
	const optimized = optimize(svg, SVGO_CONFIG).data;
	assert(optimized);
	await fs.promises.writeFile(out_fn, optimized, {encoding: 'utf-8'});
}

async function main() {
	const parser = new argparse.ArgumentParser();
	parser.add_argument('OUT_DIR');
	parser.add_argument('IN_FNS', {nargs: '+'});

	const args = parser.parse_args();
	const out_dir = args.OUT_DIR;
	const in_fns = args.IN_FNS;

	await Promise.all(in_fns.map(in_fn => {
		const out_fn = path.join(out_dir, path.basename(in_fn));
		return minify_svg(in_fn, out_fn);
	}));
}

(async () => {
    try {
        await main();
    } catch (e) {
        console.error(e.stack);
        process.exit(2);
    }
})();
