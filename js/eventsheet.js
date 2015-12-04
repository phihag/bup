var eventsheet = (function() {
'use strict';

var URLS = {
	'1BL': 'div/Spielberichtsbogen_1BL.pdf',
	'2BLN': 'div/Spielberichtsbogen_2BL.pdf',
	'2BLS': 'div/Spielberichtsbogen_2BL.pdf',
	'RLW': 'div/Spielbericht_RLW.svg',
};
var files = {};

var event;
var ui_current_eventsheets;

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

function calc_gamescore(netscore) {
	var scores = [0, 0];
	netscore.forEach(function(game_score) {
		var winner = calc.game_winner(game_score[0], game_score[1]);
		if (winner == 'left') {
			scores[0]++;
		} else if (winner == 'right') {
			scores[1]++;
		}
	});
	return scores;
}

function calc_matchscore(netscore) {
	var winner = calc.match_winner(netscore);
	if (winner == 'left') {
		return [1, 0];
	} else if (winner == 'right') {
		return [0, 1];
	} else {
		return [undefined, undefined];
	}
}

function event_winner_str(event, match_score_home, match_score_away) {
	var needed_to_win = event.matches.length / 2;
	if (match_score_home > needed_to_win) {
		return event.home_team_name;
	} else if (match_score_away > needed_to_win) {
		return event.away_team_name;
	} else if ((match_score_home == needed_to_win) && (match_score_away == needed_to_win)) {
		return state._('eventsheet:draw');
	} else {
		return undefined;
	}
}

function get_match_order(matches) {
	var in_order = matches.slice();
	in_order.sort(function(m1, m2) {
		var start1 = m1.network_match_start;
		var start2 = m2.network_match_start;

		if (start1 === start2) {
			return 0;
		}

		if (! start1) {
			return 1;
		}
		if (! start2) {
			return -1;
		}

		if (start1 < start2) {
			return -1;
		} else {
			return 1;
		}
	});

	return matches.map(function(m) {
		if (!m.network_match_start) {
			return undefined;
		} else {
			return in_order.indexOf(m) + 1;
		}
	});
}

function calc_last_update(matches) {
	var last_update = 0;
	matches.forEach(function(m) {
		if (m.network_last_update && m.network_last_update > last_update) {
			last_update = m.network_last_update;
		}
	});
	return last_update;
}

function order_matches(event, match_order) {
	var matches = [];
	event.matches.forEach(function(m) {
		matches[match_order.indexOf(m.setup.courtspot_match_id)] = m;
	});
	return matches;
}

function render_bundesliga(es_key, ui8r, extra_data) {
	var i; // "let" is not available even in modern browsers
	var match_order;
	if (es_key == '1BL') {
		match_order = ['1.HD', 'DD', '1.HE', 'DE', 'GD', '2.HE'];
	} else {
		match_order = ['1.HD', 'DD', '2.HD', '1.HE', 'DE', 'GD', '2.HE', '3.HE'];
	}

	var matches = order_matches(event, match_order);
	var last_update = calc_last_update(matches);

	var player_names = [];
	for (i = 0;i < 6;i++) {
		player_names.push(_player_names(matches[i], 0));
	}
	for (i = 0;i < 6;i++) {
		player_names.push(_player_names(matches[i], 1));
	}
	for (i = 6;i < matches.length;i++) {
		player_names.push(_player_names(matches[i], 0));
		player_names.push(_player_names(matches[i], 1));
	}

	var point_scores_arrays = matches.map(function(m) {
		var res = m.network_score.map(function(nscore) {
			return nscore[0] + '-' + nscore[1];
		});
		while (res.length < 3) {
			res.push('');
		}
		return res;
	});
	var points_scores_all = [].concat.apply([], point_scores_arrays.slice(0, 6));
	for (i = 6;i < point_scores_arrays.length;i++) {
		var line = point_scores_arrays[i];
		line.reverse();
		points_scores_all.push.apply(points_scores_all, line);
	}
	
	var scores = [];
	matches.forEach(function(m) {
		var points = [undefined, undefined];
		var games = [undefined, undefined];
		var matches = [undefined, undefined];

		var netscore = m.network_score;
		if (netscore && (netscore.length > 0) && ((netscore[0][0] > 0) || (netscore[0][1] > 0))) {
			points = [0, 0];
			netscore.forEach(function(game_score) {
				points[0] += game_score[0];
				points[1] += game_score[1];
			});
			games = calc_gamescore(netscore);
			matches = calc_matchscore(netscore);
		}
		scores.push(points[0]);
		scores.push(points[1]);
		scores.push(games[0]);
		scores.push(games[1]);
		scores.push(matches[0]);
		scores.push(matches[1]);
	});

	var sums = [];
	for (var col = 0;col < 6;col++) {
		var sum = 0;
		for (i = col;i < scores.length;i += 6) {
			if (scores[i]) {
				sum += scores[i];
			}
		}
		sums.push(sum);
	}

	// Shuffle for 2BL
	scores = [].concat(
		scores.slice(0, 6 * 6),
		sums,
		utils.reverse_every(scores.slice(6 * 6), 6)
	);

	var match_score_home = scores[scores.length - 2];
	if (!match_score_home) {
		match_score_home = 0;
	}
	var match_score_away = scores[scores.length - 1];
	if (!match_score_away) {
		match_score_away = 0;
	}

	// Süd, Richtigkeit, Nord
	var checkboxes = [];
	if (es_key == '2BLN') {
		checkboxes = [false, true, true];
	} else if (es_key == '2BLS') {
		checkboxes = [true, true, false];
	}

	var fields = {
		'Textfeld1': [event.home_team_name],
		'Textfeld2': [event.away_team_name],
		'Textfeld3': [extra_data.umpires],
		'Textfeld4': [extra_data.location],
		'Textfeld5': (last_update ? [utils.date_str(last_update * 1000)] : []),
		'Textfeld6': [extra_data.starttime],
		'Textfeld7': (last_update ? [utils.time_str(last_update * 1000)] : []),
		'Textfeld8': [extra_data.matchday],
		'Textfeld9': player_names,
		'Textfeld10': points_scores_all,
		'Textfeld11': [event_winner_str(event, match_score_home, match_score_away)],
		'Textfeld12': [extra_data.backup_players],
		'Textfeld13': [extra_data.notes],
		'Textfeld14': [undefined, undefined, undefined, extra_data.protest, (extra_data.protest ? utils.time_str(Date.now()) : '')],
		'NumerischesFeld1': get_match_order(matches),
		'NumerischesFeld2': scores,
		'Kontrollkästchen1': [true],
		'#field[91]': [true],
		'Optionsfeldliste': checkboxes,
	};
	var res_pdf = pdfform.transform(ui8r, fields);
	var filename = 'Spielbericht ' + event.event_name + (last_update ? (' ' + utils.date_str(last_update * 1000)) : '') + '.pdf';
	var blob = new Blob([res_pdf], {type: 'application/pdf'});
	saveAs(blob, filename);
}

function _svg_text(svg, id, val) {
	var whole_id = 'es_rlw_' + id;
	var text_el = svg.getElementById(whole_id);
	if (!text_el) {
		return;
	}
	while (text_el.firstChild) {
		text_el.removeChild(text_el.firstChild);
	}
	if (val !== undefined) {
		var text_node = svg.ownerDocument.createTextNode(val);
		text_el.appendChild(text_node);
	}
}

function render_svg(es_key, ui8r, extra_data) {
	var xml_str = (new TextDecoder('utf-8')).decode(ui8r);
	var svg_doc = (new DOMParser()).parseFromString(xml_str, 'image/svg+xml');
	var svg = svg_doc.getElementsByTagName('svg')[0];

	var match_order = ['1.HD', '2.HD', 'DD', '1.HE', '2.HE', '3.HE', 'DE', 'GD'];
	var matches = order_matches(event, match_order);
	var last_update = calc_last_update(event.matches);

	var body = document.getElementsByTagName('body')[0];
	var container = $('<div style="position: absolute; left: -999px; top: -999px; width: 297px; height: 210px;">');
	container[0].appendChild(svg);
	body.appendChild(container[0]);

	var props = {
		title: ('Spielbericht ' + event.event_name + (last_update ? (' ' + utils.date_str(last_update * 1000)) : '')),
		subject: state._('Event Sheet'),
		creator: 'bup (https://phihag.de/bup/)',
	};
	if (state.settings && state.settings.umpire_name) {
		props.author = state.settings.umpire_name;
	}

	var match_order_nums = get_match_order(matches);
	match_order_nums.forEach(function(mon, i) {
		_svg_text(svg, 'match' + i + '_order', mon);
	});

	var sum_points = [0, 0];
	var sum_games = [0, 0];
	var sum_matches = [0, 0];

	matches.forEach(function(match, match_id) {
		var netscore = match.network_score;

		match.setup.teams.forEach(function(team, team_id) {
			team.players.forEach(function(player, player_id) {
				var key = 'match' + match_id + '_player' + team_id + '.' + player_id;
				_svg_text(svg, key, player.name);
			});
		});

		var netscore_strs = netscore.map(function(nscore) {
			return nscore[0] + ' - ' + nscore[1];
		});
		while (netscore_strs.length < 3) {
			netscore_strs.push('');
		}
		netscore_strs.forEach(function(ns, i) {
			_svg_text(svg, 'match' + match_id + '_game' + i, ns);
		});

		if (netscore && (netscore.length > 0) && ((netscore[0][0] > 0) || (netscore[0][1] > 0))) {
			var points = [0, 0];
			netscore.forEach(function(game_score) {
				points[0] += game_score[0];
				points[1] += game_score[1];
			});
			sum_points[0] += points[0];
			sum_points[1] += points[1];
			_svg_text(svg, 'match' + match_id + '_points0', points[0]);
			_svg_text(svg, 'match' + match_id + '_points1', points[1]);

			var games = calc_gamescore(netscore);
			sum_games[0] += games[0];
			sum_games[1] += games[1];
			_svg_text(svg, 'match' + match_id + '_games0', games[0]);
			_svg_text(svg, 'match' + match_id + '_games1', games[1]);

			var matches_score = calc_matchscore(netscore);
			if (matches_score[0] !== undefined) {
				sum_matches[0] += matches_score[0];
				sum_matches[1] += matches_score[1];
			}
			_svg_text(svg, 'match' + match_id + '_matches0', matches_score[0]);
			_svg_text(svg, 'match' + match_id + '_matches1', matches_score[1]);
		} else {
			_svg_text(svg, 'match' + match_id + '_points0', '');
			_svg_text(svg, 'match' + match_id + '_points1', '');
			_svg_text(svg, 'match' + match_id + '_games0', '');
			_svg_text(svg, 'match' + match_id + '_games1', '');
			_svg_text(svg, 'match' + match_id + '_matches0', '');
			_svg_text(svg, 'match' + match_id + '_matches1', '');
		}
	});

	_svg_text(svg, 'sum_points0', sum_points[0]);
	_svg_text(svg, 'sum_points1', sum_points[1]);
	_svg_text(svg, 'sum_games0', sum_games[0]);
	_svg_text(svg, 'sum_games1', sum_games[1]);
	_svg_text(svg, 'sum_matches0', sum_matches[0]);
	_svg_text(svg, 'sum_matches1', sum_matches[1]);

	var winner_str = event_winner_str(event, sum_matches[0], sum_matches[1]);
	_svg_text(svg, 'winner', winner_str);

	_svg_text(svg, 'starttime', extra_data.starttime);
	_svg_text(svg, 'date', (last_update ? utils.date_str(last_update * 1000) : ''));
	_svg_text(svg, 'matchday', extra_data.matchday);
	_svg_text(svg, 'home_team_name', event.home_team_name);
	_svg_text(svg, 'away_team_name', event.away_team_name);
	_svg_text(svg, 'tournament_name', event.tournament_name);
	_svg_text(svg, 'location', extra_data.location);
	_svg_text(svg, 'notes', extra_data.notes);
	_svg_text(svg, 'backup_players', extra_data.backup_players);
	_svg_text(svg, 'protest', extra_data.protest);
	_svg_text(svg, 'umpires', extra_data.umpires);

	var filename = 'Spielbericht ' + event.event_name + (last_update ? (' ' + utils.date_str(last_update * 1000)) : '') + '.pdf';
	svg2pdf.save(svg, props, filename);

	container.remove();
}

function render(es_key, ui8r, extra_data) {
	switch(es_key) {
	case '1BL':
	case '2BLN':
	case '2BLS':
		return render_bundesliga(es_key, ui8r, extra_data);
	case 'RLW':
		return render_svg(es_key, ui8r, extra_data);
	default:
	throw new Error('Unsupported eventsheet key ' + es_key);
	}
}

function prepare_render(btn, es_key, extra_data) {
	var progress = $('<div class="loading-icon" />');
	btn.append(progress);
	download(es_key, function(ui8r) {
		progress.remove();
		render(es_key, ui8r, extra_data);
	});
}

function download(es_key, callback) {
	if (files[es_key]) {
		if (!callback) {
			return;
		}
		return callback(files[es_key]);
	}

	var url = URLS[es_key];
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'arraybuffer';

	xhr.onload = function() {
		var ui8r = new Uint8Array(this.response);
		files[es_key] = ui8r;
		if (callback) {
			callback(ui8r);
		}
	};
	xhr.send();
}

function render_buttons(new_event) {
	if (event && utils.deep_equal(ui_current_eventsheets, new_event.eventsheets)) {
		event = new_event;
		return;  // No need to reconfigure containers
	}
	event = new_event;

	if (typeof pdfform != 'undefined') {
		pdfform_loaded();
	}

	var container = $('.setup_eventsheets');
	container.empty();
	ui_current_eventsheets = event.eventsheets;
	event.eventsheets.forEach(function(es) {
		var link = $('<a href="#" class="eventsheet_link">');
		link.on('click', function(e) {
			e.preventDefault();
			show_dialog(es.key);
			return false;
		});
		link.text(es.label);
		container.append(link);
	});
}

function hide() {
	$('.setup_eventsheets').empty();
}

function ui_init() {
	var form = $('.eventsheet_form');
	form.on('submit', function(e) {
		e.preventDefault();
		var es_key = $('.eventsheet_container').attr('data-eventsheet_key');
		var fields = ['umpires', 'location', 'matchday', 'starttime', 'notes', 'backup_players', 'protest'];
		var extra_data = utils.map_dict(fields, function(field) {
			return form.find('[name="' + field + '"]').val();
		});

		prepare_render($('.eventsheet_generate_button'), es_key, extra_data);
		return false;
	});

	$('.eventsheet_reload').on('click', function() {
		dialog_fetch();
	});

	$('.eventsheet_back').on('click', function(e) {
		e.preventDefault();
		var from_bup = $('.eventsheet_container').attr('data-eventsheet_key') != 'auto-direct';
		if (from_bup) {
			hide_dialog();
		} else {
			window.history.back();
		}
		return false;
	});

	if (window.localStorage) {
		var location_field = $('.eventsheet_form [name="location"]');
		try {
			var location = window.localStorage.getItem('bup_eventsheet_location');
			location_field.val(location);
		} catch(e) {
			// Ignore error
		}

		location_field.on('input change', function() {
			var location = $(this).val();
			try {
				window.localStorage.setItem('bup_eventsheet_location', location);
			} catch(e) {
				// Ignore error
			}
		});
	}
}

function dialog_fetch() {
	utils.visible('.eventsheet_generate_loading_icon', !event);
	var btn = $('.eventsheet_generate_button');
	if (event) {
		btn.removeAttr('disabled');
	} else {
		btn.attr('disabled', 'disabled');
		network.list_matches(state, function(err, ev) {
			utils.visible('.eventsheet_generate_loading_icon', false);
			if (err) {
				$('.eventsheet_error_message').text(err.msg);
				utils.visible('.eventsheet_error', true);
				return;
			}
			event = ev;

			var container = $('.eventsheet_container');
			var es_key = container.attr('data-eventsheet_key');
			es_key = resolve_key(es_key);
			container.attr('data-eventsheet_key', es_key);
			btn.removeAttr('disabled');
		});
	}
}

function resolve_key(es_key) {
	if (es_key != 'auto-direct') {
		return es_key;
	}

	if (!event) {
		return es_key; // Need to resolve again later
	}

	return event.eventsheets[0].key;
}

function show_dialog(es_key) {
	state.ui.eventsheet = es_key;
	settings.hide(true);
	$('#game').hide();

	es_key = resolve_key(es_key);

	if (es_key != 'auto-direct') {
		download(es_key);
	}

	var container = $('.eventsheet_container');
	container.attr('data-eventsheet_key', es_key);
	container.removeClass('default-invisible');

	dialog_fetch();
}

function hide_dialog() {
	state.ui.eventsheet = null;
	var container = $('.eventsheet_container');
	container.addClass('default-invisible');
	$('#game').show();
	settings.show();
}

return {
	pdfform_loaded: pdfform_loaded,
	render_buttons: render_buttons,
	hide: hide,
	ui_init: ui_init,
	show_dialog: show_dialog,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var utils = require('./utils');
	var svg2pdf = require('./svg2pdf');

	module.exports = eventsheet;
}
/*/@DEV*/