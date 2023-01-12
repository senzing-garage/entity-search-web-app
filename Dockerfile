ARG BUILD_IMAGE=node:16-bullseye-slim@sha256:cfb2b5e2b39f341056ac624d32fae00ba0ab94145364111b7edfd9db703526e0
ARG PROD_IMAGE=node:16-alpine3.16@sha256:e023c53915c5e20df594809477dc249dd595a8e731a6e214c4dbdcf7431bf942
ARG TEST_IMAGE=node:16-bullseye-slim@sha256:cfb2b5e2b39f341056ac624d32fae00ba0ab94145364111b7edfd9db703526e0

FROM ${BUILD_IMAGE}
ENV REFRESHED_AT=2023-01-12

LABEL Name="senzing/entity-search-web-app" \
      Maintainer="support@senzing.com" \
      Version="2.7.3"

HEALTHCHECK CMD ["/app/healthcheck.sh"]

# Set working directory.
COPY ./rootfs /
WORKDIR /

# Add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Install and cache app dependencies.
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
WORKDIR /app

RUN npm config set update-notifier false \
 && npm config set loglevel warn \
 && npm ci \
 && npm install -g @angular/cli@13

# Build app
COPY . /app
RUN npm run build:docker

# production output stage
FROM ${PROD_IMAGE}
WORKDIR /app

# Copy files from repository.
COPY ./rootfs /
COPY ./run /app/run
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
COPY --from=0 /app/dist /app/dist

RUN npm config set update-notifier false \
 && npm config set loglevel warn \
 && npm ci --production

# update npm vulnerabilites
RUN npm -g uninstall npm
RUN rm -fr /usr/local/lib/node_modules/npm

#COPY . /app
COPY --chown=1001:1001 ./proxy.conf.json /app

#USER 1001

# Health Check
HEALTHCHECK --interval=12s --timeout=12s --start-period=30s \
    CMD node /app/run/health/check.js

# Runtime execution.
WORKDIR /app
ENTRYPOINT [ "node" ]
CMD ["./run/webserver"]
