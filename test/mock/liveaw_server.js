var url = require('url');

var bupp2p = require('./liveaw_bupp2p.js');

var liveaw_mock = (function() {
'use strict';

// cb gets called with (error, port)
function serve(cb) {
	var ws_module = require('ws');
	var wss = new ws_module.Server({host: '127.0.0.1', port: 0});

	wss._server.on('listening', function() {
		var wss_port = wss._server.address().port;

		cb(null, wss_port);
	});

	wss.on('connection', function connection(ws) {
		var location = url.parse(ws.upgradeReq.url);
		if (location.path == '/ws/bup-p2p') {
			return bupp2p.handle(ws);
		}

		ws.send('error: invalid path');
		ws.close();
	});
}


return {
	serve: serve,
};

})();

module.exports = liveaw_mock;