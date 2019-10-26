'use strict';
var urlexport = (function() {
var hide_func;

function determine_base_url() {
	var netw = network.get_netw();
	if (netw && netw.aw_proxy) { // No php support, use global server
		return 'https://aufschlagwechsel.de/bup/http_proxy/';
	}
	return 'http_proxy/';
}

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
	uiu.el(prepare_form, 'button', {}, s._('urlexport:prepare'));

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

function extra_field_value(ev, label) {
	if (/^vorgesehene Ersatzspieler/.test(label)) {
		return eventutils.calc_players_str(ev, ev.backup_players);
	}
	if (label.indexOf('Schiedsrichter') > -1) {
		return (
			ev.umpires ? ev.umpires : (
			ev.match_umpires ? ev.match_umpires.join(', ') : ''));
	}
	if (/^weitere anwesende Spieler/.test(label)) {
		return eventutils.calc_players_str(ev, ev.present_players);
	}
	if (/^Bemerkungen:?$/.test(label) && (ev.spectators)) {
		return ev.spectators + ' Zuschauer';
	}
	if (label.indexOf('Protestvorbehalt') > -1) {
		return ev.protest;
	}
	if (/^andere besondere Vorkommnisse/.test(label)) {
		return ev.notes;
	}
}

function render_submit(s, page, data, submit_cb) {
	var submit_container = uiu.el(page, 'div');

	var match_table = uiu.el(submit_container, 'table', {
		style: 'margin-bottom:1em;',
	});
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

	var submit_form = uiu.el(submit_container, 'form');
	var ef_table = uiu.el(submit_form, 'table');
	data.extra_fields.forEach(function(ef, idx) {
		var tr = uiu.el(ef_table, 'tr');
		uiu.el(tr, 'td', {
			style: 'text-align:right;font-size:2vmin;',
		}, ef.label);
		var td = uiu.el(tr, 'td');
		var input_attrs = {
			style: 'font-size: 2vmin;',
			size: 50,
			type: 'text',
			name: 'ef_' + ef.tde_id,
			'class': 'urlexport_input',
			value: (extra_field_value(s.event, ef.label) || ''),
		};
		if (/Schiedsrichter/.test(ef.label) && eventutils.umpire_required(s.event.league_key)) {
			input_attrs.required = 'required';
		}
		var input = uiu.el(td, 'input', input_attrs);
		if (idx === 0) {
			input.focus();
		}
	});

	uiu.el(submit_form, 'button', {
		style: 'position:absolute;right:3vmin;bottom:2vmin;display:block;font-size:3vmin',
	}, s._('urlexport:submit'));
	form_utils.onsubmit(submit_form, function(data) {
		submit_cb(data);
	});
	return submit_container;
}

function init(s, page) {
	function _make_request(options, success_cb) {
		uiu.removeClass(status_text, 'network_error');
		status.style.visibility = 'visible';
		status_icon.setAttribute('class', 'loading-icon');

		options.success = success_cb;
		options.error = function(code, content, xhr) {
			status_icon.setAttribute('class', 'error-icon');
			uiu.addClass(status_text, 'network_error');

			var ctype = xhr.getResponseHeader('Content-Type');
			if ((code == 500) && (ctype === 'application/json')) {
				var resp = utils.parse_json(content);
				if (resp && (resp.status === 'error')) {
					uiu.text(status_text, resp.message);
					resp.request_url = options.url;
					report_problem.silent_error('urlexport failed', resp);
					return;
				}
			}

			uiu.text(status_text, s._('urlexport:http-error', {
				code: code,
			}));
			report_problem.silent_error('urlexport to ' + options.url + ' failed with HTTP ' + code);
		};
		ajax.req(options);
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
			url: determine_base_url() + 'export2url.php?action=prepare',
			data: utils.urlencode({
				url: r_url,
				user: user,
				password: password,
				team_names: JSON.stringify(ev.team_names),
				matches_json: JSON.stringify(xmatches),
				max_game_count: calc.max_game_count(ev.matches[0].setup.counting),
			}),
		}, function(data_json) {
			var data = utils.parse_json(data_json);
			if (!data) {
				report_problem.silent_error(
					'urlexport to ' + r_url + ' failed: Invalid JSON. data is: ' + data_json);
				uiu.text(status_text, s._('urlexport:http-error', {
					code: 'invalid-json - got ' + data_json.substring(0, 50)}));
				status_icon.setAttribute('class', 'error-icon');
				uiu.addClass(status_text, 'network_error');
				return;
			}
			status.style.visibility = 'hidden';

			uiu.remove(uiu.qs('.urlexport_prepare'));
			uiu.text(status_text, s._('urlexport:submitting'));

			var submit_container = render_submit(s, page, data, function(submit_data) {
				var extra_fields = [];
				for (var k in submit_data) {
					var m = /^ef_(.*)$/.exec(k);
					if (!m) continue;

					extra_fields.push({
						tde_id: parseInt(m[1]),
						val: submit_data[k],
					});
				}

				_make_request({
					url: determine_base_url() + 'export2url.php?action=submit',
					data: utils.urlencode({
						url: r_url,
						cookies: data.cookies,
						user: user,
						password: password,
						team_names: JSON.stringify(ev.team_names),
						matches_json: JSON.stringify(xmatches),
						max_game_count: calc.max_game_count(ev.matches[0].setup.counting),
						extra_fields_json: JSON.stringify(extra_fields),
					}),
				}, function(data_json, xhr) {
					var data = utils.parse_json(data_json);

					if (!data || (data.status !== 'saved')) {
						status_icon.setAttribute('class', 'error-icon');
						uiu.addClass(status_text, 'network_error');
						uiu.text(status_text, s._('urlexport:http-error', {
							code: (data ? xhr.status : 'no-json'),
						}));
						return;
					}

					status_icon.setAttribute('class', 'success-icon');
					uiu.remove(submit_container);
					uiu.text(status_text, s._('urlexport:success'));

					uiu.el(page, 'a', {
						href: data.result_url,
						target: '_blank',
						rel: 'noopener noreferrer',
						style: 'display:block;margin-bottom:1em;',
					}, data.result_url);
				});
			});
		});
	});
}

