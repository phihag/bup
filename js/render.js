'use strict';
var render = (function() {

function _mark_button(container, enabled) {
	uiu.setClass(container, 'half-invisible', !enabled);
	uiu.mark_disabled(
		uiu.qs('button', container),
		enabled
	);
}

function exception_dialog(s) {
	// Be careful not to restrict exotic scenarios such as disqualification after match end
	_mark_button(
		uiu.qs('.exception_suspension_container'),
		!s.match.suspended
	);

	_mark_button(
		uiu.qs('.exception_correction_container'),
		s.setup.is_doubles
	);
}

function shuttle_counter(s) {
	uiu.setClass_qs('#button_shuttle', 'hide_shuttle_counter', !s.settings.shuttle_counter);
}

function _score_display_init(s) {
	var score_table = uiu.qs('#score_table');
	uiu.empty(score_table);

	var ann_tr = uiu.el(score_table, 'tr', {
		'class': 'score_announcements',
	});
	uiu.el(ann_tr, 'td', {
		colspan: 2,
	});
	score_table.setAttribute('data-game-count', s.match.max_games);

	var counting_tr = uiu.el(score_table, 'tr', {
		'class': 'score_counting_tr',
	});
	var counting_td = uiu.el(counting_tr, 'td', {
		colspan: 2,
		'class': 'score_counting_td',
	});
	var counting_container = uiu.el(counting_td, 'div', {
		'class': 'score_counting_container',
	});
	uiu.el(counting_container, 'div', {
		'class': 'score_counting',
	}, s.setup.counting);

	for (var game_index = 0;game_index < s.match.max_games;game_index++) {
		var tr = uiu.el(score_table, 'tr', {
			id: 'score_game_' + game_index,
		});

		var SIDES = ['left', 'right'];
		for (var i = 0;i < SIDES.length;i++) {
			var side = SIDES[i];

			var td = uiu.el(tr, 'td', {
				'class': 'score score_' + side,
			});

			var input = uiu.el(td, 'input', {
				type: 'number',
				size: 2,
				min: 0,
				max: 30,
				'class': 'editmode_score default-invisible',
				value: 0,
				'data-game-index': game_index,
				'data-team-side': side,
			});
			input.addEventListener('input', editmode.change_score);

			uiu.el(td, 'span');
		}
	}
}

function _score_display_set_game(s, game, game_index, is_current) {
	function _val(field, v) {
		if (field.val() != v) {
			field.val(v);
		}
	}

	var editmode_active = s.ui.editmode_active;
	var editmode_score_active = editmode_active && (s.game.team1_left !== null);
	var tr = uiu.qs('#score_game_' + game_index);

	if (!game) {
		tr.setAttribute('class', 'score_future-game');
	} else if (is_current) {
		tr.setAttribute('class', 'score_current-game');
	} else {
		tr.setAttribute('class', 'score_finished-game');
	}

	var left = $(tr.querySelector('.score_left'));
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
			uiu.$visible(left_input, editmode_score_active);
		}
	}

	var right = $(tr.querySelector('.score_right'));
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
			uiu.$visible(right_input, editmode_score_active);
		}
	}

	if (is_current) {
		var $counting_tr = $('.score_counting_tr');
		$counting_tr.insertBefore(tr);
		var ann_tr = $('tr.score_announcements');
		ann_tr.insertBefore($counting_tr);

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

	uiu.$visible_qs('.score_counting_container', (
		!s.ui.editmode_active &&
		s.setup && s.setup.counting &&
		s.match && (s.match.finished_games.length === 0) &&
		s.game && (s.game.score[0] <= 0) && (s.game.score[1] <= 0)
	));
}

