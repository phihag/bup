var importexport = (function() {
'use strict';

function load_data(s, data) {
	if (data.data && data.data.type === 'bup-export') {
		data = data.data;
	}
	if (data.type !== 'bup-export') {
		throw new Error(s._('importexport:not an export file'));
	}

	if (data.version >= 2) {
		eventutils.annotate(s, data.event);
	}

	return data;
}

function import_data(s, data) {
	var event = load_data(s, data).event;
	var snet = staticnet(event);
	network.ui_install_staticnet(s, snet);
}

function ui_import_json(s) {
	var container = uiu.qs('.import_link_container');
	var input = container.querySelector('input[type="file"]');
	if (input) {
		container.removeChild(input);
	}
	input = uiu.create_el(container, 'input', {
		type: 'file',
		accept: '.json',
		style: 'visibility: hidden; position: absolute',
	});
	input.addEventListener('change', function(ev) {
		var file = ev.target.files[0];
		var reader = new FileReader();
		reader.onload = function(e) {
			var input_json = e.target.result;
			try {
				var input_data;
				try {
					input_data = JSON.parse(input_json);
				} catch (jsone) {
					throw new Error(s._('importexport:invalid JSON', {
						msg: jsone.message,
					}));
				}

				import_data(s, input_data);
			} catch (exc) {
				alert(exc.message);
			}
		};
		reader.readAsText(file, 'UTF-8');
	});
	input.click();
}

function gen_export_data(s, include_debug) {
	var e = utils.deep_copy(s.event);
	e.matches.forEach(function(m) {
		if (m.presses || m.presses_json) {
			return;
		}
		var stored = match_storage.get(m.setup.match_id);
		if (!stored) {
			return;
		}
		if (stored.presses) {
			m.presses_json = JSON.stringify(stored.presses);
		}
	});
	var res = {
		type: 'bup-export',
		version: 1,
		event: e,
	};
	if (include_debug) {
		utils.obj_update(res, report_problem.get_info());
	}
	return res;
}

function ui_export_json(s) {
	var data = gen_export_data(s, true);
	var data_json = JSON.stringify(data, undefined, 2);
	var name = s.event ? s.event.event_name : '';
	var now = new Date();
	var filename = utils.iso8601(now) + ' ' + utils.time_str(now.getTime()).replace(':', '-') + (name ? ' ' : '') + name + '.json';
	var blob = new Blob([data_json], {type: 'application/json'});
	saveAs(blob, filename);
}

function send_export(s) {
	var data = gen_export_data(s, true);
	report_problem.send_export(data);
}

function ui_init() {
	click.qs('.export_link', function(e) {
		e.preventDefault();
		ui_export_json(state);
		return false;
	});

	click.qs('.import_link', function(e) {
		e.preventDefault();
		ui_import_json(state);
		return false;
	});

	click.qs('.settings_send_export', function(e) {
		e.preventDefault();
		var status = uiu.qs('.settings_footer_status');
		send_export(state);
		uiu.text(status, state._('importexport:export sent'));
		window.setTimeout(function() {
			uiu.text(status, '');
		}, 2000);
	});
}

return {
	ui_init: ui_init,
	ui_export_json: ui_export_json,
	ui_import_json: ui_import_json,
	load_data: load_data,
	send_export: send_export,
	gen_export_data: gen_export_data,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var click = require('./click');
	var eventutils = require('./eventutils');
	var match_storage = require('./match_storage');
	var network = require('./network');
	var report_problem = require('./report_problem');
	var staticnet = require('./staticnet');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = importexport;
}
/*/@DEV*/