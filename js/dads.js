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

function store(s, ad) {
	var ad_json = JSON.stringify(ad);
	try {
		localStorage.setItem('bup_dads_' + ad.id, ad_json);
	} catch(e) {
		if (e.code === 22) {
			uiu.text_qs('.dads_error', s._('dads:quota'));
			return;
		}
		throw e;
	}
}

function ui_add(s, ad) {
	ad.id = utils.uuid();
	s.dads.push(ad);
	var c = uiu.el(uiu.qs('.dads_previews'), 'div', 'dads_preview');
	render_preview(c, ad);
	store(s, ad);
}

function ui_change(s, ad) {
	var ad_el = uiu.qs('.dads_preview[data-ad-id="' + ad.id + '"]');
	render_preview(ad_el, ad);
	store(s, ad);
}

function ui_add_image_from_dt(s, dt) {
	if (dt.types.includes('text/html')) {
		var html = dt.getData('text/html');
		var dom = (new DOMParser()).parseFromString(
			'<!doctype html><body>' + html, 'text/html');
		var img = dom.querySelector('img');
		if (img) {
			var src = img.getAttribute('src');
			ui_add(s, {
				type: 'image',
				url: src,
			});
			return;
		}
	}

	utils.forEach(dt.files, function(f) {
		if (! /^image/.test(f.type)) {
			return;
		}
		var reader = new FileReader();
		reader.onload = function(e) {
			ui_add(s, {
				type: 'image',
				url: e.target.result,
			});
		};
		reader.readAsDataURL(f);
	});
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
		container.style.backgroundColor = ad.bgcolor || '#000';
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

function _find_ad(e) {
	var ad_id = uiu.closest_class(e.target, 'dads_preview').getAttribute('data-ad-id');
	return utils.find(state.dads, function(ad) {
		return ad.id === ad_id;
	});
}

function on_bgcolor_change(e) {
	var ad = _find_ad(e);
	ad.bgcolor = e.target.value;
	ui_change(state, ad);
}

function on_active_change(e) {
	var ad = _find_ad(e);
	ad.disabled = !e.target.checked;
	ui_change(state, ad);
}

function render_preview(container, ad) {
	uiu.empty(container);
	render_ad(container, ad);
	container.setAttribute('data-ad-id', ad.id);

	var color_input = uiu.el(container, 'input', {
		type: 'color',
		value: ad.bgcolor,
		class: 'dads_bgcolor',
	});
	color_input.addEventListener('change', on_bgcolor_change);

	var rm_btn = uiu.el(container, 'button', 'dads_rm');
	uiu.el(rm_btn, 'span');
	click.on(rm_btn, on_rm_click);

	var active_label = uiu.el(container, 'label', 'dads_active');
	var active_cb = uiu.el(active_label, 'input', {
		type: 'checkbox',
	});
	if (!ad.disabled) {
		active_cb.setAttribute('checked', 'checked');
	}
	active_cb.addEventListener('change', on_active_change);
	uiu.el(active_label, 'span', {
		'data-i18n': 'dads:active',
	}, state._('dads:active'));
}

function render_previews(s, container) {
	uiu.empty(container);
	s.dads.forEach(function(ad) {
		var c = uiu.el(container, 'div', 'dads_preview');
		render_preview(c, ad);
	});
}

function drop_noop(e) {
	e.stopPropagation();
	e.preventDefault();
}

function on_drop(e) {
	e.stopPropagation();
	e.preventDefault();
	ui_add_image_from_dt(state, e.dataTransfer);
}

function interval_input(s, container, name) {
	var label = uiu.el(container, 'label');
	uiu.el(label, 'span', {
		'data-i18n': 'dads|' + name,
	});
	var input = uiu.el(label, 'input', {
		type: 'number',
		min: 1,
		step: 1,
		name: 'dads_' + name,
		value: s.settings['dads_' + name] / 1000,
		style: 'width:4em;',
	});
	input.addEventListener('input', function() {
		var val = input.value * 1000;
		if (val > 0) {
			var changed = {};
			changed['dads_' + name] = val;
			settings.change_all(state, changed);
		}
	});
}

function render_options(s, options_container) {
	var dads_mode = s.settings.dads_mode;

	var old_mode = options_container.getAttribute('data-dads-mode');
	if (old_mode === dads_mode) {
		return;
	}

	options_container.setAttribute('data-dads-mode', dads_mode);
	uiu.empty(options_container);
	if (dads_mode === 'always') {
		interval_input(s, options_container, 'interval');
	} else if (dads_mode === 'periodic') {
		interval_input(s, options_container, 'dtime');
		interval_input(s, options_container, 'atime');
	}
}

function ui_make_config(s, outer_container) {
	var dads_mode = s.settings.dads_mode;
	var container = uiu.el(outer_container, 'div', 'dads_config_container');
	uiu.el(container, 'div', {
		'class': 'dads_error',
		'style': 'float:right;color:red;font-size:3vmin;',
	});
	uiu.el(container, 'h1', {
		'data-i18n': 'dads:heading',
		style: 'margin:0;padding-top:0.2em;text-align:center;',
	});

	var mode_label = uiu.el(container, 'label');
	uiu.el(mode_label, 'span', {
		'data-i18n': 'dads:mode',
		style: 'margin-right: 0.5ch;',
	});
	var select = ui_make_mode_select(s, mode_label, dads_mode);
	select.addEventListener('change', function() {
		if (select.value) {
			settings.change_all(s, {dads_mode: select.value});
		}
	});

	var options = uiu.el(container, 'div', 'dads_options');
	render_options(s, options);

	var previews = uiu.el(container, 'div', 'dads_previews');
	render_previews(s, previews);

	var buttons = uiu.el(container, 'div', 'dads_buttons');

	var add_image_file = uiu.el(buttons, 'input', {
		type: 'file',
		accept: 'image/*',
		style: 'display:none',
	});
	var add_image_btn = uiu.el(buttons, 'button', {
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

	var add_image_url_btn = uiu.el(buttons, 'button', {
		'data-i18n': 'dads:add image url',
	});
	click.on(add_image_url_btn, function() {
		var url = prompt('URL');
		if (url) {
			ui_add(s, {
				type: 'image',
				url: url,
			});
		}
	});

	container.addEventListener('dragenter', drop_noop);
	container.addEventListener('dragexit', drop_noop);
	container.addEventListener('dragover', drop_noop);
	container.addEventListener('drop', on_drop);

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
	ui_add_image_from_dt(state, event.clipboardData);
}

function on_style_change(s) {
	if (s.ui.dads_visible) {
		render_options(s, uiu.qs('.dads_config_container .dads_options'));
	}
	displaymode.on_style_change(s);
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

	uiu.el(container, 'span', {
		'data-i18n': 'experimental',
	});

	i18n.translate_nodes(container, s);

	return select;
}

function advance_periodic(s, container) {
	if (s.dad_periodic_to) {
		clearTimeout(s.dad_periodic_to);
	}
	s.dad_periodic_active = !s.dad_periodic_active;
	if (s.dad_periodic_active) {
		uiu.show(container);
		cycle(s, container);
	} else {
		uiu.hide(container);
	}

	s.dad_periodic_to = setTimeout(function() {
		advance_periodic(s, container);
	}, (s.dad_periodic_active ? s.settings.dads_atime : s.settings.dads_dtime));
}

function cycle(s, container) {
	if (!s.dads.length) {
		return;
	}

	for (var inc = 0;inc < s.dads.length;inc++) {
		s.dad_cycle_index = (s.dad_cycle_index + 1) % s.dads.length;
		var ad = s.dads[s.dad_cycle_index];
		if (! ad.disabled) {
			break;
		}
	}
	uiu.empty(container);
	render_ad(container, ad);
}

function cancel_timeouts(s) {
	if (s.dad_cycle_interval) {
		clearInterval(s.dad_cycle_interval);
		s.dad_cycle_interval = null;
	}
	if (s.dad_periodic_to) {
		clearTimeout(s.dad_periodic_to);
		s.dad_periodic_to = null;
	}
}

// Gets called when the configuration has changed
function d_update(container) {
	var s = state;
	var mode = s.settings.dads_mode;

	cancel_timeouts(s);
	if (mode === 'none') {
		uiu.hide(container);
		return;
	}

	s.dad_cycle_index = -1;
	cycle(s, container);
	if (mode === 'always') {
		s.dad_cycle_interval = setInterval(function() {
			cycle(s, container);
		}, s.settings.dads_interval);
		uiu.show(container);
	} else if (mode === 'periodic') {
		s.dad_periodic_active = true;
		advance_periodic(s, container);
	}
}

function d_hide(container) {
	cancel_timeouts(state);
	uiu.hide(container);
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
	d_update: d_update,
	d_hide: d_hide,
	on_style_change: on_style_change,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var control = require('./control');
	var displaymode = require('./displaymode');
	var i18n = require('./i18n');
	var report_problem = require('./report_problem');
	var settings = require('./settings');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = dads;
}
/*/@DEV*/
