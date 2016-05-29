var displaymode = (function() {
'use strict';

var autosize_cancels = [];

function _setup_autosize(el, right_node) {
	autosize.maintain(el, function() {
		var parent_node = el.parentNode;
		var w = parent_node.offsetWidth;
		if (right_node) {
			w = Math.min(w, right_node.offsetLeft);
		}
		return {
			width: w,
			height: parent_node.offsetHeight / 1.1,
		};
	});
}

function _calc_matchscore(matches) {
	var res = [0, 0];
	matches.forEach(function(m) {
		var winner = calc.match_winner(m.setup.counting, m.network_score);
		if (winner === 'left') {
			res[0] += 1;
		} else if (winner === 'right') {
			res[1] += 1;
		}
	});
	return res;
}

function _doubles_name(player) {
	if (player.lastname) {
		return player.firstname[0] + '.\xa0' + player.lastname;
	}
	
	var m = /^(.).*?\s+(\S+)$/.exec(player.name);
	if (!m) {
		return player.name;
	}
	return m[1] + '.\xa0' + m[2];
}

function _list_render_player_names(container, players, winning) {
	var names_str;
	if (players.length === 1) {
		names_str = players[0].name;
	} else {
		names_str = _doubles_name(players[0]) + ' / ' + _doubles_name(players[1]);
	}
	var div = uiu.create_el(
		container, 'div', {
			'class': 'display_list_player_names_wrapper',
		}
	);
	var span = uiu.create_el(
		div, 'span', {
			'class': (winning ? 'display_list_winning' : ''),
		}, names_str
	);
	_setup_autosize(span);
}

function _list_render_team_name(tr, team_name) {
	var th = uiu.create_el(tr, 'th', {
		'class': 'display_list_teamname',
	});
	var div = uiu.create_el(th, 'div');
	var span = uiu.create_el(div, 'span', {}, team_name);
	return span;
}

function _calc_max_games(event) {
	var res = 0;
	event.matches.forEach(function(match) {
		res = Math.max(res, calc.max_game_count(match.setup.counting));
	});
	return res;
}

function update(err, s, event) {
	var container = uiu.qs('.displaymode_layout');
	uiu.remove_qsa('.display_loading,.display_error', container);

	if (err && (err.errtype === 'loading')) {
		uiu.create_el(container, 'div', {
			'class': 'display_loading',
		});
		return;
	}

	if (err) {
		uiu.create_el(container, 'div', {
			'class': 'display_error',
		}, err.msg);
		// TODO report these errors as well to home?
		return;
	}

	// Redraw everything
	autosize_cancels.forEach(function(ac) {
		ac();
	});
	autosize_cancels = [];
	uiu.empty(container);

	s.event = event;

	if (event.courts) {
		var courts_container = uiu.create_el(container, 'div', {
			'class': 'display_courts_container',
		});
		var court_count = event.courts.length;
		var court_width = Math.floor((100.0 - (4 * (court_count - 1))) / court_count);
		for (var court_idx = 0;court_idx < court_count;court_idx++) {
			if (court_idx > 0) {
				uiu.create_el(courts_container, 'div', {
					'class': 'display_courts_separator',
				});
			}

			var court_container = uiu.create_el(courts_container, 'div', {
				'class': 'display_courts_court',
				'style': ('width: ' + court_width + '%;'),
			});

			var court = event.courts[court_idx];
			var match = court.match_id ? utils.find(event.matches, function(m) {
				return court.match_id === m.setup.match_id;
			}) : null;

			var top_team_idx = 0;
			if (match && court.chair) {
				var team0_left = network.calc_team0_left(match);
				if (typeof team0_left == 'boolean') {
					top_team_idx = (team0_left == (court.chair === 'west')) ? 0 : 1;
				}
			}
			var bottom_team_idx = 1 - top_team_idx;

			var nscore = match ? match.network_score : [];
			var match_setup = match ? match.setup : {
				teams: [{
					name: event.home_team_name,
					players: [],
				}, {
					name: event.away_team_name,
					players: [],
				}],
			};
			var prev_scores = nscore.slice(0, -1);
			var current_score = (nscore.length > 0) ? nscore[nscore.length - 1] : ['', ''];

			var server_team_id = null;
			var server_player_id = null;
			if ((typeof match.network_team1_serving == 'boolean') && match.network_teams_player1_even) {
				server_team_id = match.network_team1_serving ? 0 : 1;

				if (match.setup.is_doubles) {
					server_player_id = (match.network_teams_player1_even[server_team_id] == (current_score[server_team_id] % 2 == 0)) ? 0 : 1;
				} else {
					server_player_id = 0;
				}
			}

			var top_current_score = uiu.create_el(court_container, 'div', {
				'class': 'display_courts_current_score_top',
			}, current_score[top_team_idx]);
			var bottom_current_score = uiu.create_el(court_container, 'div', {
				'class': 'display_courts_current_score_bottom',
			}, current_score[bottom_team_idx]);

			var top_team = match_setup.teams[top_team_idx];

			var player_container = uiu.create_el(court_container, 'div', {
				'class': (match_setup.is_doubles ? 'display_courts_player_names_doubles' : 'display_courts_player_names_singles'),
			});
			for (var player_id = 0;player_id < top_team.players.length;player_id++) {
				var top_is_serving = (top_team_idx === server_team_id) && (player_id === server_player_id);
				var top_player_name_container = uiu.create_el(player_container, 'div', {
					'class': 'display_courts_player_name' + (top_is_serving ? ' display_courts_player_serving' : ''),
				});
				var top_player_name_span = uiu.create_el(
					top_player_name_container, 'span', {}, top_team.players[player_id].name);
				_setup_autosize(top_player_name_span, top_current_score);
			}

			var top_row = uiu.create_el(court_container, 'div', {
				'class': 'display_courts_team_row',
			});
			var top_prev_scores_container = uiu.create_el(top_row, 'div', {
				'class': 'display_courts_prev_scores_top',
			});
			prev_scores.forEach(function(ps) {
				uiu.create_el(top_prev_scores_container, 'div', {
					'class': ((ps[top_team_idx] > ps[bottom_team_idx]) ? 'display_courts_prev_score_won' : 'display_courts_prev_score_lost'),
				}, ps[top_team_idx]);
			});
			var top_team_el = uiu.create_el(top_row, 'div', {
				'class': 'display_courts_team_name',
			});
			var top_team_span = uiu.create_el(top_team_el, 'span', {}, top_team.name);

			var bottom_row = uiu.create_el(court_container, 'div', {
				'class': 'display_courts_team_row',
			});
			var bottom_prev_scores_container = uiu.create_el(bottom_row, 'div', {
				'class': 'display_courts_prev_scores_bottom',
			});
			prev_scores.forEach(function(ps) {
				uiu.create_el(bottom_prev_scores_container, 'div', {
					'class': ((ps[bottom_team_idx] > ps[top_team_idx]) ? 'display_courts_prev_score_won' : 'display_courts_prev_score_lost'),
				}, ps[bottom_team_idx]);
			});
			var bottom_team = match_setup.teams[bottom_team_idx];
			var bottom_team_el = uiu.create_el(bottom_row, 'div', {
				'class': 'display_courts_team_name',
			});
			var bottom_team_span = uiu.create_el(bottom_team_el, 'span', {}, bottom_team.name);

			player_container = uiu.create_el(court_container, 'div', {
				'class': (match_setup.is_doubles ? 'display_courts_player_names_doubles' : 'display_courts_player_names_singles'),
			});
			for (player_id = 0;player_id < bottom_team.players.length;player_id++) {
				var bottom_is_serving = (bottom_team_idx === server_team_id) && (player_id === server_player_id);
				var bottom_player_name_container = uiu.create_el(player_container, 'div', {
					'class': 'display_courts_player_name' + (bottom_is_serving ? ' display_courts_player_serving' : ''),
				});
				var bottom_player_name_span = uiu.create_el(
					bottom_player_name_container, 'span', {}, bottom_team.players[player_id].name);
				_setup_autosize(bottom_player_name_span, bottom_current_score);
			}

			_setup_autosize(top_team_span);
			_setup_autosize(bottom_team_span);
		}
	}

	// List of all matches
	var max_games = _calc_max_games(event);
	var match_score = _calc_matchscore(event.matches);
	var home_winning = match_score[0] > (event.matches.length / 2);
	var away_winning = match_score[1] > (event.matches.length / 2);
	if ((match_score[0] === event.matches.length / 2) && (match_score[0] === event.matches.length / 2)) {
		// draw
		home_winning = true;
		away_winning = true;
	}
	var match_list = uiu.create_el(container, 'table', {
		'class': 'display_list_container',
	});
	var match_list_head = uiu.create_el(match_list, 'tr', {
		'class': 'display_list_thead',
	});
	uiu.create_el(match_list_head, 'th', {
		'class': 'display_list_match_name',
	}, '');
	var home_span = _list_render_team_name(match_list_head, event.home_team_name);
	var away_span = _list_render_team_name(match_list_head, event.away_team_name);
	var match_score_el = uiu.create_el(match_list_head, 'th', {
		'class': 'display_list_matchscore',
		'colspan': max_games,
	});
	uiu.create_el(match_score_el, 'span', {
		'class': (home_winning ? 'display_list_winning' : ''),
	}, match_score[0]);
	uiu.create_el(match_score_el, 'span', {'class': 'display_list_vs'}, ' : ');
	uiu.create_el(match_score_el, 'span', {
		'class': (away_winning ? 'display_list_winning' : ''),
	}, match_score[1]);

	// Now that we're done with initializing the first row, actually call autosizing
	_setup_autosize(home_span);
	_setup_autosize(away_span);

	event.matches.forEach(function(m) {
		var mwinner = calc.match_winner(m.setup.counting, m.network_score);

		var row = uiu.create_el(match_list, 'tr');
		uiu.create_el(row, 'td', {
			'class': 'display_list_match_name',
		}, m.setup.match_name);
		var home_td = uiu.create_el(row, 'td', {
			'class': 'display_list_player_names' + ((mwinner === 'left') ? ' display_list_winning_players' : ''),
		});
		_list_render_player_names(home_td, m.setup.teams[0].players, (mwinner === 'left'));
		var away_td = uiu.create_el(row, 'td', {
			'class': 'display_list_player_names' + ((mwinner === 'right') ? ' display_list_winning_players' : ''),
		});
		_list_render_player_names(away_td, m.setup.teams[1].players, (mwinner === 'right'));

		for (var game_idx = 0;game_idx < max_games;game_idx++) {
			var score_td = uiu.create_el(row, 'td', {
				'class': 'display_list_game_score',
			});

			if (game_idx >= m.network_score.length) {
				continue;
			}
			var nscore = m.network_score[game_idx];
			var gwinner = calc.game_winner(m.setup.counting, game_idx, nscore[0], nscore[1]);
			uiu.create_el(score_td, 'span', {
				'class': ((gwinner === 'left') ? 'display_list_winning' : ''),
			}, nscore[0]);
			uiu.create_el(score_td, 'span', {
				'class': 'display_list_vs',
			}, ':');
			uiu.create_el(score_td, 'span', {
				'class': ((gwinner === 'right') ? 'display_list_winning' : ''),
			}, nscore[1]);
		}
	});
}

var _cancel_updates = null;
function show() {
	if (state.ui.displaymode_visible) {
		return;
	}

	state.ui.displaymode_visible = true;
	render.hide();
	settings.on_mode_change(state);
	//settings.show_displaymode();
	// TODO only show settings if required

	control.set_current(state);
	uiu.visible_qs('.displaymode_layout', true);
	$(uiu.qs('.settings_layout')).addClass('settings_layout_displaymode');

	_cancel_updates = network.ui_list_matches(state, true, false);
	update({
		errtype: 'loading',
	}, state);

	_cancel_updates = network.subscribe(state, update, function(s) {
		return s.settings.displaymode_update_interval;
	});
}

function hide() {
	if (! state.ui.displaymode_visible) {
		return;
	}

	if (_cancel_updates) {
		_cancel_updates();
	}
	uiu.visible_qs('.displaymode_layout', false);
	$(uiu.qs('.settings_layout')).removeClass('settings_layout_displaymode');
	state.ui.displaymode_visible = false;
	settings.on_mode_change(state);
}

function ui_init() {
	uiu.on_click_qs('.settings_mode_display', function(e) {
		e.preventDefault();
		show();
	});
	uiu.on_click_qs('.settings_mode_umpire', function(e) {
		e.preventDefault();
		hide();
		settings.show();
	});
}


return {
	show: show,
	hide: hide,
	ui_init: ui_init,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var autosize = require('./autosize');
	var calc = require('./calc');
	var control = require('./control');
	var network = require('./network');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = displaymode;
}
/*/@DEV*/
