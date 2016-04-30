var netstats = (function() {
'use strict';

var now = (((typeof window != 'undefined') && window.performance) ? function() {
	return window.performance.now();
} : Date.now);

var all_stats = {};

function get_stats(component)  {
	var res = all_stats[component];
	if (!res) {
		res = {
			'<25ms': 0,
			'<100ms': 0,
			'<250ms': 0,
			'<500ms': 0,
			'<2s': 0,
			'<8s': 0,
			'>8s': 0,
			'latency_sum': 0,
			'count': 0,
			'failed_net_count': 0,
			'failed_srv_count': 0,
			'success_net_count': 0,
		};
		all_stats[component] = res;
	}
	return res;
}

// Returns a callback to be called after the request
function pre_request(component) {
	var start = now();
	return function(arg1, _textStatus, arg3) {
		var duration = now() - start;
		var stats = get_stats(component);

		stats.latency_sum += duration;
		stats.count++;

		if (duration < 25) {
			stats['<25ms']++;
		} else if (duration < 100) {
			stats['<100ms']++;
		} else if (duration < 250) {
			stats['<250ms']++;
		} else if (duration < 500) {
			stats['<500ms']++;
		} else if (duration < 2000) {
			stats['<2s']++;
		} else if (duration < 8000) {
			stats['<8s']++;
		} else {
			stats['>8s']++;
		}

		// Depending on whether success or failure, the arguments will have different meanings
		var status = (typeof arg1.status == 'number') ? arg1.status : arg3.status;
		if (status === 200) {
			stats.success_net_count++;
		} else if (status === 0) {
			stats.failed_net_count++;
		} else {
			stats.failed_srv_count++;
		}

		if (state.ui.netstats_visible) {
			render_table();
		}
	};
}

function render_table() {
	var components = Object.keys(all_stats);
	components.sort();
	var cols = components.map(function(component) {
		var cstats = all_stats[component];
		cstats.label = component;
		cstats.latency_avg_str = (cstats.count > 0) ? (Math.round(cstats.latency_sum / cstats.count) + ' ms') : '-';
		return cstats;
	});
	uiu.visible_qs('.netstats_empty', cols.length === 0);

	var table = {
		cols: cols,
		labels: [],
		keys: [
			'<25ms',
			'<100ms',
			'<250ms',
			'<500ms',
			'<2s',
			'<8s',
			'>8s',
			'latency_avg_str',
			'failed_net_count',
			'failed_srv_count',
			'success_net_count',
		],
	};
	stats.render_table($('.netstats_table'), table);
}

function show() {
	if (state.ui.netstats_visible) {
		return;
	}

	render.hide();
	settings.hide(true);

	state.ui.netstats_visible = true;
	uiu.esc_stack_push(hide);
	control.set_current(state);

	uiu.visible_qs('.netstats_layout', true);
	render_table();
}

function hide() {
	if (! state.ui.netstats_visible) {
		return;
	}

	uiu.esc_stack_pop();
	uiu.visible_qs('.netstats_layout', false);
	state.ui.netstats_visible = false;
	control.set_current(state);
	settings.show();
}

function ui_init() {
	var link = uiu.qs('.netstats_link');
	uiu.visible(link, true);
	uiu.on_click(link, function(e) {
		e.preventDefault();
		show();
		return false;
	});

	uiu.on_click_qs('.netstats_back', function(e) {
		e.preventDefault();
		hide();
		return false;
	});

	var black = uiu.qs('.netstats_layout');
	uiu.on_click(black, function(e) {
		if (e.target === black) {
			hide();
		}
	});

	uiu.on_click_qs('.netstats_resync', network.resync);
}

return {
	pre_request: pre_request,
	all_stats: all_stats,
	show: show,
	hide: hide,
	ui_init: ui_init,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var control = require('./control');
	var network = require('./network');
	var render = require('./render');
	var settings = require('./settings');
	var stats = require('./stats');
	var uiu = require('./uiu');

	module.exports = netstats;
}
/*/@DEV*/