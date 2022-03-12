'use strict';
var i18n = (function() {

var languages = {};

function register_lang(lang) {
	languages[lang._code] = lang;
}

function detect_lang() {
	var codes = window.navigator.languages;
	if (codes) {
		for (var i = 0;i < codes.length;i++) {
			if (languages[codes[i]]) {
				return codes[i];
			}
		}
	}
	var code = window.navigator.language;
	if (code) {
		if (languages[code]) {
			return code;
		}
		code = code.replace(/-.*$/, '');
		if (languages[code]) {
			return code;
		}
	}
	return 'en';
}

function is_supported(lcode) {
	return (lcode === 'auto') || !!languages[lcode];
}

function register_all() {
	register_lang(i18n_en);
	register_lang(i18n_de);
	register_lang(i18n_deat);
	register_lang(i18n_dech);
	register_lang(i18n_frch);
	register_lang(i18n_nlbe);
}

function init() {
	register_all();

	var auto_code = detect_lang();
	update_state(state, auto_code);
}

function translate_nodes(root, s) {
	uiu.qsEach('*[data-i18n]', function(n) {
		uiu.text(n, translate(s, n.getAttribute('data-i18n')));
	}, root);
	uiu.qsEach('*[data-i18n-placeholder]', function(n) {
		n.setAttribute('placeholder', translate(s, n.getAttribute('data-i18n-placeholder')));
	}, root);
	uiu.qsEach('*[data-i18n-title]', function(n) {
		n.setAttribute('title', translate(s, n.getAttribute('data-i18n-title')));
	}, root);
}

function ui_init() {
	var select = uiu.qs('.settings_language');

	uiu.el(select, 'option', {
		'data-i18n': 'Automatic',
		value: 'auto',
	});

	utils.values(languages).forEach(function(lang) {
		uiu.el(select, 'option', {
			value: lang._code,
		}, lang._name);
	});
	translate_nodes(uiu.qs('html'), state);
}

function update_state(s, code) {
	if (! code) {
		if (s.settings) {
			code = s.settings.language;

			// Remove in 2018: Fall back from temporary designations to real country codes
			if (code === 'dech') {
				code = 'de-CH';
			}
			if (code === 'frch') {
				code = 'fr-CH';
			}
		}
	}
	if (!code) {
		code = 'auto';
	}
	if (code == 'auto') {
		code = detect_lang();
	}
	s.lang = code;
	s._ = function(str, data, fallback) {
		return translate(s, str, data, fallback);
	};
}

function ui_update_state(s, code) {
	update_state(s, code);
	render.ui_render(s);
	translate_nodes(uiu.qs('html'), s);
	report_problem.update();
}

function translate(s, str, data, fallback) {
	var lang = languages[s.lang];
	if (! lang) {
		return 'Invalid Language [' + s.lang + ']:>> ' + str + ' <<';
	}
	var res = lang[str];
	if ((res === undefined) && (lang._fallback)) {
		lang = languages[lang._fallback];
		if (! lang) {
			return 'invalid fallback language [' + s.lang + ']:>> ' + str + ' <<';
		}
		res = lang[str];
	}
	if (res === undefined) {
		if (fallback === undefined) {
			/*@DEV*/
			console.error('Untranslated string(' + s.lang + '): ' + JSON.stringify(str)); // eslint-disable-line no-console
			/*/@DEV*/
			return 'UNTRANSLATED:>> ' + str + ' <<';
		} else {
			return fallback;
		}
	}

	if (data) {
		for (var key in data) {
			res = utils.replace_all(res, '{' + key + '}', data[key]);
		}
	}
	return res;
}

function simple_translate(str) {
	return translate(state, str);
}

function format_money(lang, amount) {
	var res = amount.toFixed(2);
	if (lang !== 'en') {
		res = res.replace('.', ',');
	}
	return res;
}

// Make this module itself callable
simple_translate.init = init;
simple_translate.ui_init = ui_init;
simple_translate.update_state = update_state;
simple_translate.ui_update_state = ui_update_state;
simple_translate.is_supported = is_supported;
simple_translate.register_lang = register_lang;
simple_translate.translate_nodes = translate_nodes;
simple_translate.format_money = format_money;
/*@DEV*/
// Testing only
simple_translate.languages = languages;
simple_translate.register_all = register_all;
/*/@DEV*/
return simple_translate;
})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var render = require('./render');
	var report_problem = require('./report_problem');
	var uiu = require('./uiu');
	var utils = require('./utils');
	var i18n_de = require('./i18n_de');
	var i18n_deat = require('./i18n_deat');
	var i18n_dech = require('./i18n_dech');
	var i18n_en = require('./i18n_en');
	var i18n_frch = require('./i18n_frch');
	var i18n_nlbe = require('./i18n_nlbe');

	i18n.register_all();

	module.exports = i18n;
}
/*/@DEV*/