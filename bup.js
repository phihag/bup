"use strict";

var state = {
	initialized: false
};
var settings = {
	save_finished_matches: true
};

function _parse_query_string(qs) {
	// http://stackoverflow.com/a/2880929/35070
	var pl     = /\+/g;
	var search = /([^&=]+)=?([^&]*)/g;
	var decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };

	var res = {};
	var match;
	while (match = search.exec(qs)) {
		res[decode(match[1])] = decode(match[2]);
	}
	return res;
}

function _add_zeroes(n) {
	if (n < 10) {
		return '0' + n;
	} else {
		return '' + n;
	}
};

function _duration_str(start_timestamp, end_timestamp) {
	var start = new Date(start_timestamp);
	var end = new Date(end_timestamp);

	/*
	Since we're not showing seconds, we pretend to calculate in minutes:
	start:      10:00:59 | 10:00:01
	end:        11:12:01 | 11:12:59
	precise:     1:11:02 |  1:12:58
	our result:  1:12    |  1:12
	*/

	start.setSeconds(0);
	end.setSeconds(0);
	start.setMilliseconds(0);
	end.setMilliseconds(0);

	var diff_ms = end.getTime() - start.getTime();
	var mins = Math.round(diff_ms / 60000);
	var hours = (mins - (mins % 60)) / 60;
	return hours + ':' + _add_zeroes(mins % 60);
}

function _get_time_str(d) {
	return _add_zeroes(d.getHours()) + ':' + _add_zeroes(d.getMinutes());
}

function _get_date_str(d) {
	return _add_zeroes(d.getDate()) + '.' + _add_zeroes(d.getMonth()+1) + '.' + d.getFullYear();
}

function _get_datetime_str(d) {
	return _get_date_str(d) + ' ' + _get_time_str(d);
}

function _human_date_str(d) {
	var WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	return WEEKDAYS[d.getDay()] + ' ' + _get_date_str(d);
}

function _uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    	return v.toString(16);
	});
}


function liveaw_contact(cb) {
	var wsurl = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.hostname + (location.port ? ':' + location.port: '')  + '/ws/bup';
	var ws = new WebSocket(wsurl, 'liveaw-bup');
	ws.onopen = function() {
		cb(null, ws);
	};
	ws.onmessage = function(ws_message) {
		console.log('<-', ws_message.data);
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
			show_error('No handler for request ' + msg.request_id);
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
	state = {
		initialized: false,
		liveaw: {
			match_id: liveaw_match_id,
			handlers: {},
			next_request_id: 1,
			common_state: [],
		},
	};

	ui_waitprogress('Kontaktiere liveaw');
	liveaw_contact(function(err, ws) {
		if (err) {
			ui_show_error(err, msg);
			show_settings();
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
				start_match(response.setup);
			} else if (response.type == 'current_presses') {
				// TODO test more here
				if (state.presses < response.presses) {
					state.presses = response.presses;
					on_presses_change(state);
				}
			}
			return true;
		});
	});
}

function network_send_press(s, press) {
	if (s.liveaw && s.liveaw.match_id) {
		_liveaw_request({
			type: 'set-presses',
			match_id: s.liveaw.match_id,
			presses: s.presses,
		}, function() {

		});
	}
}

function _ui_make_player_pick(s, label, type, on_cancel, modify_button) {
	var kill_dialog = function() {
		Mousetrap.unbind('escape');
		dlg_wrapper.remove();
	};
	var cancel = function() {
		kill_dialog();
		on_cancel();
	}

	Mousetrap.bind('escape', cancel);
	var dlg_wrapper = $('<div class="modal-wrapper">');
	dlg_wrapper.on('click', cancel);
	var dlg = $('<div class="pick_dialog">');
	dlg.appendTo(dlg_wrapper);

	var label_span = $('<span>');
	label_span.text(label);
	label_span.appendTo(dlg);

	var team_indices = [0, 1]
	team_indices.forEach(function(ti) {
		var btn = _ui_add_player_pick(s, dlg, type, ti, 0, kill_dialog);
		if (modify_button) {
			modify_button(btn, ti, 0);
		}
		if (s.setup.is_doubles) {
			btn = _ui_add_player_pick(s, dlg, type, ti, 1, kill_dialog);
			if (modify_button) {
				modify_button(btn, ti, 1);
			}
		}
	});

	var cancel_btn = $('<button class="cancel-button">Abbrechen</button>');
	cancel_btn.on('click', cancel);
	cancel_btn.appendTo(dlg);

	$('#game').append(dlg_wrapper);
}

function _ui_add_player_pick(s, container, type, team_id, player_id, on_click, namefunc) {
	if (! namefunc) {
		namefunc = function(player) {
			return player.name;
		};
	}

	var player = s.setup.teams[team_id].players[player_id];
	var btn = $('<button>');
	btn.text(namefunc(player));
	btn.on('click', function() {
		var press = {
			type: type,
			team_id: team_id,
			player_id: player_id,
		};
		if (on_click) {
			on_click(press);
		}
		on_press(press);
	});
	container.append(btn);
	return btn;
}

function show_error(msg, e) {
	console.error(msg, e);
}

function _ui_fullscreen_supported() {
	return (
		document.fullscreenEnabled ||
		document.webkitFullscreenEnabled ||
		document.mozFullScreenEnabled ||
		document.msFullscreenEnabled
	);
}

function _ui_fullscreen_active() {
	return (
		document.fullscreenElement ||
		document.webkitFullscreenElement ||
		document.mozFullScreenElement ||
		document.msFullscreenElement
	);
}

function _ui_fullscreen_start() {
	var doc = document.documentElement;
	if (doc.requestFullscreen) {
		doc.requestFullscreen();
	} else if (doc.webkitRequestFullscreen) {
		doc.webkitRequestFullscreen(doc.ALLOW_KEYBOARD_INPUT);
	} else if (doc.mozRequestFullScreen) {
		doc.mozRequestFullScreen();
	} else if (doc.msRequestFullscreen) {
		doc.msRequestFullscreen();
	}
}

function _ui_fullscreen_stop() {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	} else if (document.msExitFullscreen) {
		document.msExitFullscreen();
	}
}

function ui_fullscreen_toggle() {
	var supported = _ui_fullscreen_supported();
	if (! supported) {
		return;
	}
	if (_ui_fullscreen_active()) {
		_ui_fullscreen_stop();
	} else {
		_ui_fullscreen_start();
	}
}

function ui_fullscreen_init() {
	$(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function() {
		$('.fullscreen_button').text(
			_ui_fullscreen_active() ? 'Vollbildmodus verlassen' : 'Vollbildmodus'
		);
	});

	if (! _ui_fullscreen_supported()) {
		$('.fullscreen_button').attr({
			disabled: 'disabled',
			title: 'Vollbildmodus wird auf diesem Browser nicht unterstützt'
		});
	}
}

