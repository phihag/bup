'use strict';
// BTS support (https://github.com/phihag/bts/) via HTTP

function btsh(baseurl, tournament_key) {

function _request_json(s, component, options, cb) {
	options.dataType = 'text';
	options.timeout = s.settings.network_timeout;
	network.request(component, options).done(function(res_json) {
		try {
			var res = JSON.parse(res_json);
		} catch (e) {
			return cb(e);
		}

		if (res.status !== 'ok') {
			return cb({msg: res.message + ' (Status ist ' + res.status + ')'});
		}

		return cb(null, res);
	}).fail(function (xhr) {
		var msg = ((xhr.status === 0) ?
			'BTS nicht via HTTP erreichbar' :
			('Netzwerk-Fehler (Code ' + xhr.status + ')')
		);
		return cb({
			type: 'network-error',
			status: xhr.status,
			msg: msg,
		});
	});
}

var outstanding_requests = 0;
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
	var post_data = {
		court_id: s.settings.court_id,
		network_score: netscore,
		team1_won: s.match.team1_won,
		presses: s.presses,
	};

	if (outstanding_requests > 0) {
		// Another request is currently underway; ours may come to late
		// Send our request anyways, but send it once again as soon as there are no more open requests
		s.remote.btsh_resend = true;
	}
	outstanding_requests++;
	var url = baseurl + 'h/' + encodeURIComponent(tournament_key) + '/m/' + encodeURIComponent(match_id) + '/score';

	_request_json(s, 'btsh.score', {
		method: 'POST',
		url: url,
		data: JSON.stringify(post_data),
		contentType: 'application/json; charset=utf-8',
	}, function(err) {
		outstanding_requests--;
		if (s.setup.match_id !== req_match_id) { // Match changed while the request was underway
			return;
		}

		if (!err) {
			s.remote.btsh_score = netscore;
			s.remote.btsh_court = s.settings.court_id;
		}
		network.errstate('btsh.score', err);

		if (s.remote.btsh_resend && outstanding_requests === 0) {
			s.remote.btsh_resend = false;
			send_score(s);
		}
	});
}

function sync(s) {
	var netscore = calc.netscore(s, true);
	if ((s.settings.court_id != s.remote.btsh_court) || !utils.deep_equal(netscore, s.remote.btsh_score)) {
		send_score(s);
	}
}

/* s, press */
function send_press(s) {
	sync(s);
}

function list_matches(s, cb) {
	var court_id = (s.ui && s.ui.displaymode_visible) ? s.settings.displaymode_court_id : s.settings.court_id;
	var filter = 'court=' + encodeURIComponent(court_id);

	_request_json(s, 'btsh.list', {
		url: baseurl + 'h/' + encodeURIComponent(tournament_key) + '/matches?' + filter,
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
	_request_json(s, 'btsh.courts', {
		url: baseurl + 'h/' + encodeURIComponent(tournament_key) + '/courts',
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
};

}

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var eventutils = require('./eventutils');
	var network = require('./network');
	var utils = require('./utils');

	module.exports = btsh;
}
/*/@DEV*/
