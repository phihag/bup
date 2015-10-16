'use strict';
var network = (function() {

function calc_score(s) {
	function _finish_score(score, team1_won) {
		var winner = team1_won ? 0 : 1;
		if (score[1 - winner] >= 29) {
			score[winner] = 30;
		} else if (score[1 - winner] >= 20) {
			score[winner] = score[1 - winner] + 2;
		} else {
			score[winner] = 21;
		}
	}

	var scores = [];
	s.match.finished_games.forEach(function(fg) {
		scores.push(fg.score);
	});
	if (s.game.started || (s.game.score[0] != 0) || (s.game.score[1] != 0)) {
		scores.push(s.game.score);
	}
	if (s.match.finished && !s.match.won_by_score) {
		if (scores.length > 0) {
			_finish_score(scores[scores.length - 1], s.match.team1_won);
		}

		var won_games = 0;
		scores.forEach(function(score) {
			if ((score[0] >= score[1]) == s.match.team1_won) {
				won_games++;
			}
		});
		for (;won_games < 2;won_games++) {
			var new_score = [0, 0];
			_finish_score(new_score, s.match.team1_won);
			scores.push(new_score);
		}
	}

	return scores;
}


function send_press(s, press) {
	if (s.liveaw && s.liveaw.match_id) {
		_liveaw_request({
			type: 'set-presses',
			match_id: s.liveaw.match_id,
			presses: s.presses,
		}, function() {

		});
	}
	if (s.courtspot && s.setup.courtspot_match_id) {
		courtspot.send_press(s, press);
	}
	if (networks.btde && s.setup.btde_match_id) {
		networks.btde.send_press(s, press);
	}
}

function ui_list_matches(s, network_type, silent) {
	function _install_reload() {
		var event_container = $('.setup_network_heading');
		if (event_container.find('.setup_network_matches_reload').length > 0) {
			return;
		}
		var reload_button = $('<button class="setup_network_matches_reload"></button>');
		reload_button.on('click', function() {
			ui_list_matches(s, network_type, silent);
		});
		event_container.append(reload_button);
	}

	var container = $('#setup_network_matches');
	if (!network_type) {
		network_type = container.attr('data-network-type');
	}

	_install_reload();

	if (!silent && container.find('.setup_network_matches_loading').length == 0) {
		var loading = $('<div class="setup_network_matches_loading"><div class="loading-icon"></div><span>Lade Spiele ...</span></div>');
		container.append(loading);
	}

	networks[network_type].list_matches(s, function(err, event) {
		container.empty(); // TODO better transition if we're updating?
		_install_reload();

		if (err) {
			var err_msg = $('<div class="network_error">');
			err_msg.text(err.msg);
			container.append(err_msg);
			return;
		}

		$('.setup_network_event').text(event.event_name ? event.event_name : 'Spiele');

		event.matches.forEach(function(match) {
			var btn = $('<button class="setup_network_match">');
			var match_name = $('<span class="setup_network_match_match_name">');
			match_name.text(match.setup.match_name);
			btn.append(match_name);

			var _players_str = function(team) {
				return team.players.map(function(p) {
					return p.name;
				}).join('/');
			};

			var _score_text = function(network_score) {
				if (!network_score) {
					return '';
				}

				if ((network_score.length == 1) && (network_score[0][0] == 0) && (network_score[0][1] == 0)) {
					return '';
				}

				return network_score.map(function(network_game) {
					return network_game[0] + '-' + network_game[1];
				}).join(' ');
			};

			var home_players = $('<span class="setup_network_match_home_players">');
			home_players.text(_players_str(match.setup.teams[0]));
			btn.append(home_players);

			var away_players = $('<span class="setup_network_match_away_players">');
			away_players.text(_players_str(match.setup.teams[1]));
			btn.append(away_players);

			var score = $('<span class="setup_network_match_score">');
			var score_text = _score_text(match.network_score);
			score.text(score_text ? score_text : '\xA0');
			btn.append(score);

			btn.on('click', function() {
				start_match(s, match.setup);
				hide_settings();
			});

			container.append(btn);
		});
	});
}

function on_error(err) {
	// TODO show button / indicator
	// TODO does showing a login help?
	// TODO reschedule re-sync
}


return {
	calc_score: calc_score,
	on_error: on_error,
	ui_list_matches: ui_list_matches,
	send_press: send_press,
};


})();

if (typeof module !== 'undefined') {
	module.exports = network;
}
