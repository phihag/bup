default: help

help:
	@echo 'make targets:'
	@echo '  help          This message'
	@echo '  deps          Download and install all dependencies (for compiling / testing / CLI operation)'
	@echo '  test          Run tests'
	@echo '  clean         Remove temporary files'


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

dist:
	rm -rf -- dist
	mkdir -p dist/bup
	node div/make_dist.js bup.html dist/bup/index.html
	<bup.css cleancss -o dist/bup/bup.min.css
	cp div/dist_htaccess dist/bup/.htaccess
	uglifyjs "libs/jquery.min.js" "libs/mousetrap.min.js" "js/courtspot.js" "js/btde.js" "js/bup.js" -m -c -o dist/bup/bup.dist.js
	cp libs/jspdf.min.js dist/bup/jspdf.dist.js
	cp -r icons dist/bup/
	cd dist && zip bup.zip bup/ -r

upload: dist
	cp div/dist_upload_config.json dist/.upload_config.json
	cp div/dist_public dist/.public
	cd dist && upload

test:
	@npm test

clean:
	rm -rf -- libs
	rm -rf -- node_modules
	rm -rf -- dist

.PHONY: default help deps test clean install-libs force-install-libs upload dist
