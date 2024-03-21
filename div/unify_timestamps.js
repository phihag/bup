#!/usr/bin/env node
'use strict';

const argparse = require('argparse');
const assert = require('assert').strict;
const child_process = require('child_process');
const fs = require('fs');
const { readdir } = require('fs').promises;
const path = require('path');
const process = require('process');
const {promisify} = require('util');


async function* walk_recursive(dir) {
	// from https://stackoverflow.com/a/45130990/35070
	const dirents = await readdir(dir, { withFileTypes: true });
	for (const dirent of dirents) {
		const res = path.resolve(dir, dirent.name);
		if (dirent.isDirectory()) {
			yield res;
			yield* walk_recursive(res);
		} else {
			yield res;
		}
	}
}

async function main() {
	const parser = new argparse.ArgumentParser();
	parser.add_argument('DIST_DIR');
	parser.add_argument('--print-date', {help: 'print date and exit.', action: 'store_true'});
	const args = parser.parse_args();

	let date;
	if (process.env.BUP_DIST_DATE) {
		if (process.env.BUP_DIST_DATE === 'now') {
			date = new Date();
		} else {
			date = new Date(process.env.BUP_DIST_DATE);
		}
	} else {
		const { stdout } = await (promisify(child_process.exec))('git log -1 --date=iso');
		const m = /Date:\s*([-+:\s0-9]+)\n/.exec(stdout);
		assert(m, `Cannot find Date in last git commit ${stdout}`);
		const date_str = m[1];
		date = new Date(date_str);
	}

	const promises = [];
	for await (const fn of walk_recursive(args.DIST_DIR)) {
		promises.push(fs.promises.utimes(fn, date, date));
	}
	await Promise.all(promises);
}

(async () => {
    try {
        await main();
    } catch (e) {
        console.error(e.stack);
        process.exit(2);
    }
})();
