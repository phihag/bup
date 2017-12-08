'use strict';

class BTDEMock {
	constructor() {

	}

	handle(req, res, pathname) {
		console.log('BTDE mock: unhandled ', pathname);
	}
}

module.exports = {
	BTDEMock,
};
