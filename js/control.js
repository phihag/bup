var control = (function() {
'use strict';

function demo_match_start() {
	var setup = {
		counting: '3x21',
		is_doubles: true,
		teams: [{
			name: state._('demo:team1'),
			players: [{
				name: state._('demo:player1.1'),
			}, {
				name: state._('demo:player1.2'),
			}],
		}, {
			name: state._('demo:team2'),
			players: [{
				name: state._('demo:player2.1'),
			}, {
				name: state._('demo:player2.2'),
			}],
		}],
		match_name: state._('demo:match_name'),
		event_name: state._('demo:event_name'),
		tournament_name: state._('demo:tournament_name'),
		team_competition: true,
	};

	settings.hide(true);
	start_match(state, setup);
}

function empty_match_start() {
	var setup = {
		counting: '3x21',
		is_doubles: false,
		teams: [{
			players: [{
				name: '',
			}],
		}, {
			players: [{
				name: '',
			}],
		}],
		team_competition: false,
	};

	settings.hide(true);
	start_match(state, setup, [], {
		id: 'empty',
	});
}

function resume_match(s) {
	stop_match(state);
	state.setup = s.setup;
	state.metadata = s.metadata;
	calc.init_state(state, null, s.presses, true);
	calc.state(state);
	set_current(state);
	render.ui_render(state);
	// Do not explicitly send anything to the network - we're just looking
}

// Start the match, but a dialog is still blocking the whole thing
function start_match_dialog(s, setup) {
	stop_match(state);
	calc.init_state(s, setup);
	calc.state(s);
	set_current(s);
	render.ui_render(s);
}

function start_match(s, setup, init_presses, metadata) {
	stop_match(state);
	if (metadata) {
		state.metadata = metadata;
	}
	calc.init_state(s, setup, init_presses, !!metadata);
	calc.state(s);
	set_current(s);
	render.ui_render(s);
	network.send_press(s, {
		type: '_start_match',
	});
}

// Prepare to show another match, close all dialogs etc. (do not destroy rest of the display)
function stop_match(s) {
	timer.remove(true);
	editmode.leave();
	if (s.destructors) {
		s.destructors.forEach(function(destructor) {
			destructor(s);
		});
		delete s.destructors;
	}
	delete s.presses;
	delete s.metadata;
	delete s.remote;
	delete s.match;
	delete s.game;
	delete s.court;
	s.initialized = false;
}

function install_destructor(s, destructor) {
	if (! s.destructors) {
		s.destructors = [];
	}
	s.destructors.push(destructor);
}

function uninstall_destructor(s, destructor) {
	if (! s.destructors) {
		// Already fired
		return;
	}
	for (var i = s.destructors.length - 1;i >= 0;i--) {
		if (s.destructors[i] === destructor) {
			s.destructors.splice(i, 1);
		}
	}
}


function on_press(press, s) {
	if (s === undefined) {
		s = state;
	}

	press.timestamp = Date.now();
	s.presses.push(press);
	if (s.settings && s.settings.umpire_name) {
		s.metadata.umpire_name = s.settings.umpire_name;
		s.metadata.service_judge_name = s.settings.service_judge_name;
	}

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
		set_current(s);
	} else {
		match_storage.store(s);
		render.ui_render(s);
	}
}

function block_score_buttons() {
	$('#right_score,#left_score').attr({
		'data-block-disabled': 'disabled',
		'disabled': 'disabled',
	});
	window.setTimeout(function() {
		var buttons = $('#right_score,#left_score');
		buttons.removeAttr('data-block-disabled');
		if (! buttons.attr('data-render-disabled')) {
			buttons.removeAttr('disabled');
		}
	}, state.settings.button_block_timeout);
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
		block_score_buttons();
		on_press({
			type: 'score',
			side: 'left',
		});
	});
	$('#right_score').on('click', function() {
		block_score_buttons();
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
	$('#exception_suspension').on('click', function() {
		on_press({
			type: 'suspension',
		});
		hide_exception_dialog();
	});
	$('#exception_correction').on('click', function() {
		hide_exception_dialog();
		uiu.make_team_pick(
			state, state._('exceptions:dialog:correction'), 'correction', ui_show_exception_dialog
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
	$('#suspension-resume').on('click', function() {
		on_press({
			'type': 'resume',
		});
	});
	$('#exception_yellow').on('click', function() {
		hide_exception_dialog();
		uiu.make_player_pick(
			state, state._('exceptions:dialog:yellow-card'), 'yellow-card', ui_show_exception_dialog,
			function(btn, v) {
				if (state.match.carded[v.team_id]) {
					btn.prepend('<span class="yellow-card-image"></span>');
					btn.attr('disabled', 'disabled');
				}
			}
		);
	});
	$('#exception_red').on('click', function() {
		hide_exception_dialog();
		uiu.make_player_pick(state, state._('exceptions:dialog:red-card'), 'red-card', ui_show_exception_dialog);
	});
	$('#exception_injury').on('click', function() {
		hide_exception_dialog();
		uiu.make_player_pick(state, state._('exceptions:dialog:injury'), 'injury', ui_show_exception_dialog);
	});
	$('#exception_retired').on('click', function() {
		hide_exception_dialog();
		uiu.make_player_pick(state, state._('exceptions:dialog:retired'), 'retired', ui_show_exception_dialog);
	});
	$('#exception_black').on('click', function() {
		hide_exception_dialog();
		uiu.make_player_pick(state, state._('exceptions:dialog:black-card'), 'disqualified', ui_show_exception_dialog);
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
	Mousetrap.bind('a', function() {
		if (state.initialized) {
			stats.show();
		}
	});
	Mousetrap.bind('e', function() {
		if (state.initialized) {
			editmode.enter();
		}
	});
	Mousetrap.bind('a', function() {
		state.settings.show_pronounciation = ! state.settings.show_pronounciation;
		if (state.initialized) {
			render.ui_render(state);
		}
		settings.store(state);
	});
	Mousetrap.bind('shift+s', function() {
		scoresheet.show();
	});
	Mousetrap.bind('shift+e', function() {
		i18n.ui_update_state(state, 'en');
	});
	Mousetrap.bind('shift+d', function() {
		i18n.ui_update_state(state, 'de');
	});
}

function set_current(s) {
	buphistory.record(s);

	var title = '';
	if (s.initialized) {
		if (s.setup.match_name) {
			title += s.setup.match_name + ' - ';
		}
		if (s.setup.is_doubles) {
			title += s.setup.teams[0].players[0].name + ' / ' + s.setup.teams[0].players[1].name + ' vs ' + s.setup.teams[1].players[0].name + ' / ' + s.setup.teams[1].players[1].name;
		} else {
			title += s.setup.teams[0].players[0].name + ' vs ' + s.setup.teams[1].players[0].name;
		}
		title += ' - ';
	}
	title += 'Badminton Umpire Panel';
	document.title = title;
}

function ui_init() {
	init_buttons();
	init_shortcuts();
}

function ui_show_exception_dialog() {
	install_destructor(state, hide_exception_dialog);
	render.exception_dialog(state);
	$('#exception_wrapper').show();
	uiu.esc_stack_push(function() {
		hide_exception_dialog();
	});
}

function hide_exception_dialog() {
	uninstall_destructor(state, hide_exception_dialog);
	uiu.esc_stack_pop();
	$('#exception_wrapper').hide();
}


return {
	on_press: on_press,
	on_presses_change: on_presses_change,
	demo_match_start: demo_match_start,
	empty_match_start: empty_match_start,
	start_match: start_match,
	start_match_dialog: start_match_dialog,
	resume_match: resume_match,
	ui_init: ui_init,
	hide_exception_dialog: hide_exception_dialog,
	stop_match: stop_match,
	install_destructor: install_destructor,
	uninstall_destructor: uninstall_destructor,
	set_current: set_current,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var i18n = require('./i18n');
	var uiu = require('./uiu');
	var network = require('./network');
	var render = require('./render');
	var calc = require('./calc');
	var match_storage = require('./match_storage');
	var editmode = require('./editmode');
	var timer = require('./timer');
	var buphistory = require('./buphistory');
	var stats = require('./stats');

	module.exports = control;
}
/*/@DEV*/
