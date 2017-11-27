'use strict';

const async = require('async');
const child_process = require('child_process');
const path = require('path');
const process = require('process');


function usage() {
	console.log('Usage: ' + process.argv[1] + ' OUT_DIR IN.svg..');
	process.exit(1);
}

function main(callback) {
	const args = process.argv.slice(2);

	if (args.length < 2) {
		return usage();
	}
	const [out_dir, ...in_fns] = args;

	async.each(in_fns, (in_fn, cb) => {
		const out_fn = path.join(out_dir, path.basename(in_fn));
		minify_svg(in_fn, out_fn, cb);
	}, callback);
}

function minify_svg(in_fn, out_fn, cb) {
	const args = [
		'-q',
		'--disable', 'removeEmptyText',
		'--disable', 'removeEmptyContainers',
		'--disable', 'convertPathData',
		'-i', in_fn,
		'-o', out_fn,
	];
	const svgo_path = path.normalize(path.join(__dirname, '..', 'node_modules', '.bin', 'svgo'));
	const proc = child_process.spawn(svgo_path, args, {
		stdio: 'inherit',
	});
	proc.on('close', (code) => {
		if (code === 0) {
			cb(null);
		} else {
			cb(new Error('svgo exited with code ' + code));
		}
	});

}

main((err) => {
	if (err) throw err;
});
