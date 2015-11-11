var async = require('async');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var process = require('process');

(function() {
'use strict';

function add_zeroes(n) {
	if (n < 10) {
		return '0' + n;
	} else {
		return '' + n;
	}
}

function git_rev(cb) {
	child_process.exec('git rev-parse --short HEAD', function (error, stdout) {
		cb(error, stdout.trim());
	});
}

function uglify(js_files, jsdist_fn, cb) {
	var args = js_files.slice();
	args.push('--mangle');
	args.push('--compress');
	args.push('-o');
	args.push(jsdist_fn);

	var uglify_proc = child_process.spawn('uglifyjs', args, {
		stdio: 'inherit',
	});
	uglify_proc.on('close', function (code) {
		if (code === 0) {
			cb(null);
		} else {
			cb({msg: 'uglify exited with code ' + code});
		}
	});
}

function transform_file(in_fn, out_fn, func, cb) {
	fs.readFile(in_fn, 'utf8', function (err, content) {
		if (err) {
			return cb(err);
		}

		content = func(content);

		fs.writeFile(out_fn, content, 'utf8', function(err) {
			cb(err);
		});
	});
}

function transform_files(in_files, out_dir, func, cb) {
	async.map(in_files, function(fn, cb) {
		var out_fn = path.join(out_dir, path.basename(fn));
		transform_file(fn, out_fn, func, function(err) {
			cb(err, out_fn);
		});
	}, function(err, out_files) {
		return cb(err, out_files);
	});
}

function ensure_mkdir(path, cb) {
	fs.mkdir(path, 0x1c0, function(err) {
		if (err && err.code == 'EEXIST') {
			return cb(null);
		}
		cb(err);
	});
}

function main() {
	var args = process.argv.slice(2);
	var in_fn = args[0];
	var out_fn = args[1];
	var jsdist_fn = args[2];
	var tmp_dir = args[3];

	// Compile HTML file
	transform_file(in_fn, out_fn, function(html) {
		html = html.replace(/<!--@DEV-->[\s\S]*?<!--\/@DEV-->/g, '');
		html = html.replace(/<!--@PRODUCTION([\s\S]*?)-->/g, function(m, m1) {return m1;});
		html = html.replace(/PRODUCTIONATTR-/g, '');
		return html;
	}, function() {});

	async.waterfall([
		function(cb) {
			ensure_mkdir(tmp_dir, cb);
		},
		function(cb) {
			git_rev(function(err, rev) {
				if (err) {
					return cb(err);
				}
				var d = new Date();
				var version_date = d.getFullYear() + '.' + add_zeroes(d.getMonth() + 1) + '.' + add_zeroes(d.getDay());
				var version = version_date + '.' + rev;
				cb(err, version);
			});
		},
		function(version, cb) {
			fs.readFile(in_fn, 'utf8', function(err, content) {
				cb(err, version, content);
			});
		},
		function (version, html, cb) {
			// Get all scripts in HTML file
			var script_files = [];
			var dev_re = /<!--@DEV-->([\s\S]*?)<!--\/@DEV-->/g;
			var dev_m;
			while ((dev_m = dev_re.exec(html))) {
				var script_re = /<script src="([^"]+)"><\/script>/g;
				var script_m;
				while ((script_m = script_re.exec(dev_m[1]))) {
					script_files.push(script_m[1]);
				}
			}

			transform_files(script_files, tmp_dir, function(js) {
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
				cb(err, tmp_files);
			});
		},
		function (tmp_files, cb) {
			async.each(tmp_files, fs.unlink, cb);
		},
		function (cb) {
			fs.rmdir(tmp_dir, cb);
		},
	], function (err) {
		if (err) {
			throw err;
		}
	});
}

main();

})();
