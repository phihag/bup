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
	var container = document.querySelector('.import_link_container');
	var input = container.querySelector('input[type="file"]');
	if (input) {
		container.removeChild(input);
	}
	input = utils.create_el(container, 'input', {
		type: 'file',
		accept: '.json',
		style: 'visibility: hidden; position: absolute',
	});
	input.addEventListener('change', function(ev) {
		var file = ev.target.files[0];
		var reader = new FileReader();
		reader.onload = function(e) {
			var input_json = e.target.result;
			var input_data = JSON.parse(input_json);

			import_data(s, input_data);
		};
		reader.readAsText(file, 'UTF-8');
	});
	input.click();
}

function export_json(s) {
	var data = {
		type: 'bup-export',
		version: 1,
		event: s.event,
		setup: s.setup,
		presses: s.presses,
		settings: s.settings,
	};

	var data_json = JSON.stringify(data, undefined, 2);
	var name = s.event ? s.event.event_name : '';
	var now = new Date();
	var filename = utils.iso8601(now) + ' ' + utils.time_str(now.getTime()).replace(':', '-') + (name ? ' ' : '') + name + '.json';
	var blob = new Blob([data_json], {type: 'application/json'});
	saveAs(blob, filename);
}

function ui_init() {
	utils.on_click_qs('.export_link', function(e) {
		e.preventDefault();
		export_json(state);
		return false;
	});

	utils.on_click_qs('.import_link', function(e) {
		e.preventDefault();
		import_json(state);
		return false;
	});

}

return {
	ui_init: ui_init,
	export_json: export_json,
	import_json: import_json,
	load_data: load_data,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var network = require('./network');
	var staticnet = require('./staticnet');
	var utils = require('./utils');

	module.exports = importexport;
}
/*/@DEV*/