function ui_show_error(msg) {
	alert(msg);
}

function ui_waitprogress(msg) {
	$('#waitprogress_message').text(msg);
	$('#waitprogress_wrapper').show();
}

function ui_waitprogress_stop() {
	$('#waitprogress_wrapper').hide();
}

function ui_settings_load_list(s) {
	if (s === undefined) {
		s = state;
	}

	var matches = load_matches();
	matches = matches.filter(function(m) {
		return (!s.metadata || m.metadata.id != s.metadata.id);
	});
	$('.setup_loadmatch_none').toggle(matches.length == 0);
	var match_list = $('.setup_loadmatch_list');
	match_list.empty();
	match_list.toggle(matches.length > 0);
	matches.sort(function(m1, m2) {
		var time1 = m1.metadata.updated;
		var time2 = m2.metadata.updated;
		if (time1 > time2) {
			return -1;
		} else if (time1 < time2) {
			return 1;
		} else {
			return 0;
		}
	});
	matches.forEach(function(m) {
		var li = $('<li>');
		var a = $('<span class="load_match_link">');
		var match_name;
		if (m.setup.is_doubles) {
			match_name = m.setup.teams[0].players[0].name + '/' + m.setup.teams[0].players[1].name + ' vs ' + m.setup.teams[1].players[0].name + '/' + m.setup.teams[1].players[1].name;
		} else {
			match_name = m.setup.teams[0].players[0].name + ' vs ' + m.setup.teams[1].players[0].name;
		}
		var d = new Date(m.metadata.updated);
		a.text(match_name + ', ' + _get_datetime_str(d));
		a.on('click', function(e) {
			e.preventDefault();
			resume_match(m);
			hide_settings(true);
		});
		li.append(a);
		var del_btn = $('<button class="button_delete image-button textsize-button"><span></span></button>');
		del_btn.on('click', function() {
			delete_match(m.metadata.id);
			ui_settings_load_list();
		});
		li.append(del_btn);
		match_list.append(li);
	});
}

function ui_show_exception_dialog() {
	$('#exception_wrapper').show();
	Mousetrap.bind('escape', function() {
		ui_hide_exception_dialog();
	});
}

function ui_hide_exception_dialog() {
	Mousetrap.unbind('escape');
	$('#exception_wrapper').hide();
}

function _scoresheet_parse_match(state) {
	var games = [];

	var s = {
		initialized: state.initialized,
		scoresheet_game: {
			table: [],
			servers: [null, null],
			reached_20_all: false,
		},
	};
	init_state(s, state.setup);
	s.presses = state.presses;

	_init_calc(s);
	calc_undo(s);
	s.flattened_presses.forEach(function(press) {
		switch (press.type) {
		case 'pick_server':
			s.scoresheet_game.server_row = press.team_id * 2 + press.player_id;
			s.scoresheet_game.servers[press.team_id] = press.player_id;
			if (! s.setup.is_doubles) {
				s.scoresheet_game.receiver_row = (1 - press.team_id) * 2;
				s.scoresheet_game.servers[1 - press.team_id] = 0;
			}
			break;
		case 'pick_receiver':
			s.scoresheet_game.receiver_row = press.team_id * 2 + press.player_id;
			s.scoresheet_game.servers[press.team_id] = press.player_id;
			break;
		case 'postgame-confirm':
			games.push(s.scoresheet_game);
			s.scoresheet_game = {
				table: [],
				servers: [null, null],
			};
			if (! s.setup.is_doubles) {
				if (s.game.team1_won) {
					s.scoresheet_game.server_row = 0;
					s.scoresheet_game.receiver_row = 2;
				} else {
					s.scoresheet_game.server_row = 2;
					s.scoresheet_game.receiver_row = 0;
				}
			}
			break;
		case 'score':
			var score_team = (s.game.team1_left == (press.side == 'left')) ? 0 : 1;
			if (s.game.team1_serving != (score_team == 0)) {
				// Service over
				if (s.setup.is_doubles) {
					s.scoresheet_game.servers[score_team] = 1 - s.scoresheet_game.servers[score_team];
				}
			}
			var c = {};
			c[2 * score_team + s.scoresheet_game.servers[score_team]] = s.game.score[score_team] + 1;
			s.scoresheet_game.table.push(c);
			break;
		case 'red-card':
			var score_team = 1 - press.team_id;
			if (s.game.team1_serving != (score_team == 0)) {
				// Service over
				if (s.setup.is_doubles) {
					s.scoresheet_game.servers[score_team] = 1 - s.scoresheet_game.servers[score_team];
				}
			}
			var c = {};
			c[2 * score_team + s.scoresheet_game.servers[score_team]] = s.game.score[score_team] + 1;
			c[2 * press.team_id + press.player_id] = 'F';
			s.scoresheet_game.table.push(c);
			break;
		}
		
		calc_press(s, press);

		switch (press.type) {
		case 'injury':
			var c = {};
			c[2 * press.team_id + press.player_id] = press.char;
			s.scoresheet_game.table.push(c);
			break;
		case 'overrule':
			var row = -1;
			// Find correct row
			if (s.scoresheet_game.table.length > 0) {
				var prev_cell = s.scoresheet_game.table[s.scoresheet_game.table.length - 1];
				for (var i = 0;i < 4;i++) {
					if (prev_cell[i] && (typeof prev_cell[i] == 'number')) {
						if (i == 0) {
							row = 1;
						} else if (i == 1) {
							row = 0;
						} else if (i == 2) {
							row = 3;
						} else if (i == 3) {
							row = 2;
						}
						break;
					}
				}

				if ((row === -1) || (typeof prev_cell[row] !== 'undefined')) {
					var CANDIDATES = [1, 3, 0, 2];
					for (var i = 0;i < CANDIDATES.length;i++) {
						if (typeof prev_cell[CANDIDATES[i]] === 'undefined') {
							row = CANDIDATES[i];
							break;
						}
					}
				}

				prev_cell[row] = press.char;
			}
			break;
		case 'referee':
			var row = 1;
			// Guess row
			if (s.scoresheet_game.table.length > 0) {
				var prev_cell = s.scoresheet_game.table[s.scoresheet_game.table.length - 1];
				for (var i = 0;i < 4;i++) {
					if (prev_cell[i] && (typeof prev_cell[i] == 'string')) {
						row = i;
						break;
					}
				}
			}

			var c = {};
			c[row] = press.char;
			s.scoresheet_game.table.push(c);
			break;
		case 'interruption':
		case 'correction':
			s.scoresheet_game.table.push({
				'1': press.char,
			});
			break;
		case 'yellow-card':
			var c = {};
			c[2 * press.team_id + press.player_id] = press.char;
			s.scoresheet_game.table.push(c);
			break;
		case 'retired':
			var c = {};
			c[2 * press.team_id + press.player_id] = 'A';
			s.scoresheet_game.table.push(c);
			break;
		}

		if ((s.game.score[0] == 20) && (s.game.score[1] == 20) && !s.scoresheet_game.reached_20_all) {
			s.scoresheet_game.reached_20_all = true;
			s.scoresheet_game.table.push({
				dash: true,
			});
		}
	});
	games.push(s.scoresheet_game);
	return games;
}

