#!/usr/bin/env node
'use strict';

var async = require('async');
var fs = require('fs');
var http = require('http');
var process = require('process');
var url = require('url');

var utils = (function() {
function download_page(url, cb, encoding) {
	if (!encoding) encoding = 'utf8'; // TODO read actual page encoding
	http.get(url, function(res) {
		res.setEncoding(encoding);
		var body = '';
		res.on('data', function(chunk) {
			body += chunk;
		});
		res.on('end', function() {
			cb(null, res, body);
		});
	}).on('error', function(e) {
		cb(e, null, null);
	});
}

function download_bin(url, cb) {
	http.request(url, function(response) {
		var buffers = [];

		response.on('data', function(chunk) {                                       
			buffers.push(chunk);
		});

		response.on('end', function() {
			var all = Buffer.concat(buffers);
			cb(null, null, all);
		});
	}).end();
}

function match_all(pattern, input) {
	var res = [];
	var match;
	while ((match = pattern.exec(input))) {
		res.push(match);
	}
	return res;
}

function multilineRegExp(regs, options) {
	return new RegExp(regs.map(
		function(reg){ return reg.source; }
	).join(''), options);
}

function replace_all(str, search, replacement) {
	return str.split(search).join(replacement);
}

return {
	match_all,
	download_page,
	download_bin,
	multilineRegExp,
	replace_all,
};

})();

function _parse_team(page_url, page_html, cb) {
	var m = /<div class="title"><h3>Mannschaft:\s*(.*?)\s*\(([0-9-A-Za-z-]+)\)[\s\S]*?<h3>Spieler<\/h3>\s*([\s\S]+?)\s*<div class="leaderboard banner">/.exec(page_html);
	if (!m) {
		throw new Error('Cannot find team name');
	}
	var players_html = m[3];

	cb(null, {
		players_html: players_html,
		name: m[1],
		textid: m[2],
	});
}

function download_team(tournament_id, team_id, cb) {
	var team_url = 'http://www.turnier.de/sport/teamrankingplayers.aspx?id=' + tournament_id + '&tid=' + team_id;
	utils.download_page(team_url, function(err, _, team_html) {
		if (err) return cb(err);
		_parse_team(team_url, team_html, cb);
	});
}

function download_league(league_id, draw_id, callback) {
	var list_url = 'http://www.turnier.de/sport/draw.aspx?id=' + league_id + '&draw=' + draw_id;
	utils.download_page(list_url, function(err, _, list_html) {
		if (err) return callback(err);

		var name_m = /<th>Konkurrenz:<\/th>\s*<td><a href="event\.aspx\?id=[0-9-A-Za-z-]+&event=[0-9]+">(.*?)<\/a>/.exec(list_html);
		if (!name_m) {
			return callback(new Error('Cannot find league name at ' + list_url));
		}
		var league_name = name_m[1];

		var teams_ms = utils.match_all(/<td><a href="\/sport\/team.aspx\?id=([a-z0-9A-Z-]+)&team=([0-9]+)"/g, list_html);
		if (teams_ms.length === 0) {
			return callback(new Error('Cannot find any teams at ' + list_url));
		}
		async.map(teams_ms, function(tm, cb) {
			download_team(tm[1], tm[2], cb);
		}, function(err, teams_data) {
			if (err) return callback(err);
			callback(null, {
				name: league_name,
				teams: teams_data,
			});
		});
	});
}

function main() {
	var args = process.argv.slice(2);
	if (args.length !== 2) {
		console.log('Usage: ' + process.argv[1] + ' TOURNAMENT_URL OUTPUT_FILE');
		return process.exit(1);
	}

	var tournament_url = args[0];
	var out_fn = args[1];

	var m = /^https?:\/\/www\.turnier\.de\/sport\/[a-z]+\.aspx\?id=([0-9A-Fa-f-]+)&draw=([0-9]+)/.exec(tournament_url);
	if (!m) {
		console.error('Unmatched TOURNAMENT_URL');
		return process.exit(2);
	}

	download_league(m[1], m[2], function(err, league_info) {
		if (err) throw err;

		var main_content = league_info.teams.map(ti => '<h2>' + ti.name + '</h2>\n' + ti.players_html).join('\n');
		var imgs_ms = utils.match_all(/<img src="([^"]+)"/g, main_content);

		async.each(imgs_ms, function(img_m, cb) {
			var img_raw_url = img_m[1];
			var img_url = url.resolve(tournament_url, img_raw_url);
			utils.download_bin(img_url, function(err, _, img_data) {
				if (err) return cb(err);
				// TODO fix this
				var b64 = new Buffer(img_data).toString('base64');
				var data_url = 'data:image/png;base64,' + b64;
				main_content = main_content.replace(img_raw_url, data_url);
				cb(err);
			}, 'binary');
		}, function(err) {
			if (err) throw err;

			var html = (
				'<!DOCTYPE html><html><head>' +
				'<meta charset="utf-8"/>' + 
				'<title>Mannschaftsunterlagen ' + league_info.name + '</title>' +
				'</head>' +
				'<body><h1>Mannschaftsunterlagen ' + league_info.name + '</h1>' +
				main_content +
				'\n</body></html>\n');
			fs.writeFile(out_fn, html);
		});
	});
}

main();
