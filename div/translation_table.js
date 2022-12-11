#!/usr/bin/env node
'use strict';

const assert = require('assert').strict;
const argparse = require('argparse');
const {unique} = require('./script_utils');

const ExcelJS = require('exceljs');

function autoHeight(worksheet) {
    // from https://github.com/exceljs/exceljs/issues/83#issuecomment-907634844
    const lineHeight = 17;
    worksheet.eachRow((row) => {
        let maxLine = 1;
        row.eachCell((cell) => {
            maxLine = Math.max(cell.value.split('\n').length - 1, maxLine);
        });
        row.height = lineHeight * maxLine;
    });
}


async function main() {
    const parser = new argparse.ArgumentParser({
        description: 'Generate file of all translations',
    });
    parser.add_argument('-i', '--import', {
        metavar: 'LANGUAGE', help: 'Language code to import from an XLSX file',
    });
    parser.add_argument('-l', '--languages', {
        help: 'Comma-separted list of languages to export',
    });
    parser.add_argument('FILE.xlsx', {help: 'File to write (or read with -i)'});
    const args = parser.parse_args();
    const file = args['FILE.xlsx'];

    const i18n = require('../js/i18n');
    i18n.register_all();

    if (args.import) {
        if (args.languages) {
            parser.error('Cannot combine -l/--languages and -i/--import');
        }

        // TODO check language code
        // TODO read file
        throw new Error('Import not implemented yet');
    }

    const all_language_ids = Object.keys(i18n.languages);
    let language_ids = all_language_ids;
    if (args.languages) {
        const requested_languages = args.languages.split(',');
        for (const code of requested_languages) {
            if (! all_language_ids.includes(code)) {
                parser.error(
                    `Unsupported language ${JSON.stringify(code)}.` +
                    ` Must be one of ${all_language_ids.join(',')}`);
            }
        }
        language_ids = requested_languages;
    }

    let all_keys = [];
    for (const language_id of language_ids) {
        const lang = i18n.languages[language_id];
        assert(lang, `Cannot find language ${language_id}`);
        all_keys.push(...Object.keys(lang));
    }
    all_keys = unique(all_keys);

    const workbook = new ExcelJS.Workbook();
    const now = new Date();
    workbook.created = now;
    workbook.modified = now;

    // Set up worksheet
    const sheet = workbook.addWorksheet('bup translations', {});
    sheet.views = [{
        state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'B2',
    }];

    // Header row
    const header_row = ['translation code'];
    header_row.push(...language_ids);
    sheet.addRow(header_row);

    // Data
    for (const key of all_keys) {
        const row = [key];
        for (const lang of language_ids) {
            row.push(i18n.languages[lang][key] || '');
        }
        sheet.addRow(row);
    }

    // Style
    sheet.eachRow((row, rowNum) => {
        row.eachCell(cell => {
            cell.alignment = {
                vertical: 'top',
                horizontal: (rowNum === 1 ? 'center' : 'left'),
            };
            cell.font = {
                name: 'Calibri',
                family: 2,
                size: 14,
                bold: (rowNum === 1),
            };
        });
    });
    sheet.columns[0].width = 35;
    for (let i = 1;i < language_ids.length + 1;i++) {
        sheet.columns[i].width = 50;
    }
    autoHeight(sheet);


    await workbook.xlsx.writeFile(file);
}

(async () => {
    try {
        await main();
    } catch (e) {
        console.error(e.stack);
        process.exit(2);
    }
})();
