ARG BUILD_IMAGE=node:20-bookworm-slim@sha256:f679d7699517426eb148a5698c717477fd3f8a48f6c1eaf771e390a9bb8268c8
ARG PROD_IMAGE=node:20-alpine3.20@sha256:3bc9a4c4cc25cfde1e8f946341c85f333c36517aafda829b4bb7e785e9b5995c
ARG TEST_IMAGE=node:20-bookworm-slim@sha256:ec35a66c9a0a275b027debde05247c081f8b2f0c43d7399d3a6ad5660cee2f6a

FROM ${BUILD_IMAGE}
ENV REFRESHED_AT=2025-07-11

LABEL Name="senzing/entity-search-web-app" \
  Maintainer="support@senzing.com" \
  Version="3.1.1"

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

# update npm vulnerabilities
RUN npm -g uninstall npm
RUN rm -fr /usr/local/lib/node_modules/npm

#COPY . /app
COPY --chown=1001:1001 ./proxy.conf.json /app

USER 1001

# Health Check
HEALTHCHECK --interval=12s --timeout=12s --start-period=30s \
  CMD node /app/run/health/check.js

# Runtime execution.
WORKDIR /app
ENTRYPOINT [ "node" ]
CMD ["./run/webserver"]