function scoresheet_show() {
	if (!state.initialized) {
		return; // Called on start with Shift+S
	}

	$('.scoresheet_tournament_name').text(state.setup.tournament_name);
	$('.scoresheet_event_name').text(state.setup.event_name);
	$('.scoresheet_match_name').text(state.setup.match_name);
	var match_date = new Date(state.metadata.start);
	$('.scoresheet_date_value').text(_human_date_str(match_date));

	$('.scoresheet_court_name>span').text(state.setup.court_name);

	$('.scoresheet_begin_value>span').text(state.metadata.start ? _get_time_str(new Date(state.metadata.start)) : '');
	if (state.match.finished) {
		$('.scoresheet_end_value>span').text(state.metadata.updated ? _get_time_str(new Date(state.metadata.updated)) : '');
		$('.scoresheet_duration_value>span').text(state.metadata.updated ? _duration_str(state.metadata.start, state.metadata.updated) : '');
	} else {
		$('.scoresheet_end_value>span').text(null);
		$('.scoresheet_duration_value>span').text(null);
	}

	$('.scoresheet_results_team1_player1').text(state.setup.teams[0].players[0].name);
	$('.scoresheet_results_team1_player2').text(state.setup.is_doubles ? state.setup.teams[0].players[1].name : '');
	$('.scoresheet_results_team1_name').text(state.setup.teams[0].name);
	$('.scoresheet_results_team2_player1').text(state.setup.teams[1].players[0].name);
	$('.scoresheet_results_team2_player2').text(state.setup.is_doubles ? state.setup.teams[1].players[1].name: '');
	$('.scoresheet_results_team2_name').text(state.setup.teams[1].name);

	if (state.match.finished) {
		$('.scoresheet_results_circle_team1_container>.scoresheet_results_circle').toggle(state.match.team1_won);
		$('.scoresheet_results_circle_team2_container>.scoresheet_results_circle').toggle(! state.match.team1_won);
	}

	var side1_str = '';
	var side2_str = '';
	var first_game = null;
	if (state.match && state.match.finished_games.length > 0) {
		first_game = state.match.finished_games[0];
	} else {
		first_game = state.game;
	}
	if (first_game && first_game.start_team1_left !== undefined) {
		if (first_game.start_team1_left) {
			side1_str = 'L';
			side2_str = 'R';
		} else {
			side1_str = 'R';
			side2_str = 'L';
		}
	}
	$('.scoresheet_results_team1_side').text(side1_str);	
	$('.scoresheet_results_team2_side').text(side2_str);	

	if (state.match) {
		var all_finished_games = state.match.finished_games.slice();
		if (state.match.finished) {
			all_finished_games.push(state.game);
		}

		all_finished_games.forEach(function(g, i) {
			$('.scoresheet_results_team1_score' + (i + 1)).text(g.score[0]);
			$('.scoresheet_results_team2_score' + (i + 1)).text(g.score[1]);
		});
	}

	// Big table(s)
	var all_players;
	if (state.setup.is_doubles) {
		all_players = [
			state.setup.teams[0].players[0],
			state.setup.teams[0].players[1],
			state.setup.teams[1].players[0],
			state.setup.teams[1].players[1]
		];
	} else {
		all_players = [
			state.setup.teams[0].players[0],
			null,
			state.setup.teams[1].players[0],
			null,
		];
	}

	var parsed_games = _scoresheet_parse_match(state);
	var game_idx = 0;
	var table_idx_init = -1;
	var table_idx;

	$('.scoresheet_table_container').empty();
	for (var i = 0;i < 6;i++) {
		var g = (game_idx < parsed_games.length) ? parsed_games[game_idx] : null;
		var row = $('<table class="scoresheet_row">');
		var tbody = $('<tbody>');
		row.append(tbody);

		for (var row_idx = 0;row_idx < 4;row_idx++) {
			table_idx = table_idx_init;
			var tr = $('<tr>');
			var name = $('<th class="scoresheet_row_player_name">');
			if (all_players[row_idx]) {
				name.text(all_players[row_idx].name);
			}
			tr.append(name);

			var server_marks = $('<td class="scoresheet_row_server_marks">');
			if (g && (table_idx == -1)) {
				if (g.server_row === row_idx) {
					server_marks.text('A');
				}
				if ((g.receiver_row === row_idx) && state.setup.is_doubles) {
					server_marks.text('R');
				}
			}
			tr.append(server_marks);

			for (var col_idx = 0;col_idx < 35;col_idx++) {
				var td = $('<td>');
				if (g) {
					if ((table_idx == -1) && ((g.server_row === row_idx) || (g.receiver_row === row_idx))) {
						td.text('0');
					} else if ((table_idx >= 0) && (table_idx < g.table.length)) {
						if (typeof g.table[table_idx][row_idx] !== 'undefined') {
							td.text(g.table[table_idx][row_idx]);
						} else if (g.table[table_idx].dash && (row_idx == 0)) {
							td.addClass('scoresheet_20all');
							var dash = $('<div class="scoresheet_20all_dash"></div>');
							td.append(dash);
						}
					}
					table_idx++;
				}
				tr.append(td);
			}

			tbody.append(tr);
		}

		if (g && (table_idx < g.table.length)) {
			table_idx_init = table_idx;
		} else {
			game_idx++;
			table_idx_init = -1;
		}
		$('.scoresheet_table_container').append(row);
	}


	var settings_visible = $('#settings_wrapper').is(':visible');
	$('.scoresheet').attr('data-settings-visible', settings_visible ? 'true' : 'false');
	if (settings_visible) {
		$('#settings_wrapper').hide();
	}
	$('#game').hide();
	$('.scoresheet').show();

	Mousetrap.bind('escape', function() {
		scoresheet_hide();
	});

	// window.print(); //  TODO
}

function scoresheet_hide() {
	$('.scoresheet').hide();
	$('#game').show();
	if ($('.scoresheet').attr('data-settings-visible') === 'true') {
		$('#settings_wrapper').show();
	}
}

