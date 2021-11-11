#!/usr/bin/env node
'use strict';

const argparse = require('argparse');
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');

const script_utils = require('./script_utils');

async function* walkFiles(dir) {
    for await (const dirent of await fs.promises.opendir(dir)) {
        const memberPath = path.resolve(path.join(dir, dirent.name));
        if (dirent.isFile()) {
            yield memberPath;
        } else if (dirent.isDirectory()) {
            yield* walkFiles(memberPath);
        }
    }
}


async function main() {
    const parser = new argparse.ArgumentParser({description: 'Generate checksum.json file for bup dist'});
    parser.add_argument('DISTDIR', {help: 'Root distribution directory'});
    parser.add_argument('INCLUDE_PATH', {help: 'Path to files to checksum, relative to DISTDIR'});
    parser.add_argument('OUTFILE', {help: 'File to write'});
    const args = parser.parse_args();

    const dist_dir = path.resolve(args.DISTDIR);
    const include_path = args.INCLUDE_PATH;
    const outfile = path.resolve(args.OUTFILE);

    const checksums = {};
    for await (const fn of walkFiles(path.join(dist_dir, include_path))) {
        if (fn === outfile) continue;

        const vfn = path.relative(dist_dir, fn);
        const sha512 = await promisify(script_utils.hash_file)(fn);
        checksums[vfn] = {sha512};
    }

    const fns = Object.keys(checksums);
    fns.sort();
    const checksums_json = '{' + fns.map(function(fn) {
        return JSON.stringify(fn) + ':' + JSON.stringify(checksums[fn]);
    }).join(',') + '}';
    await promisify(fs.writeFile)(outfile, checksums_json, {encoding: 'utf8'});
}

(async () => {
    try {
        await main();
    } catch (e) {
        console.error(e.stack);
        process.exit(2);
    }
})();
