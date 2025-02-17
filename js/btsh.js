'use strict';
// BTS support (https://github.com/phihag/bts/) via HTTP & WebSocket

function btsh(baseurl, tournament_key) {

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

function list_matches(s, cb) {
	var court_id = '';
	if ((s.ui && s.ui.displaymode_visible)) {
		var style = s.settings.displaymode_style;
		if (displaymode.option_applies(style, 'court_id') && (style != '2court')) {
			court_id = s.settings.displaymode_court_id;
		}
	} else {
		court_id = s.settings.court_id;
	}
	var filter = court_id ? ('court=' + encodeURIComponent(court_id)) : '';
	var device_url = '&device=' + encodeURIComponent(btoa(JSON.stringify(_device_data(s))));

	_request_json(s, 'btsh.list', {
		url: baseurl + 'h/' + encodeURIComponent(tournament_key) + '/matches?' + filter + device_url,
	}, function(err, answer) {
		if (err) {
			return cb(err);
		}

		var ev = answer.event;
		eventutils.annotate(s, ev);

		return cb(null, ev);
	});
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

function ui_init(s, hash_query) {
	if (!baseurl) {
		baseurl = '../';
	}
	var m = window.location.pathname.match(/^(.*\/)bup\/(?:bup\.html|index\.html)?$/);
	if (m) {
		baseurl = m[1];
	}

	if (hash_query.btsws !== undefined) {
		btsws.init(s, baseurl);
	}
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

return {
	ui_init: ui_init,
	send_press: send_press,
	list_matches: list_matches,
	sync: sync,
	courts: courts,
	fetch_courts: fetch_courts,
	service_name: service_name,
	editable: editable,
	limited_ui: true,
};

}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var btsws = require('./btsws');
	var calc = require('./calc');
	var displaymode = require('./displaymode');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var refmode_client_ui = require('./refmode_client_ui');

	module.exports = btsh;
}
/*/@DEV*/
