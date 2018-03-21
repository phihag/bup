'use strict';

const assert = require('assert');
const async = require('async');
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const process = require('process');

const utils = require('../js/utils.js');


function git_rev(cb) {
	child_process.exec('git rev-parse --short HEAD', function (error, stdout) {
		cb(error, stdout.trim());
	});
}

function transform_file(in_fn, out_fn, func, cb) {
	fs.readFile(in_fn, 'utf8', function (err, content) {
		if (err) {
			return cb(err);
		}

		content = func(content);

		fs.writeFile(out_fn, content, 'utf8', (err) => {
			cb(err);
		});
	});
}

function transform_files(in_files, out_dir, func, cb) {
	async.map(in_files, (fn, cb) => {
		const out_fn = path.join(out_dir, path.basename(fn));
		transform_file(fn, out_fn, func, (err) => {
			cb(err, out_fn);
		});
	}, (err, out_files) => {
		return cb(err, out_files);
	});
}

function ensure_mkdir(path, cb) {
	fs.mkdir(path, 0o777, (err) => {
		if (err && err.code == 'EEXIST') {
			return cb(null);
		}
		cb(err);
	});
}


/*   JavaScript   */

function uglify(js_files, jsdist_fn, cb) {
	const args = [];
	assert(!/[']/.test(jsdist_fn));
	args.push('--source-map');
	args.push('filename=\'' + jsdist_fn + '.map\',url=\'' + path.basename(jsdist_fn) + '.map\',base=dist/bup');
	args.push();
	args.push('--mangle');
	args.push('--compress');
	args.push('-o');
	args.push(jsdist_fn);
	args.push('--');
	args.push.apply(args, js_files);

	const uglify_path = path.normalize(path.join(__dirname, '..', 'node_modules', '.bin', 'uglifyjs'));
	const uglify_proc = child_process.spawn(uglify_path, args, {
		stdio: 'inherit',
	});
	uglify_proc.on('close', (code) => {
		if (code === 0) {
			cb(null);
		} else {
			cb({msg: 'uglify exited with code ' + code});
		}
	});
}

function convert_js(version, js_files, sources_dir, jsdist_fn, cb) {
	async.waterfall([
		(cb) => {
			transform_files(js_files, sources_dir, (js) => {
				js = js.replace(
					/(var\s+bup_version\s*=\s*')[^']*(';)/g,
					function(m, g1, g2) {
						return g1 + version + g2;
					}
				);
				js = js.replace(/\/\*\s*@DEV\s*\*\/[\s\S]*?\/\*\s*\/@DEV\s*\*\//g, '');
				return js;
			}, cb);
		},
		function (tmp_files, cb) {
			uglify(tmp_files, jsdist_fn, function(err) {
				cb(err);
			});
		},
	], cb);
}


/*   CSS   */

function collect_css(css_files, cb) {
	async.map(css_files, function(fn, cb) {
		fs.readFile(fn, {encoding: 'utf8'}, function(err, contents) {
			if (err) {
				return cb(err);
			}
			const css = '/*   ' + fn + '   */\n\n' + contents + '\n\n';
			cb(err, css);
		});
	}, function(err, ar) {
		if (err) {
			return cb(err);
		}

		const css = ar.join('\n');
		cb(err, css);
	});
}

function cleancss(css_infile, cssdist_fn, cb) {
	const args = [
		'--rounding-precision', '9',
		'--skip-rebase',
		'-o',
		cssdist_fn,
		css_infile,
	];

	const cleancss_path = path.normalize(path.join(__dirname, '..', 'node_modules', '.bin', 'cleancss'));

	const proc = child_process.spawn(cleancss_path, args, {
		stdio: 'inherit',
	});
	proc.on('close', function (code) {
		if (code === 0) {
			cb(null);
		} else {
			cb({msg: 'cleancss exited with code ' + code});
		}
	});
}

function convert_css(css_files, cssdist_fn, sources_dir, cb) {
	const css_tmpfn = path.join(sources_dir, 'bup.all.css');
	async.waterfall([
		function(cb) {
			collect_css(css_files, cb);
		},
		function(css, cb) {
			css = css.replace(/url\s*\(\.\.\/icons\//g, 'url(icons/');
			fs.writeFile(css_tmpfn, css, {encoding: 'utf8'}, cb);
		},
		function(cb) {
			cleancss(css_tmpfn, cssdist_fn, cb);
		},
		function(cb) {
			fs.unlink(css_tmpfn, cb);
		},
	], cb);
}

/*  Main function  */

function main() {
	const args = process.argv.slice(2);
	const dev_dir = args[0];
	const dist_dir = args[1];
	const sources_dir = args[2];

	if (! dev_dir || !dist_dir || !sources_dir) {
		console.error('Usage: make_dist.js DEV_DIR DIST_DIR SOURCES_DIR');
		process.exit(3);
		return;
	}

	const html_in_fn = path.join(dev_dir, 'bup.html');
	const html_out_fn = path.join(dist_dir, 'index.html');
	const html_out_fn2 = path.join(dist_dir, 'bup.html');
	const jsdist_fn = path.join(dist_dir, 'bup.dist.js');
	const cssdist_fn = path.join(dist_dir, 'bup.dist.css');
	const version_fn = path.join(dist_dir, 'VERSION');
	const version2_fn = path.join(dist_dir, 'VERSION.txt');

	function transform_html(html) {
		html = html.replace(/<!--@DEV-->[\s\S]*?<!--\/@DEV-->/g, '');
		html = html.replace(/<!--@PRODUCTION([\s\S]*?)-->/g, function(m, m1) {return m1;});
		html = html.replace(/PRODUCTIONATTR-/g, '');
		return html;
	}

	async.waterfall([
		function(cb) {
			transform_file(html_in_fn, html_out_fn, transform_html, cb);
		}, function(cb) {
			transform_file(html_in_fn, html_out_fn2, transform_html, cb);
		}, function(cb) {
			uglify([path.join(dev_dir, 'cachesw.js')], path.join(dist_dir, 'cachesw.js'), cb);
		},
		function(cb) {
			ensure_mkdir(sources_dir, cb);
		},
		function(cb) {
			git_rev(function(err, rev) {
				if (err) {
					return cb(err);
				}
				const d = new Date();
				const version_date = (
					d.getFullYear() + '.' +
					utils.pad(d.getMonth() + 1) + '.' +
					utils.pad(d.getDate()) + '.' +
					utils.pad(d.getHours()) + utils.pad(d.getMinutes())
				);
				const version = version_date + rev;
				cb(err, version);
			});
		},
		(version, cb) => {
			fs.writeFile(version_fn, version, {encoding: 'utf8'}, (err) => {
				cb(err, version);
			});
		},
		(version, cb) => {
			fs.writeFile(version2_fn, version, {encoding: 'utf8'}, (err) => {
				cb(err, version);
			});
		},
		(version, cb) => {
			fs.readFile(html_in_fn, 'utf8', (err, content) => {
				cb(err, version, content);
			});
		},
		function(version, html, cb) {
			// Get all scripts in HTML file
			const script_files = [];
			const dev_re = /<!--@DEV-->([\s\S]*?)<!--\/@DEV-->/g;
			let dev_m;
			while ((dev_m = dev_re.exec(html))) {
				const script_re = /<script src="([^"]+)"><\/script>/g;
				let script_m;
				while ((script_m = script_re.exec(dev_m[1]))) {
					script_files.push(script_m[1]);
				}
			}
			convert_js(version, script_files, sources_dir, jsdist_fn, function(err) {
				cb(err, html);
			});
		},
		function (html, cb) {
			const css_files = [];
			const dev_re = /<!--@DEV-->([\s\S]*?)<!--\/@DEV-->/g;
			let dev_m;
			while ((dev_m = dev_re.exec(html))) {
				const style_re = /<link\s+rel="stylesheet"\s+href="([^"]+)"/g;
				let style_m;
				while ((style_m = style_re.exec(dev_m[1]))) {
					css_files.push(style_m[1]);
				}
			}
			convert_css(css_files, cssdist_fn, sources_dir, cb);
		},
	], function (err) {
		if (err) {
			throw err;
		}
	});
}

main();
