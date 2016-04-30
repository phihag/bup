var displaymode = (function() {
'use strict';

function update(err, s, event) {
	var container = uiu.qs('.displaymode_layout');
	uiu.empty(container);

	if (err && (err.errtype === 'loading')) {
		// TODO show loading animation
	}

	if (err) {
		// TODO handle errors
		console.error(err);
		return;
	}

	s.event = event;

	if (event.courts) {
		var courts_container = uiu.create_el(container, 'div', {
			'class': 'display_courts_container',
		});
		var court_count = event.courts.length;
		for (var i = 0;i < court_count;i++) {
			if (i > 0) {
				var court_seperator = uiu.create_el(courts_container, 'div', {
					'class': 'display_courts_separator',
				});

			}

			var court_container = uiu.create_el(courts_container, 'div', {
				'class': 'display_courts_court',
				'style': ('width: ' + (100.0 / court_count - 2) + 'vw;'),
			});

			var court = event.courts[i];
			var match = court.match_id ? utils.find(event.matches, function(m) {
				return court.match_id === m.setup.match_id;
			}) : null;
			var match_setup = match.setup;

			var home_team = match_setup.teams[0];
			var player_container = uiu.create_el(court_container, 'div', {
				'class': (match_setup.is_doubles ? 'display_courts_player_names_doubles' : 'display_courts_player_names_singles'),
			});
			for (var player_id = 0;player_id < home_team.players.length;player_id++) {
				uiu.create_el(player_container, 'div', {
					'class': 'display_courts_player_name',
				}, home_team.players[player_id].name);
			}
			uiu.create_el(court_container, 'div', {
				'class': 'display_courts_team_name',
			}, home_team.name);

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
			uiu.create_el(court_container, 'div', {
				'class': 'display_courts_team_name',
			}, away_team.name);
			var player_container = uiu.create_el(court_container, 'div', {
				'class': (match_setup.is_doubles ? 'display_courts_player_names_doubles' : 'display_courts_player_names_singles'),
			});
			for (var player_id = 0;player_id < away_team.players.length;player_id++) {
				uiu.create_el(player_container, 'div', {
					'class': 'display_courts_player_name',
				}, away_team.players[player_id].name);
			}




			// TODO handle empty court
			// TODO player names
			// TODO current score
			// TODO previous score
			// TODO fatten winning score
		}
	}

	var list_container = uiu.create_el(container, 'div', {
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
	var control = require('./control');
	var network = require('./network');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');

	module.exports = displaymode;
}
/*/@DEV*/
