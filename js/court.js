var court = (function() {
'use strict';


var POSITIONS = ['left_odd', 'left_even', 'right_even', 'right_odd'];
function install(container) {
	function create_button(attrs) {
		var button = uiu.create_el(container, 'button', attrs);
		uiu.create_el(button, 'span');
		return button;
	}

	var res = {
		arrow: uiu.create_el(container, 'div', {'class': 'court_arrow default-invisible'}),
		editmode_arrow: create_button({'class': 'editmode_arrow editmode_button default-invisible'}),
		editmode_change_ends: create_button({'class': 'editmode_change-ends editmode_button default-invisible'}),
		editmode_switch_left: create_button({'class': 'editmode_switch_left editmode_button default-invisible'}),
		editmode_switch_right: create_button({'class': 'editmode_switch_right editmode_button default-invisible'}),
		editmode_leave: create_button({'class': 'editmode_leave editmode_button default-invisible'}),
	};

	function create_text(key) {
		var el = uiu.create_el(container, 'div', {'class': 'court_' + key});
		res[key] = el;
		var span = uiu.create_el(el, 'span');
		res[key + '_text'] = span;
	}
	create_text('court_str');
	create_text('left_team');
	create_text('right_team');
	create_text('match_name');

	POSITIONS.forEach(function(p) {
		var div = uiu.create_el(container, 'div', {
			'class': ('court_' + p),
		});
		res[p + '_card'] = uiu.create_el(div, 'span');
		res[p + '_text'] = uiu.create_el(div, 'span');
	});

	return res;
}

function update_court_str(s, cui) {
	uiu.text(cui.court_str_text, calc_court_str(s));
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
	uiu.visible(cui.arrow, (cdata.left_serving !== null));

	uiu.text(cui.match_name_text, s.setup.match_name ? s.setup.match_name : '');

	var show_teams = (s.setup.team_competition && (s.game.team1_left !== null));
	uiu.visible(cui.left_team, show_teams);
	uiu.visible(cui.right_team, show_teams);
	if (show_teams) {
		var left_index = s.game.team1_left ? 0 : 1;
		uiu.text(cui.left_team_text, s.setup.teams[left_index].name);
		uiu.text(cui.right_team_text, s.setup.teams[1 - left_index].name);
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

return {
	install: install,
	render: render,
	update_court_str: update_court_str,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var calc = require('./calc');
	var uiu = require('./uiu');

	module.exports = court;
}
/*/@DEV*/
