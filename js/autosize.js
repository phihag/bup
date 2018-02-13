'use strict';
// resize fonts to fit a width
var autosize = (function() {

var tasks = {};
var task_id = 0;

function autosize_once(task, deferred) {
	if (typeof window === 'undefined') {
		// Testing
		return;
	}

	var el = task.el;
	var el_style = window.getComputedStyle(el, null);
	var current_style = el_style.getPropertyValue('font-size');
	if (!current_style && !deferred) {
		// Wait until rendered
		setTimeout(function() {
			autosize_once(task, true);
		});
	}
	var desired = task.desired_func(el);
	var current_width = el.offsetWidth;
	var current_height = el.offsetHeight;
	var m = /^([0-9.,]+)(\s*px)$/.exec(current_style);
	if (!m) {
		report_problem.silent_error('Could not parse font-size for autosizing: ' + current_style + ' (deferred: ' + JSON.stringify(deferred) + ')');
		return;
	}
	var cur_size = parseFloat(m[1].replace(',', '.'));
	var by_width = Math.floor(cur_size / (current_width / desired.width));
	var by_height = Math.floor(cur_size / (current_height / desired.height));
	var new_size = Math.min(by_width, by_height);
	el.style.fontSize = new_size + m[2];
}

// desired_func gets called with the element and must return a
// {width: .., height:..} object describing the maximum size.
function maintain(el, desired_func) {
	var task = {
		el: el,
		desired_func: desired_func,
		id: task_id,
	};
	tasks[task_id] = task;
	el.setAttribute('data-autosize-id', task_id);
	task_id++;
	autosize_once(task);
}

function unmaintain(el) {
	var as_id = el.getAttribute('data-autosize-id');
	if (!as_id) {
		report_problem.silent_error('Failed to unmaintain: Autosize not enabled on element');
		return;
	}
	delete tasks[as_id];
}

function unmaintain_all(container) {
	uiu.qsEach('[data-autosize-id]', unmaintain, container);
}

if (typeof window != 'undefined') {
	window.addEventListener('resize', function() {
		for (var k in tasks) {
			autosize_once(tasks[k]);
		}
	});
}

return {
	maintain: maintain,
	unmaintain_all: unmaintain_all,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var report_problem = require('./report_problem');
	var uiu = require('./uiu');

	module.exports = autosize;
}
/*/@DEV*/
