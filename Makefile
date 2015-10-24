default: help

help:
	@echo 'make targets:'
	@echo '  deps          Download and install all dependencies (for compiling / testing / CLI operation)'
	@echo '  dist          Create distribution files'
	@echo '  test          Run tests'
	@echo '  upload        Upload to demo page'

	@echo '  clean         Remove temporary files'
	@echo '  help          This message'


install-libs:
	test -e libs/.completed || $(MAKE) force-install-libs

force-install-libs:
	mkdir -p libs
	wget https://code.jquery.com/jquery-2.1.4.min.js -O libs/jquery.min.js
	wget https://craig.global.ssl.fastly.net/js/mousetrap/mousetrap.min.js -O libs/mousetrap.min.js
	wget https://raw.githubusercontent.com/phihag/jsPDF/dist/dist/jspdf.min.js -O libs/jspdf.min.js
	touch libs/.completed

deps: install-libs
	(node --version && npm --version) >/dev/null 2>/dev/null || sudo apt-get install nodejs npm
	npm install

cleandist:
	rm -rf -- dist

dist: cleandist
	mkdir -p dist/bup
	node div/make_dist.js bup.html dist/bup/index.html
	<bup.css cleancss -o dist/bup/bup.min.css
	cp div/dist_htaccess dist/bup/.htaccess
	svgo -f icons/ -o dist/bup/icons/
	cp libs/jspdf.min.js dist/bup/jspdf.dist.js
	uglifyjs \
		"libs/jquery.min.js" "libs/mousetrap.min.js" \
		"js/utils.js" \
		"js/pronounciation.js" \
		"js/liveaw.js" \
		"js/courtspot.js" \
		"js/btde.js" \
		"js/calc.js" \
		"js/render.js" \
		"js/scoresheet.js" \
		"js/network.js" \
		"js/bup.js" \
		-m -c -o dist/bup/bup.dist.js
	cd dist && zip bup.zip bup/ -rq

upload: dist
	cp div/dist_upload_config.json dist/.upload_config.json
	cp div/dist_public dist/.public
	cd dist && upload

test:
	@npm test
	@# jshint js/*.js
	@# eslint js/*.js

clean: cleandist
	rm -rf -- libs
	rm -rf -- node_modules

.PHONY: default help deps test clean install-libs force-install-libs upload dist cleandist
