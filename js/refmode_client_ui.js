'use strict';

var refmode_client_ui = (function() {
var rc;
var abort_list;
var node_id;

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

function store_paired_referees() {
	try {
		localStorage.setItem('bup_refclient_paired', JSON.stringify(rc.get_paired_referees()));
	} catch(e) {
		report_problem.silent_error('Cannot store paired referees: ' + e.message);
	}
}

function get_node_id() {
	if (node_id) {
		return node_id;
	}

	try {
		node_id = localStorage.getItem('bup_refclient_node_id');
		if (node_id) {
			return node_id;
		}
	} catch (e) {
		// Ignore, generate a new one
	}
	node_id = utils.uuid();
	try {
		localStorage.setItem('bup_refclient_node_id', node_id);
	} catch(e) {
		// Sucks, but at least we're keeping the node_id for this browser session
	}
	return node_id;
}

function connect_button_click(e) {
	var ref_fp = e.target.getAttribute('data-fp');
	var paired = rc.get_paired_referees();
	if (paired.indexOf(ref_fp) >= 0) {
		rc.disconnect_referee(ref_fp);
	} else {
		rc.connect_to_referee(ref_fp);
	}

	store_paired_referees();
	update_ref_display(state);
	set_list(state, false);
}

function list_handler(referee_list) {
	var paired = rc.get_paired_referees();
	var list_el = uiu.qs('.refmode_client_referee_list');
	uiu.empty(list_el);
	if (referee_list.length === 0) {
		uiu.text(list_el, state._('refmode:client:no_referees'));
	}
	referee_list.forEach(function(ref) {
		var div = uiu.create_el(list_el, 'div');
		var attrs = {
			'data-fp': ref.fp,
		};
		if (paired.indexOf(ref.fp) >= 0) {
			attrs['data-paired'] = 'true';
		}
		var span = uiu.create_el(div, 'span', attrs, ref.fp);
		click.on(span, connect_button_click);
	});
}

function update_status_str(s) {
	uiu.text_qs('.refmode_status', rc.status_str(s));
}

function handle_change(estate) {
	if (estate.status === 'enabled') {
		uiu.visible_qs('.refmode_client_redir', !!estate.local_addr);
		if (estate.local_addr) {
			uiu.text_qs('.refmode_client_redir_url', estate.local_addr);
		}
	}
	update_status_str(state);
}

function on_settings_change(s) {
	if (!rc) {
		var initial_paired_refs;
		try {
			initial_paired_refs = JSON.parse(localStorage.getItem('bup_refclient_paired'));
		} catch(e) {
			// Ignore error
		}
		if (! initial_paired_refs) {
			initial_paired_refs = [];
		}

		s.refclient_node_id = get_node_id();
		rc = refmode_client(s, handle_change, initial_paired_refs);
	}

	var enabled = rc.on_settings_change(s);
	if (enabled) {
		network.ui_install_refmode_client(rc);
		rc.notify_changed_settings(s);
	} else {
		network.ui_uninstall_refmode_client();
	}
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

function on_event_update() {
	if (rc) {
		rc.on_event_update();
	}
}

return {
	on_settings_change: on_settings_change,
	on_event_update: on_event_update,
	ui_init: ui_init,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var network = require('./network');
	var refmode_client = require('./refmode_client');
	var report_problem = require('./report_problem');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = refmode_client_ui;
}
/*/@DEV*/
