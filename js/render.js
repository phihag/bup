var render = (function() {
'use strict';

function exception_dialog(s) {
	// Be careful not to restrict exotic scenarios such as disqualification after match end
	var sc = $('.exception_suspension_container');
	var button = sc.find('button');
	if (s.match.suspended) {
		sc.addClass('half-invisible');
		button.attr('disabled', 'disabled');
	} else {
		sc.removeClass('half-invisible');
		button.removeAttr('disabled');
	}
}

function shuttle_counter(s) {
	if (s.settings.shuttle_counter) {
		$('#button_shuttle').removeClass('hide_shuttle_counter');
	} else {
		$('#button_shuttle').addClass('hide_shuttle_counter');
	}
}

function _score_display_init(s) {
	$('#score_table').empty();

	var ann_tr = $('<tr class="score_announcements">');
	var ann_td = $('<td colspan="2"></td>');
	ann_tr.append(ann_td);
	$('#score_table').attr('data-game-count', s.match.max_games);
	$('#score_table').append(ann_tr);

	for (var game_index = 0;game_index < s.match.max_games;game_index++) {
		var tr = $('<tr>');
		tr.attr('id', 'score_game_' + game_index);
		$('#score_table').append(tr);

		var left = $('<td class="score score_left">');
		var left_input = $('<input type="number" size="2" min="0" max="30" class="editmode_score default-invisible" value="0">');
		left_input.attr({
			'data-game-index': game_index,
			'data-team-side': 'left',
		});
		left_input.on('input', editmode.change_score);
		left.append(left_input);
		var left_text = $('<span>');
		left.append(left_text);
		tr.append(left);

		var right = $('<td class="score score_right">');
		var right_input = $('<input type="number" size="2" min="0" max="30" class="editmode_score default-invisible" value="0">');
		right_input.attr({
			'data-game-index': game_index,
			'data-team-side': 'right',
		});
		right_input.on('input', editmode.change_score);
		right.append(right_input);
		var right_text = $('<span>');
		right.append(right_text);
		tr.append(right);
	}
}

function _score_display_set_game(s, game, game_index, is_current) {
	function _val(field, v) {
		if (field.val() != v) {
			field.val(v);
		}
	}

	var editmode_active = $('#game').hasClass('editmode');
	var editmode_score_active = editmode_active && (s.game.team1_left !== null);
	var tr = $('#score_game_' + game_index);

	if (!game) {
		utils.set_class(tr, 'score_future-game');
	} else if (is_current) {
		utils.set_class(tr, 'score_current-game');
	} else {
		utils.set_class(tr, 'score_finished-game');
	}

	var left = tr.children('.score_left');
	var left_input = left.children('input');
	left.attr('class', 'score score_left');
	if (game) {
		if (! game.started && !game.finished) {
			left.addClass('score_empty');
		}
		if (game.finished) {
			if (game.team1_won == s.game.team1_left) {
				left.addClass('score_won');
			}
		} else if ((game.team1_serving !== null) && (game.team1_serving == s.game.team1_left)) { 
			left.addClass('score_serving');
		}

		var left_text = left.children('span');
		var left_points = game.score[s.game.team1_left ? 0 : 1];
		_val(left_input, left_points);
		left_text.text(left_points);
		if (editmode_active) {
			utils.visible(left_input, editmode_score_active);
		}
	}

	var right = tr.children('.score_right');
	var right_input = right.children('input');
	right.attr('class', 'score score_right');
	if (game) {
		if (! game.started && !game.finished) {
			right.addClass('score_empty');
		}
		if (game.finished) {
			if (game.team1_won != s.game.team1_left) {
				right.addClass('score_won');
			}
		} else if ((game.team1_serving !== null) && (game.team1_serving != s.game.team1_left)) {
			right.addClass('score_serving');
		}

		var right_text = right.children('span');
		var right_points = game.score[s.game.team1_left ? 1 : 0];
		_val(right_input, right_points);
		right_text.text(right_points);
		if (editmode_active) {
			utils.visible(right_input, editmode_score_active);
		}
	}

	if (is_current) {
		var ann_tr = $('tr.score_announcements');
		ann_tr.insertBefore(tr);
		var ann_td = ann_tr.children('td');
		ann_td.empty();
		var _add_ann = function (text) {
			var ann_span = $('<span class="score_announcement">');
			ann_span.text(text);
			ann_td.append(ann_span);
		};
		if (s.game.service_over) {
			_add_ann(s._('scoredisplay:Service Over'));
		}
		if (s.game.gamepoint) {
			_add_ann(s._('scoredisplay:Game Point'));
		}
		if (s.game.matchpoint) {
			_add_ann(s._('scoredisplay:Match Point'));
		}
		if (s.game.interval) {
			_add_ann(s._('scoredisplay:Interval'));
		}
		if (s.game.change_sides) {
			_add_ann(s._('scoredisplay:Change Ends'));
		}
		if (s.game.game) {
			_add_ann(s._('scoredisplay:Game'));
		}
		if (s.match.marks.length > 0) {
			s.match.marks.forEach(function(e_press) {
				_add_ann(calc.press_char(s, e_press));
			});
		}
		// Rendering fix for empty cells not being rendered correctly
		if (ann_td.children().length === 0) {
			ann_td.text('\xA0');
		}
	}
}

function render_score_display(s) {
	if (parseInt($('#score_table').attr('data-game-count'), 10) != s.match.max_games) {
		_score_display_init(s);
	}
	for (var i = 0;i < s.match.max_games;i++) {
		if (i < s.match.finished_games.length) {
			if ((s.match.finish_confirmed) && (i === s.match.finished_games.length - 1)) {
				// In postmatch-confirmed state, all games are finished, but render it otherwise for optical reasons
				_score_display_set_game(s, s.game, i, true);
				continue;
			}
			_score_display_set_game(s, s.match.finished_games[i], i, false);
		} else if ((i == s.match.finished_games.length) && (!s.match.finish_confirmed)) {
			_score_display_set_game(s, s.game, i, true);
		} else {
			_score_display_set_game(s, null, i, false);
		}
	}
}

function calc_court_str(s) {
	var court_str = '';
	if (s.settings.court_id === 'referee') {
		return s.settings.court_description;
	}
	if (s.settings.court_id) {
		court_str = s._('Court') + ' ' + s.settings.court_id;
	}
	if (s.settings.court_description) {
		if (court_str) {
			court_str += '(' + s.settings.court_description + ')';
		} else {
			court_str += s._('Court') + ' ' + s.settings.court_description;
		}
	}
	return court_str;
}

function ui_court_str(s) {
	$('#court_court_str>span').text(calc_court_str(s));
}

function _set_dialog(dialog_qs, pr_str) {
	var dialog = document.querySelector(dialog_qs);
	var pronounciation_span = dialog.querySelector('span.pronounciation');
	var button = dialog.querySelector('button');
	var m = pr_str.match(/^([\s\S]+?)\n([^\n]+\n[^\n]{1,15}|[^\n]+)$/);

	var span_str = m ? m[1] : '';
	var btn_str = m ? m[2] : pr_str;

	if (span_str) {
		$(pronounciation_span).addClass('pronounciation_nonempty');
	} else {
		$(pronounciation_span).removeClass('pronounciation_nonempty');
	}

	utils.text(pronounciation_span, span_str);
	utils.text(button, btn_str);
}

function ui_render(s) {
	var dialog_active = false;  // Is there anything to pick in the bottom?

	if (!s.initialized) {
		// Nothing to render really
		return;
	}

	editmode.render(s);

	function _court_show_player(key) {
		var p = s.court['player_' + key];
		$('#court_' + key + '>span').text(p === null ? '' : p.name);
	}
	_court_show_player('left_odd');
	_court_show_player('left_even');
	_court_show_player('right_even');
	_court_show_player('right_odd');


	if (s.setup.team_competition && (s.game.team1_left !== null)) {
		$('#court_left_team, #court_right_team').show();
		var left_index = s.game.team1_left ? 0 : 1;
		$('#court_left_team>span').text(s.setup.teams[left_index].name);
		$('#court_right_team>span').text(s.setup.teams[1 - left_index].name);
	} else {
		$('#court_left_team, #court_right_team').hide();
	}

	$('#court_match_name>span').text(s.setup.match_name ? s.setup.match_name : '');
	ui_court_str(s);

	$('#shuttle_counter_value').text(s.match.shuttle_count);

	if (s.court.left_serving === null) {
		$('#court_arrow').hide();
	} else {
		$('#court_arrow').show();
		var transform_css = ('scale(' +
			(s.court.left_serving ? '-1' : '1') + ',' +
			(s.court.serving_downwards ? '1' : '-1') + ')'
		);
		$('#court_arrow,.editmode_arrow').css({
			'transform': transform_css,
			'-ms-transform': transform_css,
			'-webkit-transform': transform_css,
		});
	}

	utils.visible_qs('#love-all-dialog', s.match.announce_pregame && !s.match.injuries && !s.match.suspended);
	if (s.match.announce_pregame) {
		dialog_active = true;
		if (s.settings.show_pronounciation) {
			_set_dialog('#love-all-dialog', pronounciation.pronounce(s));
		} else {
			$('#love-all-dialog button').text(pronounciation.loveall_announcement(s));
			utils.text_qs('#love-all-dialog span', '');
		}
	}

	utils.disabled_qsa('#button_shuttle,#button_exception', s.match.finish_confirmed);
	utils.visible_qs('#postmatch-leave-dialog', s.match.finish_confirmed);
	if (s.match.finish_confirmed) {
		dialog_active = true;
	}
	utils.visible_qs('.postmatch_options', s.match.finished);
	utils.visible_qs('#postmatch-confirm-dialog', s.match.finished && !s.match.finish_confirmed && !s.match.suspended && !s.match.injuries);
	if (s.match.finished && !s.match.finish_confirmed) {
		dialog_active = true;
		if (s.settings.show_pronounciation) {
			_set_dialog('#postmatch-confirm-dialog', pronounciation.pronounce(s));
		} else {
			$('#postmatch-confirm-dialog button').text(pronounciation.postgame_announcement(s));
			utils.text_qs('#postmatch-confirm-dialog span', '');
		}
	}

	utils.visible_qs('#postgame-confirm-dialog', !s.match.finished && s.game.finished && !s.match.suspended && !s.match.injuries);
	if (!s.match.finished && s.game.finished) {
		dialog_active = true;
		if (s.settings.show_pronounciation) {
			_set_dialog('#postgame-confirm-dialog', pronounciation.pronounce(s));
		} else {
			$('#postgame-confirm-dialog button').text(pronounciation.postgame_announcement(s));
			utils.text_qs('#postgame-confirm-dialog span', '');
		}
	}

	utils.visible_qs('#suspension-resume-dialog', s.match.suspended);
	if (s.match.suspended) {
		dialog_active = true;
		$('#suspension-resume').text(
			(s.settings.show_pronounciation ? (pronounciation.pronounce(s) + '.\n\n') : '') +
			s._('button:Unsuspend')
		);
	}

	utils.visible_qs('#injury-resume-dialog', s.match.injuries && !s.match.suspended);
	$('#injury-resume-dialog button').remove();
	if (s.match.injuries) {
		dialog_active = true;
		$('#injury-pronounciation').text(
			(s.settings.show_pronounciation ? (pronounciation.pronounce(s)) : '')
		);
		var dialog = document.querySelector('#injury-resume-dialog');
		s.match.injuries.forEach(function(injury) {
			var btn = utils.create_el(
				dialog, 'button', {},
				s._('card.retired', {
					player_name: s.setup.teams[injury.team_id].players[injury.player_id].name,
				}).replace(/\n?$/, '')
			);
			utils.on_click(btn, function() {
				control.on_press({
					type: 'retired',
					team_id: injury.team_id,
					player_id: injury.player_id,
				});
			});
		});
		var continue_btn = utils.create_el(
			dialog, 'button', {}, s._('button:Resume after injury'));
		utils.on_click(continue_btn, function() {
			control.on_press({
				type: 'injury-resume',
			});
		});
	}

	var score_enabled = s.game.started && !s.game.finished && !s.match.suspended && !s.match.injuries;
	var buttons = $('#left_score,#right_score');
	if (score_enabled) {
		buttons.removeAttr('data-render-disabled');
		buttons.removeClass('half-invisible');
		if (! buttons.attr('data-block-disabled')) {
			buttons.removeAttr('disabled');
		}
	} else {
		buttons.attr('disabled', 'disabled');
		buttons.attr('data-render-disabled', 'disabled');
		buttons.addClass('half-invisible');
	}

	var undo = $('#button_undo');
	if (s.undo_possible) {
		undo.removeAttr('disabled');
		undo.removeClass('half-invisible');
	} else {
		undo.attr('disabled', 'disabled');
		undo.addClass('half-invisible');
	}

	$('#button_redo').toggle(s.redo_possible);

	if (s.timer) {
		timer.set();
	} else {
		timer.remove();
	}

	render_score_display(s);

	$('#pick_side').hide();
	$('#pick_server').hide();
	$('#pick_receiver').hide();
	if (!s.match.finished && !s.match.injuries && !s.match.suspended) {
		if (s.game.start_team1_left === null) {
			dialog_active = true;
			uiu.show_picker($('#pick_side'));

			$('#pick_side_team1').text(pronounciation.teamtext_internal(s, 0));
			$('#pick_side_team2').text(pronounciation.teamtext_internal(s, 1));
		} else if (s.game.start_server_player_id === null) {
			$('#pick_server button').remove();

			var team_indices = (s.game.start_server_team_id === null) ? [0, 1] : [s.game.start_server_team_id];
			team_indices.forEach(function(ti) {
				var namefunc = null;
				if (s.setup.team_competition && (team_indices.length > 1)) {
					if (s.setup.is_doubles) {
						namefunc = function(player) {
							return player.name + ' [' + s.setup.teams[ti].name + ']';
						};
					} else {
						namefunc = function(player) {
							return s.setup.teams[ti].name + ' (' + player.name + ')';
						};
					}
				}

				uiu.add_player_pick(s, $('#pick_server'), 'pick_server', ti, 0, null, namefunc);
				if (s.setup.is_doubles) {
					uiu.add_player_pick(s, $('#pick_server'), 'pick_server', ti, 1, null, namefunc);
				}
			});

			dialog_active = true;
			uiu.show_picker($('#pick_server'));
		} else if (s.game.start_receiver_player_id === null) {
			$('#pick_receiver button').remove();
			dialog_active = true;
			var team_id = (s.game.start_server_team_id == 1) ? 0 : 1;
			uiu.add_player_pick(s, $('#pick_receiver'), 'pick_receiver', team_id, 0);
			uiu.add_player_pick(s, $('#pick_receiver'), 'pick_receiver', team_id, 1);
			uiu.show_picker($('#pick_receiver'));
		}
	}

	if (s.settings.show_pronounciation && !dialog_active) {
		var pronounciation_text = pronounciation.pronounce(s);
		if (pronounciation_text) {
			$('#pronounciation>span').text(pronounciation_text);
			$('#pronounciation').show();
		} else {
			$('#pronounciation').hide();
		}
	} else {
		$('#pronounciation').hide();
	}
}

function show() {
	utils.visible_qs('#game', true);
}

function hide() {
	utils.visible_qs('#game', false);
}

return {
	ui_render: ui_render,
	ui_court_str: ui_court_str,
	exception_dialog: exception_dialog,
	shuttle_counter: shuttle_counter,
	show: show,
	hide: hide,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var control = require('./control');
	var editmode = require('./editmode');
	var pronounciation = require('./pronounciation');
	var timer = require('./timer');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = render;
}
/*/@DEV*/
