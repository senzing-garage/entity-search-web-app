ARG BUILD_IMAGE=node:16-bullseye-slim@sha256:503446c15c6236291222f8192513c2eb56a02a8949cbadf4fe78cce19815c734
ARG PROD_IMAGE=node:16-alpine3.18@sha256:a1f9d027912b58a7c75be7716c97cfbc6d3099f3a97ed84aa490be9dee20e787
ARG TEST_IMAGE=node:16-bullseye-slim@sha256:503446c15c6236291222f8192513c2eb56a02a8949cbadf4fe78cce19815c734

FROM ${BUILD_IMAGE}
ENV REFRESHED_AT=2023-09-29

LABEL Name="senzing/entity-search-web-app" \
      Maintainer="support@senzing.com" \
      Version="2.8.0"

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
 && npm install -g @angular/cli@15

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
