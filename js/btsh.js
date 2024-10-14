'use strict';
// BTS support (https://github.com/phihag/bts/) via HTTP

function btsh(baseurl, tournament_key) {
	var ws = null;
	var WS_PATH = '/ws/bup';
	var reconnect_timeout = 1000;
	var bts_update_callback = null;
	var display_initialized = false;
	var battery;
	

	if (!battery && (typeof navigator != 'undefined') && navigator.getBattery) {
		navigator.getBattery().then(function(bat) {
			battery = bat;
		});
	}

	function _bat_status() {
		if (!battery) {
			return undefined;
		}
		return {
			charging: battery.charging,
			level: battery.level,
			chargingTime: battery.chargingTime,
			dischargingTime: battery.dischargingTime,
		};
	}

	function _device_data() {
		return {
			id: refmode_client_ui.get_node_id(),
			battery: _bat_status(),
			court: state.settings.court_id,
		};
	}

	function _request_json(s, component, options, cb) {
		options.dataType = 'text';
		options.timeout = s.settings.network_timeout;
		network.$request(component, options).done(function(res_json) {
			try {
				var res = JSON.parse(res_json);
			} catch (e) {
				return cb(e);
			}

			if (res.status !== 'ok') {
				return cb({msg: res.message + ' ' + s._('network:error:status', {status: res.status})});
			}

			return cb(null, res);
		}).fail(function (xhr) {
			var msg = ((xhr.status === 0) ?
				s._('network:error:bts') :
				s._('network:error:http', {code: xhr.status})
			);
			return cb({
				type: 'network-error',
				status: xhr.status,
				msg: msg,
			});
		});
	}

	function send_score(s) {
		if (s.settings.court_id === 'referee') {
			network.errstate('btsh.score', null);
			return;
		}
		if (! /^bts_/.test(s.setup.match_id)) {
			return;
		}
		var req_match_id = s.setup.match_id;
		var match_id = req_match_id.substring('bts_'.length);

		var netscore = calc.netscore(s, true);
		var duration_ms = (s.metadata.start && s.metadata.end) ? (s.metadata.end - s.metadata.start) : null;
		var end_ts = s.metadata.end ? s.metadata.end : null;
		var post_data = {
			court_id: s.settings.court_id,
			network_team1_serving: s.game.team1_serving,
			network_teams_player1_even: s.game.teams_player1_even,
			network_score: netscore,
			team1_won: s.match.team1_won,
			finish_confirmed: s.match.finish_confirmed,
			presses: s.presses,
			duration_ms: duration_ms,
			end_ts: end_ts,
			marks: s.match.marks,
			shuttle_count: s.match.shuttle_count,
			device: _device_data(s, post_data),
		};

		var url = baseurl + 'h/' + encodeURIComponent(tournament_key) + '/m/' + encodeURIComponent(match_id) + '/score';

		_request_json(s, 'btsh.score', {
			method: 'POST',
			url: url,
			data: JSON.stringify(post_data),
			contentType: 'application/json; charset=utf-8',
		}, function(err) {
			if (s.setup.match_id !== req_match_id) { // Match changed while the request was underway
				return;
			}

			network.errstate('btsh.score', err);
		});
	}

	function sync(s) {
		send_score(s);
	}

	/* s, press */
	function send_press(s) {
		sync(s);
	}

	function fetch_courts(s, callback) {
		var device_url = '?device=' + encodeURIComponent(btoa(JSON.stringify(_device_data(s))));
		_request_json(s, 'btsh.courts', {
			url: baseurl + 'h/' + encodeURIComponent(tournament_key) + '/courts' + device_url,
		}, function(err, response) {
			if (err) {
				return callback(err);
			}

			var courts = response.courts.map(function(rc) {
				var res = {
					id: rc._id,
					label: rc.num,
				};
				if (rc.match_id) {
					res.match_id = 'bts_' + rc.match_id;
				}
				return res;
			});
			courts.push({
				id: 'referee',
				description: s._('court:referee'),
			});
			s.btsh_courts = courts;
			return callback(err, courts);
		});
	}

	function ui_init() {
		if (!baseurl) {
			baseurl = '../';
		}
		var m = window.location.pathname.match(/^(.*\/)bup\/(?:bup\.html|index\.html)?$/);
		if (m) {
			baseurl = m[1];
		}

		click.qs('.settings_send_export', function (e) {
			e.preventDefault();
			persist_display_settings();
		});
		click.qs('.settings_reset_export', function (e) {
			e.preventDefault();
			reset_display_settings();
		});
	}

	async function persist_display_settings() {
		ws.sendmsg({ type: 'persist_display_settings', tournament_key: tournament_key, panel_settings: state.settings });
	}

	async function reset_display_settings() {
		ws.sendmsg({ type: 'reset_display_settings', tournament_key: tournament_key, panel_settings: state.settings });
	}

	async function send_device_info() {
		ws.sendmsg({ type: 'device_info', tournament_key: tournament_key, device: _device_data() });
		setTimeout(send_device_info, 1000*60*5);
	}

	function service_name() {
		return 'BTSh';
	}

	function editable(/*s*/) {
		return false;
	}

	function courts(s) {
		return s.btsh_courts;
	}

	function connect(cb, s) {
		try {
			if (ws == null) {
				ws = new WebSocket(construct_url(WS_PATH), 'bts-bup');
				ws.sendmsg = ws_sendmsg;
				ws.onopen = function () {
					reload_match_information();
					send_device_info();
				};
				ws.onmessage = handle_message;
				ws.onclose = function () {
					ws = null;
					send_bts_not_reachable(cb, s);
					setTimeout(connect, reconnect_timeout, cb, s);
				};
			}
		} catch (e) {
			ws = null;
			send_bts_not_reachable(cb, s);
			setTimeout(connect, reconnect_timeout, cb, s);
		}
	}
	function construct_url(abspath) {
		var l = window.location;
		return (
			((l.protocol === 'https:') ? 'wss://' : 'ws://') +
			l.hostname +
			(((l.port !== 80) && (l.port !== 443)) ? ':' + l.port : '') +
			abspath
		);
	}

	async function ws_sendmsg(msg) {
		
		waitForSocketConnection(ws, () => {
			const msg_json = JSON.stringify(msg);
			ws.send(msg_json);
		});

	}

	// Make the function wait until the connection is made...
	function waitForSocketConnection(socket, callback){
	    setTimeout(
	        function () {
	            if (socket.readyState === 1) {
	                if (callback != null){
	                    callback();
	                }
	            } else {
	                console.log("wait for connection...")
	                waitForSocketConnection(socket, callback);
	            }

	        }, 5); // wait 5 milisecond for the connection...
	}

	function handle_message(ws_msg) {
		var msg_json = ws_msg.data;
		var msg = JSON.parse(msg_json);
		if (!msg) {
			send({
				type: 'error',
				message: 'Could not parse message',
			});
		}
		switch (msg.type) {
			case 'change':
				default_change_handler(msg);
				break;
			default:
				send({
					type: 'error',
					rid: msg.rid,
					message: 'Unsupported message ' + msg.type,
				});
		}
	}

	function default_change_handler(c) {
		switch (c.ctype) {
			case 'score-update':
				if (bts_update_callback != null) {
					bts_update_callback(null, state, c.val.event);
					if (state.settings.court_id != '' && c.val.event.matches[0] && c.val.event.matches[0].end_ts != null) {
						setTimeout(reload_match_information, 60000);
					}
				}
				break;
			case 'settings-update':
				state.settings = c.val;
				break;
			default:
				break;
		}
	}

	function reload_match_information() {
		if (state.ui.displaymode_visible) {
			var style = state.settings.displaymode_style;
			if (displaymode.option_applies(style, 'court_id') && (style != '2court')) {
				state.settings.court_id = state.settings.displaymode_court_id;
			} else {
				state.settings.court_id = ''
			}

		} else {
			state.settings.court_id = state.settings.displaymode_court_id;
		}
		ws.sendmsg({ type: 'init', initialize_display: !display_initialized, tournament_key: tournament_key, panel_settings: state.settings });
		display_initialized = true;
	}
	
	function subscribe(s, cb, calc_timeout) {
		bts_update_callback = cb;
		connect(cb,s);
	}

	function send_bts_not_reachable(cb,s) {
		var msg = s._('network:error:bts');
		cb({
			type: 'network-error',
			msg: msg,
		}, s, null);
	}

	return {
		ui_init: ui_init,
		send_press: send_press,
		sync: sync,
		courts: courts,
		fetch_courts: fetch_courts,
		service_name: service_name,
		editable: editable,
		limited_ui: true,
		push_service: true,
		subscribe: subscribe,
		reload_match_information: reload_match_information,
	};
}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var displaymode = require('./displaymode');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var refmode_client_ui = require('./refmode_client_ui');
	var click = require('./click');

	module.exports = btsh;
}
/*/@DEV*/
