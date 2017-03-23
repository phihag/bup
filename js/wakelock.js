var wakelock = (function() {
'use strict';

var WAKELOCK_DISABLE = true;
var _video;

function should(s) {
	if (WAKELOCK_DISABLE) return false;
	switch (s.settings.wakelock) {
	case 'always':
		return true;
	case 'display':
		return settings.get_mode(s) === 'display';
	case 'never':
	default:
		return false;
	}
}

function update(s) {
	if (! should(s)) {
		if (_video) {
			_video.pause();
			_video.parentNode.removeChild(_video);
			_video = null;
		}
		return;
	}

	if (!_video) {
		_video = uiu.el(uiu.qs('body'), 'video', {
			autoplay: 'autoplay',
			src: 'div/wakelock.mp4',
			loop: 'loop',
		});
	} else {
		_video.play();
	}
}

return {
	update: update,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var uiu = require('./uiu');
	var settings = require('./settings');

	module.exports = wakelock;
}
/*/@DEV*/
