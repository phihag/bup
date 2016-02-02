var fs = require('fs');
var process = require('process');


(function() {
'use strict';

function main() {
	var args = process.argv.slice(2);
	if (args.length != 2) {
		console.log('Usage: ' + process.argv[1] + ' IN.json OUT.json'); // eslint-disable-line no-console
		return 1;
	}

	var in_fn = args[0];
	var out_fn = args[1];

	var contents = fs.readFileSync(in_fn, {encoding: 'utf8'});
	var minified = JSON.stringify(JSON.parse(contents));
	fs.writeFileSync(out_fn, minified, {encoding: 'utf8'});
	return 0;
}

process.exit(main());

})();
