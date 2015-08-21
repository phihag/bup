"use strict";

var state = {};

function show_setup() {
	$('#setup').show();
}

function start_game(setup) {
	$('#setup').hide();
	$('#game').show();

	init_state(state, setup);
	calc_state();
	render();
}

function on_press(press) {
	state.presses.push(press);
	calc_state();
	render();
}

function init_state(s, setup) {
	if (s === undefined) {
		s = state;
	}

	s.setup = setup;
	s.presses = [];
	delete s.game;
	delete s.court;

	return s;
}

function calc_state(s) {
	if (s === undefined) {
		s = state;
	}

	s.game = {
		start_team1_left: null,
		start_server_team_id: null,
		start_server_player_id: null,
		start_receiver_player_id: null,

		team1_left: null,
		teams_player1_even: [null, null],
		team1_score: null,
		team2_score: null,
		team1_serving: null,
		finished: false,
	};
	s.presses.forEach(function(press) {
		switch (press.type) {
		case 'pick_side':
			s.game.start_team1_left = press.team1_left;
			s.game.team1_left = s.game.start_team1_left;
			if (! s.setup.is_doubles) {
				s.game.teams_player1_even = [true, true];
			}
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
		}
	});

	s.court = {
		player_left_odd: null,
		player_left_even: null,
		player_right_even: null,
		player_right_odd: null,

		left_serving: null,
		serving_downwards: null,
	};
	if (s.game.teams_player1_even[0] !== null) {
		s.court[
			'player_' + (s.game.team1_left ? 'left' : 'right') + '_' +
			(s.game.teams_player1_even[0] ? 'even' : 'odd')] = s.setup.teams[0].players[0];
		if (s.setup.is_doubles) {
			s.court[
				'player_' + (s.game.team1_left ? 'left' : 'right') + '_' +
				(s.game.teams_player1_even[0] ? 'odd' : 'even')] = s.setup.teams[0].players[1];
		}
	}
	if (s.game.teams_player1_even[1] !== null) {
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
		if (s.team1_score === null) {
			s.court.serving_downwards = ! s.court.left_serving;
		} else {
			var score = s.game.team1_serving ? s.team1_score : s.team2_score;
			s.court.serving_downwards = (score % 2 == 0) == s.court.left_serving;
		}
	}
	return s;
}

function render() {
	function _court_show_player(key) {
		var p = state.court['player_' + key];
		$('#court_' + key).text(p === null ? '' : p.name);
	}
	_court_show_player('left_odd');
	_court_show_player('left_even');
	_court_show_player('right_even');
	_court_show_player('right_odd');
	if (state.court.left_serving == null) {
		$('#court_arrow').hide();
	} else {
		$('#court_arrow').show();
		// TODO rotate arrow here
	}

	function _add_player_pick(container, type, team_id, player_id) {
		var player = state.setup.teams[team_id].players[player_id];
		var btn = $('<button>');
		btn.text(player.name);
		btn.on('click', function() {
			on_press({
				type: type,
				team_id: team_id,
				player_id: player_id,
			});
		});
		container.append(btn);
	}

	$('#pick_side').hide();
	$('#pick_server').hide();
	$('#pick_receiver').hide();
	if (state.game.start_team1_left === null) {
		$('#pick_side').show();
		if (state.setup.is_doubles) {
			$('#pick_side_team1').text(
				state.setup.teams[0].players[0].name + ' / ' +
				state.setup.teams[0].players[1].name);
			$('#pick_side_team2').text(
				state.setup.teams[1].players[0].name + ' / ' +
				state.setup.teams[1].players[1].name);
		} else {
			$('#pick_side_team1').text(state.setup.teams[0].players[0].name);
			$('#pick_side_team2').text(state.setup.teams[1].players[0].name);
		}
	} else if (state.game.start_server_team_id === null) {
		$('#pick_server button').remove();

		_add_player_pick($('#pick_server'), 'pick_server', 0, 0);
		if (state.setup.is_doubles) {
			_add_player_pick($('#pick_server'), 'pick_server', 0, 1);
		}
		_add_player_pick($('#pick_server'), 'pick_server', 1, 0);
		if (state.setup.is_doubles) {
			_add_player_pick($('#pick_server'), 'pick_server', 1, 1);
		}
		$('#pick_server').show();
	} else if (state.game.start_receiver_player_id === null) {
		$('#pick_receiver button').remove();
		var team_id = (state.game.start_server_team_id == 1) ? 0 : 1;
		_add_player_pick($('#pick_receiver'), 'pick_receiver', team_id, 0);
		_add_player_pick($('#pick_receiver'), 'pick_receiver', team_id, 1);
		$('#pick_receiver').show();
	}
}


function ui_init() {
	$('#setup_manual_form [name="gametype"]').on('change', function() {
		var new_type = $('#setup_manual_form [name="gametype"]:checked').val();
		var is_doubles = new_type == 'doubles';
		$('#setup_manual_form #setup_players_singles').toggle(!is_doubles);
		$('#setup_manual_form #setup_players_doubles').toggle(is_doubles);
	});

	$('#setup_manual_form').on('submit', function(e) {
		e.preventDefault();

		function _player(input_name, def) {
			var name = $('#setup_manual_form [name="' + input_name + '"]').val();
			if (! name) {
				name = def;
			}
			return {
				'name': name
			};
		}

		var team1, team2;
		var setup = {
			is_doubles: $('#setup_manual_form [name="gametype"]:checked').val() == 'doubles',
		};

		if (setup.is_doubles) {
			team1 = [_player('team1_player1', 'Left A'), _player('team1_player2', 'Left B')];
			team2 = [_player('team2_player1', 'Right C'), _player('team2_player2', 'Right D')];
		} else {
			team1 = [_player('team1_player', 'Left')];
			team2 = [_player('team2_player', 'Right')];
		}
		setup.teams = [{
			'players': team1,
		}, {
			'players': team2,
		}];

		start_game(setup);
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

	show_setup();
}

if (typeof $ !== 'undefined') {
	$(ui_init);
}

if (typeof module !== "undefined") {
	module.exports = {
		init_state: init_state,
		calc_state: calc_state,
	};
}
