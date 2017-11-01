#include <sys/socket.h>
#include <sys/types.h>
#include <stdio.h>
#include <arpa/inet.h>

int main() {
	int sock = socket(AF_INET6, SOCK_STREAM|SOCK_CLOEXEC|SOCK_NONBLOCK, IPPROTO_IP);
	if (sock < 0) {
		perror("failed to create socket");
		return 1;
	}

	int v6only = 0;
	if (setsockopt(sock, SOL_IPV6, IPV6_V6ONLY, &v6only, sizeof(v6only)) != 0) {
		perror("failed to disable IPV6_V6ONLY");
		return 2;
	}

	struct in6_addr addr_buf;
	if (inet_pton(AF_INET6, "::1", &addr_buf) != 1) {
		perror("inet_pton");
		return 3;
	}

	struct sockaddr_in6 addr;
	addr.sin6_family = AF_INET6;
	addr.sin6_port = htons(0);
	addr.sin6_addr = addr_buf;
	addr.sin6_flowinfo = htonl(0);
	addr.sin6_scope_id = 0;
	if (bind(sock, (const struct sockaddr *) &addr, sizeof addr) != 0) {
		perror("bind failed");
		return 4;
	}

	printf("BOUND successfully!\n");

	return 0;
}