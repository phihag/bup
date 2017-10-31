'use strict';

document.addEventListener('DOMContentLoaded', function() {
	Reveal.initialize({
		transition: 'none',
		slideNumber: 'c',
		history: true,
		center: false,
	});

	document.querySelector('.next-slide').addEventListener('click', function() {
		Reveal.next();
	});
});
