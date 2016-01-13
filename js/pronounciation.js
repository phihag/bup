var pronounciation = (function() {
'use strict';

function match_str(setup) {
	if (setup.is_doubles) {
		return setup.teams[0].players[0].name + '/' + setup.teams[0].players[1].name + ' vs ' + setup.teams[1].players[0].name + '/' + setup.teams[1].players[1].name;
	} else {
		return setup.teams[0].players[0].name + ' vs ' + setup.teams[1].players[0].name;
	}
}

// Team name as presented to the umpire
function teamtext_internal(s, team_id) {
	var player_names;
	if (s.setup.is_doubles) {
		player_names = (
			s.setup.teams[team_id].players[0].name + ' / ' +
			s.setup.teams[team_id].players[1].name);
	} else {
		player_names = s.setup.teams[team_id].players[0].name;
	}

	if (s.setup.team_competition) {
		return s.setup.teams[team_id].name + ' (' + player_names + ')';
	} else {
		return player_names;
	}
}

// Simplified announcement for minimal buttons
function loveall_announcement(s) {
	return s._('loveall_play.' + s.match.finished_games.length, {
		mark_extra: '',
		score: _pronounciation_score(s),
	});
}

function postgame_announcement(s) {
	var winner_index = s.game.team1_won ? 0 : 1;
	var winner_score = s.game.score[winner_index];
	var loser_score = s.game.score[1 - winner_index];
	var winner = s.setup.teams[winner_index];
	var winner_name;
	if (s.setup.team_competition) {
		winner_name = winner.name;
	} else {
		if (s.setup.is_doubles) {
			winner_name = winner.players[0].name + s._('wonby.and') + winner.players[1].name;
		} else {
			winner_name = winner.players[0].name;
		}
	}
	var res = '';
	if (s.match.finished) {
		var previous_scores = s.match.finished_games.reduce(function(str, game) {
			str += game.score[winner_index] + '-' + game.score[1 - winner_index] + ' ';
			return str;
		}, '');

		res = s._('wonby.match', {
			winner_name: winner_name,
			previous_scores: previous_scores,
			winner_score: winner_score,
			loser_score: loser_score,
		});
	} else if (s.match.finished_games.length <= 1) {
		res = s._('wonby.' + (1 + s.match.finished_games.length), {
			winner_name: winner_name,
			winner_score: winner_score,
			loser_score: loser_score,
		});
	} else {
		throw new Error('Won third game but match not finished?');
	}
	return res;
}

function _prematch_team(s, team_id) {
	var team = s.setup.teams[team_id];
	var res = '';
	if (s.setup.team_competition) {
		res = team.name + s._('onmyleft.representedby');
	}
	if (s.setup.is_doubles) {
		res += s._('onmyleft.team.doubles', {
			p1: team.players[0].name,
			p2: team.players[1].name,
		});
	} else {
		res += team.players[0].name;
	}
	if (team.name && !s.setup.team_competition) {
		res += ', ' + team.name;
	}
	return res;
}

function _pronounciation_score(s, score, team1_serving, service_over) {
	if (score === undefined) {
		score = s.game.score;
	}
	if (team1_serving === undefined) {
		team1_serving = s.game.team1_serving;
	}
	if (service_over === undefined) {
		service_over = s.game.service_over;
	}
	var first_score = score[team1_serving ? 0 : 1];
	var second_score = score[team1_serving ? 1 : 0];
	if (s.lang == 'en') {
		if (first_score === 0) {
			first_score = 'Love';
		}
		if (second_score === 0) {
			second_score = 'Love';
		}
	}
	var point_str = (s.game.gamepoint ? (' ' + s._('game point')) : (s.game.matchpoint ? (' ' + s._('match point')) : ''));
	var score_str = (
		(first_score == second_score) ?
		(first_score + point_str + ' ' + s._('score.all')) :
		(first_score + (point_str ? (point_str + ' ') : '-') + second_score)
	);
	var service_over_str = (service_over ? s._('score.service_over') : '');
	return service_over_str + score_str;
}

function marks2str(s, marks, during_interval) {
	var res = '';
	marks.forEach(function(mark) {
		var d = {};
		if ((mark.team_id !== undefined) && (mark.player_id !== undefined)) {
			d.player_name = s.setup.teams[mark.team_id].players[mark.player_id].name;
		}

		switch (mark.type) {
		case 'yellow-card':
			res += s._('card.yellow', d);
			break;
		case 'red-card':
			res += s._('card.red' + (during_interval ? '.interval' : ''), d);
			break;
		case 'disqualified':
			res += s._('card.black', d);
			break;
		case 'retired':
			res += s._('card.retired', d);
			break;
		}
	});
	return res;
}

function pronounce(s) {
	var mark_str = marks2str(s, s.match.marks);

	if (s.match.announce_pregame && s.match.finished_games.length === 0) {
		var serving_team_id = s.game.team1_serving ? 0 : 1;
		var receiving_team_id = 1 - serving_team_id;

		var server_score_side = s.game.score[serving_team_id] % 2;
		var serving_player_id = s.game.teams_player1_even[serving_team_id] ? server_score_side : (1 - server_score_side);
		var receiving_player_id = s.game.teams_player1_even[receiving_team_id] ? server_score_side : (1 - server_score_side);

		var server_name = s.setup.teams[serving_team_id].players[serving_player_id].name;
		var receiver_name = s.setup.teams[receiving_team_id].players[receiving_player_id].name;

		var d; // Can't use let :(
		if (s.setup.team_competition) {
			var serving_str = (
				s.setup.is_doubles ?
				(s.setup.is_doubles ? (', ' + server_name + s._('onmyleft.serve.to') + receiver_name) : '') :
				''
			);
			d = {
				away_team: _prematch_team(s, 1),
				home_team: _prematch_team(s, 0),
				serving_team: s.setup.teams[serving_team_id].name,
				serving_str: serving_str,
				score: _pronounciation_score(s),
			};

			return (
				mark_str +
				s._(s.game.team1_left ? 'onmyleft.home_team' : 'onmyleft.away_team', d)
			);
		} else {
			var receiver_str = (s.setup.is_doubles ?
				s._('onmyleft.serveto', {receiver: receiver_name}) : '');

			d = {
				right_team: _prematch_team(s, (s.game.team1_left ? 1 : 0)),
				left_team: _prematch_team(s, (s.game.team1_left ? 0 : 1)),
				server: server_name,
				receiver_str: receiver_str,
				score: _pronounciation_score(s),
			};

			return mark_str + s._('onmyleft', d);
		}
	} else if (s.match.announce_pregame) {
		if (mark_str) {
			return s._('loveall_play.' + s.match.finished_games.length + '.mark', {
				mark_str: marks2str(s, s.match.marks, true),
				score: _pronounciation_score(s),
			});
		} else {
			return s._('loveall_play.' + s.match.finished_games.length, {
				score: _pronounciation_score(s),
			});
		}
	}

	if (s.game.finished) {
		var pre_mark_str = mark_str;
		var post_mark_str = '';
		if (s.game.final_marks) {
			pre_mark_str = marks2str(s, s.game.final_marks);
			var post_marks = s.match.marks.slice(s.game.final_marks.length);
			post_mark_str = marks2str(s, post_marks, true);
		}

		return (
			pre_mark_str +
			(s.game.won_by_score ? s._('game(won)') + '.\n' : '') +
			(post_mark_str ? (post_mark_str) : '') +
			postgame_announcement(s)
		);
	}

	if (s.match.suspended) {
		return s._('match suspended');
	}

	if (s.match.injuries) {
		var referee_called = s.match.marks.some(function(mark) {
			return mark.type == 'referee';
		});
		return mark_str + (referee_called ? '' : (s._('[Call referee!]') + '\n')) + s._('Are you retiring?');
	}

	if (s.match.just_unsuspended)  {
		return (
			mark_str + s._('ready to unsuspend') +
			_pronounciation_score(s, undefined, undefined, false) +
			s._('card.play')
		);
	}

	if (!s.game.finished && s.game.started) {
		if ((s.game.score[0] === 0) && (s.game.score[1] === 0) && !mark_str) {
			return null;  // Special case at 0-0, we just showed the long text. Time to focus on the game.
		}

		var interval_str = (s.game.interval ? ' ' + s._('Interval') : '') + (s.game.change_sides ? s._('change_ends') : '');
		if (s.game.interval && mark_str) {
			var interval_pre_mark_str = marks2str(s, s.game.interval_marks);
			var post_interval_marks = s.match.marks.slice(s.game.interval_marks.length);

			if (post_interval_marks.length > 0) {
				var interval_post_mark_str = marks2str(s, post_interval_marks, true);
				if (interval_post_mark_str) {
					// Only use extended form if it's more than just a referee call
					return (
						interval_pre_mark_str +
						_pronounciation_score(s, s.game.interval_score, s.game.interval_team1_serving, s.game.interval_service_over) +
						interval_str + '.\n' +
						interval_post_mark_str +
						_pronounciation_score(s) +
						s._('card.play')
					);
				}
			}
		}

		return mark_str + _pronounciation_score(s) + interval_str;
	}

	if (mark_str) {
		if (s.game.started && !s.game.finished) {
			return mark_str.trim();
		} else {
			return marks2str(s, s.match.marks, true).trim();
		}
	}

	return null;
}

return {
	pronounce: pronounce,
	loveall_announcement: loveall_announcement,
	postgame_announcement: postgame_announcement,
	match_str: match_str,
	teamtext_internal: teamtext_internal,
};

})();

/*@DEV*/
if (typeof module !== 'undefined') {
	module.exports = pronounciation;
}
/*/@DEV*/
