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


_describe.skip('refmode', function() {
	var hub;
	after(function() { // eslint-disable-line no-undef
		if (hub) {
			hub.close();
		}
	});

	_it('ws integration test', function(done) {
		var terminated = false;
		async.waterfall([function(cb) {
			hub = refmode_hub({port: 0});
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
				if (terminated) return;

				if (new_state.status === 'error') {
					return cb(new_state);
				}
				if (new_state.status === 'referee.registered') {
					return cb(null, client, referee);
				}
			}

			var referee = bup.refmode_referee(server_state, on_change, function(clients) {
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
			var rid;
			referee.test_render_clients = function(clients) {
				assert(Array.isArray(clients));
				assert.strictEqual(clients.length, 1);
				var c = clients[0];
				if (c.last_state_rid !== rid) {
					return; // Call from prior event espousing business
				}

				assert.deepStrictEqual(c.id, referee.test_client0_id);
				assert.deepStrictEqual(c.subscribed, false);
				assert.deepStrictEqual(c.event, client.test_state.event);
				assert.deepStrictEqual(c.event.matches.length, 7);
				// We should now go and espouse the event automatically
				if (referee.test_state.event) {
					assert.deepStrictEqual(referee.test_state.event, c.event);
					assert.deepStrictEqual(client._subscriptions, []);
					cb(null, client, referee);
				}
			};
			rid = referee.refresh(referee.test_client0_id);
		}, function(client, referee, cb) {
			// Select a match on client, expect it seen on referee as soon as we refresh
			referee.test_render_clients = function(clients) {
				assert(Array.isArray(clients));
				assert.strictEqual(clients.length, 1);
				var c = clients[0];
				assert.deepStrictEqual(c.id, referee.test_client0_id);
				assert.deepStrictEqual(c.subscribed, false);
				assert.deepStrictEqual(c.setup.match_id, 'testbl_HE2');
				assert.deepStrictEqual(c.presses, []);
				var remote_state = bup.calc.remote_state({}, c.setup, c.presses);
				var nscore = bup.calc.netscore(remote_state);
				assert.deepStrictEqual(nscore, []);
				cb(null, client, referee);
			};

			var s = client.test_state;
			var he2 = s.event.matches[6];
			assert.deepStrictEqual(he2.setup.match_id, 'testbl_HE2');
			bup.calc.init_state(s, he2.setup);
			bup.calc.state(s);
			assert.deepStrictEqual(bup.calc.netscore(s), []);
			client.net_send_press(s, {
				type: '_start_match',
			});
			referee.refresh(referee.test_client0_id);
		}, function(client, referee, cb) {
			var all_presses;
			referee.test_render_clients = function(clients) {
				assert(Array.isArray(clients));
				assert.strictEqual(clients.length, 1);
				var c = clients[0];
				assert.deepStrictEqual(c.id, referee.test_client0_id);
				assert.deepStrictEqual(c.subscribed, false);
				assert.deepStrictEqual(c.setup.match_id, 'testbl_HE2');
				assert.deepStrictEqual(c.presses, all_presses);
				var remote_state = bup.calc.remote_state({}, c.setup, c.presses);
				var nscore = bup.calc.netscore(remote_state);
				assert.deepStrictEqual(nscore, [[2, 0]]);
				cb(null, client, referee);
			};

			var s = client.test_state;
			var press = {
				type: 'pick_side',
				team1_left: true,
			};
			s.presses.push(press);
			bup.calc.state(s);
			client.net_send_press(s, press);

			press = {
				type: 'pick_server',
				team_id: 0,
				player_id: 0,
			};
			s.presses.push(press);
			bup.calc.state(s);
			client.net_send_press(s, press);

			press = {
				type: 'love-all',
			};
			s.presses.push(press);
			bup.calc.state(s);
			assert.deepStrictEqual(bup.calc.netscore(s), [[0, 0]]);
			client.net_send_press(s, press);

			press = {
				type: 'score',
				side: 'left',
			};
			s.presses.push(press);
			bup.calc.state(s);
			client.net_send_press(s, press);

			press = {
				type: 'score',
				side: 'left',
				timestamp: 1000,
			};
			s.presses.push(press);
			bup.calc.state(s);
			client.net_send_press(s, press);

			all_presses = bup.utils.deep_copy(s.presses);
			referee.refresh(referee.test_client0_id);
		}, function(client, referee, cb) {
			referee.test_render_clients = function(clients) {
				assert(Array.isArray(clients));
				assert.strictEqual(clients.length, 1);
				var c = clients[0];
				assert.deepStrictEqual(c.id, referee.test_client0_id);
				assert.deepStrictEqual(c.subscribed, true);
				assert.deepStrictEqual(c.setup.match_id, 'testbl_HE2');
				assert.deepStrictEqual(c.presses, client.test_state.presses);
				var remote_state = bup.calc.remote_state({}, c.setup, c.presses);
				var nscore = bup.calc.netscore(remote_state);
				assert.deepStrictEqual(nscore, [[2, 0]]);
				cb(null, client, referee);
			};
			var cd = referee.client_by_conn_id(referee.test_client0_id);
			cd.subscribed = true;
			referee.refresh(referee.test_client0_id);
		}, function(client, referee, cb) {
			referee.test_render_clients = function(clients) {
				assert(Array.isArray(clients));
				assert.strictEqual(clients.length, 1);
				var c = clients[0];
				assert.deepStrictEqual(c.id, referee.test_client0_id);
				assert.deepStrictEqual(c.subscribed, true);
				assert.deepStrictEqual(c.setup.match_id, 'testbl_HE2');
				assert.deepStrictEqual(c.presses, client.test_state.presses);
				var remote_state = bup.calc.remote_state({}, c.setup, c.presses);
				var nscore = bup.calc.netscore(remote_state);
				assert.deepStrictEqual(nscore, [[3, 0]]); // changed
				cb(null, client, referee);
			};
			var s = client.test_state;
			var press = {
				type: 'score',
				side: 'left',
				timestamp: 2000,
			};
			s.presses.push(press);
			bup.calc.state(s);
			client.net_send_press(s, press);
			// No refresh - client should send automatically now
		}, function(client, referee, cb) {
			referee.test_render_clients = function(clients) {
				assert(Array.isArray(clients));
				assert.strictEqual(clients.length, 1);
				var c = clients[0];
				assert.deepStrictEqual(c.id, referee.test_client0_id);
				assert.deepStrictEqual(c.subscribed, true);
				assert.deepStrictEqual(c.setup.match_id, 'testbl_HE2');
				assert.deepStrictEqual(c.presses, client.test_state.presses);
				var remote_state = bup.calc.remote_state({}, c.setup, c.presses);
				var nscore = bup.calc.netscore(remote_state);
				assert.deepStrictEqual(nscore, [[4, 0]]); // changed
				cb(null, client, referee);
			};
			var s = client.test_state;
			var press = {
				type: 'score',
				side: 'left',
				timestamp: 3000,
			};
			s.presses.push(press);
			bup.calc.state(s);
			client.net_send_press(s, press);
			// No refresh - client should send automatically now
		}, function(client, referee, cb) {
			referee.test_render_clients = function(clients) {
				assert(Array.isArray(clients));
				assert.strictEqual(clients.length, 1);
				var c = clients[0];
				assert.deepStrictEqual(c.id, referee.test_client0_id);
				assert.deepStrictEqual(c.subscribed, true);
				if (c.setup.match_id === 'testbl_HE2') {
					// old updates
					return;
				}
				assert.deepStrictEqual(c.setup.match_id, 'testbl_GD');
				assert.deepStrictEqual(c.presses, []);
				var remote_state = bup.calc.remote_state({}, c.setup, c.presses);
				var nscore = bup.calc.netscore(remote_state);
				assert.deepStrictEqual(nscore, []); // changed
				cb(null, client, referee);
			};

			var s = client.test_state;
			var mx = s.event.matches[5];
			assert.deepStrictEqual(mx.setup.match_id, 'testbl_GD');
			bup.calc.init_state(s, mx.setup);
			bup.calc.state(s);
			assert.deepStrictEqual(bup.calc.netscore(s), []);
			client.net_send_press(s, {
				type: '_start_match',
			});
		}, function(client, referee, cb) {
			referee.test_render_clients = function(clients) {
				assert(Array.isArray(clients));
				assert.strictEqual(clients.length, 1);
				var c = clients[0];
				assert.deepStrictEqual(c.id, referee.test_client0_id);
				assert.deepStrictEqual(c.subscribed, true);
				assert.deepStrictEqual(c.setup.match_id, 'testbl_GD');
				assert.deepStrictEqual(c.presses, client.test_state.presses);
				var remote_state = bup.calc.remote_state({}, c.setup, c.presses);
				var nscore = bup.calc.netscore(remote_state);
				assert.deepStrictEqual(nscore, []);
				cb(null, client, referee);
			};
			var s = client.test_state;
			var press = {
				type: 'pick_side',
				team1_left: true,
				timestamp: 10000,
			};
			s.presses.push(press);
			bup.calc.state(s);
			client.net_send_press(s, press);
		}, function(client, referee, cb) {
			referee.test_render_clients = function(clients) {
				if (terminated) return;

				assert(Array.isArray(clients));
				assert.strictEqual(clients.length, 1);
				var c = clients[0];
				assert.deepStrictEqual(c.id, referee.test_client0_id);
				assert.deepStrictEqual(c.subscribed, true);
				assert.deepStrictEqual(c.setup.match_id, 'testbl_GD');
				var remote_state = bup.calc.remote_state({}, c.setup, c.presses);
				var nscore = bup.calc.netscore(remote_state);
				if (!bup.utils.deep_equal(nscore, [[1, 2]])) {
					return;
				}
				assert.deepStrictEqual(c.presses, client.test_state.presses);
				cb(null, client, referee);
			};
			var s = client.test_state;
			var press = {
				type: 'pick_server',
				team_id: 0,
				player_id: 0,
				timestamp: 11000,
			};
			s.presses.push(press);
			bup.calc.state(s);
			client.net_send_press(s, press);

			press = {
				type: 'pick_receiver',
				team_id: 1,
				player_id: 0,
				timestamp: 12000,
			};
			s.presses.push(press);
			bup.calc.state(s);
			client.net_send_press(s, press);

			press = {
				type: 'love-all',
				timestamp: 13000,
			};
			s.presses.push(press);
			bup.calc.state(s);
			client.net_send_press(s, press);

			press = {
				type: 'score',
				side: 'left',
				timestamp: 13000,
			};
			s.presses.push(press);
			bup.calc.state(s);
			client.net_send_press(s, press);

			press = {
				type: 'score',
				side: 'right',
				timestamp: 14000,
			};
			s.presses.push(press);
			bup.calc.state(s);
			client.net_send_press(s, press);

			press = {
				type: 'score',
				side: 'right',
				timestamp: 15000,
			};
			s.presses.push(press);
			bup.calc.state(s);
			client.net_send_press(s, press);
		}, function(client, referee, cb) {
			// Event on server should be up to date
			var ev = referee.test_state.event;
			assert.deepStrictEqual(ev.matches.length, 7);

			var he2 = bup.utils.find(ev.matches, function(m) {
				return m.setup.match_id == 'testbl_HE2';
			});
			assert(he2);
			assert.deepStrictEqual(he2.presses.length, 7);

			var gd = bup.utils.find(ev.matches, function(m) {
				return m.setup.match_id == 'testbl_GD';
			});
			assert(gd);
			assert.deepStrictEqual(gd.presses.length, 7);

			cb();
		}], function(err) {
			terminated = true;
			done(err);
		});
	});
});