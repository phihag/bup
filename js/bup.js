var state = {
	initialized: false,
	ui: {},
};
var bup_version = 'dev';

(function() {
'use strict';

function init() {
	i18n.init();
	i18n.ui_update_state(state);
	register_sworker();
	state.settings = settings.load();
	fullscreen.update_fullscreen_button();
}

function ui_init() {
	compat.ui_init();
	i18n.ui_init();

	uiu.text_qs('.version', bup_version);

	$('#script_jspdf').on('load', function() {
		scoresheet.jspdf_loaded();
		setupsheet.jspdf_loaded();
	});
	$('#script_pdfform').on('load', eventsheet.loaded('pdfform'));
	$('#script_jszip').on('load', eventsheet.loaded('jszip'));

	report_problem.ui_init(); // First because it reports problems in all other modules
	dads.ui_init(state); // Most be before settings

	editmode.ui_init();
	scoresheet.ui_init();
	timer.ui_init();
	control.ui_init();
	startmatch.ui_init();
	settings.ui_init(state);
	eventsheet.ui_init();
	stats.ui_init();
	order.ui_init();
	importexport.ui_init();
	urlimport.ui_init();
	editevent.ui_init();
	setupsheet.ui_init();
	shortcuts.ui_init(state);
	refmode_client_ui.ui_init(state);
	refmode_referee_ui.ui_init();
	printing.set_orientation('landscape');

	var hash_query = utils.parse_query_string(window.location.hash.substr(1));
	if (hash_query.lang) {
		settings.change(state, 'language', hash_query.lang);
	}
	var hub_url = hash_query.hub_url;
	if (hub_url) {
		settings.change_all(state, {
			refmode_client_ws_url: hub_url,
			refmode_referee_ws_url: hub_url,
		});
	}
	displaymode.ui_init(state, hash_query);
	network.ui_init(state, hash_query);
	buphistory.ui_init();
	buphistory.kickoff();

	if (state.settings.go_fullscreen) {
		fullscreen.autostart();
	}
}

/*@DEV*/
if (typeof module === 'undefined') {
/*/@DEV*/
	init();
	document.addEventListener('DOMContentLoaded', ui_init);
/*@DEV*/
}
/*/@DEV*/

})();

/* @DEV */
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var btde = require('./btde');
	var buphistory = require('./buphistory');
	var calc = require('./calc');
	var compat = require('./compat');
	var control = require('./control');
	var courtspot = require('./courtspot');
	var dads = require('./dads');
	var displaymode = require('./displaymode');
	var editevent = require('./editevent');
	var editmode = require('./editmode');
	var eventutils = require('./eventutils');
	var extradata = require('./extradata');
	var eventsheet = require('./eventsheet');
	var fullscreen = require('./fullscreen');
	var i18n = require('./i18n');
	var importexport = require('./importexport');
	var key_utils = require('./key_utils');
	var network = require('./network');
	var order = require('./order');
	var p2p = require('./p2p');
	var printing = require('./printing');
	var pronunciation = require('./pronunciation');
	var refmode_client = require('./refmode_client');
	var refmode_client_ui = require('./refmode_client_ui');
	var refmode_referee = require('./refmode_referee');
	var refmode_referee_ui = require('./refmode_referee_ui');
	var register_sworker = require('./register_sworker');
	var report_problem = require('./report_problem');
	var scoresheet = require('./scoresheet');
	var settings = require('./settings');
	var setupsheet = require('./setupsheet');
	var shortcuts = require('./shortcuts');
	var startmatch = require('./startmatch');
	var stats = require('./stats');
	var svg2pdf = require('./svg2pdf');
	var svg_utils = require('./svg_utils');
	var timer = require('./timer');
	var uiu = require('./uiu');
	var urlimport = require('./urlimport');
	var utils = require('./utils');
	var xlsx = require('./xlsx');

	module.exports = {
		btde: btde,
		calc: calc,
		courtspot: courtspot,
		displaymode: displaymode,
		eventsheet: eventsheet,
		eventutils: eventutils,
		extradata: extradata,
		i18n: i18n,
		importexport: importexport,
		key_utils: key_utils,
		network: network,
		order: order,
		p2p: p2p,
		pronunciation: pronunciation,
		refmode_client: refmode_client,
		refmode_referee: refmode_referee,
		scoresheet: scoresheet,
		setupsheet: setupsheet,
		stats: stats,
		svg2pdf: svg2pdf,
		svg_utils: svg_utils,
		timer: timer,
		uiu: uiu,
		utils: utils,
		xlsx: xlsx,
	};
}
/*/@DEV*/
