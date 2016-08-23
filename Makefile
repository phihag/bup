default: help

help:
	@echo 'make targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-13s %s\n", $$1, $$2}'
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
	wget https://raw.githubusercontent.com/Stuk/jszip/master/dist/jszip.min.js -O libs/jszip.min.js
	touch libs/.completed

deps: install-libs ## Download and install all dependencies (for compiling / testing / CLI operation)
	(node --version && npm --version) >/dev/null 2>/dev/null || sudo apt-get install nodejs npm
	npm install
	$(MAKE) deps-optional

deps-optional:
	test -e ./node_modules/wrtc/build/Release/obj.target/wrtc/src/peerconnection.o || npm install wrtc || echo 'wrtc installation failed. Continuing without wrtc...'

cleandist:
	rm -rf -- dist

manifest: appcache-manifest

appcache-manifest:
	node div/make_manifest.js dist/bup/ div/bup.appcache.in dist/bup/bup.appcache

dist: cleandist ## Create distribution files
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
		div/Mannschaftsaufstellung_1BL-2015.pdf \
		div/Mannschaftsaufstellung_2BL-2015.pdf \
		div/Spielberichtsbogen_1BL-2015.pdf \
		div/Spielberichtsbogen_2BL-2015.pdf \
		div/Spielbericht-Buli-2016-17.xlsm \
		div/Spielbericht_RLW.svg \
		div/Spielbericht_RLN.svg \
		div/scoresheet_international.svg \
		div/scoresheet_international_5x11.svg \
		div/FAQ.de \
		--target-directory dist/bup/div/

	$(MAKE) appcache-manifest

	find dist -exec touch --date "$$(git log -1 --date=iso | sed -n -e 's/Date:\s*\([0-9 :-]*\)+.*/\1/p')" '{}' ';'
	cd dist && zip bup.zip bup/ -rq

upload: dist ## Upload to demo page
	cp div/dist_upload_config.json dist/.upload_config.json
	cp div/dist_public dist/.public
	$(MAKE) upload-run

upload-run:
	cd dist && upload

test: ## Run tests
	@npm test

lint: eslint stylelint ## Verify source code quality

eslint:
	@./node_modules/.bin/eslint js/ div/*.js test/ cachesw.js

stylelint:
	@./node_modules/.bin/stylelint css/*.css

coverage:
	istanbul cover _mocha -- -R spec

coverage-display: coverage
	xdg-open coverage/lcov-report/js/index.html

cd: coverage-display

clean: cleandist ## Remove temporary files
	rm -rf -- libs
	rm -rf -- node_modules

.PHONY: default help deps deps-optional test clean install-libs force-install-libs upload dist cleandist coverage coverage-display cd lint jshint eslint appcache-manifest manifest upload-run