function demo_match_start() {
	var setup = {
		counting: '3x21',
		is_doubles: true,
		teams: [{
			name: '1.BC Beuel 1',
			players: [{
				name: 'Max Weißkirchen'
			}, {
				name: 'Birgit Michels'
			}]
		}, {
			name: '1.BC Sbr.-Bischmisheim 1',
			players: [{
				name: 'Michael Fuchs'
			}, {
				name: 'Samantha Barning'
			}]
		}],
		match_name: 'GD',
		event_name: 'BCB - BCB (Demo)',
		tournament_name: 'Demo',
		court_name: '1',
		team_competition: true,
	};

	hide_settings(true);
	start_match(setup);
}

function show_settings() {
	$('#settings_wrapper').show();
	Mousetrap.bind('escape', function() {
		hide_settings();
	});
	ui_settings_load_list();
	$('.extended_options').toggle(state.initialized);

}

function hide_settings(force) {
	if (!force && !state.initialized) {
		return;
	}
	Mousetrap.unbind('escape');
	$('#settings_wrapper').hide();
}

function resume_match(s) {
	state = s;
	state.initialized = true;
	calc_state(state);
	render(state);
}

function start_match(setup) {
	init_state(state, setup);
	calc_state(state);
	render(state);
}

function on_press(press, s) {
	if (s === undefined) {
		s = state;
	}

	press.timestamp = Date.now();
	s.presses.push(press);

	network_send_press(s, press);
	on_presses_change(s);
}

function on_presses_change(s) {
	calc_state(s);
	if (s.match.finish_confirmed) {
		if (! settings.save_finished_matches) {
			delete_match(s.metadata.id);
		}
		s.metadata = {};
		s.initialized = false;
		show_settings();
	} else {
		store_match(s);
		render(s);
	}
}

function init_state(s, setup) {
	var now = Date.now();
	s.metadata = {
		id: setup.match_id ? setup.match_id : _uuid(),
		start: now,
		updated: now,
	};
	s.initialized = true;
	s.setup = setup;
	s.presses = [];
	s.timer = false;

	delete s.match;
	delete s.game;
	delete s.court;

	return s;
}

function make_game_state(s, previous_game) {
	var res = {
		start_team1_left: (previous_game ? !previous_game.start_team1_left : null),
		start_server_team_id: (previous_game ? (previous_game.team1_won ? 0 : 1) : null),
		start_server_player_id: null,
		start_receiver_player_id: null,
		team1_serving: previous_game ? previous_game.team1_won : null,

		score: [null, null],
		teams_player1_even: [null, null],

		service_over: null,
		interval: null,
		change_sides: null,
		gamepoint: null,
		game: null,
		matchpoint: null,

		finished: false,
		team1_won: null
	};
	res.team1_left = res.start_team1_left;
	if (!s.setup.is_doubles) {
		if (previous_game) {
			res.start_server_player_id = 0;
			res.start_receiver_player_id = 0;
		}
		res.teams_player1_even = [true, true];
	}
	return res;
}

function score(s, team_id, timestamp) {
	var team1_scored = team_id == 0;
	s.game.service_over = team1_scored != s.game.team1_serving;
	s.game.score[team_id] += 1;

	var team1_won = (
		((s.game.score[0] == 21) && (s.game.score[1] < 20)) ||
		((s.game.score[0] > 21) && (s.game.score[1] < s.game.score[0] - 1)) ||
		(s.game.score[0] == 30)
	);
	var team2_won = (
		((s.game.score[1] == 21) && (s.game.score[0] < 20)) ||
		((s.game.score[1] > 21) && (s.game.score[0] < s.game.score[1] - 1)) ||
		(s.game.score[1] == 30)
	);
	if (team1_won) {
		s.match.game_score[0]++;
	} else if (team2_won) {
		s.match.game_score[1]++;
	}
	if (team1_won || team2_won) {
		s.game.team1_won = team1_won;
		s.game.game = true;
		s.game.finished = true;
		if (s.match.game_score[team_id] == 2) {
			s.match.finished = true;
			s.match.team1_won = team1_won;
		}
		s.game.team1_serving = null;
		s.game.service_over = null;
	} else {
		if (s.setup.is_doubles) {
			if (! s.game.service_over) {
				s.game.teams_player1_even[team_id] = !s.game.teams_player1_even[team_id];
			}
		} else {
			var even_score = s.game.score[team_id] % 2 == 0;
			s.game.teams_player1_even[team_id] = even_score;
			s.game.teams_player1_even[1 - team_id] = even_score;
		}
		s.game.team1_serving = team1_scored;
	}

	s.game.interval = (
		(s.game.score[team_id] === 11) && (s.game.score[1 - team_id] < 11)
	);

	if (s.game.interval) {
		s.timer = {
			start: timestamp,
			duration: 60 * 1000,
		};
	} else if (s.game.finished && !s.match.finished) {
		s.timer = {
			start: timestamp,
			duration: 120 * 1000,
		};
	} else {
		s.timer = false;
	}

	s.game.change_sides = (s.game.interval && s.match.finished_games.length == 2);
	if (s.game.change_sides) {
		s.game.team1_left = ! s.game.team1_left;
	}

	if (s.match.marks.length > 0) {
		s.match.marks = [];
	}
}

