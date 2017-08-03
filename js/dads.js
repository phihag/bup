'use strict';
// Display ads
var dads = (function() {

var ALL_MODES = ['none', 'always', 'periodic'];

function load(s) {
	s.dads = [];

	if (typeof localStorage === 'undefined') {
		return; // Will probably crash when trying to store
	}

	for (var i = 0;i < localStorage.length;i++) {
		var k = localStorage.key(i);
		if (! k.match(/^bup_dads_/)) {
			continue;
		}

		s.dads.push(JSON.parse(localStorage.getItem(k)));
	}
}

function ui_add(s, ad) {
	ad.id = utils.uuid();
	s.dads.push(ad);
	ad.images2 = [{url: 'foo'}];
	localStorage.setItem('bup_dads_' + ad.id, JSON.stringify(ad));
	render_preview(uiu.qs('.dads_previews'), ad);
}

function ui_rm(s, ad_id) {
	utils.remove_cb(s.dads, function(ad) {
		return ad.id === ad_id;
	});
	localStorage.removeItem('bup_dads_' + ad_id);
	render_previews(s, uiu.qs('.dads_previews'));
}

function render_ad(container, ad) {
	switch(ad.type) {
	case 'image':
		container.setAttribute('style', 'background:#000');
		uiu.el(container, 'img', {
			src: ad.url,
			style: 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;',
		});
		break;
	default:
		uiu.text(container, 'Unsupported type ' + ad.type);
		report_problem.silent_error('Unsupported ad type ' + ad.type);
	}
}

function on_rm_click(e) {
	var ad_id = uiu.closest_class(e.target, 'dads_preview').getAttribute('data-ad-id');
	ui_rm(state, ad_id);
}

function render_preview(container, ad) {
	var c = uiu.el(container, 'div', 'dads_preview');
	render_ad(c, ad);
	c.setAttribute('data-ad-id', ad.id);
	var rm_btn = uiu.el(c, 'button', 'dads_rm');
	uiu.el(rm_btn, 'span');
	click.on(rm_btn, on_rm_click);
}

function render_previews(s, container) {
	uiu.empty(container);
	s.dads.forEach(function(ad) {
		render_preview(container, ad);
	});
}

function ui_make_config(s, outer_container) {
	var container = uiu.el(outer_container, 'div', 'dads_config_container');
	uiu.el(container, 'h1', {
		'data-i18n': 'dads:heading',
		style: 'margin:0;padding-top:0.2em;text-align:center;',
	});

	var mode_label = uiu.el(container, 'label');
	uiu.el(mode_label, 'span', {
		'data-i18n': 'dads:mode',
		style: 'margin-right: 0.5ch;',
	});
	ui_make_mode_select(s, mode_label, s.settings.dads_mode);

	// TODO if mode=periodic then show periodic config

	var previews = uiu.el(container, 'div', 'dads_previews');
	render_previews(s, previews);

	var add_image_file = uiu.el(container, 'input', {
		type: 'file',
		accept: 'image/*',
		style: 'display:none',
	});
	var add_image_btn = uiu.el(container, 'button', {
		'data-i18n': 'dads:add image',
	});
	click.on(add_image_btn, function() {
		add_image_file.click();
	});
	add_image_file.addEventListener('change', function() {
		var file = add_image_file.files[0];
		var reader = new FileReader();
		reader.onload = function(e) {
			ui_add(s, {
				type: 'image',
				url: e.target.result,
			});
		};
		reader.readAsDataURL(file);
	});

	var back_container = uiu.el(container, 'div', {
		style: 'padding:0.4em 0;font-size:120%;',
	});
	var back_link = uiu.el(back_container, 'a', {
		href: '#',
		'data-i18n': 'dads:back',
	});
	click.on(back_link, back2displaymode);

	i18n.translate_nodes(container, s);
}

function paste_handler(event) {
	utils.forEach(event.clipboardData.files, function(f) {
		if (! /^image/.test(f.type)) {
			return;
		}
		var reader = new FileReader();
		reader.onload = function(e) {
			ui_add(state, {
				type: 'image',
				url: e.target.result,
			});
		};
		reader.readAsDataURL(f);
	});
}

function show() {
	if (state.ui.dads_visible) {
		return;
	}

	displaymode.hide();
	state.ui.dads_visible = true;
	control.set_current(state);
	uiu.esc_stack_push(back2displaymode);
	uiu.qs('body').addEventListener('paste', paste_handler);

	ui_make_config(state, uiu.qs('body'));
}

function hide() {
	if (!state.ui.dads_visible) {
		return;
	}

	state.ui.dads_visible = false;
	uiu.qsEach('.dads_config_container', uiu.remove);
}

function back2displaymode() {
	hide();
	displaymode.show();
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
		show(s);
	});
	i18n.translate_nodes(container, s);

	return select;
}

function ui_init(s) {
	load(s);

	var select = install_controls(s, uiu.qs('.d_dads_config'), s.settings.dads_mode);
	select.setAttribute('name', 'dads_mode');
}

return {
	ui_init: ui_init,
	show: show,
	hide: hide,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var control = require('./control');
	var displaymode = require('./displaymode');
	var i18n = require('./i18n');
	var report_problem = require('./report_problem');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = dads;
}
/*/@DEV*/
