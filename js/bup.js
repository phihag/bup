var state = {
	initialized: false,
};
var networks = {};

(function() {
'use strict';

function init() {
	state.settings = settings.load();
}

function ui_init() {
	var bup_version = 'dev';
	$('#version').text(bup_version);

	$('#script_jspdf').on('load', scoresheet.jspdf_loaded);
	editmode.ui_init();
	$('.backtogame_button').on('click', function() {
		settings.hide();
	});

	scoresheet.ui_init();
	network.ui_init();

	$('#setup_manual_form [name="gametype"]').on('change', function() {
		var new_type = $('#setup_manual_form [name="gametype"]:checked').val();
		var is_doubles = new_type == 'doubles';
		$('#setup_manual_form .only-doubles').toggle(is_doubles);

		$('.setup_players_manual [data-doubles-rowspan]').each(function(_, cell) {
			var $cell = $(cell);
			$cell.attr('rowspan', $cell.attr(is_doubles ? 'data-doubles-rowspan' : 'data-singles-rowspan'));
		});
	});

	$('.settings_layout').on('click', function(e) {
		if (e.target != this) {
			return;
		}
		settings.hide();
	});
	$('#exception_wrapper').on('click', function(e) {
		if (e.target != this) {
			return;
		}
		control.hide_exception_dialog();
	});

	$('#setup_manual_form').on('submit', function(e) {
		e.preventDefault();

		function _player_formval(input_name, def) {
			return {
				name: _formval(input_name, def),
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
			counting: '3x21',
		};

		setup.team_competition = $('#setup_manual_form [name="team_competition"]').prop('checked');
		setup.match_name = _formval('match_name');
		setup.event_name = _formval('event_name');
		setup.tournament_name = _formval('tournament_name');

		if (setup.is_doubles &&
				!_formval('team1_player1') && !_formval('team1_player2') &&
				!_formval('team2_player1') && !_formval('team2_player2') &&
				!_formval('team1_name') && !_formval('team2_name') &&
				!setup.match_name &&
				!setup.event_name &&
				!setup.tournament_name) {
			// Demo mode
			return control.demo_match_start();
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

		settings.hide(true);
		control.start_match(state, setup);
	});

	control.init_buttons();
	control.init_shortcuts();

	settings.ui_init();
	var hash_query = utils.parse_query_string(window.location.hash.substr(1));
	if (hash_query.court) {
		// TODO make sure this is only for the current session, only overwrite settings when necessary
		state.settings.court_id = hash_query.court;
		if (state.settings.court_id == '1') {
			state.settings.court_description = 'links';
		} else if (state.settings.court_id == '2') {
			state.settings.court_description = 'rechts';
		}
		settings.update();
	}
	if (hash_query.courtspot !== undefined) {
		networks.courtspot = courtspot();
		networks.courtspot.ui_init(state);
	} else if (hash_query.btde !== undefined) {
		networks.btde = btde();
		networks.btde.ui_init(state);
	} else if (hash_query.demo !== undefined) {
		control.demo_match_start();
	} else {
		settings.show();
	}

	if (state.settings.go_fullscreen) {
		fullscreen.autostart();
	}
}

/*@DEV*/
if (typeof $ !== 'undefined') {
/*/@DEV*/
	init();
	$(ui_init);
/*@DEV*/
}
/*/@DEV*/

})();

/* @DEV */
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var utils = require('./utils');
	var calc = require('./calc');
	var editmode = require('./editmode');
	var fullscreen = require('./fullscreen');
	var scoresheet = require('./scoresheet');
	var network = require('./network');
	var btde = require('./btde');
	var courtspot = require('./courtspot');
	var settings = require('./settings');
	var pronounciation = require('./pronounciation');
	var control = require('./control');

	module.exports = {
		calc: calc,
		btde: btde,
		courtspot: courtspot,
		network: network,
		pronounciation: pronounciation,
		scoresheet: scoresheet,
		utils: utils,
	};
}
/*/@DEV*/
