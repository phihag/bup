'use strict';

var assert = require('assert');
var async = require('async');
var fs = require('fs');
var path = require('path');

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
			var client_state = {
				settings: {
					refmode_client_enabled: true,
					refmode_client_ws_url: ws_url,
				},
			};

			var bldemo_fn = path.join(__dirname, 'test_bl.json');
			fs.readFile(bldemo_fn, {encoding: 'utf-8'}, function(err, fcontents) {
				if (err) return cb(err);

				var demo_data = JSON.parse(fcontents);
				var loaded = bup.importexport.load_data(client_state, demo_data);
				assert(loaded && loaded.event);
				client_state.event = loaded.event;
				cb(err, ws_url, client_state);
			});
		}, function(ws_url, client_state, cb) {
			function on_change(new_state) {
				if (new_state.status === 'error') {
					return cb(new_state);
				}
				if (new_state.status === 'connected to hub') {
					return cb(null, ws_url, client);
				}
			}
			var client = bup.refmode_client(client_state, function(status) {
				client.test_handlers.forEach(function(h) {
					h(status);
				});
			}, []);
			client.test_handlers = [on_change];
			client.test_state = client_state;
			client.on_settings_change(client_state);
		}, function(ws_url, client, cb) {
			var server_state = {
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

			var referee = bup.refmode_referee(on_change, function(clients) {
				referee.test_render_clients(clients);
			}, function(s) {
				referee.test_render_event(s);
			}, tutil_key_storage);
			referee.test_render_clients = function(clients) {
				assert(Array.isArray(clients));
				assert(clients.length <= 1);
			};
			referee.test_render_event = function(s) {
				assert(s);
				assert(s === server_state);
			};
			referee.on_settings_change(server_state);
			referee.test_state = server_state;
		},
		function(client, referee, cb) {
			client.list_referees(function(refs) {
				assert.strictEqual(refs.length, 1);
				assert(/^[0-9a-f]{64}$/.test(refs[0].fp));
				cb(null, client, referee, refs[0].fp);
			});
		},
		function(client, referee, ref_fp, cb) {
			var client_connected = false;
			var server_seen_client = false;

			client.test_handlers = [function(status) {
				if (status.status === 'client.connected') {
					assert.deepStrictEqual(status.fp, ref_fp);
					if (!client_connected) {
						client_connected = true;
						if (server_seen_client) {
							cb(null, client, referee);
						}
					}
				}
			}];
			referee.test_render_clients = function(clients) {
				assert(Array.isArray(clients));
				assert.strictEqual(clients.length, 1);
				referee.test_client0_id = clients[0].id;
				if (!server_seen_client) {
					server_seen_client = true;
					if (client_connected) {
						cb(null, client, referee);
					}
				}
			};
			client.connect_to_referee(ref_fp);
		},
		function(client, referee, cb) {
			var c = referee.client_by_conn_id(referee.test_client0_id);
			assert(c);
			c.subscribed = false;
			client.test_handlers = [];
			referee.test_render_clients = function(clients) {
				assert(Array.isArray(clients));
				assert.strictEqual(clients.length, 1);
				var c = clients[0];
				assert.deepStrictEqual(c.id, referee.test_client0_id);
				assert.deepStrictEqual(c.subscribed, false);
				assert.deepStrictEqual(c.event, client.test_state.event);
				assert.deepStrictEqual(c.event.matches.length, 7);
				cb(null, client, referee);
			};
			referee.refresh(client.test_client_id);
		}, function(client, referee, cb) {
			// TODO add point on client
			// TODO refresh without subscribe
			// TODO server should have that point
			// TODO refresh with subscribe
			// TODO + press on client
			// TODO check server got it
			// TODO + press on client
			// TODO + press on client
			// TODO check server got it
			// TODO client changes match
			// TODO server should now client at a different match
			// TODO + press on client
			// TODO check server got it
			cb();
		}], done);
	});
});