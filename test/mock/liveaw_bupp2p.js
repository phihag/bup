var utils = require(__dirname + '/../../js/utils.js');

var bupp2p = (function() {
'use strict';

function _is_string_array(ar) {
	if (! (ar instanceof Array)) {
		return false;
	}
	for (var i = 0;i < ar.length;i++) {
		if (typeof ar[i] != 'string') {
			return false;
		}
	}
	return true;
}

function _any_matching(ar1, ar2) {
	for (var i = 0;i < ar1.length;i++) {
		if (ar2.indexOf(ar1[i]) >= 0) {
			return true;
		}
	}
	return false;
}

function _send_error(ws, emsg, request_id) {
	var msg = {
		type: 'error',
		msg: emsg,
	};
	if (request_id) {
		msg.request_id = request_id;
	}
	_send(ws, msg);
}

function _send(ws, msg) {
	try {
		ws.send(JSON.stringify(msg));
		return true;
	} catch (e) {
		return false;
	}
}

function send_peerlist(ws) {
	var event_ids = ws.bup_event_ids;
	all_nodes.forEach(function(node) {
		if ((node === ws) || (!node.bup_event_ids)) {
			return;
		}

		if (! _any_matching(event_ids, node.bup_event_ids)) {
			return false;
		}

		_send(node, {
			type: 'peer-available',
			node_id: ws.bup_node_id,
			event_ids: ws.event_ids,
		});
		// TODO notify the other way round, too?
	});
}

var all_nodes = [];
var node_by_id = {};

function handle(ws, req) {
	var remote_ip = req.connection.remoteAddress;

	var node_id = 'liveaw-bupp2p_' + remote_ip + ':' + req.connection.remotePort;
	ws.bup_node_id = node_id;

	all_nodes.push(ws);
	node_by_id[node_id] = ws;
	ws.on('close', function() {
		var idx = all_nodes.indexOf(ws);
		all_nodes.splice(idx, 1);
		delete node_by_id[node_id];
	});

	ws.on('message', function(data, flags) {
		if (flags.binary) {
			return;  // We don't understand that
		}

		var msg;
		try {
			msg = JSON.parse(data);
		} catch (e) {
			return _send_error(ws, 'Could not parse JSON');
		}
		if (typeof msg.request_id == 'undefined') {
			return _send_error(ws, 'Missing request_id');
		}
		if (! msg.type) {
			return _send_error(ws, 'Missing type');
		}

		switch (msg.type) {
		case 'error':
			// We don't care about client errors
			break;
		case 'set-events':
			if (! _is_string_array(msg.event_ids)) {
				return _send_error(ws, 'All event IDs must be strings!');
			}

			var is_changed = !utils.deep_equal(ws.bup_event_ids, msg.event_ids);
			if (is_changed) {
				ws.bup_event_ids = msg.event_ids;
				send_peerlist(ws);
			}
			break;
		case 'connection-request':
		case 'connection-response':
		case 'ice-candidate':
			// Just relay these messages
			if (typeof msg.to_node != 'string') {
				return _send_error(ws, 'Missing to_node field!', msg.request_id);
			}

			var receiver = node_by_id[msg.to_node];
			if (! receiver) {
				return _send_error(ws, 'Could not find node ' + msg.to_node, msg.request_id);
			}
			msg.from_node = node_id;
			_send(receiver, msg);
			break;
		default:
			return _send_error(ws, 'Unsupported msg type ' + msg.type, msg.request_id);
		}
	});
}

return {
	handle: handle,
};

})();

module.exports = bupp2p;