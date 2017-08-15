default: help

help:
	@echo 'make targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-13s %s\n", $$1, $$2}'
	@echo '  help          This message'

download-libs:
	node div/download_libs.js div/libs.json libs/

deps: deps-essential ## Download and install all dependencies (for compiling / testing / CLI operation)
	$(MAKE) deps-optional

deps-mandatory: deps-essential

deps-essential:
	(node --version && npm --version) >/dev/null 2>/dev/null || sudo apt-get install nodejs npm
	npm install
	$(MAKE) download-libs

deps-optional:
	test -e ./node_modules/wrtc/build/Release/obj.target/wrtc/src/peerconnection.o || npm install wrtc || echo 'wrtc installation failed. Continuing without wrtc...'

cleandist:
	rm -rf -- dist

manifest: appcache-manifest

appcache-manifest:
	node div/make_manifest.js dist/bup/ div/bup.appcache.in dist/bup/bup.appcache

teamlists:
	mkdir -p div/teamlists
	div/gen_teamlist.js 'http://www.turnier.de/sport/draw.aspx?id=2E6B5BAC-8F64-46E8-94FC-804611281DF1&draw=1' div/teamlists/teamlist-1BL-2016.html
	div/gen_teamlist.js 'http://www.turnier.de/sport/draw.aspx?id=2E6B5BAC-8F64-46E8-94FC-804611281DF1&draw=2' div/teamlists/teamlist-2BLN-2016.html
	div/gen_teamlist.js 'http://www.turnier.de/sport/draw.aspx?id=2E6B5BAC-8F64-46E8-94FC-804611281DF1&draw=3' div/teamlists/teamlist-2BLS-2016.html

dist: cleandist ## Create distribution files
	@test -d div/teamlists || $(MAKE) teamlists
	mkdir -p dist/bup

	node div/make_dist.js . dist/bup/ dist/tmp

	cp libs/jspdf.min.js dist/bup/jspdf.dist.js
	cp libs/jszip.min.js dist/bup/jszip.min.js
	cp libs/pdfform.minipdf.dist.js dist/bup/pdfform.minipdf.dist.js
	svgo -f icons/ -o dist/bup/icons/
	cp icons/*.gif icons/*.png dist/bup/icons/
	cp div/dist_htaccess dist/bup/.htaccess
	mkdir -p dist/bup/div/
	svgo -i div/bundesliga-logo.svg -o dist/bup/div/bundesliga-logo.svg
	node div/minify_json.js div/edemo.json dist/bup/div/edemo.json
	node div/minify_json.js div/vdemo.json dist/bup/div/vdemo.json
	node div/minify_json.js div/bldemo.json dist/bup/div/bldemo.json
	node div/minify_json.js div/bldemo_inprogress.json dist/bup/div/bldemo_inprogress.json
	node div/minify_json.js div/bldemo_incomplete.json dist/bup/div/bldemo_incomplete.json
	node div/minify_json.js div/nlademo.json dist/bup/div/nlademo.json
	node div/minify_json.js div/nrwdemo.json dist/bup/div/nrwdemo.json
	node div/minify_json.js div/tdemo.json dist/bup/div/tdemo.json
	node div/minify_json.js div/rlmdemo.json dist/bup/div/rlmdemo.json
	cp -R div/teamlists --target-directory dist/bup/div/
	cp -R div/courtspot --target-directory dist/bup/div/
	cp -R http_proxy --target-directory dist/bup/
	cp \
		div/bundesliga-ballsorten-2016.pdf \
		div/bupdate.php \
		div/data_structures.txt \
		div/FAQ.de \
		div/URLS.md \
		div/LICENSE.commercial.de \
		div/Mannschaftsaufstellung_1BL-2015.pdf \
		div/Mannschaftsaufstellung_2BL-2015.pdf \
		div/scoresheet_bundesliga-2016.svg \
		div/scoresheet_international.svg \
		div/scoresheet_international_5x11.svg \
		div/Spielbericht-Buli-2016-17.xlsm \
		div/Spielbericht_8x3x21.svg \
		div/Spielberichtsbogen_1BL-2015.pdf \
		div/Spielberichtsbogen_2BL-2015.pdf \
		div/setupsheet_bundesliga-2016.svg \
		div/setupsheet_default.svg \
		div/wakelock.mp4 \
		--target-directory dist/bup/div/

	# backwards compat, remove by 2018
	cp \
		div/courtspot_screenshot_links.png \
		div/courtspot_screenshot_rechts.png \
		--target-directory dist/bup/div/

	$(MAKE) appcache-manifest
	node div/calc_checksums.js dist/ bup/ dist/bup/checksums.json

	find dist -exec touch --date "$$(git log -1 --date=iso | sed -n -e 's/Date:\s*\([0-9 :-]*\)+.*/\1/p')" '{}' ';'
	cd dist && zip bup.zip bup/ -rqX

upload: dist ## Upload to demo page
	cp div/dist_upload_config.json dist/.upload_config.json
	cp div/dist_public dist/.public
	$(MAKE) upload-run

upload-run:
	cd dist && upload

test: ## Run tests
	@npm test

lint: eslint stylelint doclint ## Verify source code quality

eslint:
	@./node_modules/.bin/eslint js/ div/*.js test/ cachesw.js refmode_hub/ div/eval_order/

stylelint:
	@./node_modules/.bin/stylelint css/*.css

doclint:
	@if grep --line-number '	' div/data_structures.txt; then echo 'Tab char in div/data_structures.md'; exit 1 ; fi

coverage:
	./node_modules/.bin/istanbul cover _mocha -- -R spec

coverage-display: coverage
	xdg-open coverage/lcov-report/js/index.html

cd: coverage-display

clean: cleandist ## Remove temporary files
	rm -rf -- libs
	rm -rf -- node_modules
	rm -rf -- div/teamlists/

root-hub:
	node refmode_hub/refmode_hub.js

sat-hub:
	node refmode_hub/refmode_hub.js '{"root_hub":"wss://live.aufschlagwechsel.de/refmode_hub/"}'

list-sats:
	node refmode_hub/list_sats.js

install-hub: deps
	sed -e "s#BUP_ROOT_DIR#$$PWD#" refmode_hub/buphub.service.template | sudo tee /etc/systemd/system/buphub.service >/dev/null
	sudo chmod +x /etc/systemd/system/buphub.service
	systemctl enable buphub
	systemctl start buphub

.PHONY: default help deps deps-essential deps-mandatory deps-optional test clean download-libs upload dist cleandist coverage coverage-display cd lint jshint eslint appcache-manifest manifest upload-run stylelint doclint deps-essential sat-hub root-hub install-hub
