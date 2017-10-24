'use strict';
var urlexport = (function() {
var hide_func;

var BASE_URL = 'http_proxy/tde_export.php';

function render_prepare(s, page, submit_cb) {
	var prepare_form = uiu.el(page, 'form', 'urlexport_form urlexport_prepare');
	s.event.report_urls.forEach(function(r_url) {
		var domain = utils.domain(r_url);
		if (!domain) {
			return;
		}

		uiu.el(prepare_form, 'input', {
			type: 'hidden',
			name: 'urlexport_url_' + domain,
			value: r_url,
		});

		var user_label = uiu.el(prepare_form, 'label');
		uiu.el(user_label, 'span', {}, s._('urlexport:user', {
			domain: domain,
		}));
		var user_k = 'urlexport_user_' + domain;
		uiu.el(user_label, 'input', {
			name: user_k,
			autofocus: 'autofocus',
			required: 'required',
			value: (
				(typeof localStorage !== 'undefined') ?
				(localStorage.getItem('bup_' + user_k) || '') :
				''
			),
		});

		var password_label = uiu.el(prepare_form, 'label');
		uiu.el(password_label, 'span', {}, s._('urlexport:password'));
		var pw_k = 'urlexport_password_' + domain;
		uiu.el(password_label, 'input', {
			required: 'required',
			type: 'password',
			name: pw_k,
			value: (
				(typeof localStorage !== 'undefined') ?
				(localStorage.getItem('bup_' + pw_k) || '') :
				''
			),
		});
	});
	var prepare_btn = uiu.el(prepare_form, 'button', {}, s._('urlexport:prepare'));
	uiu.el(prepare_btn, 'span', {}, s._('experimental'));

	form_utils.onsubmit(prepare_form, function(data) {
				if (typeof localStorage !== 'undefined') {
			for (var k in data) {
				if (/user|password/.test(k)) {
					try {
						localStorage.setItem('bup_' + k, data[k]);
					} catch(e) {
						// Never mind
					}
				}
			}
		}
		submit_cb(data);
	});
}

function _winner_code_str(s, winner_code) {
	var team_names = s.event.team_names;
	if (winner_code === 0) {
		return s._('urlexport:winner_code:0');
	}
	if (winner_code === 1) {
		return team_names[0];
	}
	if (winner_code === 2) {
		return team_names[1];
	}
	if (winner_code === 4) {
		return s._('urlexport:winner_code:retired', {
			team_name: team_names[0],
		});
	}
	if (winner_code === 5) {
		return s._('urlexport:winner_code:retired', {
			team_name: team_names[1],
		});
	}
	return 'CODE ' + winner_code;
}

function unify_name(match_name) {
	var m = /^([0-9]+)\.\s*(.*)$/.exec(match_name);
	if (m) {
		return m[2] + m[1];
	}
	return match_name;
}

function render_submit(s, page, data, submit_cb) {
	var match_table = uiu.el(page, 'table');
	data.matches.forEach(function(dm) {
		var tr = uiu.el(match_table, 'tr');
		uiu.el(tr, 'th', {}, dm.name);
		dm.players.forEach(function(team_players) {
			var team_td = uiu.el(tr, 'td', {
				style: 'font-size:2vmin',
			});
			team_players.forEach(function(p) {
				uiu.el(team_td, 'div', {}, p.name);
			});
		});
		uiu.el(tr, 'td', {}, _winner_code_str(s, dm.winner_code));
		dm.score_strs.forEach(function(score_str) {
			uiu.el(tr, 'td', {
				style: 'text-align:center;min-width:3em;',
			}, score_str);
		});
	});

	var submit_form = uiu.el(page, 'form');
	// TODO render text fields
	uiu.el(submit_form, 'button', {
		style: 'position:absolute;right:3vmin;bottom:2vmin;display:block;font-size:3vmin',
	}, s._('urlexport:submit'));
	form_utils.onsubmit(submit_form, function(data) {
		submit_cb(data);
	});
}

function init(s, page) {
	function _make_request(options, success_cb) {
		uiu.removeClass(status_text, 'network_error');
		status.style.visibility = 'visible';
		status_icon.setAttribute('class', 'loading-icon');

		ajax.req(options, success_cb, function(code, content, xhr) {
			status_icon.setAttribute('class', 'error-icon');
			uiu.addClass(status_text, 'network_error');

			var ctype = xhr.getResponseHeader('Content-Type');
			if ((code == 500) && (ctype === 'application/json')) {
				var resp = utils.parse_json(content);
				if (resp && (resp.status === 'error')) {
					uiu.text(status_text, resp.message);
					return;
				}
			}

			uiu.text(status_text, s._('urlexport:http-error', {
				code: code,
			}));
			report_problem.silent_error('urlexport to ' + options.url + ' failed with HTTP ' + code);
		});
	}

	var status = uiu.el(page, 'div', {
		'class': 'urlexport_status',
		style: 'visibility:hidden;',
	});
	var status_icon = uiu.el(status, 'div', 'loading-icon');
	var status_text = uiu.el(status, 'span', {}, 'X'); // The X ensures height is already allocated

	render_prepare(s, page, function(form_data) {
		var ev = s.event;
		eventutils.set_metadata(ev);
		if (ev.report_urls.length !== 1) {
			throw new Error('Internal error: invalid number of report_urls');
		}
		var r_url = ev.report_urls[0];
		var domain = utils.domain(r_url);

		var user = form_data['urlexport_user_' + domain];
		var password = form_data['urlexport_password_' + domain];

		var xmatches = ev.matches.map(function(m) {
			var winner_code = 0;
			if (m.network_finished) {
				var won_by_score = m.network_won_by_score;
				winner_code = (m.network_team1_won ?
					(won_by_score ? 1 : 5) :
					(won_by_score ? 2 : 4)
				);
			}

			return {
				name: unify_name(m.setup.match_name),
				score: m.network_score,
				winner_code: winner_code,
				players: m.setup.teams.map(function(team) {
					return team.players.map(function(p) {
						return {
							name: p.name,
						};
					});
				}),
			};
		});

		uiu.text(status_text, s._('urlexport:preparing'));
		_make_request({
			url: BASE_URL + '?action=prepare&' + utils.urlencode({
				url: r_url,
				user: user,
				password: password,
				team_names: JSON.stringify(ev.team_names),
				matches_json: JSON.stringify(xmatches),
				max_game_count: calc.max_game_count(ev.matches[0].setup.counting),
			}),
		}, function(data_json) {
			var data = JSON.parse(data_json);
			status.style.visibility = 'hidden';

			uiu.remove(uiu.qs('.urlexport_prepare'));
			render_submit(s, page, data, function() {
				_make_request({
					url: BASE_URL + '?action=submit&' + utils.urlencode({
						url: r_url,
						user: user,
						password: password,
						team_names: JSON.stringify(ev.team_names),
						matches_json: JSON.stringify(xmatches),
						max_game_count: calc.max_game_count(ev.matches[0].setup.counting),
					}),
				}, function() {
					status_icon.setAttribute('class', 'success-icon');
					uiu.text(status_text, s._('urlexport:success'));
					// TODO render link
				});
			});
		});
	});
}

function show() {
	if (hide_func) return; // Already displayed

	hide_func = bupui.make_page(state, 'urlexport', init, function() {
		hide_func = null;
	});
}

function hide() {
	if (hide_func) {
		hide_func();
	}
}

function render_links(s, container) {
	uiu.empty(container);
	var ev = s.event;
	if (!ev || !ev.report_urls) return;
	ev.report_urls.forEach(function(r_url) {
		var domain = utils.domain(r_url);
		if (! domain) return;
		
		var link = uiu.el(container, 'a', {
			href: '#',
		}, s._('urlexport:link', {
			domain: domain,
		}));
		uiu.el(link, 'span', {}, s._('experimental'));
		click.on(link, show);
	});
}


return {
	hide: hide,
	show: show,
	render_links: render_links,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var ajax = require('./ajax');
	var bupui = require('./bupui');
	var calc = require('./calc');
	var click = require('./click');
	var eventutils = require('./eventutils');
	var form_utils = require('./form_utils');
	var report_problem = require('./report_problem');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = urlexport;
}
/*/@DEV*/
