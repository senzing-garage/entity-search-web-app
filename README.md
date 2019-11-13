# Entity Search Web App

[![Build Status](https://travis-ci.com/Senzing/entity-search-web-app.svg?branch=master)](https://travis-ci.com/Senzing/entity-search-web-app)
[![License](https://img.shields.io/github/license/senzing/entity-search-web-app.svg)](https://github.com/Senzing/entity-search-web-app/blob/master/LICENSE)

![Screen Shot](src/assets/landing-page.png)

## Overview

This is a more complex example of SDK component usage. It differs from the example web apps in the following features:

* Routing (bookmarkable urls)
* Resolvers
* Activity Spinner
* Angular Material
* Direct interaction with SDK Services, not just components
* Error feedback
* Reverse proxy support
* ExpressJS web server(for production deployment)
* Open detail view in new tab

It's not meant to be followed along by a developer. Rather it serves as both an example of what a more full-featured implementation looks like, as well as a ready to build and deploy docker container.

### Related artifacts

1. [DockerHub](https://hub.docker.com/r/senzing/entity-search-web-app)
1. [Helm Chart](https://github.com/Senzing/charts/tree/master/charts/senzing-entity-search-web-app)

### Contents

- [Entity Search Web App](#entity-search-web-app)
  - [Overview](#overview)
    - [Related artifacts](#related-artifacts)
    - [Contents](#contents)
  - [Preparation](#preparation)
    - [Prerequisite software](#prerequisite-software)
    - [Clone repository](#clone-repository)
    - [Create SENZING_DIR](#create-senzingdir)
  - [Using docker-compose](#using-docker-compose)
  - [Using docker](#using-docker)
    - [Using SSL](#using-ssl)
      - [Prerequisites](#prerequisites)
      - [Self-Signed Certificates](#self-signed-certificates)
      - [Setting up SSL using Docker Stack](#setting-up-ssl-using-docker-stack)
    - [Air Gapped Environments](#air-gapped-environments)
    - [Building from Source](#building-from-source)
  - [Development](#development)
    - [Development server](#development-server)
    - [Production Server](#production-server)
  - [Code scaffolding](#code-scaffolding)
  - [Running unit tests](#running-unit-tests)
  - [Running end-to-end tests](#running-end-to-end-tests)
  - [Further help](#further-help)

## Preparation

### Prerequisite software

The following software programs need to be installed:

1. [docker](https://github.com/Senzing/knowledge-base/blob/master/HOWTO/install-docker.md)
1. [docker-compose](https://github.com/Senzing/knowledge-base/blob/master/HOWTO/install-docker-compose.md)

### Clone repository

1. Set these environment variable values:

    ```console
    export GIT_ACCOUNT=senzing
    export GIT_REPOSITORY=entity-search-web-app
    ```

1. Follow steps in [clone-repository](https://github.com/Senzing/knowledge-base/blob/master/HOWTO/clone-repository.md) to install the Git repository.

1. After the repository has been cloned, be sure the following are set:

    ```console
    export GIT_ACCOUNT_DIR=~/${GIT_ACCOUNT}.git
    export GIT_REPOSITORY_DIR="${GIT_ACCOUNT_DIR}/${GIT_REPOSITORY}"
    ```

### Create SENZING_DIR

If you do not already have an `/opt/senzing` directory on your local system, visit
[HOWTO - Create SENZING_DIR](https://github.com/Senzing/knowledge-base/blob/master/HOWTO/create-senzing-dir.md).

## Using docker-compose

1. Run in a docker-compose formation.
   Example:

    ```console
    cd ${GIT_REPOSITORY_DIR}

    sudo docker-compose up senzing-webapp
    ```

1. To verify that containers are running and accessible:

    1. Open a web browser on [http://localhost:8081](http://localhost:8081) (or substitute hostname or IP for `localhost`).

    1. Alternatively, `curl` can be used.
       Example:

       ```console
       curl http://machine-host-name:8081
       ```

## Using docker

1. Pull the latest release of this app from [Docker Hub](https://hub.docker.com/r/senzing/entity-search-web-app).
   Example:

    ```console
    sudo docker pull senzing/entity-search-web-app
    ```

1. Pull the latest of the api server from [DockerHub](https://hub.docker.com/r/senzing/senzing-api-server).
   Example:

    ```console
    sudo docker pull senzing/senzing-api-server
    ```

1. :pencil2: Configure the app.
   You can do this by setting environment variables, or by setting them through a [docker-compose.yaml](docker-compose.yaml),
   or by passing them in at run-time.
   The following are the important ones:

    ```console
    SENZING_API_SERVER_URL="http://senzing-api-server:8080"
    SENZING_WEB_SERVER_PORT=8081
    SENZING_WEB_SERVER_API_PATH="/api"
    ```

1. Create Network.
   In order to have the docker containers talk to one another it is suggested that you create a network for your docker
   containers to communicate with each other.
   If using docker-compose.yaml to run the formation you can skip steps 3-5
   as this is handled in the docker-compose.yaml.
   Example:

    ```console
    sudo docker network create -d bridge sz-api-network
    ```

1. Attach senzing-api-server.
   Example:

    ```console
    sudo docker run \
      --interactive \
      --name=senzing-api-server \
      --network=sz-api-network \
      --publish 8080:8080 \
      --rm \
      --tty \
      --volume /opt/senzing:/opt/senzing \
      senzing/senzing-api-server \
        -concurrency 10 \
        -httpPort 8080 \
        -bindAddr all \
        -iniFile /opt/senzing/g2/python/G2Module.ini
    ```

1. Run entity search web app.   Example:

    ```console
    sudo docker run \
      --env SENZING_API_SERVER_URL=http://senzing-api-server:8080 \
      --env SENZING_WEB_SERVER_PORT=8081 \
      --interactive \
      --name=senzing-webapp \
      --network=sz-api-network \
      --publish 8081:8081 \
      --rm \
      --tty \
      senzing/entity-search-web-app
    ```

1. To verify that containers are running and accessible:

    1. Open a web browser on [http://localhost:8081](http://localhost:8081) (or substitute hostname or IP for `localhost`).

    1. Alternatively, `curl` can be used.
       Example:

       ```console
       curl http://machine-host-name:8081
       ```

### Using SSL

The main docker image for the senzing webapp supports running it's webserver over HTTPS. In order to deploy the webapp in a secure way, you must be using the image in a swarm configuration, rather than a standalone service. For more information on swarms and why this is a requirement see [Docker Swarm Secrets](https://docs.docker.com/engine/swarm/secrets/)

#### Prerequisites

1. docker client and daemon with *API version* > 1.25
you can check what api version your docker client is running by typing `docker version`
2. Valid SSL certificates(server.key and server.cert) for the webserver. (if you don't have them, you can use a [self-signed certificate](#self-signed-certificates) in the interim)

#### Self-Signed Certificates

A self-signed certificate is sufficent to establish a secure, HTTPS connection for development purposes. It should not be used in a production environment, but if you're just trying to test out encryption to see how it works it's a viable short-term solution. You will need *OpenSSL* installed on your system to generate these. Just do a [google search](https://www.google.com/search?q=using+self+signed+SSL+certificate) or check out [this article](https://flaviocopes.com/express-https-self-signed-certificate/) or [this one](https://flaviocopes.com/express-https-self-signed-certificate/) and come back to this section once you have the server.cert and server.key files

#### Setting up SSL using Docker Stack

For convenience we have included a docker compose [file](./docker-stack.yml) specifically for running in SSL configuration. We suggest starting with this example if you're not familiar how stacks work(you will want a different yml file for stack deployment for a number of reasons).
If you open that example up you will see two lines at the bottom of the file:

```yaml
  SZ_WEBAPP_SSL_CERT:
    file: '../CERTS/server.cert'
  SZ_WEBAPP_SSL_KEY:
    file: '../CERTS/server.key'
```

Those lines tell docker to pass two secrets to the services defined in the docker compose file. These two lines should point to the location of the *server.key* and *server.cert* file you wish to use. The configuration of the *senzing-api-server* service may differ from how you have set up your configuration to run. You should copy over the configuration options defined in your _already working_ docker-compose.yml file to the docker-stack.yml file.
The other important lines(under the *senzing-webapp* service definition) are:

```yaml
secrets:
      - source: SZ_WEBAPP_SSL_CERT
        target: server.cert
        uid: '1001'
        gid: '1001'
      - source: SZ_WEBAPP_SSL_KEY
        target: server.key
        uid: '1001'
        gid: '1001'
```

They tell the webapp service to use the content of the secrets defined at the bottom of the file. It's like passing the files in.. but also not. docker secrets are weird.

Next you will deploy the services defined in the yml file to your swarm manager by typing `sudo SENZING_DATA_VERSION_DIR=${SENZING_DATA_VERSION_DIR} SENZING_ETC_DIR=${SENZING_ETC_DIR} SENZING_G2_DIR=${SENZING_G2_DIR} SENZING_VAR_DIR=${SENZING_VAR_DIR} docker stack deploy -c docker-stack.yml senzing-webapp`
check that the services started up successfully by typing `docker stack ps senzing-webapp`. the result should look like the following

```bash
ID                  NAME                                  IMAGE                               NODE                DESIRED STATE       CURRENT STATE               ERROR               PORTS
7mxc4jru51pl        senzing-webapp_senzing-api-server.1   senzing/senzing-api-server:latest   americium           Running             Running about an hour ago
rnguy9d2incb        senzing-webapp_senzing-webapp.1       senzing/entity-search-web-app:ssl   americium           Running             Running about an hour ago
```

next you can initiate a curl request to your webserver with `curl -kvv https://localhost:8081`. The output should looks something like the following:

```bash
* Rebuilt URL to: https://localhost:8081/
*   Trying 127.0.0.1...
* TCP_NODELAY set
* Connected to localhost (127.0.0.1) port 8081 (#0)
* ALPN, offering h2
* ALPN, offering http/1.1
* successfully set certificate verify locations:
*   CAfile: /etc/ssl/certs/ca-certificates.crt
  CApath: /etc/ssl/certs
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS Unknown, Certificate Status (22):
* TLSv1.3 (IN), TLS handshake, Unknown (8):
* TLSv1.3 (IN), TLS Unknown, Certificate Status (22):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS Unknown, Certificate Status (22):
* TLSv1.3 (IN), TLS handshake, CERT verify (15):
* TLSv1.3 (IN), TLS Unknown, Certificate Status (22):
* TLSv1.3 (IN), TLS handshake, Finished (20):
* TLSv1.3 (OUT), TLS change cipher, Client hello (1):
* TLSv1.3 (OUT), TLS Unknown, Certificate Status (22):
* TLSv1.3 (OUT), TLS handshake, Finished (20):
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
* ALPN, server accepted to use http/1.1
* Server certificate:
*  subject: C=US; ST=OR; L=SenzingTown; O=Senzing; CN=localhost
*  start date: Nov 13 00:49:12 2019 GMT
*  expire date: Nov 12 00:49:12 2020 GMT
*  issuer: C=US; ST=OR; L=SenzingTown; O=Senzing; CN=localhost
*  SSL certificate verify result: self signed certificate (18), continuing anyway.
* TLSv1.3 (OUT), TLS Unknown, Unknown (23):
> GET / HTTP/1.1
> Host: localhost:8081
> User-Agent: curl/7.58.0
> Accept: */*
```

I'm using a self-signed cert in this example, but the important part is that you see the *TLSvx.x* handshake(s) and the *Server certificate:* response block. At this point you open up a normal browser(chrome, ff, edge etc) to your server instance, something like [https://localhost:8081](https://localhost:8081). You _should_ see information next to the address in the address bar with the SSL information provided by the certificate. If you self-signed you will be greeted with a warning message asking whether you want to proceed or not, this is normal.

You can shut down the swarm node with `docker stack rm senzing-webapp`

### Air Gapped Environments

Obviously if your deployment environment is highly restricted you're probably going
to run in to issues downloading the latest images from that context.
Please refer to
"[Install docker image in an air-gapped environment](https://github.com/Senzing/knowledge-base/blob/master/HOWTO/install-docker-image-in-air-gapped-enviroment.md)"
for how to procedure regarding this use-case.

The short version is find a machine with network access, then:

1. Pull the docker images you need to that machine.
2. Package them as a tar file. Example:

    ```console
    sudo docker save senzing/entity-search-web-app --output senzing-entity-search-web-app-latest.tar
    ```

3. Copy that to the deployment machine.
4. Load via

    ```console
    sudo docker load --input senzing-entity-search-web-app-latest.tar
    ```

### Building from Source

1. Build Senzing api server. tag it as *senzing/senzing-api-server *. Following the instructions at ["Senzing API server"](https://github.com/Senzing/senzing-api-server).
   Example:

    ```console
    cd ../senzing-api-server
    sudo docker build --tag senzing/senzing-api-server .
    ```

2. Build the web app.
   Example:

    ```console
    sudo docker build --tag senzing/entity-search-web-app .
    ```

3. Run the app.
   Example:

    ```console
    sudo docker-compose up senzing-webapp
    ```

The default api server port that the compose formation is set to communicate is *8080*. If you changed it to something else in step 1 you will have to change the environment variables in the [docker-compose.yaml](docker-compose.yaml).

## Development

1. To modify or make changes to the app the developer will have to clone or fork the Repository and build from source.

    ```console
    git clone git@github.com:Senzing/entity-search-web-app.git
    cd entity-search-web-app
    npm install
    npm start
    ```

You may also need to install [NodeJS](https://nodejs.org), and [AngularCLI](https://cli.angular.io/) if you haven't already done so.

### Development server

1. Run

    ```console
    ng serve
    ```

   for a dev server. Navigate to `http://localhost:4200/`.
   The app will automatically reload if you change any of the source files.

### Production Server

1. Generate a compiled version of the app in the `_dist/_` directory.
   Example:

    ```console
    ng build --prod
    ```

1. Compiled assets can be served by ExpressJS by running:

    ```console
    node webserver
    ```

## Code scaffolding

1. To generate a new component, Run

    ```console
    ng generate component component-name
    ```

1. Alternatively, you can use

    ```console
    ng generate directive|pipe|service|class|guard|interface|enum|module
    ```

## Running unit tests

There are several ways to run unit tests.

1. For developers,  to execute the unit tests via [Karma](https://karma-runner.github.io) using the default [karma config file](src/karma.conf.js), run

    ```console
    npm run test
    ```

1. These tests can also be run in a headless mode by running

    ```console
    npm run test:headless
    ```

1. For running unit tests from inside a docker container make sure you have the latest docker container, the script or [docker-compose.yaml](docker-compose.yaml) should pass the appropriate test script command to the container by

    ```console
    sudo docker-compose up --abort-on-container-exit senzing-webapp-test
    ```

## Running end-to-end tests

1. For running e2e tests from inside a docker container make sure you have the latest docker container, the script or docker-compose.yml should pass the appropriate e2e script command to the container. Example:

    ```console
    sudo docker-compose up --abort-on-container-exit senzing-webapp-e2e
    ```

1. Alternately you can pass the commands directly to the container by adding an
`e2e:docker` to the end of your docker run command. Example:

    ```console
    sudo docker run \
      --env SENZING_API_SERVER_URL=http://senzing-api-server:8080 \
      --env SENZING_WEB_SERVER_PORT=8081 \
      --interactive \
      --name=senzing-webapp-e2e \
      --network=sz-api-network \
      --publish 8081:8081 \
      --tty \
      senzing/entity-search-web-app e2e:docker
    ```

## Further help

1. To get more help on the Angular CLI use

    ```console
    ng help
    ```

   or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
