// resize fonts to fit a width
var autosize = (function() {
'use strict';

var tasks = [];


function autosize_once(task) {
	var el = task.el;
	var desired = task.desired_func(el);

	var current_width = el.offsetWidth;
	var current_height = el.offsetHeight;
	var el_style = window.getComputedStyle(el, null);
	var current_style = el_style.getPropertyValue('font-size');
	var m = /^([0-9.]+)(\s*px)$/.exec(current_style);
	if (!m) {
		report_problem.silent_error('Could not parse font-size for autosizing: ' + current_style);
		return;
	}
	var by_width = Math.floor(parseFloat(m[1]) / (current_width / desired.width));
	var by_height = Math.floor(parseFloat(m[1]) / (current_height / desired.height));
	var new_size = Math.min(by_width, by_height);
	el.style.fontSize = new_size + m[2];
}

// desired_func gets called with the element and must return a
// {width: .., height:..} object describing the maximum size.
function maintain(el, desired_func) {
	var task = {
		el: el,
		desired_func: desired_func,
	};
	tasks.push(task);
	autosize_once(task);
	return function() {
		utils.remove(tasks, task);
	};
}

if (typeof window != 'undefined') {
	window.addEventListener('resize', function() {
		tasks.forEach(function(task) {
			autosize_once(task);
		});
	});
}

return {
	maintain: maintain,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var report_problem = require('./report_problem');
	var utils = require('./utils');

	module.exports = autosize;
}
/*/@DEV*/
