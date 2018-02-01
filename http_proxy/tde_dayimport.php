<?php
namespace aufschlagwechsel\bup\tde_dayimport;
use aufschlagwechsel\bup\utils;

function make_player($pname) {
	$pname = utils\decode_html($pname);
	if (\preg_match('/^([^[]+)\s+\[/', $pname, $matches)) {
		$pname = $matches[1];
	}

	return [
		'name' => $pname,
	];
}

function make_team($n1, $n2) {
	$names = $n2 ? [$n1, $n2] : [$n1];
	$players = \array_map('aufschlagwechsel\\bup\\tde_dayimport\\make_player', $names);
	return [
		'players' => $players
	];
}

function parse_score($html) {
	if (!$html) {
		return 0;
	}

	preg_match_all('/<span>(?P<left>[0-9]+)-(?P<right>[0-9]+)<\/span>/', $html, $matches, \PREG_SET_ORDER);
	if (\count($matches) === 0) {
		throw new \Exception('Unable to parse score HTML ' . $html);
	}

	return \array_map(function($score_m) {
		return [\intval($score_m['left']), \intval($score_m['right'])];
	}, $matches);
}

function parse_day($full_html) {
	if (!preg_match('/<table class="ruler matches">(.*?)<\/tbody>\s*<\/table>/s', $full_html, $matches)) {
		throw new \Exception('Could not find table');
	}
	$table_html = $matches[1];

	$mres = preg_match_all('/
		#<td\s+class="plannedtime"[^>]*>\s*[^<]*<\/td>\s*
		<td><a\s+href="(?:\.\/)?draw\.aspx[^"]*">(?P<discipline_name>[^<]+)<\/a><\/td>\s*

		<td(?:\s+align="right")?>\s*
		<table(?:\s+align="Right")?>\s*
		(?:
			<tr>\s*<td(?:\s+align="right")?>\s*
			(?:<strong>)?<a\s+href="player[^"]*">(?P<player11_name>[^<]+)<\/a>\s*
			(?:<\/strong>)?<\/td>\s*
			(?:<td>
				(?:<a\s+href="[^"]+"><img[^>]+><span[^>]+>[^<]*<\/span><\/a>)?
			<\/td>\s*)?
			<\/tr>\s*
		)
		(?:
			<tr>\s*<td(?:\s+align="right")?>\s*
			(?:<strong>)?<a\s+href="player[^"]*">(?P<player12_name>[^<]+)<\/a>\s*
			(?:<\/strong>)?<\/td>\s*
			(?:<td>
				(?:<a\s+href="[^"]+"><img[^>]+><span[^>]+>[^<]*<\/span><\/a>)?
			<\/td>\s*)?
			<\/tr>\s*
		)?
		<\/table>\s*<\/td>\s*
		<td\s+align="center">-<\/td>\s*

		<td>\s*<table>\s*
		(?:
			<tr>\s*
			(?:<td>\s*
				(?:<a\s+href="[^"]+"><img[^>]+><span[^>]+>[^<]*<\/span><\/a>)?
			<\/td>\s*)?
			<td>(?:<strong>)?<a\s+href="player[^"]*">(?P<player21_name>[^<]+)<\/a>\s*
			(?:<\/strong>)?<\/td>\s*
			<\/tr>\s*
		)
		(?:
			<tr>\s*
			(?:<td>\s*
				(?:<a\s+href="[^"]+"><img[^>]+><span[^>]+>[^<]*<\/span><\/a>)?
			<\/td>\s*)?
			<td>(?:<strong>)?<a\s+href="player[^"]*">(?P<player22_name>[^<]+)<\/a>\s*
			(?:<\/strong>)?<\/td>\s*
			<\/tr>\s*
		)?
		<\/table>\s*<\/td>\s*
		<td>
		(?:
			<span\s+class="score">
			(?P<score_html>
				(?:<span>[0-9]+-[0-9]+<\/span>\s*)+
			)
			<\/span>
		)?
		<\/td>
	/x', $table_html, $matches, \PREG_SET_ORDER);

	if (!$mres) {
		throw new \Exception('Did not match any matches');
	}

	$matches_by_name = [];
	$bm_matches = [];
	foreach ($matches as $m) {
		$t1 = make_team($m['player11_name'], isset($m['player12_name']) ? $m['player12_name'] : '');
		$t2 = make_team($m['player21_name'], isset($m['player22_name']) ? $m['player22_name'] : '');
		$is_doubles = \count($t1['players']) === 2;
		$match_name = $m['discipline_name'];
		$match_id = 'tde_dayimport_' . $match_name . '_' . \count($bm_matches);

		$setup = [
			'teams' => [$t1, $t2],
			'is_doubles' => $is_doubles,
			'match_name' => $match_name,
			'match_id' => $match_id,
			'counting' => '3x21', // just assume
		];
		$bm = [
			'setup' => $setup,
		];
		if (\array_key_exists('score_html', $m)) {
			$bm['network_score'] = parse_score($m['score_html']);
		}

		if (!\array_key_exists($match_name, $matches_by_name)) {
			$matches_by_name[$match_name] = [];
		}
		\array_push($matches_by_name[$match_name], $bm);

		\array_push($bm_matches, $bm);
	}

	$unfinished = utils\any(function($bm) {
		return ! (\array_key_exists('network_score', $bm) && $bm['network_score']);
	}, $bm_matches);
	if ($unfinished) {
		$res_matches = \array_values(\array_filter($bm_matches, function($bm) {
			return ! (\array_key_exists('network_score', $bm) && $bm['network_score']);
		}));

		$match_count_by_name = [];
		$match_curcount_by_name = [];
		foreach ($res_matches as $bm) {
			$match_name = $bm['setup']['match_name'];
			if (!\array_key_exists($match_name, $match_count_by_name)) {
				$match_curcount_by_name[$match_name] = 0;
				$match_count_by_name[$match_name] = 0;
			}
			$match_count_by_name[$match_name]++;
		}

		foreach ($res_matches as &$bm) {
			$match_name = $bm['setup']['match_name'];
			if ($match_count_by_name[$match_name] > 1) {
				$match_curcount_by_name[$match_name]++;
				$bm['setup']['match_name'] = $match_name . ' ' . $match_curcount_by_name[$match_name];
			}
		}
	} else {
		// Add the latest match of any discipline
		$res_matches = [];
		foreach ($matches_by_name as $_ => $bms) {
			\array_push($res_matches, $bms[\count($bms) - 1]);
		}
	}

	$res = [
		'matches' => $res_matches,
	];

	if (\preg_match('/<div\s+class="title">\s*<h3>(?P<tournament_name>[^<]+)<\/h3>/', $full_html, $m)) {
		$res['tournament_name'] = utils\decode_html($m['tournament_name']);
	}

	return $res;
}