function calc_press(s, press) {
	switch (press.type) {
	case 'pick_side':
		s.game.start_team1_left = press.team1_left;
		s.game.team1_left = s.game.start_team1_left;
		s.timer = {
			start: press.timestamp,
			duration: 120 * 1000,
		};
		break;
	case 'pick_server':
		s.game.start_server_team_id = press.team_id;
		s.game.start_server_player_id = press.player_id;
		if (s.setup.is_doubles) {
			s.game.teams_player1_even[s.game.start_server_team_id] = s.game.start_server_player_id == 0;
		} else {
			s.game.start_receiver_player_id = 0;
		}
		s.game.team1_serving = s.game.start_server_team_id == 0;
		break;
	case 'pick_receiver':
		s.game.start_receiver_player_id = press.player_id;
		s.game.teams_player1_even[press.team_id] = s.game.start_receiver_player_id == 0;
		break;
	case 'love-all':
		s.game.score = [0, 0];
		s.game.service_over = false;
		s.game.interval = false;
		s.game.change_sides = false;
		s.game.matchpoint = false;
		s.game.gamepoint = false;
		s.game.game = false;
		break;
	case 'score':
		var team1_scored = (s.game.team1_left == (press.side == 'left'));
		score(s, (team1_scored ? 0 : 1), press.timestamp);
		break;
	case 'postgame-confirm':
		if (s.match.finished) {
			throw new Error('Match finished, but game instead of matched confirmed.');
		}
		s.match.finished_games.push(s.game);
		s.game = make_game_state(s, s.game);
		break;
	case 'postmatch-confirm':
		if (!s.match.finished) {
			throw new Error('Match not finished, but match end confirmed.');
		}
		if (s.match.finish_confirmed) {
			throw new Error('Match already confirmed.');
		}
		s.match.finished_games.push(s.game);
		s.match.finish_confirmed = true;
		break;
	case 'overrule':
		press.char = 'O';
		s.match.marks.push(press);
		break;
	case 'referee':
		press.char = 'R';
		s.match.marks.push(press);
		break;
	case 'correction':
		press.char = 'C';
		s.match.marks.push(press);
		break;
	case 'interruption':
		press.char = 'U';
		s.match.marks.push(press);
		break;
	case 'mark': // Deprecated
		s.match.marks.push(press);
		break;
	case 'yellow-card':
		if (s.match.carded[press.team_id]) {
			throw new Error('Gelbe Karte wurde bereits an diese Seite vergeben');
		}
		press.char = 'W';
		s.match.marks.push(press);
		s.match.carded[press.team_id] = true;
		break;
	case 'red-card':
		press.char = 'F';
		s.match.marks.push(press);
		if (! s.match.finished) {
			score(s, 1 - press.team_id, press.timestamp);
		}
		break;
	case 'injury':
		press.char = 'V';
		s.match.marks.push(press);
		break;
	case 'retired':
		press.char = 'A';
		s.match.marks.push(press);
		s.game.team1_won = press.team_id != 0;
		s.match.team1_won = s.game.team1_won;
		s.game.finished = true;
		s.match.finished = true;
		s.game.team1_serving = null;
		s.game.service_over = null;
		s.timer = false;
		break;
	case 'disqualified':
		press.char = 'Disqualifiziert';
		s.match.marks.push(press);
		s.game.finished = true;
		s.game.team1_won = press.team_id != 0;
		s.match.team1_won = s.game.team1_won;
		s.match.finished = true;
		s.game.team1_serving = null;
		s.game.service_over = null;
		s.timer = false;
		break;
	default:
		throw new Error('Unsupported press type ' + press.type);
	}
}

function _init_calc(s) {
	s.match = {
		finished_games: [],
		game_score: [0, 0],
		finished: false,
		marks: [],
		finish_confirmed: false,
		carded: [false, false],
		team1_won: null,
	};

	switch (s.setup.counting) {
	case '3x21':
		s.match.max_games = 3;
		break;
	default:
		throw new Error('Invalid counting scheme ' + s.setup.counting);
	}

	s.game = make_game_state(s);
}

function calc_state(s) {
	if (s.presses.length > 0) {
		s.metadata.updated = s.presses[s.presses.length - 1].timestamp;
	}

	_init_calc(s);
	calc_undo(s);
	s.flattened_presses.forEach(function(press) {
		calc_press(s, press);
	});

	if ((s.game.score[0] === 11) && (s.game.score[1] < 11) && (s.game.team1_serving)) {
		s.game.interval = true;
	} else if ((s.game.score[1] === 11) && (s.game.score[0] < 11) && (!s.game.team1_serving)) {
		s.game.interval = true;
	}

	if (! s.game.finished) {
		if ((s.game.team1_serving) && (((s.game.score[0] === 20) && (s.game.score[1] < 20)) || (s.game.score[0] == 29))) {
			if (s.match.game_score[0] == 0) {
				s.game.gamepoint = true;
			} else {
				s.game.matchpoint = true;
			}
		} else if ((!s.game.team1_serving) && (((s.game.score[1] === 20) && (s.game.score[0] < 20)) || (s.game.score[1] == 29))) {
			if (s.match.game_score[1] == 0) {
				s.game.gamepoint = true;
			} else {
				s.game.matchpoint = true;
			}
		}
	}

	s.court = {
		player_left_odd: null,
		player_left_even: null,
		player_right_even: null,
		player_right_odd: null,

		left_serving: null,
		serving_downwards: null,
	};
	if ((s.game.team1_left !== null) && (s.game.teams_player1_even[0] !== null)) {
		s.court[
			'player_' + (s.game.team1_left ? 'left' : 'right') + '_' +
			(s.game.teams_player1_even[0] ? 'even' : 'odd')] = s.setup.teams[0].players[0];
		if (s.setup.is_doubles) {
			s.court[
				'player_' + (s.game.team1_left ? 'left' : 'right') + '_' +
				(s.game.teams_player1_even[0] ? 'odd' : 'even')] = s.setup.teams[0].players[1];
		}
	}
	if ((s.game.team1_left !== null) && (s.game.teams_player1_even[1] !== null)) {
		s.court[
			'player_' + (s.game.team1_left ? 'right' : 'left') + '_' +
			(s.game.teams_player1_even[1] ? 'even' : 'odd')] = s.setup.teams[1].players[0];
		if (s.setup.is_doubles) {
			s.court[
				'player_' + (s.game.team1_left ? 'right' : 'left') + '_' +
				(s.game.teams_player1_even[1] ? 'odd' : 'even')] = s.setup.teams[1].players[1];
		}
	}

	if ((! s.game.finished) && (s.game.team1_serving !== null) && (s.game.team1_left !== null)) {
		s.court.left_serving = s.game.team1_serving == s.game.team1_left;
		if (s.game.score[0] === null) {
			s.court.serving_downwards = ! s.court.left_serving;
		} else {
			var serving_score = s.game.score[s.game.team1_serving ? 0 : 1];
			s.court.serving_downwards = (serving_score % 2 == 0) != s.court.left_serving;
		}
	}

	return s;
}

