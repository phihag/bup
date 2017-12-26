'use strict';

const fs = require('fs');
const path = require('path');

const httpd_utils = require('./httpd_utils');

function mimetype(pathname) {
	const parsed_path = path.parse(pathname);
	return {
		'.appcache': 'text/cache-manifest',
		'.css': 'text/css',
		'.gif': 'image/gif',
		'.html': 'text/html',
		'.jpg': 'image/jpeg',
		'.js': 'application/javascript',
		'.json': 'application/json',
		'.md': 'text/markdown',
		'.mp4': 'video/mp4',
		'.pdf': 'application/pdf',
		'.png': 'image/png',
		'.svg': 'image/svg+xml',
		'.txt': 'text/plain',
		'.xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
		'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'.xltm': 'application/vnd.ms-excel.template.macroEnabled.12',
	}[parsed_path.ext];
}

// Safely resolves a path, without going into hidden files or path traversal
function resolve_path(root_dir, url_path, cb, path_module, fs_module) {
	path_module = path_module || path;
	fs_module = fs_module || fs;

	const parsed_components = url_path.split('/');
	const components = [];
	for (const c of parsed_components) {
		if (c === '..') {
			if (components.length > 0) {
				components.pop();
			}
			continue;
		} else if (c === '.') {
			continue;
		} else if (c.startsWith('.')) {
			// Intentionally redundant with the above and below regexp: strip any secret files
			continue;
		} else if (c === 'node_modules') { // Not terribly secret, but not relevant for clients
			continue;
		} else if (!c) { // foo///bar
			continue;
		}

		if (/^[-a-zA-Z0-9_.]+$/.test(c)) {
			components.push(c);
		}
	}

	fs_module.realpath(root_dir, (err, nroot_dir) => {
		if (err) return cb(err);

		const rel_path = path_module.join(nroot_dir, ...components);
		fs_module.realpath(rel_path, (err, res_fn) => {
			if (err) return cb(err);

			const cmp_dir = nroot_dir + nroot_dir.endsWith(path_module.sep) ? '' : path_module.sep;
			if ((!res_fn.startsWith(cmp_dir)) || (cmp_dir === nroot_dir)) {
				return cb(new Error('Path traversal detected'));
			}

			return cb(null, res_fn);
		});
	});
}

function send_file(res, root_dir, pathname, index_filename) {
	resolve_path(root_dir, pathname, (err, fn) => {
		if (err) {
			console.error('Error while trying to resolve ' + pathname + ': ' + err.message);
			return httpd_utils.err(res, 404);
		}

		const stream = fs.createReadStream(fn);
		stream.on('error', (err) => {
			if (err.code === 'EISDIR') {
				if (index_filename) {
					const index_pathname = path.join(pathname, index_filename);
					return send_file(res, root_dir, index_pathname); // No index filename, we don't want endless recursion
				}
				return httpd_utils.err(res, 404);
			}
			console.error('failed to create stream: ' + err.message);
			return httpd_utils.err(res, 500);
		});
		const headers = {
			'Cache-Control': 'no-store, must-revalidate',
			'Expires': '0',
		};
		const mt = mimetype(fn);
		if (mt) {
			headers['Content-Type'] = mt;
		}

		res.writeHead(200, headers);

		const pipe = stream.pipe(res, {end: true});
		pipe.on('error', (err) => {
			console.error('pipe error: ' + err.message);
			return httpd_utils.err(res, 500);
		});
	});
}

function file_handler(prefix, root_dir, index_filename) {
	return httpd_utils.prefixed(prefix, (req, res, pathname) => {
		if (! ['GET', 'HEAD'].includes(req.method)) {
			return httpd_utils.err(res, 405);
		}

		send_file(res, root_dir, pathname, index_filename);
	});
}

module.exports = {
	file_handler,
	// Testing only
	resolve_path,
	mimetype,
};
