var eventsheet = (function() {
'use strict';

var URLS = {
	'1BL': 'div/Spielberichtsbogen_1BL.pdf',
	'2BLN': 'div/Spielberichtsbogen_2BL.pdf',
	'2BLS': 'div/Spielberichtsbogen_2BL.pdf',
};

var event;

function pdfform_loaded() {
	$('.setup_eventsheets').removeClass('default-invisible');
}

function _player_names(match, team_id) {
	var team = match.setup.teams[team_id];
	if (match.setup.is_doubles) {
		return (
			team.players[0].name + ' / ' +
			team.players[1].name);
	} else {
		return team.players[0].name;
	}
}

function render_bundesliga(es_key, ui8r) {
	var match_order = ['1.HD', 'DD', '1.HE', 'DE', 'GD', '2.HE'];
	var matches_in_order = [];
	event.matches.forEach(function(m) {
		matches_in_order[match_order.indexOf(m.setup.courtspot_match_id)] = m;
	});

	var last_update = 0;
	matches_in_order.forEach(function(m) {
		if (m.network_last_update && m.network_last_update > last_update) {
			last_update = m.network_last_update;
		}
	});

	var player_names_home = matches_in_order.map(function(m) {
		return _player_names(m, 0);
	});
	var player_names_away = matches_in_order.map(function(m) {
		return _player_names(m, 1);
	});
	var player_names_all = [].concat(player_names_home, player_names_away);

	var point_scores_arrays = matches_in_order.map(function(m) {
		var res = m.network_score.map(function(nscore) {
			return nscore[0] + '-' + nscore[1];
		});
		while (res.length < 3) {
			res.push('');
		}
		return res;
	});
	var points_scores_all = [].concat.apply([], point_scores_arrays);
	
	var scores = [];
	matches_in_order.forEach(function(m) {
		var home_points = 0;
		var away_points = 0;
		var home_games = 0;
		var away_games = 0;

		if (m.network_score) {
			m.network_score.forEach(function(netscore) {
				home_points += netscore[0];
				away_points += netscore[1];
			});
		}
		scores.push(home_points);
		scores.push(away_points);
		scores.push('TODO');
		scores.push('TODO');
		scores.push('TODO');
		scores.push('TODO');
	});
	for (var col = 0;col < 6;col++) {
		var sum = 0;
		for (var i = col;i < scores.length;i += 6) {
			sum += scores[i];
		}
		scores.push(sum);
	}

	var fields = {
		'Textfeld1': [event.home_team_name],
		'Textfeld2': [event.away_team_name],
		'Textfeld3': ['TODO Schiedsrichter'],
		'Textfeld4': ['TODO Austragungsstätte'],
		'Textfeld5': (last_update ? [utils.date_str(last_update * 1000)] : []),
		'Textfeld6': ['TODO Start'],
		'Textfeld7': (last_update ? [utils.time_str(last_update * 1000)] : []),
		'Textfeld8': ['TODO Spieltag'],
		'Textfeld9': player_names_all,
		'Textfeld10': points_scores_all,
		'Textfeld11': ['TODO Sieger'],
		'NumerischesFeld2': scores,
		'Kontrollkästchen1': [true],
		'#field[91]': [true],
	};
	var res_pdf = pdfform.transform(ui8r, fields);
	var filename = 'Spielbericht ' + event.event_name + '.pdf';
	// TODO better name?
	var blob = new Blob([res_pdf], {type: 'application/pdf'});
	saveAs(blob, filename);
}

function render(es_key, ui8r) {
	switch(es_key) {
	case '1BL':
	case '2BLN':
	case '2BLS':
		return render_bundesliga(es_key, ui8r);
	default:
	throw new Error('Unsupported eventsheet key ' + es_key);
	}
}

function prepare_render(es_key) {
	console.log('active progress');
	download(es_key, function(ui8r) {
		console.log('deactive progress');
		render(es_key, ui8r);
	});
}

function download(es_key, callback) {
	var url = URLS[es_key];
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'arraybuffer';

	xhr.onload = function(e) {
 		var ui8r = new Uint8Array(this.response);
 		if (callback) {
 			callback(ui8r);
 		}
	};
	xhr.send();
}

function render_buttons(new_event) {
	if (event && utils.deep_equal(event.eventsheets, new_event.eventsheets)) {
		event = new_event;
		return;  // No need to reconfigure containers
	}
	event = new_event;

	if (typeof pdfform != 'undefined') {
		pdfform_loaded();
	}

	var container = $('.setup_eventsheets');
	container.empty();
	event.eventsheets.forEach(function(es) {
		download(es.key);
		var btn = $('<button role="button">');
		btn.on('click', function() {
			prepare_render(es.key);
		});
		btn.text(es.label);
		container.append(btn);
	});
}

function hide() {
	$('.setup_eventsheets').empty();
}

return {
	pdfform_loaded: pdfform_loaded,
	render_buttons: render_buttons,
	hide: hide,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var utils = require('./utils');
	var control = require('./control');
	var uiu = require('./uiu');

	module.exports = eventsheet;
}
/*/@DEV*/