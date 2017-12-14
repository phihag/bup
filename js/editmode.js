'use strict';
var editmode = (function() {

var last_click = 0;

function ui_visible(val) {
	var main_cui = render.main_court_ui();
	for (var k in main_cui) {
		if (/^editmode_/.test(k)) {
			uiu.$visible(main_cui[k], !!val);
		}
	}
}

function enter() {
	ui_visible(true);
	state.ui.editmode_active = true;

	var k = /*i18n-term:*/'settings:Abort Manual Edit';
	var toggle_button = uiu.qs('.go_editmode_button');
	uiu.text(toggle_button, state._(k));
	toggle_button.setAttribute('data-i18n', k);

	uiu.$visible_qsa('#score td.score span', false);
	uiu.addClass_qs('#game', 'editmode');
	update_ui(state);
}

function leave() {
	uiu.removeClass_qs('#game', 'editmode');
	ui_visible(false);
	state.ui.editmode_active = false;

	var k = 'settings:Edit Manually';
	var toggle_button = uiu.qs('.go_editmode_button');
	uiu.text(toggle_button, state._(k));
	toggle_button.setAttribute('data-i18n', k);

	hide_inputs(0);
	uiu.$visible_qsa('#score td.score span', true);
}

function ui_init() {
	click.qs('.go_editmode_button', function() {
		if (state.ui.editmode_active) {
			leave();
		} else {
			enter();
		}
		settings.hide();
	});
	uiu.qs('#court').addEventListener('click', function(e) {
		if ((e.target.tagName.toLowerCase() == 'button') || (e.target.parentNode.tagName.toLowerCase() == 'button')) {
			return;
		}

		if (! state.settings.editmode_doubleclick) {
			return;
		}

		var now = Date.now();
		if (now - last_click < state.settings.double_click_timeout) {
			last_click = 0;
			enter();
		} else {
			last_click = now;
		}
		return true;
	});

	var main_cui = render.main_court_ui();
	click.on(main_cui.editmode_leave, function() {
		leave();
	});
	click.on(main_cui.editmode_change_ends, function() {
		control.on_press({
			type: 'editmode_change-ends',
		});
	});
	click.on(main_cui.editmode_switch_left, function() {
		control.on_press({
			type: 'editmode_switch-sides',
			side: 'left',
		});
	});
	click.on(main_cui.editmode_switch_right, function() {
		control.on_press({
			type: 'editmode_switch-sides',
			side: 'right',
		});
	});
	click.on(main_cui.editmode_arrow, function() {
		control.on_press({
			type: 'editmode_change-serve',
		});
	});
}

function hide_inputs(since_game) {
	uiu.qsEach('.editmode_score', function(n) {
		uiu.removeClass(n, 'editmode_invalid');
		var game_index = parseInt(n.getAttribute('data-game-index'), 10);
		uiu.$visible(n, game_index < since_game);
	});
}

function read_input() {
	var res = [];
	for (var game_index = 0;game_index < state.match.max_games;game_index++) {
		var left_str = $('.editmode_score[data-game-index="' + game_index + '"][data-team-side="left"]').val();
		var left_val = parseInt(left_str, 10);
		if (isNaN(left_val)) {
			left_val = 0;
		}

		var right_str = $('.editmode_score[data-game-index="' + game_index + '"][data-team-side="right"]').val();
		var right_val = parseInt(right_str, 10);
		if (isNaN(right_val)) {
			right_val = 0;
		}

		var winner = calc.game_winner(state.setup.counting, game_index, left_val, right_val);
		res.push({
			winner: winner,
			left: left_val,
			right: right_val,
		});

		if ((winner == 'invalid') || (winner == 'inprogress')) {
			return res;
		}

		var mwinner = calc.match_winner(state.setup.counting, res);
		if (mwinner != 'inprogress') {
			return res;
		}
	}

	return res;
}

function change_score() {
	var input_scores = read_input();
	hide_inputs((state.game.team1_left === null) ? 0 : input_scores.length);
	if (input_scores[input_scores.length - 1].winner == 'invalid') {
		$('.editmode_score[data-game-index="' + (input_scores.length - 1) + '"]').addClass('editmode_invalid');
		return;
	}

	var finished_inputs = input_scores.slice(0, input_scores.length - 1);
	var is_changed = (finished_inputs.length != state.match.finished_games.length);
	if (! is_changed) {
		is_changed = finished_inputs.some(function(fi, game_index) {
			var input_score = calc.lr2score(state, fi);
			var fg = state.match.finished_games[game_index];
			return !utils.deep_equal(input_score, fg.score);
		});
	}
	if (is_changed) {
		control.on_press({
			type: 'editmode_set-finished_games',
			scores: finished_inputs,
			by_side: true,
		});
	}

	var game_input = input_scores[input_scores.length - 1];
	var new_score = calc.lr2score(state, game_input);
	if (! utils.deep_equal(new_score, state.game.score)) {
		control.on_press({
			type: 'editmode_set-score',
			score: game_input,
			by_side: true,
		});
	}
}

function update_ui(s) {
	if (!state.ui.editmode_active) {
		return;
	}

	hide_inputs((s.game.team1_left === null) ? 0 : (s.match.finished_games.length + 1));

	var left_active = false;
	var right_active = false;
	if (s.game.team1_left !== null) {
		var left_team = s.game.team1_left ? 0 : 1;
		left_active = s.game.teams_player1_even[left_team] !== null;
		right_active = s.game.teams_player1_even[1 - left_team] !== null;
	}

	var switch_left = $('.editmode_switch_left');
	if (! s.setup.is_doubles) {
		switch_left.hide();
	} else if (left_active) {
		switch_left.removeAttr('disabled');
	} else {
		switch_left.attr('disabled', 'disabled');
	}

	var switch_right = $('.editmode_switch_right');
	if (! s.setup.is_doubles) {
		switch_right.hide();
	} else if (right_active) {
		switch_right.removeAttr('disabled');
	} else {
		switch_right.attr('disabled', 'disabled');
	}

	var switch_sides = $('.editmode_change-ends');
	if (s.game.team1_left === null) {
		switch_sides.attr('disabled', 'disabled');
	} else {
		switch_sides.removeAttr('disabled');
	}

	var switch_serve = $('.editmode_arrow');
	if ((s.game.team1_left === null) || (s.game.finished)) {
		switch_serve.attr('disabled', 'disabled');
	} else {
		switch_serve.removeAttr('disabled');
	}
}

function faketime_calc(s, input) {
	var ts = Date.parse(input.value);
	if (ts) {
		s.ui.faketime_val = ts;
	}
}

function make_fix_time_ui(container) {
	var div = uiu.el(container, 'div', 'editmode_fix_time_container');

	var cb_label = uiu.el(div, 'label');
	var attrs = {
		type: 'checkbox',
	};
	if (state.ui && state.ui.editmode_fixed_time) {
		attrs.checked = 'checked';
	}
	var cb = uiu.el(cb_label, 'input', attrs);
	uiu.el(cb_label, 'span', {
		'data-i18n': 'editmode:fix_time',
	}, state._('editmode:fix_time'));
	var d = new Date();
	var input = uiu.el(div, 'input', {
		pattern: '[0-9]{4}-?[0-9]{1,2}-?[0-9]{1,2}[ T_][0-9]{1,2}:[0-9]{1,2}(?::[0-9]{1,2})?',
		value: (
			d.getFullYear() +
			'-' + utils.pad(d.getMonth() + 1) +
			'-' + utils.pad(d.getDate()) +
			' ' + utils.pad(d.getHours()) +
			':' + utils.pad(d.getMinutes()) +
			':' + utils.pad(d.getSeconds())
		),
	});

	cb.addEventListener('change', function() {
		state.ui.faketime_enabled = cb.checked;
		faketime_calc(state, input);
	});
	input.addEventListener('input', function() {
		faketime_calc(state, input);
	});

	return div;
}

return {
	enter: enter,
	leave: leave,
	ui_init: ui_init,
	change_score: change_score,
	update_ui: update_ui,
	make_fix_time_ui: make_fix_time_ui,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var click = require('./click');
	var control = require('./control');
	var render = require('./render');
	var settings = require('./settings');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = editmode;
}
/*/@DEV*/