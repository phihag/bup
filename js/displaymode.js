var displaymode = (function() {
'use strict';

var autosize_cancels = [];

function _setup_autosize(el, right_el) {
	autosize.maintain(el, function() {
		return {
			width: right_el.offsetLeft - el.offsetLeft,
			height: right_el.offsetHeight,
		};
	});
}

function update(err, s, event) {
	autosize_cancels.forEach(function(ac) {
		ac();
	});
	autosize_cancels = [];

	var container = uiu.qs('.displaymode_layout');
	uiu.empty(container);

	if (err && (err.errtype === 'loading')) {
		// TODO show loading animation
	}

	if (err) {
		// TODO handle errors
		console.error(err); // eslint-disable-line no-console
		return;
	}

	s.event = event;

	if (event.courts) {
		var courts_container = uiu.create_el(container, 'div', {
			'class': 'display_courts_container',
		});
		var court_count = event.courts.length;
		for (var court_idx = 0;court_idx < court_count;court_idx++) {
			if (court_idx > 0) {
				uiu.create_el(courts_container, 'div', {
					'class': 'display_courts_separator',
				});
			}

			var court_container = uiu.create_el(courts_container, 'div', {
				'class': 'display_courts_court',
				'style': ('width: ' + (100.0 / court_count - 4) + 'vw;'),
			});

			var court = event.courts[court_idx];
			var match = court.match_id ? utils.find(event.matches, function(m) {
				return court.match_id === m.setup.match_id;
			}) : null;

			var match_setup = match.setup;
			var nscore = match.network_score;
			var current_score = (nscore.length > 0) ? nscore[nscore.length - 1] : ['', ''];
			var prev_scores = nscore.slice(0, -1);
prev_scores = [[11, 5], [13, 11], [14, 15], [8, 11]];
			var home_team = match_setup.teams[0];
home_team.name = 'TSV Neuhausen-Nymphenburg 1'; // DEBUG
			var home_team_container = uiu.create_el(court_container, 'div', {
				'class': 'display_courts_team_container',
			});
			var player_container = uiu.create_el(home_team_container, 'div', {
				'class': (match_setup.is_doubles ? 'display_courts_player_names_doubles' : 'display_courts_player_names_singles'),
			});
			for (var player_id = 0;player_id < home_team.players.length;player_id++) {
				uiu.create_el(player_container, 'div', {
					'class': 'display_courts_player_name',
				}, home_team.players[player_id].name);
			}
			var home_team_el = uiu.create_el(home_team_container, 'div', {
				'class': 'display_courts_team_name',
			});
			var home_team_span = uiu.create_el(home_team_el, 'span', {}, home_team.name);
			uiu.create_el(player_container, 'div', {
				'class': 'display_courts_current_score',
			}, current_score[0]);
			var home_prev_scores_container = uiu.create_el(player_container, 'div', {
				'class': 'display_courts_prev_scores_home',
			});
			prev_scores.forEach(function(ps) {
				uiu.create_el(home_prev_scores_container, 'div', {
					'class': ((ps[0] > ps[1]) ? 'display_courts_prev_score_won' : 'display_courts_prev_score_lost'),
				}, ps[0]);
			});

			var divider_line = uiu.create_el(court_container, 'div', {
				'class': 'display_courts_divider_line_container',
			});
			uiu.create_el(divider_line, 'div', {
				'class': 'display_courts_divider_line1',
			});
			uiu.create_el(divider_line, 'div', {
				'class': 'display_courts_match_name',
			}, match ? match.setup.match_name : '');
			uiu.create_el(divider_line, 'div', {
				'class': 'display_courts_divider_line2',
			});

			var away_team = match_setup.teams[1];
			var away_team_container = uiu.create_el(court_container, 'div', {
				'class': 'display_courts_team_container',
			});
			var away_team_el = uiu.create_el(away_team_container, 'div', {
				'class': 'display_courts_team_name',
			});
			var away_team_span = uiu.create_el(away_team_el, 'span', {}, away_team.name);

			player_container = uiu.create_el(away_team_container, 'div', {
				'class': (match_setup.is_doubles ? 'display_courts_player_names_doubles' : 'display_courts_player_names_singles'),
			});
			for (player_id = 0;player_id < away_team.players.length;player_id++) {
				uiu.create_el(player_container, 'div', {
					'class': 'display_courts_player_name',
				}, away_team.players[player_id].name);
			}
			uiu.create_el(player_container, 'div', {
				'class': 'display_courts_current_score',
			}, current_score[1]);
			var away_prev_scores_container = uiu.create_el(player_container, 'div', {
				'class': 'display_courts_prev_scores_away',
			});
			prev_scores.forEach(function(ps) {
				uiu.create_el(away_prev_scores_container, 'div', {
					'class': ((ps[1] > ps[0]) ? 'display_courts_prev_score_won' : 'display_courts_prev_score_lost'),
				}, ps[1]);
			});

			_setup_autosize(home_team_span, home_prev_scores_container);
			_setup_autosize(away_team_span, away_prev_scores_container);


			// TODO handle empty court
			// TODO current score
			// TODO previous score
			// TODO fatten winning score
		}
	}

	uiu.create_el(container, 'div', {
		'class': 'display_list_container',
	});
	// TODO team names
	// TODO match table
	// TODO score
	// TODO fatten winners
}

var _cancel_updates = null;
function show() {
	if (state.ui.displaymode_visible) {
		return;
	}

	state.ui.displaymode_visible = true;
	render.hide();
	settings.on_mode_change(state);
	settings.show_displaymode();

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
	var control = require('./control');
	var network = require('./network');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = displaymode;
}
/*/@DEV*/
