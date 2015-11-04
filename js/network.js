var network = (function() {
'use strict';

function get_netw() {
	return networks.btde || networks.courtspot;
}

function calc_score(s, always_zero) {
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
		scores.push(fg.score.slice());
	});
	if (! s.match.finish_confirmed && ((s.game.started || (s.game.score[0] > 0) || (s.game.score[1] > 0) || always_zero))) {
		scores.push(s.game.score.slice());
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
	if (networks.courtspot && s.setup.courtspot_match_id) {
		networks.courtspot.send_press(s, press);
	}
	if (networks.btde && s.setup.btde_match_id) {
		networks.btde.send_press(s, press);
	}
}

var _network_list_timeout = null;
function _stop_list_matches() {
	if (_network_list_timeout !== null) {
		window.clearTimeout(_network_list_timeout);
		_network_list_timeout = null;
	}
}

function _start_list_matches(s) {
	if (_network_list_timeout !== null) {
		window.clearTimeout(_network_list_timeout);
		_network_list_timeout = null;
	}

	if (erroneous) {
		// Let the normal resync procedure handle it
		return;
	}

	_network_list_timeout = setTimeout(function() {
		ui_list_matches(s, true);
	}, s.settings.network_update_interval);
}

function _matchlist_install_reload_button(s) {
	var event_container = $('.setup_network_heading');
	if (event_container.find('.setup_network_matches_reload').length > 0) {
		return;
	}
	var reload_button = $('<button class="setup_network_matches_reload"></button>');
	reload_button.on('click', function() {
		ui_list_matches(s);
	});
	event_container.append(reload_button);
}

function _score_text(network_score) {
	if (!network_score) {
		return '';
	}

	if ((network_score.length == 1) && (network_score[0][0] === 0) && (network_score[0][1] === 0)) {
		return '';
	}

	return network_score.map(function(network_game) {
		return network_game[0] + '-' + network_game[1];
	}).join(' ');
}

function ui_render_matchlist(s, event) {
	var container = $('#setup_network_matches');
	container.empty(); // TODO better transition if we're updating?
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
			var netw = get_netw();
			if (netw.prepare_match) {
				netw.prepare_match(state.settings, match);
			}

			hide_settings(true);

			if (match.network_score) {
				var netscore = match.network_score;
				var mwinner = calc.match_winner(netscore);

				if ((mwinner == 'inprogress') && calc.match_started(netscore)) {
					_ui_make_pick('Das Spiel ' + pronounciation.match_str(match.setup) + ' wurde bereits angefangen', [{
						label: 'Spiel bei ' + _score_text(netscore) + ' fortsetzen',
						key: 'resume',
					}, {
						label: 'Spiel bei 0-0 starten',
						key: 'restart',
					}], function(pick) {
						var presses = [];
						if (pick.key == 'resume') {
							var current_game = netscore[netscore.length - 1];

							if (netscore.length > 1) {
								presses.push({
									type: 'editmode_set-finished_games',
									scores: netscore.slice(0, netscore.length - 1),
									by_side: false,
								});
							}
							presses.push({
								type: 'editmode_set-score',
								score: current_game,
								by_side: false,
								resumed: true,
							});

							if (typeof match.network_team1_left == 'boolean') {
								presses.push({
									type: 'pick_side',
									team1_left: match.network_team1_left,
								});
							}
							if ((typeof match.network_team1_serving == 'boolean') && match.network_teams_player1_even) {
								var serving_team = match.network_team1_serving ? 0 : 1;
								var serving_even = (current_game[serving_team] % 2) === 0;

								var serving_player = 0;
								var receiving_player = 0;
								if (match.setup.is_doubles) {
									serving_player = (match.network_teams_player1_even[serving_team] == serving_even) ? 0 : 1;
									receiving_player = (match.network_teams_player1_even[1 - serving_team] == serving_even) ? 0 : 1;
								}

								presses.push({
									type: 'pick_server',
									team_id: serving_team,
									player_id: serving_player,
								});
								presses.push({
									type: 'pick_receiver',
									team_id: 1 - serving_team,
									player_id: receiving_player,
								});
							}
						}
						start_match(s, match.setup, presses);
					}, show_settings);
					return;
				}
				if (mwinner == 'left' || mwinner == 'right') {
					_ui_make_pick('Das Spiel ' + pronounciation.match_str(match.setup) + ' ist bereits beendet (' + _score_text(netscore) + ')!', [{
						label: 'Spiel bei 0-0 neu starten',
					}], function() {
						start_match(s, match.setup);
					}, show_settings);
					return;
				}
			}
			start_match(s, match.setup);
		});

		container.append(btn);
	});
}

