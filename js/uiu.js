// ui utils
var uiu = (function() {
'use strict';

var esc_stack = [];
function esc_stack_push(cancel) {
	esc_stack.push(cancel);
	Mousetrap.bind('escape', function() {
		cancel();
	});
}

function esc_stack_pop() {
	esc_stack.pop();
	Mousetrap.unbind('escape');
	var cancel = esc_stack[esc_stack.length - 1];
	if (esc_stack.length > 0) {
		Mousetrap.bind('escape', function() {
			cancel();
		});
	}
}

function qsEach(selector, func) {
	var nodes = document.querySelectorAll(selector);
	for (var i = 0;i < nodes.length;i++) {
		func(nodes[i], i);
	}
}

function on_click(node, callback) {
	node.addEventListener('click', callback, false);
}

function on_click_qs(selector, callback) {
	on_click(qs(selector), callback);
}

function on_click_qsa(qs, callback) {
	qsEach(qs, function(node) {
		on_click(node, callback);
	});
}

function visible(node, val) {
	// TODO test adding/removing invisible class here
	if (val) {
		$(node).show();
	} else {
		$(node).hide();
	}
}

function qs(selector) {
	/*@DEV*/
	var all_nodes = document.querySelectorAll(selector);
	if (all_nodes.length !== 1) {
		throw new Error(all_nodes.length + ' nodes matched by qs ' + selector);
	}
	/*/@DEV*/

	var node = document.querySelector(selector);
	if (! node) {
		report_problem.silent_error('Expected to find qs  ' + selector + ' , but no node matching.');
		return;
	}
	return node;
}

function visible_qsa(selector, val) {
	var nodes = document.querySelectorAll(selector);
	for (var i = 0;i < nodes.length;i++) {
		visible(nodes[i], val);
	}
}

function visible_qs(selector, val) {
	visible(qs(selector), val);
}

function disabled_qsa(qs, val) {
	var nodes = document.querySelectorAll(qs);
	for (var i = 0;i < nodes.length;i++) {
		var n = nodes[i];
		if (val) {
			n.setAttribute('disabled', 'disabled');
			$(n).addClass('half-invisible');
		} else {
			n.removeAttribute('disabled');
			$(n).removeClass('half-invisible');
		}
	}
}

function empty(node) {
	var last;
	while ((last = node.lastChild)) {
		node.removeChild(last);
	}
}

function text(node, str) {
	empty(node);
	node.appendChild(node.ownerDocument.createTextNode(str));
}

function text_qs(selector, str) {
	text(qs(selector), str);
}

function create_el(parent, tagName, attrs, text) {
	var el = document.createElement(tagName);
	if (attrs) {
		for (var k in attrs) {
			el.setAttribute(k, attrs[k]);
		}
	}
	if (text) {
		el.appendChild(document.createTextNode(text));
	}
	parent.appendChild(el);
	return el;
}

return {
	create_el: create_el,
	disabled_qsa: disabled_qsa,
	empty: empty,
	esc_stack_pop: esc_stack_pop,
	esc_stack_push: esc_stack_push,
	on_click: on_click,
	on_click_qs: on_click_qs,
	on_click_qsa: on_click_qsa,
	qs: qs,
	qsEach: qsEach,
	text: text,
	text_qs: text_qs,
	visible: visible,
	visible_qs: visible_qs,
	visible_qsa: visible_qsa,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var report_problem = require('./report_problem');

	module.exports = uiu;
}
/*/@DEV*/
