var importexport = (function() {
'use strict';

function load_data(data) {
	return data;
}

function import_data(s, data) {
	var event = load_data(data).event;
	var snet = staticnet(event);
	network.ui_install_staticnet(s, snet);
}

function import_json(s) {
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
			var input_data;
			try {
				input_data = JSON.parse(input_json);
			} catch (jsone) {
				alert(s._('importexport:invalid JSON', {
					msg: jsone.message,
				}));
				return;
			}
			if (input_data.type !== 'bup-export') {
				alert(s._('importexport:not an export file'));
				return;
			}

			import_data(s, input_data);
		};
		reader.readAsText(file, 'UTF-8');
	});
	input.click();
}

function gen_export_data(s) {
	return {
		type: 'bup-export',
		version: 1,
		event: s.event,
		setup: s.setup,
		presses: s.presses,
		netstats: netstats.all_stats,
		settings: s.settings,
	};
}

function export_json(s) {
	var data = gen_export_data(s);
	var data_json = JSON.stringify(data, undefined, 2);
	var name = s.event ? s.event.event_name : '';
	var now = new Date();
	var filename = utils.iso8601(now) + ' ' + utils.time_str(now.getTime()).replace(':', '-') + (name ? ' ' : '') + name + '.json';
	var blob = new Blob([data_json], {type: 'application/json'});
	saveAs(blob, filename);
}

function send_export(s) {
	var data = gen_export_data(s);
	report_problem.send_export(data);
}

function ui_init() {
	uiu.on_click_qs('.export_link', function(e) {
		e.preventDefault();
		export_json(state);
		return false;
	});

	uiu.on_click_qs('.import_link', function(e) {
		e.preventDefault();
		import_json(state);
		return false;
	});

	uiu.on_click_qs('.settings_send_export', function(e) {
		e.preventDefault();
		send_export(state);
	});
}

return {
	ui_init: ui_init,
	export_json: export_json,
	import_json: import_json,
	load_data: load_data,
	send_export: send_export,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var netstats = require('./netstats');
	var network = require('./network');
	var report_problem = require('./report_problem');
	var staticnet = require('./staticnet');
	var uiu = require('./uiu');
	var utils = require('./utils');

	module.exports = importexport;
}
/*/@DEV*/