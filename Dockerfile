ARG BUILD_IMAGE=node:16-bullseye-slim@sha256:726698a073f984efd26cb31c176a35b39200c4a82f4dc6f933c7cc957403b567
ARG PROD_IMAGE=node:16-alpine3.17@sha256:fb4c5fcefe7cf706ab7f9eed97258641f33ca318b03f072119180133ab3ef334
ARG TEST_IMAGE=node:16-bullseye-slim@sha256:726698a073f984efd26cb31c176a35b39200c4a82f4dc6f933c7cc957403b567

FROM ${BUILD_IMAGE}
ENV REFRESHED_AT=2023-06-15

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
