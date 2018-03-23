'use strict';

var login = (function() {

function render_links(s, container) {
	var netw = network.get_netw();
	uiu.empty(container);
	if (!netw || !netw.login) {
		return;
	}

	var link = uiu.el(container, 'a', {
		href: '#',
		'data-i18n': 'login:link',
	}, s._('login:link'));
	click.on(link, link_click);
}

function get_stored() {
	if (typeof localStorage === 'undefined') {
		return [];
	}

	return utils.parse_json(localStorage.getItem('bup_logins')) || [];
}

function store(user, password) {
	if (typeof localStorage === 'undefined') {
		return;
	}

	var cur = get_stored();
	cur = cur.filter(function(acc) {
		return acc.user !== user;
	});
	cur.splice(0, 0, {
		user: user,
		password_b64: btoa(password),
	});
	cur = cur.slice(0, 4);
	localStorage.setItem('bup_logins', JSON.stringify(cur));
}

function render_form(container, include_close) {
	if (container.querySelector('.settings_login')) {
		return; // Form already rendered
	}

	var netw = network.get_netw();
	uiu.empty(container);
	var outer_container = uiu.el(container, 'div', 'settings_login');
	uiu.el(outer_container, 'h2', {}, state._('login:header', {
		service_name: netw.service_name(),
	}));

	if (include_close) {
		var close_button = uiu.el(outer_container, 'a', {
			href: '#',
			'class': 'login_close',
			'data-i18n': 'login:close',
		}, state._('login:close'));
		click.on(close_button, function() {
			uiu.empty(container);
		});
	}

	var login_error = uiu.el(outer_container, 'div', 'network_error');

	var input_form = uiu.el(outer_container, 'form', 'login_input_form');
	uiu.el(input_form, 'input', {
		name: 'user',
		placeholder: state._('login:user'),
		required: 'required',
	});
	uiu.el(input_form, 'input', {
		name: 'password',
		type: 'password',
		placeholder: state._('login:password'),
		required: 'required',
	});
	var loading_icon = uiu.el(input_form, 'div', 'default-invisible loading-icon');
	uiu.el(input_form, 'button', 'login_button', state._('login:button'));

	var login = function(user, password) {
		uiu.show(loading_icon);
		netw.login(user, password, function(message) {
			uiu.hide(loading_icon);
			if (message) {
				uiu.text(login_error, message);
			} else { // Login successful
				network.errstate('all', null);
				store(user, password);
			}
		});
	};

	form_utils.onsubmit(input_form, function(inputs) {
		login(inputs.user, inputs.password);
	});

	var presets_form = uiu.el(outer_container, 'div', 'login_presets');
	get_stored().forEach(function(stored) {
		var btn = uiu.el(presets_form, 'button', {}, state._('login:as', {user: stored.user}));
		click.on(btn, function() {
			login(stored.user, atob(stored.password_b64));
		});
	});
}

function link_click() {
	var login_container = uiu.qs('.settings_network_login_container');
	render_form(login_container, true);
	login_container.scrollIntoView();
	login_container.querySelector('input[name="user"]').focus();
}

function required() {
	render_form(uiu.qs('.settings_network_login_container'));
	render_form(uiu.qs('.network_desync_login_container'));
}

return {
	render_links: render_links,
	required: required,
};

})();


/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var form_utils = require('./form_utils');
	var network = require('./network');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = login;
}
/*/@DEV*/