function outer_init(s, page) {
	var ev = s.event;
	if (ev.report_urls && (ev.report_urls.length > 0)) {
		init(s, page);
		return;
	}

	var url_form = uiu.el(page, 'form', 'urlexport_urlform');
	var label = uiu.el(url_form, 'label');
	uiu.el(label, 'span', {}, s._('urlexport:url'));
	uiu.el(label, 'input', {
		style: 'margin:0 0.5em;',
		type: 'url',
		required: 'required',
		size: 100,
		name: 'report_url',
		autofocus: 'autofocus',
	});

	uiu.el(label, 'button', {}, s._('urlexport:submit url'));

	form_utils.onsubmit(url_form, function(data) {
		ev.report_urls = [data.report_url];
		uiu.remove(url_form);
		init(s, page);
	});
}

function show() {
	if (hide_func) return; // Already displayed

	hide_func = bupui.make_page(state, 'urlexport', outer_init, function() {
		hide_func = null;
	});
}

function hide() {
	if (hide_func) {
		hide_func();
	}
}

function supported_leagues(league_key) {
	if (eventutils.is_bundesliga(league_key) ||
			eventutils.NRW2016_RE.test(league_key) ||
			(league_key === 'RLW-2016') || (league_key === 'RLN-2016') || (league_key === 'RLM-2016')) {
		return ['dbv.turnier.de', 'www.turnier.de', 'turnier.de'];
	}
}

function render_links(s, container, append) {
	if (!append) {
		uiu.empty(container);
	}

	var ev = s.event;
	if (!ev) return;

	var report_urls = ev.report_urls;
	var domains;
	if (report_urls) {
		domains = utils.filter_map(report_urls, utils.domain);
	} else {
		var sup = supported_leagues(ev.league_key);
		if (sup) {
			domains = sup;
		}
	}

	if (!domains) {
		return;
	}

	domains.forEach(function(domain) {
		var link = uiu.el(container, 'a', {
			href: '#',
		}, s._('urlexport:link', {
			domain: domain,
		}));
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
	var network = require('./network');
	var report_problem = require('./report_problem');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = urlexport;
}
/*/@DEV*/
