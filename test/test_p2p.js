var assert = require('assert');
var async = require('async');

var tutils = require('./tutils');
var bup = tutils.bup;
var _describe = tutils._describe;
var _it = tutils._it;

var liveaw_server = require('./mock/liveaw_server.js');

(function() {
'use strict';
var DISABLED = true;

_describe('p2p', function() {
	if (DISABLED) return;
	var ws_module = require('ws');

	_it('test connection and basic communication', function(done) {
		this.timeout(30000);

		try {
			var wrtc = require('wrtc');
		} catch (e) {
			console.log('Skipping p2p test because wrtc module not installed');  // eslint-disable-line no-console
			return done();
		}


		async.waterfall([
		function(cb) { // Start liveaw
			liveaw_server.serve(cb);
		},
		function(port, cb) { // Start p2p
			var conncount = 0;
			var on_connect = function(info) {
				assert.ok(info.node_id.match(/^liveaw-bupp2p_127.0.0.1.*$/));
				conncount++;
				if (conncount == 2) {
					cb();
				}
			};

			var s1 = {
				event: {
					id: 'testevent-p2p-' + port,
				},
			};
			var client1 = bup.p2p(s1, on_connect, 'ws://[127.0.0.1]:' + port + '/ws/bup-p2p', [], wrtc, ws_module);
			client1.init();

			var s2 = {
				event: {
					id: 'testevent-p2p-' + port,
				},
			};
			var client2 = bup.p2p(s2, on_connect, 'ws://[127.0.0.1]:' + port + '/ws/bup-p2p', [], wrtc, ws_module);
			client2.init();
		}], function(err) {
			done(err);
		});
	});
});

})();