// Returns a callback to be called when the list is no longer required
function ui_list_matches(s, silent, no_timer) {
	_matchlist_install_reload_button(s);
	if (! no_timer) {
		_start_list_matches(s);
	}

	var status_container = $('.setup_network_status');
	if (!silent && status_container.find('.setup_network_matches_loading').length === 0) {
		var loading = $('<div class="setup_network_matches_loading"><div class="loading-icon"></div><span>Lade Spiele ...</span></div>');
		status_container.append(loading);
	}

	var netw = get_netw();
	if (!netw) {
		return;
	}
	netw.list_matches(s, function(err, event) {
		status_container.empty();
		_matchlist_install_reload_button(s);
		errstate('list_matches', err);
		if (err) {
			var err_msg = $('<div class="network_error">');
			err_msg.text(err.msg);
			status_container.append(err_msg);
			return;
		}

		ui_render_matchlist(s, event);
	});

	return _stop_list_matches;
}


// Map of component => error status (true: currently faulty)
var erroneous = {};

var login_rendered = false;
var resync_timeout = null;

function schedule_resync() {
	if (resync_timeout !== null) {
		window.clearTimeout(resync_timeout);
		resync_timeout = null;
	}
	resync_timeout = window.setTimeout(resync, Math.max(state.settings.network_update_interval, 100));
}

function resync() {
	var netw = get_netw();
	if (! netw) {
		return;
	}

	if (state.initialized) {
		netw.sync(state);
	}
	ui_list_matches(state, true, true);

	if (resync_timeout !== null) {
		window.clearTimeout(resync_timeout);
		resync_timeout = null;
	}
	if (utils.any(utils.values(erroneous))) {
		schedule_resync();
	}
}

function errstate(component, err) {
	if (err) {
		erroneous[component] = true;

		$('.network_desync_container').show();
		if (resync_timeout === null) {
			schedule_resync();
		}

		if ((err.type == 'login-required') && !login_rendered) {
			login_rendered = true;
			var netw = get_netw();
			netw.ui_render_login($('.settings_network_login_container'));
			netw.ui_render_login($('.network_desync_login_container'));
		}

		$('.network_desync_errmsg').text(err.msg);
	} else {
		var was_erroneous;
		if (component == 'all') {
			was_erroneous = true;
			erroneous = {};
		} else {
			was_erroneous = erroneous[component];
			erroneous[component] = false;
		}

		if (login_rendered && (component.indexOf('login') >= 0) || (component == 'all')) {
			$('.settings_network_login_container').empty();
			$('.network_desync_login_container').empty();
			login_rendered = false;
		}
		if (! utils.any(utils.values(erroneous))) {
			$('.network_desync_container').hide();
		}
		if (was_erroneous) {
			resync();
		}
	}
}

function ui_init() {
	utils.on_click($('.network_desync_image'), resync);
}

return {
	calc_score: calc_score,
	send_press: send_press,
	ui_list_matches: ui_list_matches,
	ui_init: ui_init,
	resync: resync,
	errstate: errstate,
};


})();

if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var utils = require('./utils');
	var calc = require('./calc');
	var pronounciation = require('./pronounciation');

	module.exports = network;
}
