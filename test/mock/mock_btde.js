'use strict';

const httpd_utils = require('./httpd_utils');

class BTDEMock {
	constructor() {
		this.handler = httpd_utils.multi_handler([
			httpd_utils.redirect_handler('/', 'ticker/login/start.php'),
			httpd_utils.redirect_handler('/ticker/login/', 'ticker/login/start.php'),

			(req, res, pathname) => {
				console.log('BTDE mock: unhandled ', pathname);
			},
		]);
	}

	start_handler(req, res) {
		console.log('BTDE Mock: start handler', res);
		// TODO if not logged in: redirect to
	}
}

module.exports = {
	BTDEMock,
};
