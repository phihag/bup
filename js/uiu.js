'use strict';
// ui utils
var uiu = (function() {

function qsEach(selector, func, container) {
	if (!container) {
		container = document;
	}
	var nodes = container.querySelectorAll(selector);
	for (var i = 0;i < nodes.length;i++) {
		func(nodes[i], i);
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

function $visible(node, val) {
	// TODO test adding/removing invisible class here
	if (val) {
		$(node).show();
	} else {
		$(node).hide();
	}
}

function $visible_qsa(selector, val) {
	var nodes = document.querySelectorAll(selector);
	for (var i = 0;i < nodes.length;i++) {
		$visible(nodes[i], val);
	}
}

function $visible_qs(selector, val) {
	$visible(qs(selector), val);
}

function $hide_qs(selector) {
	$visible_qs(selector, false);
}

function $show_qs(selector) {
	$visible_qs(selector, true);
}

function $hide(node) {
	$visible(node, false);
}

function $show(node) {
	$visible(node, true);
}

function is_hidden(el) {
	// Fast track: look if style is set
	if (el.style.display === 'none') return true;
	if (el.style.display) return false;

	var cs = window.getComputedStyle(el);
	return (cs.display === 'none');
}

function hide(el) {
	var style = el.style;
	if (! is_hidden(el)) {
		if (style.display) {
			el.setAttribute('data-uiu-display', style.display);
		}
		style.display = 'none';
	}
}

function show(el) {
	var style = el.style;
	removeClass(el, 'default-invisible');
	if (is_hidden(el)) {
		style.display = el.getAttribute('data-uiu-display');
		el.removeAttribute('data-uiu-display');
	}
}

function visible(el, val) {
	if (val) {
		show(el);
	} else {
		hide(el);
	}
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

function disabled_qsa(qs, is_disabled) {
	var nodes = document.querySelectorAll(qs);
	for (var i = 0;i < nodes.length;i++) {
		var n = nodes[i];
		if (is_disabled) {
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
	if ((str !== undefined) && (str !== null)) {
		node.appendChild(node.ownerDocument.createTextNode(str));
	}
}

function text_qs(selector, str) {
	text(qs(selector), str);
}

function attr(el, init_attrs) {
	if (init_attrs) {
		for (var k in init_attrs) {
			el.setAttribute(k, init_attrs[k]);
		}
	}
}

function ns_el(parent, ns, tagName, init_attrs, text) {
	var doc = parent ? parent.ownerDocument : document;
	var el = doc.createElementNS(ns, tagName);
	attr(el, init_attrs);
	if ((text !== undefined) && (text !== null)) {
		el.appendChild(doc.createTextNode(text));
	}
	if (parent) {
		parent.appendChild(el);
	}
	return el;
}

function el(parent, tagName, init_attrs, text) {
	var doc = parent ? parent.ownerDocument : document;
	var el = doc.createElement(tagName);
	if (typeof init_attrs === 'string') {
		init_attrs = {
			'class': init_attrs,
		};
	}
	attr(el, init_attrs);
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

function setClass_qs(selector, className, enabled) {
	setClass(qs(selector), className, enabled);
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

function mark_disabled(el, is_enabled) {
	if (is_enabled) {
		el.removeAttribute('disabled');
	} else {
		el.setAttribute('disabled', 'disabled');
	}
}

function fadeout(el, timeout) {
	var now = ((window.performance && window.performance.now) ? function() {
		return window.performance.now();
	} : Date.now);
	var rfa = (window.requestAnimationFrame ? window.requestAnimationFrame : function(cb) {
		setTimeout(cb, 16);
	});

	var start = now();
	var style = el.style;
	style.opacity = 1;

	function step() {
		var cur = now() - start;
		if (cur >= timeout) {
			style.opacity = '';
			hide(el);
		} else {
			style.opacity = 0.5 + Math.cos((cur / timeout) * Math.PI) / 2;
			rfa(step);
		}
	}
	rfa(step);
}

return {
	addClass: addClass,
	addClass_qs: addClass_qs,
	attr: attr,
	closest: closest,
	closest_class: closest_class,
	disabled_qsa: disabled_qsa,
	empty: empty,
	el: el,
	fadeout: fadeout,
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
	setClass_qs: setClass_qs,
	mark_disabled: mark_disabled,
	show: show,
	show_qs: show_qs,
	text: text,
	text_qs: text_qs,
	visible: visible,
	visible_qs: visible_qs,
	visible_qsa: visible_qsa,
	$show: $show,
	$show_qs: $show_qs,
	$hide: $hide,
	$hide_qs: $hide_qs,
	$visible: $visible,
	$visible_qs: $visible_qs,
	$visible_qsa: $visible_qsa,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var report_problem = null; // avoid circular import, should really be require('./report_problem');

	module.exports = uiu;
}
/*/@DEV*/
