'use strict';
// Display ads
var dads = (function() {

var ALL_MODES = ['none', 'always', 'periodic'];

function ui_config_show(s) {
	var container = uiu.el(uiu.qs('body'), 'div', 'dads_config_container');
	uiu.el(container, 'h1', {
		'data-i18n': 'dads:heading',
		style: 'margin-top:0.2em;text-align: center;',
	});

	var mode_label = uiu.el(container, 'label');
	uiu.el(mode_label, 'span', {
		'data-i18n': 'dads:mode',
	});
	ui_make_mode_select(s, mode_label, s.settings.dads_mode);

	// TODO if mode=periodic then show periodic config

	i18n.translate_nodes(container, s);
}

function ui_make_mode_select(s, container, cur_val) {
	var select = uiu.el(container, 'select', {
		size: 1,
	});
	ALL_MODES.forEach(function(v) {
		var attrs = {
			value: v,
			'data-i18n': 'dads|' + v,
		};
		if ((v === cur_val) || ((v === 'none') && (!cur_val))) {
			attrs.selected = 'selected';
		}
		uiu.el(select, 'option', attrs);
	});
	return select;
}

function install_controls(s, container, cur_val) {
	uiu.el(container, 'span', {
		'data-i18n': 'dads:label',
		style: 'margin-right:0.5ch;',
	});

	var select = ui_make_mode_select(s, container, cur_val);

	var link = uiu.el(container, 'a', {
		style: 'margin-left:0.5ch;',
		'href': '#dads',
		'data-i18n': 'dads:configure',
	});
	click.on(link, function() {
		ui_config_show(s);
	});
	i18n.translate_nodes(container, s);

	return select;
}

function ui_init(s) {
	var select = install_controls(s, uiu.qs('.d_dads_config'), s.settings.dads_mode);
	select.setAttribute('name', 'dads_mode');
}

return {
	ui_init: ui_init,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var i18n = require('./i18n');
	var uiu = require('./uiu');

	module.exports = dads;
}
/*/@DEV*/
