'use strict';
var court = (function() {

var POSITIONS = ['left_odd', 'left_even', 'right_even', 'right_odd'];
function install(container) {
	function create_button(attrs) {
		var button = uiu.el(container, 'button', attrs);
		uiu.el(button, 'span');
		return button;
	}

	var res = {
		arrow: uiu.el(container, 'div', {'class': 'court_arrow default-invisible'}),
		editmode_arrow: create_button({'class': 'editmode_arrow editmode_button default-invisible'}),
		editmode_change_ends: create_button({'class': 'editmode_change-ends editmode_button default-invisible'}),
		editmode_switch_left: create_button({'class': 'editmode_switch_left editmode_button default-invisible'}),
		editmode_switch_right: create_button({'class': 'editmode_switch_right editmode_button default-invisible'}),
		editmode_leave: create_button({'class': 'editmode_leave editmode_button default-invisible'}),
		editmode_fix_time: editmode.make_fix_time_ui(container),
	};

	function create_text(key) {
		var el = uiu.el(container, 'div', {'class': 'court_' + key});
		res[key] = el;
		var span = uiu.el(el, 'span');
		res[key + '_text'] = span;
	}
	create_text('court_str');
	create_text('umpire_name');
	create_text('left_team');
	create_text('right_team');
	create_text('match_name');

	POSITIONS.forEach(function(p) {
		var div = uiu.el(container, 'div', {
			'class': ('court_' + p),
		});
		res[p + '_card'] = uiu.el(div, 'span');
		res[p + '_text'] = uiu.el(div, 'span');
	});

	return res;
}

function update_court_str(s, cui) {
	uiu.text(cui.court_str_text, calc_court_str(s));
}

function _team_names(s) {
	if (s.game.team1_left === null) {
		return; // No sides yet, cannot see team names
	}

	if (s.setup.team_competition) {
		return [s.setup.teams[0].name, s.setup.teams[1].name];
	}

	if (s.setup.teams[0].players[0] && s.setup.teams[0].players[0].nationality) {
		// International tournament
		return s.setup.teams.map(function(team, team_idx) {
			var players = team.players;
			if ((players.length > 1) && (players[0].nationality !== players[1].nationality)) {
				var idxs = [0, 1];
				if (s.game && s.game.teams_player1_even && (s.game.teams_player1_even[team_idx] !== (s.game.team1_left === (team_idx !== 0)))) {
					idxs = [1, 0];
				}

				return idxs.map(function(player_idx) {
					return countrycodes.lookup(players[player_idx].nationality);
				}).join('\n');
			} else {
				return countrycodes.lookup(players[0].nationality);
			}
		});
    }

    // No team names
}

function render(s, cui) {
	var cdata = calc.court(s);

	POSITIONS.forEach(function(key) {
		var p = cdata[key];
		uiu.text(cui[key + '_text'], (p === null ? '' : p.player.name));

		cui[key + '_card'].setAttribute('class', (p && p.carded) ? ('court_' + p.carded.type) : '');
	});

	if (cdata.left_serving !== null) {
		var transform_val = ('scale(' +
			(cdata.left_serving ? '-1' : '1') + ',' +
			(cdata.serving_downwards ? '1' : '-1') + ')'
		);

		cui.arrow.style.transform = transform_val;
		cui.arrow.style.MsTransform = transform_val;
		cui.arrow.style.WebkitTransform = transform_val;
		cui.editmode_arrow.style.transform = transform_val;
		cui.editmode_arrow.style.MsTransform = transform_val;
		cui.editmode_arrow.style.WebkitTransform = transform_val;
	}
	uiu.$visible(cui.arrow, (cdata.left_serving !== null));
	var umpire_name = s.setup.umpire_name || '';
	if (umpire_name && s.setup.service_judge_name) {
		umpire_name += ' / ' + s.setup.service_judge_name;
	}
	uiu.text(cui.umpire_name, umpire_name);
	uiu.visible(cui.umpire_name, (cdata.left_serving === null));

	uiu.text(cui.match_name_text, s.setup.match_name ? s.setup.match_name : '');

	// Teams
	var team_names = _team_names(s);
	var show_teams = !!team_names;
	if (show_teams) {
		var left_index = s.game.team1_left ? 0 : 1;
		uiu.text(cui.left_team_text, team_names[left_index]);
		uiu.text(cui.right_team_text, team_names[1 - left_index]);
	}

	uiu.$visible(cui.left_team, show_teams);
	uiu.$visible(cui.right_team, show_teams);
}

function calc_court_str(s) {
	var court_str = '';
	if (s.settings.court_id === 'referee') {
		return s.settings.court_description;
	}
	if (s.settings.court_id) {
		return s._('Court') + ' ' + network.court_label(s, s.settings.court_id);
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

return {
	install: install,
	render: render,
	update_court_str: update_court_str,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var countrycodes = require('./countrycodes');
	var editmode = require('./editmode');
	var network = require('./network');
	var uiu = require('./uiu');

	module.exports = court;
}
/*/@DEV*/
