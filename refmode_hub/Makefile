deps:
	type node 2>/dev/null || sudo apt install -y node

install: deps
	sudo cp buphub.service /etc/systemd/system/
	sudo chmod +x /etc/systemd/system/buphub.service
	systemctl enable buphub
	systemctl start buphub

.PHONY: deps install
