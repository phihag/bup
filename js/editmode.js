var editmode = (function() {

var last_click = 0;

function enter() {
	$('.editmode_leave,.editmode_arrow,.editmode_change-ends,.editmode_switch_left,.editmode_switch_right').show();
	$('.editmode_ok').attr('disabled', 'disabled');
	$('.editmode_button').text('Manuelles Bearbeiten abbrechen');
	$('#score td.score input').show();
	$('#score td.score span').hide();
	$('#game').addClass('editmode');
}

function leave() {
	$('#game').removeClass('editmode');
	$('.editmode_leave,.editmode_arrow,.editmode_change-ends,.editmode_switch_left,.editmode_switch_right').hide();
	$('.editmode_button').text('Manuell bearbeiten');
	$('#score td.score input').hide();
	$('#score td.score span').show();
}

function ui_init() {
	$('.editmode_button').on('click', function() {
		if ($('#game').hasClass('editmode')) {
			leave();
		} else {
			enter();
		}
		hide_settings();
	});
	$('#court').on('click', function(e) {
		if (e.target.tagName.toLowerCase() == 'button') {
			return;
		}

		var now = Date.now();
		if (now - last_click < DOUBLE_CLICK_TIMEOUT) {
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
		on_press({
			type: 'editmode_change-ends',
		});
	});
	utils.on_click($('.editmode_switch_left'), function() {
		on_press({
			type: 'editmode_switch-sides',
			side: 'left',
		});
	});
	utils.on_click($('.editmode_switch_right'), function() {
		on_press({
			type: 'editmode_switch-sides',
			side: 'right',
		});
	});
	utils.on_click($('.editmode_arrow'), function() {
		on_press({
			type: 'editmode_change-serve',
		});
	});
}

function hide_inputs(since_game) {
	utils.qsEach('.editmode_score', function(n) {
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
	hide_inputs(input_scores.length);

	if (input_scores[input_scores.length - 1].winner == 'invalid') {
		// TODO red background or so
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
		on_press({
			type: 'editmode_set-finished_games',
			scores: finished_inputs,
			by_side: true,
		});
	}

	var game_input = input_scores[input_scores.length - 1];
	var new_score = calc.lr2score(state, game_input);
	if (! utils.deep_equal(new_score, state.game.score)) {
		on_press({
			type: 'editmode_set-score',
			score: game_input,
			by_side: true,
		});
	}
}

return {
	enter: enter,
	leave: leave,
	ui_init: ui_init,
	change_score: change_score,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var utils = require('./utils');
	var calc = require('./calc');

	module.exports = editmode;
}
/*/@DEV*/