function render(s) {
	function _court_show_player(key) {
		var p = s.court['player_' + key];
		$('#court_' + key + '>span').text(p === null ? '' : p.name);
	}
	_court_show_player('left_odd');
	_court_show_player('left_even');
	_court_show_player('right_even');
	_court_show_player('right_odd');

	if (s.setup.team_competition && (s.game.team1_left !== null)) {
		$('#court_left_team, #court_right_team').show();
		var left_index = s.game.team1_left ? 0 : 1;
		$('#court_left_team>span').text(s.setup.teams[left_index].name);
		$('#court_right_team>span').text(s.setup.teams[1 - left_index].name);
	} else {
		$('#court_left_team, #court_right_team').hide();
	}

	$('#court_match_name>span').text(s.setup.match_name ? s.setup.match_name : '');
	$('#court_court_name>span').text(s.setup.court_name ? 'Feld ' + s.setup.court_name : '');

	if (s.court.left_serving == null) {
		$('#court_arrow').hide();
	} else {
		$('#court_arrow').show();
		var transform_css = ('scale(' +
			(s.court.left_serving ? '-1' : '1') + ',' +
			(s.court.serving_downwards ? '1' : '-1') + ')'
		);
		$('#court_arrow').css({
			'transform': transform_css,
			'-ms-transform': transform_css,
			'-webkit-transform': transform_css,
		});
	}

	var prematch = (
		(s.game.start_server_player_id !== null) &&
		(s.game.start_receiver_player_id !== null) &&
		(s.game.score[0] === null));
	if (prematch) {
		$('#love-all-dialog').show();
		$('#love-all').text(loveall_announcement());
	} else {
		$('#love-all-dialog').hide();
	}

	if (s.match.finished) {
		$('#postmatch-confirm-dialog').show();
		$('#postmatch-confirm').text(postgame_announcement());
	} else {
		$('#postmatch-confirm-dialog').hide();
	}
	if (!s.match.finished && s.game.finished) {
		$('#postgame-confirm-dialog').show();
		$('#postgame-confirm').text(postgame_announcement());
	} else {
		$('#postgame-confirm-dialog').hide();
	}

	var score_enabled = (s.game.score[0] !== null) && (! s.game.finished);
	var buttons = $('#left_score,#right_score');
	if (score_enabled) {
		buttons.removeAttr('disabled');
		buttons.removeClass('half-invisible');
	} else {
		buttons.attr('disabled', 'disabled');
		buttons.addClass('half-invisible');
	}

	var undo = $('#button_undo');
	if (s.undo_possible) {
		undo.removeAttr('disabled');
		undo.removeClass('half-invisible');
	} else {
		undo.attr('disabled', 'disabled');
		undo.addClass('half-invisible');
	}

	var redo = $('#button_redo');
	if (s.redo_possible) {
		redo.removeAttr('disabled');
		redo.removeClass('nearly-invisible');
	} else {
		redo.attr('disabled', 'disabled');
		redo.addClass('nearly-invisible');
	}

	if (s.timer) {
		ui_set_timer(s.timer);
	} else {
		ui_remove_timer();
	}

	$('#score_table').empty();
	var _add_game = function(game, is_current) {
		if (is_current) {
			var ann_tr = $('<tr class="score_announcements">');
			var ann_td = $('<td colspan="2"></td>');
			var _add_ann = function (text) {
				var ann_span = $('<span class="score_announcement">')
				ann_span.text(text);
				ann_td.append(ann_span);
			}
			if (s.game.service_over) {
				_add_ann('Aufschlagwechsel');
			}
			if (s.game.gamepoint) {
				_add_ann('Satzpunkt');
			}
			if (s.game.matchpoint) {
				_add_ann('Spielpunkt');
			}
			if (s.game.interval) {
				_add_ann('Pause');
			}
			if (s.game.change_sides) {
				_add_ann('Seiten wechseln');
			}
			if (s.game.game) {
				_add_ann('Satz');
			}
			if (s.match.marks.length > 0) {
				s.match.marks.forEach(function(mark_press) {
					_add_ann(mark_press.char);
				});
			}
			// Rendering fix for empty cells not being rendered correctly
			if (ann_td.children().length == 0) {
				ann_td.text('\xA0');
			}
			ann_tr.append(ann_td);
			$('#score_table').append(ann_tr);
		}

		var points;
		var tr = $('<tr>');
		if (!game) {
			tr.addClass('score_future-game');
		} else if (is_current) {
			tr.addClass('score_current-game');
		} else {
			tr.addClass('score_finished-game');
		}
		var left = $('<td class="score score_left">');
		if (game) {
			points = game.score[s.game.team1_left ? 0 : 1];
			if (points === null) {
				left.addClass('score_empty');
				points = 0;
			}
			if (game.finished) {
				if (game.team1_won == s.game.team1_left) {
					left.addClass('score_won');
				}
			} else if ((game.team1_serving !== null) && (game.team1_serving == s.game.team1_left)) {
				left.addClass('score_serving');
			}
			left.text(points);
		}
		tr.append(left);
		var right = $('<td class="score score_right">');
		if (game) {
			points = game.score[s.game.team1_left ? 1 : 0];
			if (points === null) {
				right.addClass('score_empty');
				points = 0;
			}
			if (game.finished) {
				if (game.team1_won != s.game.team1_left) {
					right.addClass('score_won');
				}
			} else if ((game.team1_serving !== null) && (game.team1_serving != s.game.team1_left)) {
				right.addClass('score_serving');
			}
			right.text(points);
		}
		tr.append(right);
		$('#score_table').append(tr);
	};
	for (var i = 0;i < s.match.max_games;i++) {
		if (i < s.match.finished_games.length) {
			_add_game(s.match.finished_games[i]);
		} else if (i == s.match.finished_games.length) {
			_add_game(s.game, true);
		} else {
			_add_game(null);
		}
	}

	$('#pick_side').hide();
	$('#pick_server').hide();
	$('#pick_receiver').hide();
	if (s.game.start_team1_left === null) {
		ui_show_picker($('#pick_side'));

		$('#pick_side_team1').text(calc_teamtext_internal(s, 0));
		$('#pick_side_team2').text(calc_teamtext_internal(s, 1));
	} else if (s.game.start_server_player_id === null) {
		$('#pick_server button').remove();

		var team_indices = (s.game.start_server_team_id === null) ? [0, 1] : [s.game.start_server_team_id];
		team_indices.forEach(function(ti) {
			var namefunc = null;
			if (s.setup.team_competition && (team_indices.length > 1)) {
				if (s.setup.is_doubles) {
					namefunc = function(player) {
						return player.name + ' [' + s.setup.teams[ti].name + ']'
					};
				} else {
					namefunc = function(player) {
						return s.setup.teams[ti].name + ' (' + player.name + ')'
					};
				}
			}

			_ui_add_player_pick(s, $('#pick_server'), 'pick_server', ti, 0, null, namefunc);
			if (s.setup.is_doubles) {
				_ui_add_player_pick(s, $('#pick_server'), 'pick_server', ti, 1, null, namefunc);
			}
		});

		ui_show_picker($('#pick_server'));
	} else if (s.game.start_receiver_player_id === null) {
		$('#pick_receiver button').remove();
		var team_id = (s.game.start_server_team_id == 1) ? 0 : 1;
		_ui_add_player_pick(s, $('#pick_receiver'), 'pick_receiver', team_id, 0);
		_ui_add_player_pick(s, $('#pick_receiver'), 'pick_receiver', team_id, 1);
		ui_show_picker($('#pick_receiver'));
	}
}

