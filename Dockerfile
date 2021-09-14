ARG BUILD_IMAGE=node:lts-buster-slim
ARG PROD_IMAGE=node:lts-alpine
ARG TEST_IMAGE=node:lts-buster-slim

FROM ${BUILD_IMAGE}
ENV REFRESHED_AT=2021-07-26

LABEL Name="senzing/entity-search-web-app" \
      Maintainer="support@senzing.com" \
      Version="2.3.3"

HEALTHCHECK CMD ["/app/healthcheck.sh"]

# Set working directory.
WORKDIR /app

# Add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Install and cache app dependencies.
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN npm config set loglevel warn \
 && npm install --silent \
 && npm install --silent -g @angular/cli@10.0.0

# Build app. build as root and switch back
COPY ./rootfs /
COPY . /app
RUN npm run build:docker

# production output stage
FROM ${PROD_IMAGE}

# Copy files from repository.
COPY ./rootfs /
COPY ./run /app/run
COPY --from=0 /app/dist /app/dist
RUN npm config set loglevel warn \
 && npm install --silent --production

#COPY . /app
COPY --chown=1001:1001 ./proxy.conf.json /app

#USER 1001

# Runtime execution.

WORKDIR /app
ENTRYPOINT [ "npm", "run" ]
CMD ["start:docker"]
