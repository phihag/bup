FROM alpine:3.17

RUN apk add make nodejs npm

# HTTP server for development only, not required for actual use
RUN npm install -g http-server

WORKDIR /bup
COPY package.json package-lock.json Makefile ./
COPY ./install/* ./install/
RUN mkdir -p doc/libs/
RUN make install

COPY . .
RUN make dist
# RUN make test

CMD http-server -p 80
