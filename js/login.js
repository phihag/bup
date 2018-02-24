'use strict';

var login = (function() {

function render_links(s, container) {
	var netw = network.get_netw();
	uiu.empty(container);
	if (!netw || !netw.login) return;

	var link = uiu.el(container, 'a', {
		href: '#',
		'data-i18n': 'login:link',
	}, s._('login:link'));
	click.on(link, link_click);
}

function render_form(container, include_close) {
	if (container.querySelector('.settings_login')) {
		return; // Form already rendered
	}

	var netw = network.get_netw();
	uiu.empty(container);
	var login_form = uiu.el(container, 'form', 'settings_login');
	uiu.el(login_form, 'h2', {}, state._('login:header', {
		service_name: netw.service_name(),
	}));

	if (include_close) {
		var close_button = uiu.el(login_form, 'a', {
			href: '#',
			'class': 'login_close',
			'data-i18n': 'login:close',
		}, state._('login:close'));
		click.on(close_button, function() {
			uiu.empty(container);
		});
	}

	var login_error = uiu.el(login_form, 'div', 'network_error');
	uiu.el(login_form, 'input', {
		name: 'user',
		placeholder: state._('login:user'),
		required: 'required',
	});
	uiu.el(login_form, 'input', {
		name: 'password',
		type: 'password',
		placeholder: state._('login:password'),
		required: 'required',
	});
	uiu.el(login_form, 'button', 'login_button', state._('login:button'));
	var loading_icon = uiu.el(login_form, 'div', 'default-invisible loading-icon');

	form_utils.onsubmit(login_form, function(inputs) {
		uiu.show(loading_icon);
		netw.login(inputs.user, inputs.password, function(message) {
			uiu.hide(loading_icon);
			if (message) {
				uiu.text(login_error, message);
			} else { // Login successful
				network.errstate('all', null);
			}
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

	module.exports = login;
}
/*/@DEV*/