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
}

function ui_init() {
	compat.ui_init();
	i18n.ui_init();

	uiu.text_qs('.version', bup_version);

	appcache.ui_init();
	$('#script_jspdf').on('load', scoresheet.jspdf_loaded);
	$('#script_pdfform').on('load', eventsheet.loaded('pdfform'));
	$('#script_jszip').on('load', eventsheet.loaded('jszip'));

	report_problem.ui_init();
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
	editevent.ui_init();
	displaymode.ui_init();
	shortcuts.ui_init(state);

	var hash_query = utils.parse_query_string(window.location.hash.substr(1));
	if (hash_query.lang) {
		state.settings.language = hash_query.lang;
		settings.update(state);
	}
	network.ui_init(state, hash_query);
	buphistory.ui_init();
	buphistory.kickoff();

	if (state.settings.go_fullscreen) {
		fullscreen.autostart();
	}

	if (hash_query.updated !== undefined) {
		appcache.on_post_update(bup_version);
	}
}

/*@DEV*/
if (typeof $ !== 'undefined') {
/*/@DEV*/
	init();
	$(ui_init);
/*@DEV*/
}
/*/@DEV*/

})();

/* @DEV */
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var appcache = require('./appcache');
	var btde = require('./btde');
	var buphistory = require('./buphistory');
	var calc = require('./calc');
	var compat = require('./compat');
	var control = require('./control');
	var courtspot = require('./courtspot');
	var displaymode = require('./displaymode');
	var editevent = require('./editevent');
	var editmode = require('./editmode');
	var eventutils = require('./eventutils');
	var eventsheet = require('./eventsheet');
	var fullscreen = require('./fullscreen');
	var i18n = require('./i18n');
	var importexport = require('./importexport');
	var network = require('./network');
	var order = require('./order');
	var p2p = require('./p2p');
	var pronunciation = require('./pronunciation');
	var register_sworker = require('./register_sworker');
	var report_problem = require('./report_problem');
	var scoresheet = require('./scoresheet');
	var settings = require('./settings');
	var shortcuts = require('./shortcuts');
	var startmatch = require('./startmatch');
	var stats = require('./stats');
	var timer = require('./timer');
	var uiu = require('./uiu');
	var utils = require('./utils');
	var xlsx = require('./xlsx');

	module.exports = {
		btde: btde,
		calc: calc,
		courtspot: courtspot,
		eventutils: eventutils,
		i18n: i18n,
		importexport: importexport,
		network: network,
		order: order,
		p2p: p2p,
		pronunciation: pronunciation,
		scoresheet: scoresheet,
		stats: stats,
		utils: utils,
		xlsx: xlsx,
	};
}
/*/@DEV*/
