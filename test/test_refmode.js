'use strict';

var async = require('async');

var tutils = require('./tutils');
var _describe = tutils._describe;
var _it = tutils._it;
var bup = tutils.bup;

var refmode_hub = require('../refmode_hub/refmode_hub');

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
				if (new_state === null) {
					return cb(null, ws_url);
				}
			}
			var client = bup.refmode_client(on_change);
			client.on_settings_change(s);
		}, function(ws_url, cb) {
			var s = {
				settings: {
					refmode_referee_ws_url: ws_url,
				},
			};

			function on_change(new_state) {
				if (new_state === null) {
					return cb();
				}
			}
			var referee = bup.refmode_referee(on_change);
			referee.on_settings_change(s);
		}], done);
	});
});