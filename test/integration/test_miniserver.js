'use strict';

const assert = require('assert');
const path = require('path');

const tutils = require('../tutils');
const _describe = tutils._describe;
const _it = tutils._it;

const miniserver = require('./miniserver');

const fs_modules = {
	posix: {
		realpath: (p, cb) => cb(null, path.posix.normalize(p)),
	},
	win32: {
		realpath: (p, cb) => cb(null, path.win32.normalize(p)),
	},
};

function test_resolve_path(platform, cwd, urlpath, expect) {
	return new Promise((resolve, reject) => {
		assert(['posix', 'win32'].includes(platform));
		const fs_module = fs_modules[platform];
		const path_module = path[platform];

		miniserver.resolve_path(cwd, urlpath, (err, result) => {
			if (err) return reject(err);

			assert.strictEqual(result, expect);
			return resolve();
		}, path_module, fs_module);
	});
}


_describe('miniserver', () => {
	_it('path calculation', async () => {
		await test_resolve_path('posix', '/a/b/c', 'x', '/a/b/c/x');
		await test_resolve_path('posix', '/a/b/c', '../x', '/a/b/c/x');
		await test_resolve_path('posix', '/a/b/c', 'y/../z', '/a/b/c/z');
		await test_resolve_path('posix', 'cwd', 'foo/bar/..////./baz/a.b.d', 'cwd/foo/baz/a.b.d');
		await test_resolve_path('posix', 'cwd', '.git/secret', 'cwd/secret');
	});

	_it('path calculation on Windows', async () => {
		await test_resolve_path('win32', '/a/b/c', '../x', '\\a\\b\\c\\x');
		await test_resolve_path('win32', 'C:\\a\\b/c', 'y/../z/__', 'C:\\a\\b\\c\\z\\__');
		await test_resolve_path('win32', 'cwd', 'foo/bar/..//./baz/__', 'cwd\\foo\\baz\\__');
		await test_resolve_path('win32', 'cwd', 'foo/bar/../baz/a.b.d', 'cwd\\foo\\baz\\a.b.d');
		await test_resolve_path('win32', 'cwd', 'a\\b/c', 'cwd\\c');
		await test_resolve_path('win32', 'cwd', '.git/.secret/show/.htaccess', 'cwd\\show');
	});

	_it('mimetype', () => {
		assert.strictEqual(miniserver.mimetype('foo.txt'), 'text/plain');
		assert.strictEqual(miniserver.mimetype('foo.gif'), 'image/gif');
		assert.strictEqual(miniserver.mimetype('bup/bup.css'), 'text/css');
		assert.strictEqual(miniserver.mimetype('dist/bup.appcache'), 'text/cache-manifest');
		assert.strictEqual(miniserver.mimetype('Makefile'), undefined); // follow apache
	});
});
