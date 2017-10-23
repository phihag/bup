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

function init(s, page) {
	function _make_request(options, success_cb) {
		uiu.removeClass(status_text, 'network_error');
		status.style.visibility = 'visible';
		status_icon.setAttribute('class', 'loading-icon');

		ajax.req(options, success_cb, function(code) {
			status_icon.setAttribute('class', 'error-icon');
			uiu.text(status_text, s._('urlexport:http-error', {
				code: code,
			}));
			uiu.addClass(status_text, 'network_error');
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
		if (s.event.report_urls.length !== 1) {
			throw new Error('Internal error: invalid number of report_urls');
		}
		var r_url = s.event.report_urls[0];
		var domain = utils.domain(r_url);

		var user = form_data['urlexport_user_' + domain];
		var password = form_data['urlexport_password_' + domain];

		uiu.text(status_text, s._('urlexport:preparing'));
		_make_request({
			url: BASE_URL + '?action=prepare',
			data: {
				url: r_url,
				user: user,
				password: password,
			},
		}, function(data) {
			status.style.visibility = 'hidden';

			uiu.remove(uiu.qs('.urlexport_prepare'));
			console.log('TODO: success', data);  // eslint-disable-line no-console
			// TODO render submission form
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
	var click = require('./click');
	var form_utils = require('./form_utils');
	var report_problem = require('./report_problem');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = urlexport;
}
/*/@DEV*/