function calc_undo(s) {
	s.flattened_presses = [];
	s.redo_stack = [];
	s.undo_possible = false;
	s.redo_possible = false;
	s.presses.forEach(function(press) {
		if (press.type == 'undo') {
			if (! s.undo_possible) {
				throw new Error('Nothing to undo');
			}
			var last_press = s.flattened_presses.pop();
			s.redo_stack.push(last_press);
		} else if (press.type == 'redo') {
			if (! s.redo_possible) {
				throw new Error('Nothing to redo');
			}
			var p = s.redo_stack.pop();
			s.flattened_presses.push(p);
		} else {
			if (s.redo_stack.length > 0) {
				s.redo_stack = [];
			}
			s.flattened_presses.push(press);
		}

		s.undo_possible = s.flattened_presses.length > 0;
		s.redo_possible = s.redo_stack.length > 0;
	});
}

function loveall_announcement(s) {
	if (s === undefined) {
		s = state;
	}

	var prefix = '';
	if (s.match.finished_games == 1) {
		prefix = 'Zweiter Satz, ';
	} else if (s.match.finished_games == 2) {
		prefix = 'Entscheidungssatz, '
	}

	return prefix + '0 beide.\nBitte spielen';
}

function postgame_announcement(s) {
	if (s === undefined) {
		s = state;
	}

	var winner_index = s.game.team1_won ? 0 : 1;
	var winner_score = s.game.score[winner_index];
	var loser_score = s.game.score[1 - winner_index];
	var winner = s.setup.teams[winner_index];
	var winner_name;
	if (s.setup.team_competition) {
		winner_name = winner.name;
	} else {
		if (s.setup.is_doubles) {
			winner_name = winner.players[0].name + ' / ' + winner.players[1].name;
		} else {
			winner_name = winner.players[0].name;
		}
	}
	var res = '';
	if (s.match.finished) {
		var previous_scores = s.match.finished_games.reduce(function(str, game) {
			str += game.score[winner_index] + '-' + game.score[1 - winner_index] + ' ';
			return str;
		}, '');

		res = 'Das Spiel wurde gewonnen von ' + winner_name + ' mit\n' + previous_scores + winner_score + '-' + loser_score;
	} else if (s.match.finished_games.length == 0) {
		res = 'Der erste Satz wurde gewonnen von ' + winner_name + ' mit ' + winner_score + '-' + loser_score;
	} else if (s.match.finished_games.length == 1) {
		res = 'Der zweite Satz wurde gewonnen von ' + winner_name + ' mit ' + winner_score + '-' + loser_score + '; einen Satz beide';
	} else {
		throw new Error('Won third game but match not finished?')
	}
	return res;
}

// Team name as presented to the umpire
function calc_teamtext_internal(s, team_id) {
	var player_names;
	if (s.setup.is_doubles) {
		player_names = (
			s.setup.teams[team_id].players[0].name + ' / ' +
			s.setup.teams[team_id].players[1].name);
	} else {
		player_names = s.setup.teams[team_id].players[0].name;
	}

	if (s.setup.team_competition) {
		return s.setup.teams[team_id].name + ' (' + player_names + ')';
	} else {
		return player_names;
	}
}


function ui_show_picker(obj) {
	obj.show();
	var first_button = obj.find('button:first');
	first_button.addClass('auto-focused');
	first_button.focus();
	var kill_special_treatment = function() {
		first_button.removeClass('auto-focused');
		first_button.off('blur', kill_special_treatment);
	};
	first_button.on('blur', kill_special_treatment);
}

function store_match(s) {
	if (! window.localStorage) {
		show_error('localStorage unavailable');
		return;
	}

	var presses = s.presses;
	if (presses && presses[presses.length - 1].type == 'postmatch-confirm') {
		presses = presses.slice(0, presses.length - 1);
	}
	var cleaned_s = {
		metadata: s.metadata,
		setup: s.setup,
		presses: presses,
	};
	try {
		window.localStorage.setItem('bup_match_' + s.metadata.id, JSON.stringify(cleaned_s));
	} catch(e) {
		show_error('Failed to store match ' + s.metadata.id, e);
	}
}

function load_matches() {
	if (! window.localStorage) {
		show_error('localStorage unavailable');
		return;
	}

	var res = [];
	for (var i = 0;i < window.localStorage.length;i++) {
		var k = window.localStorage.key(i);
		if (! k.match(/^bup_match_/)) {
			continue;
		}

		var m = JSON.parse(window.localStorage.getItem(k));
		res.push(m);
	}
	return res;
}

function delete_match(match_id) {
	window.localStorage.removeItem('bup_match_' + match_id);
}

function settings_load() {
	if (! window.localStorage) {
		show_error('localStorage unavailable');
		return;
	}

	var s = window.localStorage.getItem('bup_settings');
	if (s) {
		settings = JSON.parse(s);
	}
}

function settings_store() {
	if (! window.localStorage) {
		show_error('localStorage unavailable');
		return;
	}

	window.localStorage.setItem('bup_settings', JSON.stringify(settings));
}

function init() {
	settings_load();
}

function ui_init_settings() {
	var checkboxes = ['save_finished_matches'];
	checkboxes.forEach(function(name) {
		var box = $('.settings [name="' + name + '"]');
		box.prop('checked', settings[name]);
		box.on('change', function() {
			settings[name] = box.prop('checked');
			settings_store();
		});
	});

	ui_fullscreen_init();
	$('.fullscreen_button').on('click', function() {
		ui_fullscreen_toggle();
	});
}

var ui_timer = null;
function ui_set_timer(timer) {
	if (ui_timer) {
		window.clearTimeout(ui_timer);
	}

	if (ui_update_timer()) {
		$('.timer_container').show();
	}
}

function ui_update_timer() {
	if (! state.timer) {
		ui_remove_timer();
		return;
	}

	var remaining = state.timer.start + state.timer.duration - Date.now();
	remaining = Math.max(0, remaining);
	var remaining_val = Math.round(remaining / 1000);
	if (remaining_val >= 60) {
		remaining_val = Math.floor(remaining_val / 60) + ':' + _add_zeroes(remaining_val % 60);
	}
	$('.timer').text(remaining_val);
	if (remaining <= 0) {
		ui_remove_timer();
		return;
	}

	var remaining_ms = Math.max(10, remaining % 1000);
	ui_timer = window.setTimeout(ui_update_timer, remaining_ms);
	return true;
}

function ui_remove_timer() {
	if (ui_timer) {
		window.clearTimeout(ui_timer);
		ui_timer = null;
		$('.timer_container').fadeOut(500);
	}
}

