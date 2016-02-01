var importexport = (function() {
'use strict';

function export_json(s) {
	var data = {
		type: 'bup-export',
		version: 1,
		event: s.event,
		setup: s.setup,
		presses: s.presses,
		settings: s.settings,
	};

	var export_json = JSON.stringify(data, undefined, 2);
	var name = s.event ? s.event.event_name : '';
	var now = new Date();
	var filename = utils.iso8601(now) + ' ' + utils.time_str(now.getTime()).replace(':', '-') + (name ? ' ' : '') + name + '.json';
	var blob = new Blob([export_json], {type: 'application/json'});
	saveAs(blob, filename);
}

function ui_init() {
	utils.on_click_qs('.export_link', function(e) {
		e.preventDefault();
		export_json(state);
		return false;
	});
}

return {
	ui_init: ui_init,
	export_json: export_json,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var utils = require('./utils');

	module.exports = importexport;
}
/*/@DEV*/