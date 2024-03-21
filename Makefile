default: help

help:
	@echo 'make targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-13s %s\n", $$1, $$2}'
	@echo '  help          This message'

download-libs:
	install/download_libs.js install/libs.json libs/
	install/download_libs.js install/doc_libs.json doc/libs/

deps: deps-essential ## Download and install all dependencies (for compiling / testing / CLI operation)
	# (node --version && npm --version) >/dev/null 2>/dev/null || sudo apt-get install nodejs npm
	npm install
	$(MAKE) download-libs

install: deps

script-deps:
	composer.phar install

cleandist:
	rm -rf -- dist

dist: cleandist ## Create distribution files
	mkdir -p dist/bup

	node div/make_dist.js . dist/bup/ dist/bup/sources

	cp libs/jspdf.min.js dist/bup/jspdf.dist.js
	cp libs/jszip.min.js dist/bup/jszip.min.js
	cp libs/pdfform.minipdf.dist.js dist/bup/pdfform.minipdf.dist.js
	mkdir -p dist/bup/icons
	node_modules/.bin/svgo -q -f icons/ -o dist/bup/icons/
	cp icons/*.gif icons/*.png dist/bup/icons/
	mkdir -p dist/bup/div/logos/
	node_modules/.bin/svgo -q -f div/logos/ -o dist/bup/div/logos/
	cp div/dist_htaccess dist/bup/.htaccess
	mkdir -p dist/bup/div/
	mkdir -p dist/bup/div/demos/
	node div/minify_json.js --dir div/demos/ dist/bup/div/demos/
	node div/minify_json.js div/edemo.json dist/bup/div/edemo.json
	node div/minify_json.js div/vdemo.json dist/bup/div/vdemo.json
	node div/minify_json.js div/bldemo.json dist/bup/div/bldemo.json
	node div/minify_json.js div/bldemo_inprogress.json dist/bup/div/bldemo_inprogress.json
	node div/minify_json.js div/bldemo_incomplete.json dist/bup/div/bldemo_incomplete.json
	node div/minify_json.js div/nlademo.json dist/bup/div/nlademo.json
	node div/minify_json.js div/nrwdemo.json dist/bup/div/nrwdemo.json
	node div/minify_json.js div/tdemo.json dist/bup/div/tdemo.json
	node div/minify_json.js div/rlmdemo.json dist/bup/div/rlmdemo.json
	cp -R div/courtspot --target-directory dist/bup/div/
	cp -R http_proxy --target-directory dist/bup/
	mkdir -p dist/bup/div/scoresheet
	node div/minify_svg.js dist/bup/div/scoresheet/ \
		div/scoresheet/*.svg
	cp -R div/flags --target-directory dist/bup/div/
	node div/minify_svg.js dist/bup/div/ \
		div/bundesliga-logo.svg \
		div/buli2017_mindestanforderungen_schiedsrichter.svg \
		div/buli2017_mindestanforderungen_verein.svg
	mkdir -p dist/bup/div/eventsheet
	node div/minify_svg dist/bup/div/eventsheet/ div/eventsheet/*.svg
	cp div/eventsheet/*.xlsx dist/bup/div/eventsheet/
	cp doc/ -R dist/bup/
	mkdir -p dist/bup/fonts
	cp css/fonts/ -R dist/bup/
	cp div/bupdate.php dist/bup/div/bupdate.txt
	cp \
		div/bundesliga-ballsorten-2016.pdf \
		div/bupdate.php \
		div/Mannschaftsaufstellung_1BL-2015.pdf \
		div/Mannschaftsaufstellung_2BL-2015.pdf \
		div/eventsheet_obl.xlsx \
		div/receipt.svg \
		div/eventsheet_international.svg \
		div/buli2017_spielbericht.svg \
		div/Spielbericht-Buli-2016-17.xlsm \
		div/Spielbericht_8x3x21.svg \
		div/Spielberichtsbogen_1BL-2015.pdf \
		div/Spielberichtsbogen_2BL-2015.pdf \
		div/setupsheet_bundesliga-2016.svg \
		div/setupsheet_default.svg \
		div/setupsheet_international.svg \
		div/setupsheet_nla.svg \
		div/wakelock.mp4 \
		--target-directory dist/bup/div/

	node div/calc_checksums.js dist/ bup/ dist/bup/checksums.json
	node div/unify_timestamps.js dist/

	cd dist && zip bup.zip bup/ -rqX

upload: dist ## Upload to demo page
	cp div/dist_upload_config.json dist/.upload_config.json
	cp div/dist_public dist/.public
	$(MAKE) upload-run

upload-run:
	cd dist && upload

ta: testall

tu: ta
	$(MAKE) upload

testall: test itest lint

test: ## Run tests
	@node_modules/.bin/mocha test/ test/mock/

itest: ## Run integration tests
	@node_modules/.bin/mocha test/integration/

lint: eslint stylelint doclint ## Verify source code quality

eslint:
	@./node_modules/.bin/eslint js/ div/*.js test/ cachesw.js refmode_hub/ div/eval_order/

stylelint:
	@./node_modules/.bin/stylelint css/*.css

doclint:
	@if grep --line-number '	' doc/data_structures.txt; then echo 'Tab char in div/data_structures.md'; exit 1 ; fi

coverage:
	./node_modules/.bin/istanbul cover _mocha -- -R spec

coverage-display: coverage
	xdg-open coverage/lcov-report/js/index.html

cd: coverage-display

clean: cleandist ## Remove temporary files
	rm -rf -- libs
	rm -rf -- node_modules

mockserver:
	node_modules/.bin/node-supervisor -w test/mock/ -- test/mock/mockserver.js 4201

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

.PHONY: default help deps deps-essential deps-optional install test clean download-libs upload dist cleandist coverage coverage-display cd lint jshint eslint upload-run stylelint doclint deps-essential sat-hub root-hub install-hub testall ta tu mockserver
