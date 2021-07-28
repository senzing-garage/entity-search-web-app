ARG BASE_IMAGE=node:lts-buster-slim
FROM ${BASE_IMAGE}

ENV REFRESHED_AT=2021-07-26

LABEL Name="senzing/entity-search-web-app" \
      Maintainer="support@senzing.com" \
      Version="2.2.4"

HEALTHCHECK CMD ["/app/healthcheck.sh"]

# Run as "root" for system installation.

USER root

# Install WGET
RUN apt-get -qq update \
 && apt-get install -qq -yq \
 wget \
 gnupg2

# Install chrome for protractor tests.

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
 && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
 && apt-get -qq update \
 && apt-get -qq install -yq \
    google-chrome-stable \
 && rm -rf /var/lib/apt/lists/*

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

# Copy files from repository.
COPY ./rootfs /
COPY . /app
COPY --chown=1001:1001 ./proxy.conf.json /app

# Build app. build as root and switch back
USER root
RUN npm run build:docker

# Remove src tree after build
RUN rm -fR /app/src

USER 1001

# Runtime execution.

WORKDIR /app
ENTRYPOINT [ "npm", "run" ]
CMD ["start:docker"]