function ui_init() {
	$('.scoresheet_button').on('click', scoresheet_show);
	// $('.scoresheet').on('click', scoresheet_hide); TODO

	$('#setup_manual_form [name="gametype"]').on('change', function() {
		var new_type = $('#setup_manual_form [name="gametype"]:checked').val();
		var is_doubles = new_type == 'doubles';
		$('#setup_manual_form .only-doubles').toggle(is_doubles);

		$('.setup_players_manual [data-doubles-rowspan]').each(function(_, cell) {
			var $cell = $(cell);
			$cell.attr('rowspan', $cell.attr(is_doubles ? 'data-doubles-rowspan' : 'data-singles-rowspan'));
		});
	});

	$('#settings_wrapper').on('click', function(e) {
		if (e.target != this) {
			return;
		}
		hide_settings();
	});
	$('#exception_wrapper').on('click', function(e) {
		if (e.target != this) {
			return;
		}
 		ui_hide_exception_dialog();
	});

	$('#setup_manual_form').on('submit', function(e) {
		e.preventDefault();

		function _player_formval(input_name, def) {
			return {
				name: _formval(input_name, def)
			};
		}

		function _formval(input_name, def) {
			var val = $('#setup_manual_form [name="' + input_name + '"]').val();
			if (! val) {
				val = def;
			}
			return val;
		}

		var team1, team2;
		var setup = {
			is_doubles: $('#setup_manual_form [name="gametype"]:checked').val() == 'doubles',
			counting: '3x21'
		};

		setup.team_competition = $('#setup_manual_form [name="team_competition"]').prop('checked');
		setup.match_name = _formval('match_name');
		setup.event_name = _formval('event_name');
		setup.tournament_name = _formval('tournament_name');
		setup.court_name = _formval('court_name');

		if (setup.is_doubles &&
				!_formval('team1_player1') && !_formval('team1_player2') &&
				!_formval('team2_player1') && !_formval('team2_player2') &&
				!_formval('team1_name') && !_formval('team2_name') &&
				!setup.match_name &&
				!setup.event_name &&
				!setup.tournament_name &&
				!setup.court_name) {
			// Demo mode
			return demo_match_start();
		}

		if (setup.is_doubles) {
			team1 = [_player_formval('team1_player1', 'Left A'), _player_formval('team1_player2', 'Left B')];
			team2 = [_player_formval('team2_player1', 'Right C'), _player_formval('team2_player2', 'Right D')];
		} else {
			team1 = [_player_formval('team1_player1', 'Left')];
			team2 = [_player_formval('team2_player1', 'Right')];
		}
		setup.teams = [{
			'players': team1,
			'name': _formval('team1_name', (setup.team_competition ? (setup.is_doubles ? 'AB team' : 'Left team') : null)),
		}, {
			'players': team2,
			'name': _formval('team2_name', (setup.team_competition ? (setup.is_doubles ? 'CD team' : 'Right team') : null)),
		}];

		hide_settings(true);
		start_match(setup);
	});
	$('#pick_side_team1').on('click', function() {
		on_press({
			type: 'pick_side',
			team1_left: true,
		});
	});
	$('#pick_side_team2').on('click', function() {
		on_press({
			type: 'pick_side',
			team1_left: false,
		});
	});
	$('#love-all').on('click', function() {
		on_press({
			type: 'love-all'
		});
	});
	$('#postgame-confirm').on('click', function() {
		on_press({
			type: 'postgame-confirm'
		});
	});
	$('#postmatch-confirm').on('click', function() {
		on_press({
			type: 'postmatch-confirm'
		});
	});
	$('#left_score').on('click', function() {
		on_press({
			type: 'score',
			side: 'left'
		});
	});
	$('#right_score').on('click', function() {
		on_press({
			type: 'score',
			side: 'right'
		});
	});
	$('#button_undo').on('click', function() {
		on_press({
			type: 'undo',
		});
	});
	$('#button_redo').on('click', function() {
		on_press({
			type: 'redo',
		});
	});

	$('#button_settings').on('click', function() {
		show_settings();
	});
	$('#button_exception').on('click', function() {
		ui_show_exception_dialog();
	});
	$('.exception_dialog>.cancel-button').on('click', function() {
		ui_hide_exception_dialog();
	});
	$('#exception_referee').on('click', function() {
		on_press({
			type: 'referee',
		});
		ui_hide_exception_dialog();
	});
	$('#exception_interruption').on('click', function() {
		on_press({
			type: 'interruption',
		});
		ui_hide_exception_dialog();
	});
	$('#exception_correction').on('click', function() {
		on_press({
			type: 'correction',
		});
		ui_hide_exception_dialog();
	});
	$('#exception_overrule').on('click', function() {
		on_press({
			'type': 'overrule',
		});
		ui_hide_exception_dialog();
	});
	$('#exception_yellow').on('click', function() {
		ui_hide_exception_dialog();
		_ui_make_player_pick(
			state, 'Verwarnung (Gelbe Karte)', 'yellow-card', ui_show_exception_dialog,
			function(btn, team_id, player_id) {
				if (state.match.carded[team_id]) {
					btn.prepend('<span class="yellow-card-image"></span>');
					btn.attr('disabled', 'disabled');
				}
			}
		);
	});
	$('#exception_red').on('click', function() {
		ui_hide_exception_dialog();
		_ui_make_player_pick(state, 'Fehlerwarnung (rote Karte)', 'red-card', ui_show_exception_dialog);
	});
	$('#exception_injury').on('click', function() {
		ui_hide_exception_dialog();
		_ui_make_player_pick(state, 'Verletzung', 'injury', ui_show_exception_dialog);
	});
	$('#exception_retired').on('click', function() {
		ui_hide_exception_dialog();
		_ui_make_player_pick(state, 'Aufgegeben', 'retired', ui_show_exception_dialog);
	});
	$('#exception_black').on('click', function() {
		ui_hide_exception_dialog();
		_ui_make_player_pick(state, 'Disqualifiziert (schwarze Karte)', 'disqualified', ui_show_exception_dialog);
	});


	Mousetrap.bind('e', function() {
		if (state.initialized) {
			ui_show_exception_dialog();
		}
	});
	Mousetrap.bind('s', function() {
		if (state.initialized) {
			show_settings();
		}
	});
	Mousetrap.bind('shift+s', function() {
		scoresheet_show();
	});

	ui_init_settings();

	var hash_query = _parse_query_string(window.location.hash.substr(1));
	if (hash_query.liveaw_match_id) {
		liveaw_init(hash_query.liveaw_match_id);
	} else if (typeof hash_query.demo !== 'undefined') {
		demo_match_start();
	} else {
		show_settings();
	}
}

if (typeof $ !== 'undefined') {
	init();
	$(ui_init);
}

if (typeof module !== 'undefined') {
	module.exports = {
		init_state: init_state,
		calc_state: calc_state,
		// For testing only
		_duration_str: _duration_str,
	};
}
