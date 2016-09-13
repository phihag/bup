var control = (function() {
'use strict';

function demo_match_start(setup) {
	if (! setup) {
		setup = {
			counting: '3x21',
			team_competition: true,
		};
	}
	utils.obj_update(setup, {
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
	});

	settings.hide(true);
	start_match(state, setup);
}

function servedemo_match_start() {
	var setup = {
		counting: '3x21',
		team_competition: true,
		is_doubles: true,
		teams: [{
			name: state._('servedemo:team1'),
			players: [{
				name: state._('servedemo:player1.1'),
			}, {
				name: state._('servedemo:player1.2'),
			}],
		}, {
			name: state._('servedemo:team2'),
			players: [{
				name: state._('servedemo:player2.1'),
			}, {
				name: state._('servedemo:player2.2'),
			}],
		}],
		match_name: state._('servedemo:match_name'),
		event_name: state._('servedemo:event_name'),
		tournament_name: state._('servedemo:tournament_name'),
	};
	var presses = [{
		type: 'pick_side',
		team1_left: false,
	}, {
		type: 'pick_server',
		team_id: 0,
		player_id: 0,
	}, {
		type: 'pick_receiver',
		team_id: 1,
		player_id: 0,
	}, {
		type: 'love-all',
	}];

	settings.hide(true);
	start_match(state, setup, presses);
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
	s.initialized = false;
}

function leave_match(s) {
	stop_match(s);
	settings.show();
	set_current(s);
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

	var on_end = netstats.perf('perfp.calc');
	press.timestamp = Date.now();
	s.presses.push(press);
	if (s.settings && s.settings.umpire_name) {
		s.metadata.umpire_name = s.settings.umpire_name;
		s.metadata.service_judge_name = s.settings.service_judge_name;
	}

	calc.state(s);
	on_end();
	on_end = netstats.perf('perfp.store');
	match_storage.store(s);
	on_end();
	on_end = netstats.perf('perfp.render');
	render.ui_render(s); // TODO move this up?
	on_end();

	network.send_press(s, press);
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

function ui_init() {
	uiu.on_click_qs('#pick_side_team1', function() {
		on_press({
			type: 'pick_side',
			team1_left: true,
		});
	});
	uiu.on_click_qs('#pick_side_team2', function() {
		on_press({
			type: 'pick_side',
			team1_left: false,
		});
	});
	uiu.on_click_qs('#love-all', function() {
		on_press({
			type: 'love-all',
		});
	});
	uiu.on_click_qs('#postgame-confirm', function() {
		on_press({
			type: 'postgame-confirm',
		});
	});
	uiu.on_click_qs('#postinterval-confirm', function() {
		on_press({
			type: 'postinterval-confirm',
		});
	});
	uiu.on_click_qs('#postmatch-confirm', function() {
		if (! state.match.finish_confirmed) {
			on_press({
				type: 'postmatch-confirm',
			});
		}
		leave_match(state);
	});
	uiu.on_click_qs('#postmatch-leave', function() {
		leave_match(state);
	});
	uiu.on_click_qs('#left_score', function() {
		block_score_buttons();
		on_press({
			type: 'score',
			side: 'left',
		});
	});
	uiu.on_click_qs('#right_score', function() {
		block_score_buttons();
		on_press({
			type: 'score',
			side: 'right',
		});
	});
	uiu.on_click_qs('#button_undo', function() {
		on_press({
			type: 'undo',
		});
	});
	uiu.on_click_qs('#button_redo', function() {
		on_press({
			type: 'redo',
		});
	});

	uiu.on_click_qs('#button_settings', function() {
		settings.show();
	});
	uiu.on_click_qs('#button_exception', function() {
		ui_show_exception_dialog();
	});
	uiu.on_click_qs('.exception_dialog>.cancel-button', function() {
		hide_exception_dialog();
	});
	uiu.on_click_qs('#exception_referee', function() {
		on_press({
			type: 'referee',
		});
		hide_exception_dialog();
	});
	uiu.on_click_qs('#exception_suspension', function() {
		on_press({
			type: 'suspension',
		});
		hide_exception_dialog();
	});
	uiu.on_click_qs('#exception_correction', function() {
		hide_exception_dialog();
		bupui.make_team_pick(
			state, state._('exceptions:dialog:correction'), 'correction', ui_show_exception_dialog
		);
	});
	uiu.on_click_qs('#exception_overrule', function() {
		on_press({
			'type': 'overrule',
		});
		hide_exception_dialog();
	});
	uiu.on_click_qs('#button_shuttle', function() {
		on_press({
			'type': 'shuttle',
		});
	});
	uiu.on_click_qs('#suspension-resume', function() {
		on_press({
			'type': 'resume',
		});
	});

	uiu.on_click_qs('#exception_yellow', function() {
		hide_exception_dialog();
		bupui.make_player_pick(
			state, state._('exceptions:dialog:yellow-card'), 'yellow-card', ui_show_exception_dialog,
			function(btn, v) {
				var carded = calc.player_carded(state, v.team_id, v.player_id);
				if (carded) {
					btn.prepend('<span class="' + carded.type + '-image"></span>');
				}
				var team_carded = calc.team_carded(state, v.team_id);
				if (team_carded) {
					btn.attr('disabled', 'disabled');
				}
			}
		);
	});
	uiu.on_click_qs('#exception_red', function() {
		hide_exception_dialog();
		bupui.make_player_pick(
			state, state._('exceptions:dialog:red-card'), 'red-card', ui_show_exception_dialog,
			function(btn, v) {
				var carded = calc.player_carded(state, v.team_id, v.player_id);
				if (carded) {
					btn.prepend('<span class="' + carded.type + '-image"></span>');
				}
			}
		);

	});
	uiu.on_click_qs('#exception_black', function() {
		hide_exception_dialog();
		bupui.make_player_pick(
			state, state._('exceptions:dialog:black-card'), 'disqualified', ui_show_exception_dialog,
			function(btn, v) {
				var carded = calc.player_carded(state, v.team_id, v.player_id);
				if (carded) {
					btn.prepend('<span class="' + carded.type + '-image"></span>');
				}
			}
		);
	});

	uiu.on_click_qs('#exception_injury', function() {
		hide_exception_dialog();
		bupui.make_player_pick(state, state._('exceptions:dialog:injury'), 'injury', ui_show_exception_dialog);
	});
	uiu.on_click_qs('#exception_retired', function() {
		hide_exception_dialog();
		bupui.make_player_pick(state, state._('exceptions:dialog:retired'), 'retired', ui_show_exception_dialog);
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
	demo_match_start: demo_match_start,
	empty_match_start: empty_match_start,
	hide_exception_dialog: hide_exception_dialog,
	install_destructor: install_destructor,
	on_press: on_press,
	resume_match: resume_match,
	servedemo_match_start: servedemo_match_start,
	set_current: set_current,
	start_match: start_match,
	start_match_dialog: start_match_dialog,
	stop_match: stop_match,
	ui_init: ui_init,
	ui_show_exception_dialog: ui_show_exception_dialog,
	uninstall_destructor: uninstall_destructor,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var buphistory = require('./buphistory');
	var bupui = require('./bupui');
	var calc = require('./calc');
	var editmode = require('./editmode');
	var match_storage = require('./match_storage');
	var netstats = require('./netstats');
	var network = require('./network');
	var render = require('./render');
	var settings = require('./settings');
	var timer = require('./timer');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = control;
}
/*/@DEV*/
