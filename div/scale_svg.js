#!/usr/bin/env node
'use strict';

const argparse = require('argparse');
const assert = require('assert');
const fs = require('fs');
const {promisify} = require('util');
const DOMParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;

const svg_utils = require('../js/svg_utils.js');

function* traverse_dom(element) {
	yield element;
	for (const c of Array.from(element.childNodes)) {
		if (c.nodeType !== c.ELEMENT_NODE) continue;

		yield* traverse_dom(c);
	}
}

function convert_val(val, factor) {
	if (val === 'none') return val;

	assert(!isNaN(factor));
	const val_m = /(\s*)([0-9.]+)(\s*px)?(\s*)/.exec(val);
	assert(val_m, `Cannot parse numeric value ${JSON.stringify(val)}`);

	const num_val = parseFloat(val_m[2]) * factor;
	assert(!isNaN(num_val), `Failed to parse ${JSON.stringify(val_m[2])}`);
	return val_m[1] + num_val + (val_m[3] || '') + val_m[4];
}

function convert_css_prop(prop, factor) {
	assert(!isNaN(factor));
	if (/^\s*$/.test(prop)) { // whitespace only?
		return prop;
	}

	const prop_m = /^([^:]+):([^:]+)$/.exec(prop);
	assert(prop_m, `Cannot parse CSS property ${JSON.stringify(prop)}`);

	const key = prop_m[1].trim();
	switch (key) {
	case 'fill':
	case 'fill-opacity':
	case 'fill-rule':
	case 'font-family':
	case 'font-weight':
	case 'opacity':
	case 'stroke-linecap':
	case 'stroke-linejoin':
	case 'stroke-miterlimit': // numerical, but a ratio
	case 'stroke-opacity':
	case 'text-anchor':
		return prop;
	case 'stroke':
		assert(/^\s*(?:#[0-9a-f]{3,6}|none)\s*$/.test(prop_m[2]),
			`Invalid stroke value ${JSON.stringify(prop_m[2])}`);
		return prop;
	case 'font-size':
	case 'stroke-width':
		return prop_m[1] + ':' + convert_val(prop_m[2], factor);
	case 'stroke-dasharray':
		return prop_m[1] + ':' + prop_m[2].split(',').map(n => convert_val(n, factor)).join(',');
	}

	throw new Error(`Unsupported CSS prop ${JSON.stringify(prop.trim())}`);
}

function convert_css_props(css_props, factor) {
	assert(!isNaN(factor));
	return css_props.split(';').map(p => convert_css_prop(p, factor)).join(';');
}

function convert_css(css, factor) {
	assert(!isNaN(factor));
	return css.replace(/\{([^}]*)\}/g, (_, m) => '{' + convert_css_props(m, factor) + '}');
}

function scale_attrs(el, factor, attrs) {
	for (const aname of attrs) {
		const strval = el.getAttribute(aname);
		assert(strval, `Missing attribute ${aname} on ${el}`);
		const val = parseFloat(strval);
		assert(!isNaN(val));
		el.setAttribute(aname, factor * val);
	}
}

function scale_element(el, factor) {
	assert(factor);

	const style_attr = el.getAttribute('style');
	if (style_attr) {
		el.setAttribute('style', convert_css_props(style_attr, factor));
	}

	switch(el.tagName) {
	case 'svg':
		{
			let viewBox = el.getAttribute('viewBox');
			assert(viewBox);
			viewBox = viewBox.split(/\s+/).map(str => factor * parseFloat(str)).join(' ');
			el.setAttribute('viewBox', viewBox);
		}
		break;
	case 'style':
		{
			const css = el.firstChild.nodeValue;
			el.removeChild(el.firstChild);
			el.appendChild(el.ownerDocument.createTextNode(convert_css(css, factor)));
		}
		break;
	case 'text':
		scale_attrs(el, factor, ['x', 'y']);
		break;
	case 'rect':
		scale_attrs(el, factor, ['x', 'y', 'width', 'height']);
		break;
	case 'line':
		scale_attrs(el, factor, ['x1', 'x2', 'y1', 'y2']);
		break;
	case 'circle':
		scale_attrs(el, factor, ['cx', 'cy', 'r']);
		break;
	case 'ellipse':
		scale_attrs(el, factor, ['cx', 'cy', 'rx', 'ry']);
		break;
	case 'g':
		break;
	case 'path':
		el.setAttribute('d', svg_utils.translate_path(el.getAttribute('d'), factor, 0, 0));
		break;
	default:
		throw new Error(`Unsupported element ${el.tagName}!`);
	}
}

async function scaleFile(filename, factor) {
	const input = await promisify(fs.readFile)(filename, {encoding: 'utf-8'});

	const doc = new DOMParser().parseFromString(input);
	for (const el of traverse_dom(doc.documentElement)) {
		scale_element(el, factor);
	}

	const output = (new XMLSerializer()).serializeToString(doc);
	await promisify(fs.writeFile)(filename, output, {encoding: 'utf-8'});
}

async function main() {
	const parser = argparse.ArgumentParser({description: 'Scale all numbers in an SVG'});
	parser.add_argument('files', {nargs: '+', help: 'The SVG files to modify'});
	parser.add_argument(['-f', '--factor'], {defaultValue: 1, type: 'float', help: 'Scaling factor'});
	const args = parser.parse_args();

	for (const f of args.files) {
		await scaleFile(f, args.factor);
	}
}

(async () => {
    try {
        await main();
    } catch (e) {
        console.error(e.stack);
        process.exit(2);
    }
})();
