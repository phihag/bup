'use strict';
var pronunciation = (function() {

function match_str(setup) {
	if (setup.incomplete) {
		return setup.match_name;
	}
	if (setup.is_doubles) {
		return setup.teams[0].players[0].name + '/' + setup.teams[0].players[1].name + ' vs ' + setup.teams[1].players[0].name + '/' + setup.teams[1].players[1].name;
	} else {
		return setup.teams[0].players[0].name + ' vs ' + setup.teams[1].players[0].name;
	}
}

// Team name as presented to the umpire
function teamtext_internal(s, team_id) {
	var setup = s.setup;
	var player_names = setup.teams[team_id].players.map(function(p) {
		return p ? p.name : '';
	}).join(' / ');

	if (setup.team_competition) {
		return s.setup.teams[team_id].name + ' (' + player_names + ')';
	} else {
		return player_names;
	}
}

// Simplified announcement for minimal buttons
function loveall_announcement(s) {
	var glen = s.match.finished_games.length;
	var game_id = (s.match.max_games - 1 === glen) ? 'final' : glen;
	return (
		s._('loveall_game|' + game_id) + 
		pronounce_score(s) +
		s._('loveall_play')
	);
}

function wonby_name(s, winner_idx) {
	var winner = s.setup.teams[winner_idx];

	if (s.setup.team_competition) {
		return eventutils.pronounce_teamname(winner.name);
	} else {
		if (s.setup.is_doubles) {
			return winner.players[0].name + s._('wonby.and') + winner.players[1].name;
		} else {
			return winner.players[0].name;
		}
	}
}

function postgame_announcement(s) {
	var winner_index = s.game.team1_won ? 0 : 1;
	var winner_score = s.game.score[winner_index];
	var loser_score = s.game.score[1 - winner_index];
	var winner_name = wonby_name(s, winner_index);

	var res = '';
	if (s.match.finished) {
		res = s._('wonby.match', {
			winner_name: winner_name,
			score_str: calc.score_str(s, winner_index),
		});
	} else {
		var is_individual_doubles = s.setup.is_doubles && !s.setup.team_competition;
		var gscore = calc.gamescore(s);
		var games_leader_idx = (gscore[0] > gscore[1]) ? 0 : 1;
		var games_leader_name = wonby_name(s, games_leader_idx);
		res = s._('wonby|' + (gscore[0] + gscore[1])) + s._('wonby.winner', {
			winner_name: winner_name,
			winner_score: winner_score,
			loser_score: loser_score,
		}) + s._('gamescore|' + (is_individual_doubles ? 'doubles|' : '') + gscore[games_leader_idx] + '-' + gscore[1 - games_leader_idx], {
			games_leader_name: games_leader_name,
		});
	}
	return res;
}

function _prematch_team(s, team_id) {
	var setup = s.setup;
	var team = setup.teams[team_id];
	var res = '';
	if (setup.team_competition) {
		res = eventutils.pronounce_teamname(team.name) + s._('onmyright.representedby');
	}
	var different_nationalities = (team.players.length >= 2) && (team.players[0].nationality !== team.players[1].nationality);
	var names = team.players.map(function(p, pidx) {
		if (setup.nation_competition && !setup.team_competition && p.nationality &&
				((team.players.length < 2) || (pidx === 1) || different_nationalities)) {
			return p.name + ', ' + countrycodes.lookup(p.nationality);
		}
		return p.name;
	});
	if (setup.is_doubles) {
		res += s._('onmyright.team.doubles', {
			p1: names[0],
			p2: names[1],
		});
	} else {
		res += names[0];
	}

	if (team.name && setup.nation_competition) {
		var has_nationalities = utils.any(team.players.map(function(p) {return p.nationality;}));
		if (! has_nationalities) {
			// Nation competition, but nations manually specified
			res += ', ' + eventutils.pronounce_teamname(team.name);
		}
	}
	return res;
}

function pronounce_score(s, score, team1_serving, service_over) {
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
			first_score = 'love';
		}
		if (second_score === 0) {
			second_score = 'love';
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

function marks2str(s, marks) {
	return marks.reduce(function(res, mark) {
		var d = {};
		if ((mark.team_id !== undefined) && (mark.player_id !== undefined)) {
			d.player_name = s.setup.teams[mark.team_id].players[mark.player_id].name;
		}

		switch (mark.type) {
		case 'yellow-card':
			res += s._('card.yellow', d);
			break;
		case 'red-card':
			res += s._('card.red', d);
			break;
		case 'disqualified':
			res += s._('card.black', d);
			break;
		case 'retired':
			res += s._('card.retired', d);
			break;
		}
		return res;
	}, '');
}

function ready_announcement(s) {
	var court_id = s.settings ? s.settings.court_id : null;
	if (court_id === 'referee') {
		court_id = null;
	}
	if (court_id) {
		return s._('20secs', {court_id: compat.courtnum(court_id)});
	} else {
		return s._('20secs:nocourt');
	}
}

function faulted_str(s, marks) {
	return marks.filter(function(m) {
		return m.type === 'red-card';
	}).map(function(c) {
		return s._('card.red.interval', {
			player_name: s.setup.teams[c.team_id].players[c.player_id].name,
		});
	}).join('');
}

function pronounce(s, now) {
	var timer_done = false;
	var timer_exigent = false;
	if (s.timer) {
		if (!now) {
			now = Date.now();
		}
		timer_done = now >= (s.timer.start + s.timer.duration);
		if (!timer_done && s.timer.exigent) {
			timer_exigent = now >= (s.timer.start + s.timer.duration - s.timer.exigent);
		}
	}

	var mark_str = marks2str(s, s.match.marks);

	if (s.match.suspended) {
		return s._('match suspended');
	}

	if (s.match.injuries) {
		return mark_str + s._('Are you retiring?');
	}

	if (s.match.announce_pregame && s.match.finished_games.length === 0) {
		var ready_str = (timer_exigent) ? s._('ready to play') + '\n' : '';

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
				(s.setup.is_doubles ? (', ' + server_name + s._('onmyright.serve.to') + receiver_name) : '') :
				''
			);
			var left_team = (s.game.team1_left ? 0 : 1);
			d = {
				left_team: _prematch_team(s, left_team),
				right_team: _prematch_team(s, 1 - left_team),
				serving_team: eventutils.pronounce_teamname(s.setup.teams[serving_team_id].name),
				serving_str: s._('onmyright.serves') + serving_str,
				score: pronounce_score(s),
			};

			return (
				ready_str +
				mark_str +
				((s.setup.away_first && !s.game.team1_left) ? s._('onmyleft.team', d) : s._('onmyright.team', d))
			);
		} else {
			var receiver_str = (s.setup.is_doubles ?
				s._('onmyright.serveto', {receiver: receiver_name}) :
				s._('onmyright.serves'));

			d = {
				right_team: _prematch_team(s, (s.game.team1_left ? 1 : 0)),
				left_team: _prematch_team(s, (s.game.team1_left ? 0 : 1)),
				server: server_name,
				receiver_str: receiver_str,
				score: pronounce_score(s),
			};

			return ready_str + mark_str + s._('onmyright', d);
		}
	} else if (s.match.announce_pregame) {
		var glen = s.match.finished_games.length;
		var game_id_str = (s.match.max_games - 1 === glen) ? 'final' : glen;
		var rtp = timer_exigent ? (ready_announcement(s) + '\n') : '';
		var red_cards_faulted_str = faulted_str(s, s.match.marks);

		var res = (
			rtp + marks2str(s, s.match.marks)
		);
		if (res) {
			res += '\n';
		}
		return (
			res +
			s._('loveall_game|' + game_id_str) +
			(red_cards_faulted_str ? (
				pronounce_score(s, [0, 0], undefined, false) +
				'.\n' +
				red_cards_faulted_str
			) : '') +
			pronounce_score(s) +
			s._('loveall_play')
		);
	}

	if (s.game.finished) {
		var pre_mark_str = mark_str;
		var post_mark_str = '';
		if (s.game.final_marks) {
			pre_mark_str = marks2str(s, s.game.final_marks);
			var post_marks = s.match.marks.slice(s.game.final_marks.length);
			post_mark_str = marks2str(s, post_marks);
		}

		if (s.match.walkover) {
			var winner_index = s.match.team1_won ? 0 : 1;
			return pre_mark_str + s._('wonby.walkover', {
				winner_name: wonby_name(s, winner_index),
				loser_name: wonby_name(s, 1 - winner_index),
			});
		}

		return (
			pre_mark_str +
			(s.game.won_by_score ? s._('game(won)') + '.\n' : '') +
			(post_mark_str ? (post_mark_str) : '') +
			'\n' +
			postgame_announcement(s)
		);
	}

	if (s.match.just_unsuspended)  {
		return (
			mark_str + s._('ready to unsuspend') +
			pronounce_score(s, undefined, undefined, false) +
			s._('card.play')
		);
	}

	var score_str = pronounce_score(s);

	// No let in current browsers, therefore tucked in here
	var interval_pre_mark_str;
	var post_interval_marks;
	var interval_post_mark_str;
	var post_red_cards_str;

	if (!s.game.finished && s.game.started) {
		if ((s.game.score[0] === 0) && (s.game.score[1] === 0) && !mark_str) {
			return null;  // Special case at 0-0, we just showed the long text. Time to focus on the game.
		}

		if (s.game.interval) {
			var interval_str = '';
			if (timer_exigent) {
				interval_str = ready_announcement(s) + '\n';
			} else if (!timer_done) {
				if (score_str) {
					score_str = pronounce_score(s, s.game.interval_score, s.game.interval_team1_serving, s.game.interval_service_over);
				}

				interval_str = score_str + ' ' + s._('Interval');
				if (s.game.change_sides) {
					interval_str += s._('change_ends');
				}
				interval_str += '\n';
			}

			if (mark_str) {
				post_interval_marks = s.match.marks.slice(s.game.interval_marks.length);
				interval_pre_mark_str = marks2str(s, s.game.interval_marks);
				interval_post_mark_str = marks2str(s, post_interval_marks);
				post_red_cards_str = faulted_str(s, post_interval_marks);
				if (post_red_cards_str) {
					return (
						interval_pre_mark_str +
						interval_str +
						interval_post_mark_str +
						'\n' +
						post_red_cards_str +
						pronounce_score(s) +
						s._('card.play')
					);
				}
			} else {
				interval_pre_mark_str = interval_post_mark_str = '';
			}

			var interval_res = (
				interval_pre_mark_str +
				interval_str +
				interval_post_mark_str
			);
			return (
				interval_res +
				(interval_res ? '\n' : '') +
				s._('postinterval.play', {
					score: pronounce_score(s, undefined, undefined, false),
				})
			);
		} else if (s.game.just_interval) {
			post_interval_marks = s.match.marks.slice(s.game.interval_marks.length);
			interval_post_mark_str = marks2str(s, post_interval_marks);
			post_red_cards_str = faulted_str(s, post_interval_marks);
			if (post_red_cards_str) {
				return (interval_post_mark_str + '\n' +
					post_red_cards_str +
					pronounce_score(s) +
					s._('card.play')
				);
			}

			if (interval_post_mark_str) {
				return interval_post_mark_str + s._('postinterval.play', {
					score: pronounce_score(s, undefined, undefined, false),
				});
			} else {
				return null;  // Special case after interval, pronunciation has just been confirmed.	
			}
		}

		return mark_str + score_str;
	}

	if (mark_str) {
		return mark_str.trim();
	}

	return null;
}

return {
	pronounce: pronounce,
	loveall_announcement: loveall_announcement,
	postgame_announcement: postgame_announcement,
	pronounce_score: pronounce_score,
	match_str: match_str,
	teamtext_internal: teamtext_internal,
};

})();

/*@DEV*/
if (typeof module !== 'undefined') {
	var calc = require('./calc');
	var compat = require('./compat');
	var countrycodes = require('./countrycodes');
	var eventutils = require('./eventutils');
	var utils = require('./utils');

	module.exports = pronunciation;
}
/*/@DEV*/
