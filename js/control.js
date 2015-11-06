var control = (function() {
'use strict';

function demo_match_start() {
	var setup = {
		counting: '3x21',
		is_doubles: true,
		teams: [{
			name: '1.BC Beuel',
			players: [{
				name: 'Max Weißkirchen',
			}, {
				name: 'Birgit Michels',
			}],
		}, {
			name: '1.BC Sbr.-Bischmisheim',
			players: [{
				name: 'Michael Fuchs',
			}, {
				name: 'Samantha Barning',
			}],
		}],
		match_name: 'GD',
		event_name: 'BCB - BCB (Demo)',
		tournament_name: 'Demo',
		team_competition: true,
	};

	settings.hide(true);
	start_match(state, setup);
}

function set_current(s) {
	var hval = window.location.hash;
	hval = hval.replace(/[#&]g=[^&]*/, '');
	if (!hval.match(/^#/)) {
		hval = '#' + hval;
	}
	if (hval.length > 1) {
		hval += '&';
	}
	hval += 'g=' + encodeURIComponent(s.metadata.id);

	window.location.hash = hval;
}

function resume_match(s) {
	calc.init_state(s, null, s.presses, true);
	calc.state(s);
	s.settings = state.settings;
	state = s;
	set_current();
	render.ui_render(s);
	// Do not explicitly send anything to the network - we're just looking
}

function start_match(s, setup, init_presses) {
	calc.init_state(s, setup, init_presses);
	calc.state(s);
	set_current(s);
	render.ui_render(s);
	network.send_press(s, {
		type: '_start_match',
	});
}

function on_press(press, s) {
	if (s === undefined) {
		s = state;
	}

	press.timestamp = Date.now();
	s.presses.push(press);

	on_presses_change(s);
	network.send_press(s, press);
}

function on_presses_change(s) {
	calc.state(s);
	if (s.match.finish_confirmed) {
		if (! s.settings.save_finished_matches) {
			match_storage.remove(s.metadata.id);
		}
		s.metadata = {};
		s.initialized = false;
		settings.show();
	} else {
		match_storage.store(s);
		render.ui_render(s);
	}
}

function init_buttons() {
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
			type: 'love-all',
		});
	});
	$('#postgame-confirm').on('click', function() {
		on_press({
			type: 'postgame-confirm',
		});
	});
	$('#postmatch-confirm').on('click', function() {
		on_press({
			type: 'postmatch-confirm',
		});
	});
	$('#left_score').on('click', function() {
		on_press({
			type: 'score',
			side: 'left',
		});
	});
	$('#right_score').on('click', function() {
		on_press({
			type: 'score',
			side: 'right',
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
		settings.show();
	});
	$('#button_exception').on('click', function() {
		ui_show_exception_dialog();
	});
	$('.exception_dialog>.cancel-button').on('click', function() {
		hide_exception_dialog();
	});
	$('#exception_referee').on('click', function() {
		on_press({
			type: 'referee',
		});
		hide_exception_dialog();
	});
	$('#exception_interruption').on('click', function() {
		on_press({
			type: 'interruption',
		});
		hide_exception_dialog();
	});
	$('#exception_correction').on('click', function() {
		hide_exception_dialog();
		uiu.make_team_pick(
			state, 'Vertauschung Aufschlagfeld', 'correction', ui_show_exception_dialog
		);
	});
	$('#exception_overrule').on('click', function() {
		on_press({
			'type': 'overrule',
		});
		hide_exception_dialog();
	});
	$('#button_shuttle').on('click', function() {
		on_press({
			'type': 'shuttle',
		});
	});
	$('#exception_yellow').on('click', function() {
		hide_exception_dialog();
		uiu.make_player_pick(
			state, 'Verwarnung (Gelbe Karte)', 'yellow-card', ui_show_exception_dialog,
			function(btn, team_id) {
				if (state.match.carded[team_id]) {
					btn.prepend('<span class="yellow-card-image"></span>');
					btn.attr('disabled', 'disabled');
				}
			}
		);
	});
	$('#exception_red').on('click', function() {
		hide_exception_dialog();
		uiu.make_player_pick(state, 'Fehlerwarnung (rote Karte)', 'red-card', ui_show_exception_dialog);
	});
	$('#exception_injury').on('click', function() {
		hide_exception_dialog();
		uiu.make_player_pick(state, 'Verletzung', 'injury', ui_show_exception_dialog);
	});
	$('#exception_retired').on('click', function() {
		hide_exception_dialog();
		uiu.make_player_pick(state, 'Aufgegeben', 'retired', ui_show_exception_dialog);
	});
	$('#exception_black').on('click', function() {
		hide_exception_dialog();
		uiu.make_player_pick(state, 'Disqualifiziert (schwarze Karte)', 'disqualified', ui_show_exception_dialog);
	});
}

function init_shortcuts() {
	Mousetrap.bind('x', function() {
		if (state.initialized) {
			ui_show_exception_dialog();
		}
	});
	Mousetrap.bind('s', function() {
		if (state.initialized) {
			settings.show();
		}
	});
	Mousetrap.bind('e', function() {
		if (state.initialized) {
			editmode.enter();
		}
	});
	Mousetrap.bind('shift+s', function() {
		scoresheet.ui_show();
	});
}

function onhashchange() {
	
}

function ui_init() {
	init_buttons();
	init_shortcuts();
	window.addEventListener('hashchange', onhashchange, false);
}

function ui_show_exception_dialog() {
	$('#exception_wrapper').show();
	uiu.esc_stack_push(function() {
		hide_exception_dialog();
	});
}

function hide_exception_dialog() {
	uiu.esc_stack_pop();
	$('#exception_wrapper').hide();
}


return {
	on_press: on_press,
	on_presses_change: on_presses_change,
	demo_match_start: demo_match_start,
	start_match: start_match,
	resume_match: resume_match,
	ui_init: ui_init,
	hide_exception_dialog: hide_exception_dialog,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var uiu = require('./uiu');
	var network = require('./network');
	var render = require('./render');
	var calc = require('./calc');
	var match_storage = require('./match_storage');
	var editmode = require('./editmode');

	module.exports = control;
}
/*/@DEV*/
