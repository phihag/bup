var i18n = (function() {
'use strict';

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
	return !! ((lcode == 'auto') || languages[lcode]);
}

function init() {
	register_lang(i18n_de);
	register_lang(i18n_en);

	var auto_code = detect_lang();
	update_state(state, auto_code);
}

function translate_html() {
	$('*[data-i18n]').each(function(_, n) {
		$(n).text(translate(state, n.getAttribute('data-i18n')));
	});
	$('*[data-i18n-placeholder]').each(function(_, n) {
		$(n).attr('placeholder', translate(state, n.getAttribute('data-i18n-placeholder')));
	});
	$('*[data-i18n-title]').each(function(_, n) {
		$(n).attr('title', translate(state, n.getAttribute('data-i18n-title')));
	});
}

function ui_init() {
	var select = $('.settings_language');

	var auto = $('<option data-i18n="Automatic" value="auto">');
	select.append(auto);

	utils.values(languages).forEach(function(lang) {
		var option = $('<option>');
		option.attr('value', lang._code);
		option.text(lang._name);
		select.append(option);
	});
	translate_html();
}

function update_state(s, code) {
	if (! code) {
		if (s.settings) {
			code = s.settings.language;
		}
	}
	if (!code) {
		code = 'auto';
	}
	if (code == 'auto') {
		code = detect_lang();
	}
	s.lang = code;
	s._ = function(str, data) {
		return translate(s, str, data);
	};
}

function ui_update_state(s, code) {
	update_state(s, code);
	render.ui_render(s);
	translate_html();
}

function translate(s, str, data) {
	var lang = languages[s.lang];
	if (! lang) {
		return 'Invalid Language [' + s.lang + ']:>> ' + str + ' <<';
	}
	var res = lang[str];
	if (res === undefined) {
		return 'UNTRANSLATED:>> ' + str + ' <<';
	}

	if (data) {
		for (var key in data) {
			res = res.replace('{' + key + '}', data[key]);
		}
	}
	return res;
}

function simple_translate(str) {
	return translate(state, str);
}

// Make this module itself callable
simple_translate.init = init;
simple_translate.ui_init = ui_init;
simple_translate.update_state = update_state;
simple_translate.ui_update_state = ui_update_state;
simple_translate.is_supported = is_supported;
simple_translate.register_lang = register_lang;
// Testing only
simple_translate.languages = languages;
return simple_translate;
})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var utils = require('./utils');
	var render = require('./render');

	var i18n_de = require('./i18n_de');
	i18n.register_lang(i18n_de);
	var i18n_en = require('./i18n_en');
	i18n.register_lang(i18n_en);

	module.exports = i18n;
}
/*/@DEV*/