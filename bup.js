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

function calc_state(s) {
	if (s === undefined) {
		s = state;
	}

	s.match = {
		finished_games: [],
		game_score: [0, 0],
		finished: false
	};

	switch (s.setup.counting) {
	case '3x21':
		s.match.max_games = 3;
		break;
	default:
		throw new Error('Invalid counting scheme ' + s.setup.counting);
	}

	s.game = make_game_state(s);
	s.presses.forEach(function(press) {
		switch (press.type) {
		case 'pick_side':
			s.game.start_team1_left = press.team1_left;
			s.game.team1_left = s.game.start_team1_left;
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
			s.game.service_over = team1_scored != s.game.team1_serving;
			var team_index = team1_scored ? 0 : 1;
			s.game.score[team_index] += 1;
			if (s.setup.is_doubles) {
				if (! s.game.service_over) {
					s.game.teams_player1_even[team_index] = !s.game.teams_player1_even[team_index];
				}
			} else {
				var even_score = s.game.score[team_index] % 2 == 0;
				s.game.teams_player1_even[team_index] = even_score;
				s.game.teams_player1_even[1 - team_index] = even_score;
			}
			s.game.team1_serving = team1_scored;

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
				if (s.match.game_score[team_index] == 2) {
					s.match.finished = true;
				}
				s.game.team1_serving = null;
				s.game.service_over = null;
			}

			s.game.interval = (
				(s.game.score[team_index] === 11) && (s.game.score[1 - team_index] < 11)
			);
			s.game.change_sides = (s.game.interval && s.match.finished_games.length == 2);
			if (s.game.change_sides) {
				s.game.team1_left = ! s.game.team1_left;
			}
			break;
		case 'postgame-confirm':
			s.match.finished_games.push(s.game);
			s.game = make_game_state(s, s.game);
			break;
		}
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
			var score = s.game.score[s.game.team1_serving ? 0 : 1];
			s.court.serving_downwards = (score % 2 == 0) != s.court.left_serving;
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
		var transform_css = ('scale(' +
			(state.court.left_serving ? '-1' : '1') + ',' +
			(state.court.serving_downwards ? '1' : '-1') + ')'
		);
		$('#court_arrow').css({
			'transform': transform_css,
			'-ms-transform': transform_css,
			'-webkit-transform': transform_css,
		});
	}

	var prematch = (
		(state.game.start_server_player_id !== null) &&
		(state.game.start_receiver_player_id !== null) &&
		(state.game.score[0] === null));
	if (prematch) {
		$('#love-all-dialog').show();
		$('#love-all').text(loveall_announcement());
	} else {
		$('#love-all-dialog').hide();
	}

	if (state.match.finished) {
		$('#postmatch-confirm-dialog').show();
		$('#postmatch-confirm').text(postgame_announcement());
	} else {
		$('#postmatch-confirm-dialog').hide();
	}
	if (!state.match.finished && state.game.finished) {
		$('#postgame-confirm-dialog').show();
		$('#postgame-confirm').text(postgame_announcement());
	} else {
		$('#postgame-confirm-dialog').hide();
	}

	var score_enabled = (state.game.score[0] !== null) && (! state.game.finished);
	var buttons = $('#left_score,#right_score');
	if (score_enabled) {
		buttons.removeAttr('disabled');
	} else {
		buttons.attr('disabled', 'disabled');
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
			if (state.game.service_over) {
				_add_ann('Aufschlagwechsel');
			}
			if (state.game.gamepoint) {
				_add_ann('Satzpunkt');
			}
			if (state.game.matchpoint) {
				_add_ann('Spielpunkt');
			}
			if (state.game.interval) {
				_add_ann('Pause');
			}
			if (state.game.change_sides) {
				_add_ann('Seiten wechseln');
			}
			if (state.game.game) {
				_add_ann('Satz');
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
			points = game.score[state.game.team1_left ? 0 : 1];
			if (points === null) {
				left.addClass('score_empty');
				points = 0;
			}
			if (game.finished) {
				if (game.team1_won == state.game.team1_left) {
					left.addClass('score_won');
				}
			} else if ((game.team1_serving !== null) && (game.team1_serving == state.game.team1_left)) {
				left.addClass('score_serving');
			}
			left.text(points);
		}
		tr.append(left);
		var right = $('<td class="score score_right">');
		if (game) {
			points = game.score[state.game.team1_left ? 1 : 0];
			if (points === null) {
				right.addClass('score_empty');
				points = 0;
			}
			if (game.finished) {
				if (game.team1_won != state.game.team1_left) {
					right.addClass('score_won');
				}
			} else if ((game.team1_serving !== null) && (game.team1_serving != state.game.team1_left)) {
				right.addClass('score_serving');
			}
			right.text(points);
		}
		tr.append(right);
		$('#score_table').append(tr);
	};
	for (var i = 0;i < state.match.max_games;i++) {
		if (i < state.match.finished_games.length) {
			_add_game(state.match.finished_games[i]);
		} else if (i == state.match.finished_games.length) {
			_add_game(state.game, true);
		} else {
			_add_game(null);
		}
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
	} else if (state.game.start_server_player_id === null) {
		$('#pick_server button').remove();

		var team_indices = (state.game.start_server_team_id === null) ? [0, 1] : [state.game.start_server_team_id];
		team_indices.forEach(function(ti) {
			_add_player_pick($('#pick_server'), 'pick_server', ti, 0);
			if (state.setup.is_doubles) {
				_add_player_pick($('#pick_server'), 'pick_server', ti, 1);
			}
		});

		$('#pick_server').show();
	} else if (state.game.start_receiver_player_id === null) {
		$('#pick_receiver button').remove();
		var team_id = (state.game.start_server_team_id == 1) ? 0 : 1;
		_add_player_pick($('#pick_receiver'), 'pick_receiver', team_id, 0);
		_add_player_pick($('#pick_receiver'), 'pick_receiver', team_id, 1);
		$('#pick_receiver').show();
	}
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
	if (s.setup.is_doubles) {
		winner_name = winner.players[0].name + ' / ' + winner.players[1].name;
	} else {
		winner_name = winner.players[0].name;
	}
	var res = '';
	if (s.match.finished) {
		var previous_scores = s.match.finished_games.reduce(function(str, game) {
			str += game.score[winner_index] + '-' + game.score[1 - winner_index] + ' ';
			return str;
		}, '');

		res = 'Das Spiel wurde gewonnen von ' + winner_name + ' mit ' + previous_scores + winner_score + '-' + loser_score;
	} else if (s.match.finished_games.length == 0) {
		res = 'Der erste Satz wurde gewonnen von ' + winner_name + ' mit ' + winner_score + '-' + loser_score;
	} else if (s.match.finished_games.length == 1) {
		res = 'Der zweite Satz wurde gewonnen von ' + winner_name + ' mit ' + winner_score + '-' + loser_score + '; einen Satz beide';
	} else {
		throw new Error('Won third game but match not finished?')
	}
	return res;
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
			counting: '3x21'
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


	show_setup();
}

if (typeof $ !== 'undefined') {
	$(ui_init);
}

if (typeof module !== 'undefined') {
	module.exports = {
		init_state: init_state,
		calc_state: calc_state,
	};
}
