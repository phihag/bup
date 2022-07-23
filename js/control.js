'use strict';
var control = (function() {

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

function empty_match_start(counting) {
	var setup = {
		counting: counting,
		is_doubles: false,
		date: ' ',
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
		id: 'empty' + counting,
	});
}

function resume_match(s) {
	stop_match(state);
	state.setup = s.setup;
	state.metadata = s.metadata;
	calc.init_state(state, null, s.presses, true);
	calc.state(state);
	set_current(state);
	render.show();
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
	render.show();
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

function ask_leave_match(s) {
	if (!network.is_enabled()) {
		leave_match(s);
		return;
	}

	if (network.score_transmitted()) {
		leave_match(s);
		return;
	}

	// error state
	if (window.confirm(s._('network:leave match?'))) {
		leave_match(s);
	} else {
		if (s.presses && s.presses.length > 0) {
			var last_press = s.presses[s.presses.length - 1];
			network.send_press(s, last_press);
		}
	}
}

function leave_match(s) {
	stop_match(s);

	if (s.ui.referee_mode) {
		refmode_referee_ui.back_to_ui();
	} else {
		// Umpire mode

		settings.clear_manual();
		settings.show();
	}
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

	var se = s.settings;
	if (se && se.court_id != 'referee') {
		if (se.umpire_name && (se.umpire_name !== s.match.umpire_name)) {
			press.umpire_name = se.umpire_name;
		}
		if (se.service_judge_name && (se.service_judge_name !== s.match.service_judge_name)) {
			press.service_judge_name = se.service_judge_name;
		}
		if (se.court_id && (se.court_id !== s.match.court_id)) {
			press.court_id = se.court_id;
		}
	}

	var on_end = netstats.perf('perfp.calc');
	press.timestamp = (
		(state.ui && state.ui.faketime_enabled && state.ui.faketime_val) ?
		state.ui.faketime_val :
		Date.now()
	);
	s.presses.push(press);

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

var _block_buttons_active = false;
function block_buttons() {
	_block_buttons_active = true;
	block_buttons_update();
	window.setTimeout(function() {
		_block_buttons_active = false;
		uiu.qsEach('.blocking_button', function(btn) {
			btn.removeAttribute('data-block-disabled');
			if (! btn.getAttribute('data-render-disabled')) {
				btn.removeAttribute('disabled');
			}
		});
	}, state.settings.button_block_timeout);
}

function block_buttons_update() {
	if (!_block_buttons_active) return;

	uiu.qsEach('.blocking_button', function(btn) {
		uiu.attr(btn, {
			'data-block-disabled': 'disabled',
			disabled: 'disabled',
		});
	});
}

function ui_init() {
	click.qs('#pick_side_team1', function() {
		block_buttons();
		on_press({
			type: 'pick_side',
			team1_left: false,
		});
	});
	click.qs('#pick_side_team2', function() {
		block_buttons();
		on_press({
			type: 'pick_side',
			team1_left: true,
		});
	});
	click.qs('#love-all', function() {
		on_press({
			type: 'love-all',
		});
	});
	click.qs('#postgame-confirm', function() {
		block_buttons();
		on_press({
			type: 'postgame-confirm',
		});
	});
	click.qs('#postinterval-confirm', function() {
		on_press({
			type: 'postinterval-confirm',
		});
	});
	click.qs('#postmatch-confirm', function() {
		if (! state.match.finish_confirmed) {
			on_press({
				type: 'postmatch-confirm',
			});
		}
		ask_leave_match(state);
	});
	click.qs('#postmatch-leave', function() {
		ask_leave_match(state);
	});
	click.qs('#left_score', function() {
		block_buttons();
		on_press({
			type: 'score',
			side: 'left',
		});
	});
	click.qs('#right_score', function() {
		block_buttons();
		on_press({
			type: 'score',
			side: 'right',
		});
	});
	click.qs('#button_undo', function() {
		on_press({
			type: 'undo',
		});
	});
	click.qs('#button_redo', function() {
		on_press({
			type: 'redo',
		});
	});

	click.qs('#button_settings', function() {
		settings.show();
	});
	click.qs('#button_exception', function() {
		ui_show_exception_dialog();
	});
	click.qs('.exception_dialog>.cancel-button', function() {
		hide_exception_dialog();
	});
	click.qs('#exception_referee', function() {
		on_press({
			type: 'referee',
		});
		hide_exception_dialog();
	});
	click.qs('#exception_suspension', function() {
		on_press({
			type: 'suspension',
		});
		hide_exception_dialog();
	});
	click.qs('#exception_correction', function() {
		hide_exception_dialog();
		bupui.make_team_pick(
			state, state._('exceptions:dialog:correction'), 'correction', ui_show_exception_dialog
		);
	});
	click.qs('#exception_overrule', function() {
		on_press({
			'type': 'overrule',
		});
		hide_exception_dialog();
	});
	click.qs('#button_shuttle', function() {
		on_press({
			'type': 'shuttle',
		});
	});
	click.qs('#suspension-resume', function() {
		on_press({
			'type': 'resume',
		});
	});

	var _mark_carded = function(btn, v) {
		var carded = calc.player_carded(state, v.team_id, v.player_id);
		if (carded) {
			var img = uiu.el(null, 'span', carded.type + '-image');
			btn.insertBefore(img, btn.firstChild);
		}
	};

	click.qs('#exception_yellow', function() {
		hide_exception_dialog();
		bupui.make_player_pick(
			state, state._('exceptions:dialog:yellow-card'), 'yellow-card', ui_show_exception_dialog,
			function(btn, v) {
				_mark_carded(btn, v);
				var team_carded = calc.team_carded(state, v.team_id);
				if (team_carded) {
					btn.setAttribute('disabled', 'disabled');
				}
			}
		);
	});
	click.qs('#exception_red', function() {
		hide_exception_dialog();
		bupui.make_player_pick(
			state, state._('exceptions:dialog:red-card'), 'red-card',
			ui_show_exception_dialog, _mark_carded
		);

	});
	click.qs('#exception_black', function() {
		hide_exception_dialog();
		bupui.make_player_pick(
			state, state._('exceptions:dialog:black-card'), 'disqualified',
			ui_show_exception_dialog, _mark_carded
		);
	});

	click.qs('#exception_injury', function() {
		hide_exception_dialog();
		bupui.make_player_pick(state, state._('exceptions:dialog:injury'), 'injury', ui_show_exception_dialog);
	});
	click.qs('#exception_retired', function() {
		hide_exception_dialog();
		bupui.make_player_pick(state, state._('exceptions:dialog:retired'), 'retired', ui_show_exception_dialog);
	});
	click.qs('#exception_walkover', function() {
		hide_exception_dialog();
		bupui.make_team_pick(
			state, state._('exceptions:dialog:walkover'), 'walkover', ui_show_exception_dialog);
	});

}

function set_current(s) {
	buphistory.record(s);

	var title = '';
	if (s.initialized && (settings.get_mode(s) === 'umpire')) {
		if (s.setup.match_name) {
			title += s.setup.match_name + ' - ';
		}
		if (!s.setup.incomplete) {
			if (s.setup.is_doubles) {
				title += s.setup.teams[0].players[0].name + ' / ' + s.setup.teams[0].players[1].name + ' vs ' + s.setup.teams[1].players[0].name + ' / ' + s.setup.teams[1].players[1].name;
			} else {
				title += s.setup.teams[0].players[0].name + ' vs ' + s.setup.teams[1].players[0].name;
			}
		}
		title += ' - ';
	}
	title += 'Badminton Umpire Panel';
	document.title = title;
}

function ui_show_exception_dialog() {
	install_destructor(state, hide_exception_dialog);
	render.exception_dialog(state);
	uiu.show_qs('#exception_wrapper');
	var players_present = calc.players_present(state);
	uiu.visible_qs('#exception_walkover_container', !players_present);
	uiu.visible_qs('#exception_overrule_container', players_present);

	bupui.esc_stack_push(function() {
		hide_exception_dialog();
	});
}

function hide_exception_dialog() {
	uninstall_destructor(state, hide_exception_dialog);
	bupui.esc_stack_pop();
	uiu.hide_qs('#exception_wrapper');
}


return {
	block_buttons: block_buttons,
	block_buttons_update: block_buttons_update,
	demo_match_start: demo_match_start,
	empty_match_start: empty_match_start,
	hide_exception_dialog: hide_exception_dialog,
	install_destructor: install_destructor,
	on_press: on_press,
	resume_match: resume_match,
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
	var click = require('./click');
	var editmode = require('./editmode');
	var match_storage = require('./match_storage');
	var netstats = require('./netstats');
	var network = require('./network');
	var refmode_referee_ui = null; // break cycle, should be require('./refmode_referee_ui');
	var render = require('./render');
	var settings = require('./settings');
	var timer = require('./timer');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = control;
}
/*/@DEV*/
