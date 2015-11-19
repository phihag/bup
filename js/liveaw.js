/*
'use strict';

function liveaw_contact(cb) {
	var wsurl = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.hostname + (location.port ? ':' + location.port: '')  + '/ws/bup';
	var ws = new WebSocket(wsurl, 'liveaw-bup');
	ws.onopen = function() {
		cb(null, ws);
	};
	ws.onmessage = function(ws_message) {
		var msg = JSON.parse(ws_message.data);
		if (! msg.request_id) {
			// Not an answer, ignore for now
			return;
		}
		if (state.liveaw.handlers[msg.request_id]) {
			if (! state.liveaw.handlers[msg.request_id](msg)) {
				delete state.liveaw.handlers[msg.request_id];
			}
		} else {
			control.show_error('No handler for request ' + msg.request_id);
		}
	};
}

function _liveaw_request(msg, cb) {
	msg.request_id = state.liveaw.next_request_id;
	state.liveaw.next_request_id++;
	state.liveaw.handlers[msg.request_id] = cb;
	state.liveaw.ws.send(JSON.stringify(msg));
}

function liveaw_init(liveaw_match_id) {
	liveaw_contact(function(err, ws) {
		if (err) {
			control.show_error(err, msg);
			settings.show();
			return;
		}

		ui_waitprogress('Lade Match-Setup');
		state.liveaw.ws = ws;
		_liveaw_request({
			type: 'get_setup&subscribe',
			match_id: liveaw_match_id,
		}, function(response) {
			if (response.type == 'setup') {
				ui_waitprogress_stop();
				start_match(state, response.setup);
			} else if (response.type == 'current_presses') {
				if (state.presses < response.presses) {
					state.presses = response.presses;
					on_presses_change(state);
				}
			}
			return true;
		});
	});
}
*/