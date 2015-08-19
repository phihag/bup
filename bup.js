"use strict";

var state = {};

function show_setup() {
	$('#setup').show();
}

function start_game(setup) {
	$('#setup').hide();
	$('#game').show();

	state.setup = setup;
	state.presses = [];
	calc_state();
	render();
}

function calc_state() {
	state.current_state = {
		player_left_top: state.setup.team1.players[0],
		player_left_bottom: state.setup.team1.players[0],
		player_right_top: state.setup.team2.players[0],
		player_right_bottom: state.setup.team2.players[0],
	};
}

function render() {
	console.log("RENDERING");
	var cs = state.current_state;
	$('#court_left_top').text(cs.player_left_top.name);
	$('#court_left_bottom').text(cs.player_left_bottom.name);
	$('#court_right_top').text(cs.player_right_top.name);
	$('#court_right_bottom').text(cs.player_right_bottom.name);
}


document.addEventListener('DOMContentLoaded', function() {
	$('#setup_manual_form [name="gametype"]').on('change', function() {
		var new_type = $('#setup_manual_form [name="gametype"]:checked').val();
		var is_singles = new_type == 'singles';
		$('#setup_manual_form #setup_players_singles').toggle(is_singles);
		$('#setup_manual_form #setup_players_doubles').toggle(!is_singles);
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
			gametype: $('#setup_manual_form [name="gametype"]:checked').val(),
		};
		if (setup.gametype == 'singles') {
			team1 = [_player('team1_player', 'Left')];
			team2 = [_player('team2_player', 'Right')];
		} else {
			team1 = [_player('team1_player1', 'Left A'), _player('team1_player2', 'Left B')];
			team2 = [_player('team2_player1', 'Right C'), _player('team1_player2', 'Right D')];
		}
		setup.team1 = {
			'players': team1,
		};
		setup.team2 = {
			'players': team2,
		}

		start_game(setup);
	});

	show_setup();
});