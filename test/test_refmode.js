'use strict';

var assert = require('assert');
var async = require('async');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

var refmode_hub = require('../refmode_hub/refmode_hub');


var tutil_key_storage = (function() {
	var stored;
	return {
		retrieve: function(cb) {
			if (stored) {
				return cb(null, stored);
			}

			bup.key_utils.gen(function(err, store) {
				if (err) return cb(err);
				stored = store;
				cb(null, stored);
			});
		},
	};
})();


_describe('refmode', function() {
	_it('ws integration test', function(done) {
		async.waterfall([function(cb) {
			var hub = refmode_hub({port: 0});
			hub.on('listening', function() {
				var port = hub._server.address().port;
				var ws_url = 'ws://localhost:' + port + '/';
				cb(null, ws_url);
			});
		}, function(ws_url, cb) {
			var s = {
				settings: {
					refmode_client_enabled: true,
					refmode_client_ws_url: ws_url,
				},
			};

			function on_change(new_state) {
				if (new_state.status === 'error') {
					return cb(new_state);
				}
				if (new_state.status === 'connected to hub') {
					return cb(null, ws_url, client);
				}
			}
			var client = bup.refmode_client(function(status) {
				client.test_handlers.forEach(function(h) {
					h(status);
				});
			});
			client.test_handlers = [on_change];
			client.on_settings_change(s);
		}, function(ws_url, client, cb) {
			var s = {
				settings: {
					refmode_referee_ws_url: ws_url,
				},
			};

			function on_change(new_state) {
				if (new_state.status === 'error') {
					return cb(new_state);
				}
				if (new_state.status === 'referee.registered') {
					return cb(null, client, referee);
				}
			}
			var referee = bup.refmode_referee(on_change, tutil_key_storage);
			referee.on_settings_change(s);
		},
		function(client, referee, cb) {
			client.list_referees(function(refs) {
				assert.strictEqual(refs.length, 1);
				assert(/^[0-9a-f]{64}$/.test(refs[0].fp));
				cb(null, client, referee, refs[0].fp);
			});
		},
		function(client, referee, ref_fp, cb) {
			client.test_handlers = [function(status) {
				if (status.status === 'client.connected') {
					assert.deepStrictEqual(status.fp, ref_fp);
					cb();
				}
			}];
			client.connect_to_referee(ref_fp);
		}], done);
	});
});