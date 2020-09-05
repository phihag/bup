var importexport = (function() {
'use strict';

function load_data(s, data) {
	if (data.event && Array.isArray(data.event.matches)) {
		// Standard event format (documented in data_structures.txt)
		if (!data.version) {
			data.version = 2;
		}
	} else if (data.data && data.data.type === 'bup-export') {
		// bup export format
		data = data.data;
	} else {
		throw new Error(s._('importexport:not an export file'));
	}

	if (data.version >= 2) {
		eventutils.annotate(s, data.event);
		eventutils.set_incomplete(data.event);
	}

	return data;
}

function import_data(s, data) {
	var event_data = load_data(s, data);
	var event = event_data.event;
	if (! event) {
		event = {
			matches: [event_data],
		};
	}
	var snet = staticnet(event);
	network.ui_install_staticnet(s, snet);
}

function ui_import_json(s) {
	var container = uiu.qs('.import_link_container');
	var input = container.querySelector('input[type="file"]');
	if (input) {
		container.removeChild(input);
	}
	input = uiu.el(container, 'input', {
		type: 'file',
		accept: '.json',
		style: 'visibility: hidden; position: absolute',
	});
	input.addEventListener('change', function(ev) {
		var file = ev.target.files[0];
		var reader = new FileReader();
		reader.onload = function(e) {
			var input_json = e.target.result;

			// There seems to be a bug in some part of the export-sending that creates invalid JSON.
			// Fix it up.
			input_json = utils.replace_all(input_json, '\ufffd', '');

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
				report_problem.silent_error('Import error: ' + exc.message);
				alert(exc.message);
			}
		};
		reader.readAsText(file, 'UTF-8');
	});
	input.click();
}

function gen_export_data(s, include_debug) {
	var e = utils.deep_copy(s.event);
	if (e) {
		e.matches.forEach(function(m) {
			if (m.presses || m.presses_json) {
				return;
			}
			var stored = match_storage.load_match(m.setup.match_id);
			if (!stored) {
				return;
			}
			if (stored.presses) {
				m.presses_json = JSON.stringify(stored.presses);
			}
		});
	}
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
	var filename = (
		utils.iso8601(now) + ' ' +
		utils.timesecs_str(now.getTime()).replace(':', '-') +
		(name ? ' ' + name : '') +
		'.json'
	);
	var blob = new Blob([data_json], {type: 'application/json'});
	save_file(blob, filename);
}

function send_export(s) {
	var data = gen_export_data(s, true);
	report_problem.send_export(data);
}

function ui_init() {
	click.qs('.export_link', function() {
		ui_export_json(state);
	});

	click.qs('.export_link_nonet', function() {
		ui_export_json(state);
	});

	click.qs('.import_link', function() {
		ui_import_json(state);
	});

	click.qs('.settings_send_export', function(e) {
		e.preventDefault();
		var status = uiu.qs('.settings_footer_status');
		send_export(state);
		uiu.text(status, state._('importexport:export sent'));
		window.setTimeout(function() {
			uiu.text(status, '');
		}, 10000);
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
	var save_file = require('./save_file');
	var staticnet = require('./staticnet');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = importexport;
}
/*/@DEV*/