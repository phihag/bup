'use strict';

document.addEventListener('DOMContentLoaded', function() {
	Reveal.initialize({
		transition: 'none',
		slideNumber: 'c',
		history: true,
		center: false,
	});

	document.querySelector('body').addEventListener('click', function(e) {
		var el = e.target;
		do {
			var tagName = el.tagName.toLowerCase();
			if ((tagName === 'a') || (tagName === 'button')) {
				return;
			}
		} while ((el = el.parentNode) && (el.nodeType === 1));

		Reveal.next();
	});
});