function _set_dialog(s, dialog_qs, btn_str) {
	var pr_str = pronunciation.pronounce(s);
	var dialog = uiu.qs(dialog_qs);
	var pronunciation_span = dialog.querySelector('span.pronunciation');
	var button = dialog.querySelector('button');
	var span_str;

	if (btn_str) {
		span_str = pr_str;
	} else {
		var m = pr_str.match(/^([\s\S]+?)\n\n([\s\S]+)$/);
		span_str = m ? m[1] : '';
		btn_str = m ? m[2] : pr_str;
	}

	if (s.settings.show_announcements === 'none') {
		span_str = '';
	} else if(s.settings.show_announcements === 'except-first') {
		if (s.match.announce_pregame && s.match.finished_games.length === 0) {
			span_str = '';
		}
	}

	uiu.setClass(pronunciation_span, 'pronunciation_nonempty', span_str);
	uiu.setClass(pronunciation_span, 'pronunciation_longtext', span_str && utils.count_lines(span_str) >= 5);

	uiu.text(pronunciation_span, span_str);
	uiu.text(button, btn_str);
}

var _main_court_ui;
function main_court_ui() {
	if (! _main_court_ui) {
		_main_court_ui = court.install(uiu.qs('#court'));
	}
	return _main_court_ui;
}

function ui_court_str(s) {
	court.update_court_str(s, main_court_ui());
}

