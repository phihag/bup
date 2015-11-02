'use strict';

var fs = require('fs');
var process = require('process');
var child_process = require('child_process');

function uglify(js_files, jsdist_fn) {
	var args = js_files.slice();
	args.push('--mangle');
	args.push('--compress');
	args.push('-o');
	args.push(jsdist_fn);

	var uglify = child_process.spawn('uglifyjs', args, {
		stdio: 'inherit'
	});
	uglify.on('close', function (code) {
		if (code !== 0) {
			console.log('uglify exited with code ' + code);
			process.exit(3);
		}
	});
}

function transform_file(in_fn, out_fn, func) {
	fs.readFile(in_fn, 'utf8', function (err, content) {
		if (err) {
			console.log(err);
			process.exit(1);
			return;
		}

		content = func(content);

		fs.writeFile(out_fn, content, 'utf8', function(err) {
			if (err) {
				console.log(err);
				process.exit(2);
				return;
			}
		});
	});
}

function main() {
	var args = process.argv.slice(2);
	var in_fn = args[0];
	var out_fn = args[1];
	var jsdist_fn = args[2];

	// Compile HTML file
	transform_file(in_fn, out_fn, function(html) {
		html = html.replace(/<!--@DEV-->[\s\S]*?<!--\/@DEV-->/g, '');
		html = html.replace(/<!--@PRODUCTION([\s\S]*?)-->/g, function(m, m1) {return m1;});
		return html;
	});

	// Get all scripts in HTML file
	fs.readFile(in_fn, 'utf8', function (err, html) {
		var script_files = [];

		var dev_re = /<!--@DEV-->([\s\S]*?)<!--\/@DEV-->/g;
		var dev_m;
		while (dev_m = dev_re.exec(html)) {
			var script_re = /<script src="([^"]+)"><\/script>/g;
			var script_m;
			while (script_m = script_re.exec(dev_m[1])) {
				script_files.push(script_m[1]);
			}
		}

		uglify(script_files, jsdist_fn);
	});
}

main();