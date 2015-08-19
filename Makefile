install-libs:
	test -e libs/.completed || $(MAKE) force-install-libs

force-install-libs:
	mkdir -p libs
	wget https://code.jquery.com/jquery-2.1.4.min.js -O libs/jquery.min.js
	touch libs/.completed

clean:
	rm -rf -- libs

.PHONY: install-libs force-install-libs
