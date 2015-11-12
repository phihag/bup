var editmode = (function() {
'use strict';

var last_click = 0;

function enter() {
	$('.editmode_leave,.editmode_arrow,.editmode_change-ends,.editmode_switch_left,.editmode_switch_right').show();
	$('.editmode_ok').attr('disabled', 'disabled');
	$('.editmode_button').text('Manuelles Bearbeiten abbrechen');
	$('#score td.score span').hide();
	$('#game').addClass('editmode');
	render(state);
}

function leave() {
	$('#game').removeClass('editmode');
	$('.editmode_leave,.editmode_arrow,.editmode_change-ends,.editmode_switch_left,.editmode_switch_right').hide();
	$('.editmode_button').text('Manuell bearbeiten');
	hide_inputs(0);
	$('#score td.score span').show();
}

function ui_init() {
	$('.editmode_button').on('click', function() {
		if ($('#game').hasClass('editmode')) {
			leave();
		} else {
			enter();
		}
		settings.hide();
	});
	$('#court').on('click', function(e) {
		if (e.target.tagName.toLowerCase() == 'button') {
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

	utils.on_click($('.editmode_leave'), function() {
		leave();
	});
	utils.on_click($('.editmode_change-ends'), function() {
		control.on_press({
			type: 'editmode_change-ends',
		});
	});
	utils.on_click($('.editmode_switch_left'), function() {
		control.on_press({
			type: 'editmode_switch-sides',
			side: 'left',
		});
	});
	utils.on_click($('.editmode_switch_right'), function() {
		control.on_press({
			type: 'editmode_switch-sides',
			side: 'right',
		});
	});
	utils.on_click($('.editmode_arrow'), function() {
		control.on_press({
			type: 'editmode_change-serve',
		});
	});
}

function hide_inputs(since_game) {
	utils.qsEach('.editmode_score', function(n) {
		$(n).removeClass('editmode_invalid');
		var game_index = parseInt(n.getAttribute('data-game-index'), 10);
		utils.visible(n, game_index < since_game);
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

		var winner = calc.game_winner(left_val, right_val);
		res.push({
			winner: winner,
			left: left_val,
			right: right_val,
		});

		if ((winner == 'invalid') || (winner == 'inprogress')) {
			return res;
		}

		var match_winner = calc.match_winner(res);
		if (match_winner != 'inprogress') {
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

function render(s) {
	var editmode_active = $('#game').hasClass('editmode');
	if (!editmode_active) {
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
}

return {
	enter: enter,
	leave: leave,
	ui_init: ui_init,
	change_score: change_score,
	render: render,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var utils = require('./utils');
	var calc = require('./calc');
	var control = require('./control');
	var settings = require('./settings');

	module.exports = editmode;
}
/*/@DEV*/