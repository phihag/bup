default: help

help:
	@echo 'make targets:'
	@echo '  deps          Download and install all dependencies (for compiling / testing / CLI operation)'
	@echo '  dist          Create distribution files'
	@echo '  test          Run tests'
	@echo '  lint          Verify source code quality'
	@echo '  upload        Upload to demo page'
	@echo '  clean         Remove temporary files'
	@echo '  help          This message'


install-libs:
	test -e libs/.completed || $(MAKE) force-install-libs

force-install-libs:
	mkdir -p libs
	wget https://code.jquery.com/jquery-2.1.4.min.js -O libs/jquery.min.js
	wget https://craig.global.ssl.fastly.net/js/mousetrap/mousetrap.min.js -O libs/mousetrap.min.js
	wget https://raw.githubusercontent.com/ftlabs/fastclick/master/lib/fastclick.js -O libs/fastclick.js
	wget https://raw.githubusercontent.com/phihag/jsPDF/dist/dist/jspdf.min.js -O libs/jspdf.min.js
	wget https://raw.githubusercontent.com/phihag/pdfform.js/dist/dist/pdfform.dist.js -O libs/pdfform.dist.js
	wget https://raw.githubusercontent.com/eligrey/FileSaver.js/master/FileSaver.min.js -O libs/FileSaver.min.js
	wget https://raw.githubusercontent.com/phihag/text-encoding-utf-8/master/lib/encoding.js -O libs/encoding.js
	touch libs/.completed

deps: install-libs
	(node --version && npm --version) >/dev/null 2>/dev/null || sudo apt-get install nodejs npm
	npm install

cleandist:
	rm -rf -- dist

manifest: appcache-manifest

appcache-manifest:
	node div/make_manifest.js dist/bup/ div/bup.appcache.in dist/bup/bup.appcache

dist: cleandist
	mkdir -p dist/bup

	node div/make_dist.js . dist/bup/ dist/tmp

	cp libs/jspdf.min.js dist/bup/jspdf.dist.js
	cp libs/pdfform.dist.js dist/bup/pdfform.dist.js
	svgo -f icons/ -o dist/bup/icons/
	cp icons/*.gif icons/*.png dist/bup/icons/
	cp div/dist_htaccess dist/bup/.htaccess
	mkdir -p dist/bup/div/
	node div/minify_json.js div/edemo_de.json dist/bup/div/edemo_de.json
	node div/minify_json.js div/edemo_en.json dist/bup/div/edemo_en.json
	node div/minify_json.js div/vdemo_de.json dist/bup/div/vdemo_de.json
	node div/minify_json.js div/vdemo_en.json dist/bup/div/vdemo_en.json
	cp \
		div/courtspot_screenshot_links.png \
		div/courtspot_screenshot_rechts.png \
		div/LICENSE.commercial.de \
		div/Mannschaftsaufstellung_1BL.pdf \
		div/Mannschaftsaufstellung_2BL.pdf \
		div/Spielberichtsbogen_1BL.pdf \
		div/Spielberichtsbogen_2BL.pdf \
		div/Spielbericht_RLW.svg \
		div/scoresheet_international.svg \
		div/FAQ.de \
		--target-directory dist/bup/div/

	$(MAKE) appcache-manifest

	find dist -exec touch --date "$$(git log -1 --date=iso | sed -n -e 's/Date:\s*\([0-9 :-]*\)+.*/\1/p')" '{}' ';'
	cd dist && zip bup.zip bup/ -rq

upload: dist
	cp div/dist_upload_config.json dist/.upload_config.json
	cp div/dist_public dist/.public
	$(MAKE) upload-run

upload-run:
	cd dist && upload

test:
	@npm test

lint: jshint eslint

jshint:
	@jshint js/ div/*.js test/ div/*.js cachesw.js

eslint:
	@eslint js/ div/*.js test/ div/*.js cachesw.js

coverage:
	istanbul cover _mocha -- -R spec

coverage-display: coverage
	xdg-open coverage/lcov-report/js/index.html

cd: coverage-display

clean: cleandist
	rm -rf -- libs
	rm -rf -- node_modules

.PHONY: default help deps test clean install-libs force-install-libs upload dist cleandist coverage coverage-display cd lint jshint eslint appcache-manifest manifest upload-run