function ui_render(s) {
	var dialog_active = false;  // Is there anything to pick in the bottom?

	if (!s.initialized) {
		// Nothing to render really
		return;
	}

	court.render(s, main_court_ui());
	editmode.update_ui(s);

	uiu.text_qs('#shuttle_counter_value', s.match.shuttle_count);

	uiu.$visible_qs('#love-all-dialog', s.match.announce_pregame && !s.match.injuries && !s.match.suspended);
	if (s.match.announce_pregame) {
		dialog_active = true;
		_set_dialog(s, '#love-all-dialog');
	}

	uiu.disabled_qsa('#button_shuttle,#button_exception', s.match.finish_confirmed);
	uiu.$visible_qs('#postmatch-leave-dialog', s.match.finish_confirmed);
	if (s.match.finish_confirmed) {
		dialog_active = true;
	}
	uiu.visible_qs('.postmatch_options', s.match.finished);
	uiu.visible_qs('#postmatch-confirm-dialog', s.match.finished && !s.match.finish_confirmed && !s.match.suspended && !s.match.injuries);
	if (s.match.finished && !s.match.finish_confirmed) {
		dialog_active = true;
		_set_dialog(s, '#postmatch-confirm-dialog');
	}

	uiu.$visible_qs('#postgame-confirm-dialog', !s.match.finished && s.game.finished && !s.match.suspended && !s.match.injuries);
	if (!s.match.finished && s.game.finished) {
		dialog_active = true;
		_set_dialog(s, '#postgame-confirm-dialog');
	}

	uiu.$visible_qs('#postinterval-confirm-dialog', s.game.interval);
	if (s.game.interval) {
		dialog_active = true;
		_set_dialog(s, '#postinterval-confirm-dialog');
	}

	uiu.$visible_qs('#suspension-resume-dialog', s.match.suspended);
	if (s.match.suspended) {
		dialog_active = true;
		_set_dialog(s, '#suspension-resume-dialog', s._('button:Unsuspend'));
	}

	uiu.$visible_qs('#injury-resume-dialog', s.match.injuries && !s.match.suspended);
	$('#injury-resume-dialog button').remove();
	if (s.match.injuries) {
		dialog_active = true;
		$('#injury-pronunciation').text(
			((s.settings.show_announcements !== 'none') ? (pronunciation.pronounce(s)) : '')
		);
		var dialog = uiu.qs('#injury-resume-dialog');

		var referee_called = s.match.marks.some(function(mark) {
			return mark.type == 'referee';
		});
		if (!referee_called) {
			var ref_btn = uiu.el(dialog, 'button', {}, s._('Call referee'));
			click.on(ref_btn, function() {
				control.on_press({
					type: 'referee',
				});
			});
		}

		s.match.injuries.forEach(function(injury) {
			var btn = uiu.el(
				dialog, 'button', {},
				s._('card.retired', {
					player_name: s.setup.teams[injury.team_id].players[injury.player_id].name,
				}).replace(/\n?$/, '')
			);
			click.on(btn, function() {
				control.on_press({
					type: 'retired',
					team_id: injury.team_id,
					player_id: injury.player_id,
				});
			});
		});
		var continue_btn = uiu.el(
			dialog, 'button', {}, s._('button:Resume after injury'));
		click.on(continue_btn, function() {
			control.on_press({
				type: 'injury-resume',
			});
		});
	}

	var score_enabled = s.game.started && !s.game.finished && !s.match.suspended && !s.match.injuries && !s.game.interval;
	var $buttons = $('#left_score,#right_score');
	if (score_enabled) {
		$buttons.removeAttr('data-render-disabled');
		$buttons.removeClass('half-invisible');
		if (! $buttons.attr('data-block-disabled')) {
			$buttons.removeAttr('disabled');
		}
	} else {
		$buttons.attr('disabled', 'disabled');
		$buttons.attr('data-render-disabled', 'disabled');
		$buttons.addClass('half-invisible');
	}

	uiu.disabled_qsa('#button_undo', !s.undo_possible);

	$('#button_redo').toggle(s.redo_possible);

	if (s.timer) {
		timer.set();
	} else {
		timer.remove();
	}

	render_score_display(s);

	var $pick_side = $('#pick_side');
	var $pick_server = $('#pick_server');
	var $pick_receiver = $('#pick_receiver');
	
	$pick_side.hide();
	$pick_server.hide();
	$pick_receiver.hide();
	if (!s.match.finished && !s.match.injuries && !s.match.suspended) {
		if (s.game.start_team1_left === null) {
			dialog_active = true;
			bupui.show_picker($pick_side);

			$('#pick_side_team1').text(pronunciation.teamtext_internal(s, 0));
			$('#pick_side_team2').text(pronunciation.teamtext_internal(s, 1));
		} else if (s.game.start_server_player_id === null) {
			$pick_server.find('button').remove();

			var team_indices = (s.game.start_server_team_id === null) ? [0, 1] : [s.game.start_server_team_id];
			team_indices.forEach(function(ti) {
				var namefunc = null;
				if (s.setup.team_competition && (team_indices.length > 1)) {
					if (s.setup.is_doubles) {
						namefunc = function(player) {
							return player.name;
						};
					} else {
						namefunc = function(player) {
							return s.setup.teams[ti].name + ' (' + player.name + ')';
						};
					}
				}

				bupui.add_player_pick(s, $pick_server[0], 'pick_server', ti, 0, null, namefunc);
				if (s.setup.is_doubles) {
					bupui.add_player_pick(s, $pick_server[0], 'pick_server', ti, 1, null, namefunc);
				}
			});

			dialog_active = true;
			control.block_buttons_update();
			bupui.show_picker($pick_server);
		} else if (s.game.start_receiver_player_id === null) {
			$pick_receiver.find('button').remove();
			dialog_active = true;
			var team_id = (s.game.start_server_team_id == 1) ? 0 : 1;
			bupui.add_player_pick(s, $pick_receiver[0], 'pick_receiver', team_id, 0);
			bupui.add_player_pick(s, $pick_receiver[0], 'pick_receiver', team_id, 1);
			control.block_buttons_update();
			bupui.show_picker($pick_receiver);
		}
	}

	var $pronunciation_el = $('#pronunciation');
	if ((s.settings.show_announcements !== 'none') && !dialog_active) {
		var pronunciation_text = pronunciation.pronounce(s);
		if (pronunciation_text) {
			$pronunciation_el.find('>span').text(pronunciation_text);
			$pronunciation_el.show();
		} else {
			$pronunciation_el.hide();
		}
	} else {
		$pronunciation_el.hide();
	}
}

function show() {
	uiu.show_qs('#game');
}

function hide() {
	uiu.hide_qs('#game');
}

return {
	ui_render: ui_render,
	ui_court_str: ui_court_str,
	exception_dialog: exception_dialog,
	main_court_ui: main_court_ui,
	shuttle_counter: shuttle_counter,
	show: show,
	hide: hide,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var bupui = require('./bupui');
	var calc = require('./calc');
	var click = require('./click');
	var control = require('./control');
	var court = require('./court');
	var editmode = require('./editmode');
	var pronunciation = require('./pronunciation');
	var timer = require('./timer');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = render;
}
/*/@DEV*/
