# Test with
# docker build . --tag bup && docker run --rm -p 8028:80 -it bup
# Then visit http://localhost:8028/bup.html for the development version
# or http://localhost:8028/dist/bup/ for the minified distribution version

FROM alpine:3.17

RUN apk add make grep zip nodejs npm

# HTTP server for this docker only, not required for actual use
RUN npm install -g http-server

WORKDIR /bup
COPY package.json package-lock.json Makefile ./
COPY ./install/* ./install/
RUN mkdir -p doc/libs/
RUN make install

COPY . .
RUN make test
RUN make lint
RUN BUP_DIST_GIT_REVISION=dockerdev BUP_DIST_DATE=now make dist

CMD http-server -p 80
