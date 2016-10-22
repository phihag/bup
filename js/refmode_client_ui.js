'use strict';

var refmode_client_ui = (function() {
var rc;
var abort_list;

function update_ref_display(s) {
	var paired = rc.get_paired_referees();
	var paired_el = uiu.qs('.refmode_client_paired');
	if (paired.length > 0) {
		uiu.text(paired_el, s._('refmode:client:paired', {
			refs_str: paired.join(', '),
		}));
	} else {
		uiu.text(paired_el, s._('refmode:client:paired:none'));
	}
}

function connect_button_click(e) {
	var ref_fp = e.target.getAttribute('data-fp');
	rc.connect_to_referee(ref_fp);
	update_ref_display(state);
	set_list(state, false);
}

function list_handler(referee_list) {
	var list_el = uiu.qs('.refmode_client_referee_list');
	uiu.empty(list_el);
	if (referee_list.length === 0) {
		uiu.text(list_el, state._('refmode:client:no_referees'));
	}
	referee_list.forEach(function(ref) {
		var div = uiu.create_el(list_el, 'div');
		var span = uiu.create_el(div, 'span', {
			'data-fp': ref.fp,
		}, ref.fp);
		click.on(span, connect_button_click);
	});
}

function update_status_str(s) {
	uiu.text_qs('.refmode_status', rc.status_str(s));
}

function handle_change(estate) {
	network.errstate('refmode.client.ws', ((estate.status === 'error') ? estate : null));
	update_status_str(state);
}

function on_settings_change(s) {
	if (!rc) {
		rc = refmode_client(handle_change);
	}
	rc.on_settings_change(s);
}

function ui_init(s) {
	update_ref_display(s);
	on_settings_change(s);

	click.qs('.refmode_client_selref', function() {
		list_button_click(s);
	});
}

function list_button_click(s) {
	set_list(s, !abort_list);
}

function set_list(s, enabled) {
	var btn = uiu.qs('.refmode_client_selref');

	if (enabled) {
		if (!abort_list) {
			list_handler([]);
			abort_list = rc.list_referees(list_handler);
		}
	} else {
		if (abort_list) {
			abort_list();
			abort_list = null;
		}
	}
	var i18n = enabled ? 'refmode:client:no_select_referee' : 'refmode:client:select_referee';
	btn.setAttribute('data-i18n', i18n);
	uiu.text(btn, s._(i18n));
	uiu.visible_qs('.refmode_client_referee_list', enabled);
}

return {
	on_settings_change: on_settings_change,
	ui_init: ui_init,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var network = require('./network');
	var uiu = require('./uiu');
	var refmode_client = require('./refmode_client');

	module.exports = refmode_client_ui;
}
/*/@DEV*/
