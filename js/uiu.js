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

function qsEach(selector, func, container) {
	if (!container) {
		container = document;
	}
	var nodes = container.querySelectorAll(selector);
	for (var i = 0;i < nodes.length;i++) {
		func(nodes[i], i);
	}
}

function visible(node, val) {
	// TODO test adding/removing invisible class here
	if (val) {
		$(node).show();
	} else {
		$(node).hide();
	}
}

function qs(selector, container) {
	if (! container) {
		container = document;
	}

	/*@DEV*/
	var all_nodes = container.querySelectorAll(selector);
	if (all_nodes.length !== 1) {
		throw new Error(all_nodes.length + ' nodes matched by qs ' + selector);
	}
	/*/@DEV*/

	var node = container.querySelector(selector);
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

function hide_qs(selector) {
	visible_qs(selector, false);
}

function show_qs(selector) {
	visible_qs(selector, true);
}

function hide(node) {
	visible(node, false);
}

function show(node) {
	visible(node, true);
}

function disabled_qsa(qs, val) {
	var nodes = document.querySelectorAll(qs);
	for (var i = 0;i < nodes.length;i++) {
		var n = nodes[i];
		if (val) {
			n.setAttribute('disabled', 'disabled');
			addClass(n, 'half-invisible');
		} else {
			n.removeAttribute('disabled');
			removeClass(n, 'half-invisible');
		}
	}
}

function empty(node) {
	var last;
	while ((last = node.lastChild)) {
		node.removeChild(last);
	}
}

function remove(node) {
	empty(node);
	node.parentNode.removeChild(node);
}

function remove_qsa(qs, container) {
	qsEach(qs, remove, container);
}

function text(node, str) {
	empty(node);
	node.appendChild(node.ownerDocument.createTextNode(str));
}

function text_qs(selector, str) {
	text(qs(selector), str);
}

function ns_el(parent, ns, tagName, attrs, text) {
	var doc = parent ? parent.ownerDocument : document;
	var el = doc.createElementNS(ns, tagName);
	if (attrs) {
		for (var k in attrs) {
			el.setAttribute(k, attrs[k]);
		}
	}
	if ((text !== undefined) && (text !== null)) {
		el.appendChild(doc.createTextNode(text));
	}
	if (parent) {
		parent.appendChild(el);
	}
	return el;
}

function el(parent, tagName, attrs, text) {
	var doc = parent ? parent.ownerDocument : document;
	var el = doc.createElement(tagName);
	if (attrs) {
		if (typeof attrs === 'string') {
			attrs = {
				'class': attrs,
			};
		}
		for (var k in attrs) {
			el.setAttribute(k, attrs[k]);
		}
	}
	if ((text !== undefined) && (text !== null)) {
		el.appendChild(doc.createTextNode(text));
	}
	if (parent) {
		parent.appendChild(el);
	}
	return el;
}

// From https://plainjs.com/javascript/attributes/adding-removing-and-testing-for-classes-9/
var hasClass, addClass, removeClass;
if (typeof document != 'undefined') {
	if ('classList' in document.documentElement) {
		hasClass = function(el, className) {
			return el.classList.contains(className);
		};
		addClass = function(el, className) {
			el.classList.add(className);
		};
		removeClass = function(el, className) {
			el.classList.remove(className);
		};
	} else {
		hasClass = function (el, className) {
			return new RegExp('\\b'+ className+'\\b').test(el.className);
		};
		addClass = function (el, className) {
			if (!hasClass(el, className)) {
				el.className += ' ' + className;
			}
		};
		removeClass = function (el, className) {
			el.className = el.className.replace(new RegExp('\\b' + className + '\\b', 'g'), '');
		};
	}
}

function addClass_qs(selector, className) {
	return addClass(qs(selector), className);
}

function removeClass_qs(selector, className) {
	return removeClass(qs(selector), className);
}

function setClass(el, className, enabled) {
	if (enabled) {
		addClass(el, className);
	} else {
		removeClass(el, className);
	}
}

function closest(el, cb) {
	while (el) {
		if (cb(el)) {
			return el;
		}
		el = el.parentNode;
	}
}

function closest_class(el, className) {
	return closest(el, function(node) {
		// nodeType != 1: not an element (i.e. document)
		return (node.nodeType === 1) && hasClass(node, className);
	});
}

return {
	addClass: addClass,
	addClass_qs: addClass_qs,
	closest: closest,
	closest_class: closest_class,
	disabled_qsa: disabled_qsa,
	empty: empty,
	el: el,
	esc_stack_pop: esc_stack_pop,
	esc_stack_push: esc_stack_push,
	hasClass: hasClass,
	hide: hide,
	hide_qs: hide_qs,
	ns_el: ns_el,
	qs: qs,
	qsEach: qsEach,
	remove: remove,
	remove_qsa: remove_qsa,
	removeClass: removeClass,
	removeClass_qs: removeClass_qs,
	setClass: setClass,
	show: show,
	show_qs: show_qs,
	text: text,
	text_qs: text_qs,
	visible: visible,
	visible_qs: visible_qs,
	visible_qsa: visible_qsa,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var report_problem = null; // avoid circular import, should really be require('./report_problem');

	module.exports = uiu;
}
/*/@DEV*/
