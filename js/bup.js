var state = {
	initialized: false,
	ui: {},
};
var networks = {};

(function() {
'use strict';

function init() {
	state.settings = settings.load();
}

function ui_init() {
	var bup_version = 'dev';
	$('.version').text(bup_version);

	appcache.ui_init();
	$('#script_jspdf').on('load', scoresheet.jspdf_loaded);

	editmode.ui_init();
	scoresheet.ui_init();
	network.ui_init();
	timer.ui_init();
	control.ui_init();
	startmatch.ui_init();
	settings.ui_init();

	var hash_query = utils.parse_query_string(window.location.hash.substr(1));
	if (hash_query.court) {
		// TODO make sure this is only for the current session, only overwrite settings when necessary
		state.settings.court_id = hash_query.court;
		if (state.settings.court_id == '1') {
			state.settings.court_description = 'links';
		} else if (state.settings.court_id == '2') {
			state.settings.court_description = 'rechts';
		}
		settings.update();
	}
	if (hash_query.courtspot !== undefined) {
		networks.courtspot = courtspot();
		networks.courtspot.ui_init(state);
	} else if (hash_query.btde !== undefined) {
		networks.btde = btde();
		networks.btde.ui_init(state, hash_query);
	}

	control.load_by_hash();

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
	var utils = require('./utils');
	var calc = require('./calc');
	var appcache = require('./appcache');
	var timer = require('./timer');
	var editmode = require('./editmode');
	var fullscreen = require('./fullscreen');
	var scoresheet = require('./scoresheet');
	var network = require('./network');
	var btde = require('./btde');
	var courtspot = require('./courtspot');
	var settings = require('./settings');
	var pronounciation = require('./pronounciation');
	var control = require('./control');
	var startmatch = require('./startmatch');

	module.exports = {
		calc: calc,
		btde: btde,
		courtspot: courtspot,
		network: network,
		pronounciation: pronounciation,
		scoresheet: scoresheet,
		utils: utils,
	};
}
/*/@DEV*/
