'use strict';

var fs = require('fs');
var process = require('process');

function main() {
	var args = process.argv.slice(2);
	var in_fn = args[0];
	var out_fn = args[1];

	fs.readFile(in_fn, 'utf8', function (err, html) {
		if (err) {
			console.log(err);
			process.exit(1);
			return 1;
		}

		html = html.replace(/<!--@DEV-->[\s\S]*?<!--\/@DEV-->/g, '');
		html = html.replace(/<!--@PRODUCTION([\s\S]*?)-->/g, function(m, m1) {return m1;});

		fs.writeFile(out_fn, html, 'utf8', function(err) {
			if (err) {
				console.log(err);
				process.exit(2);
				return;
			}
		});
	});
}

main();