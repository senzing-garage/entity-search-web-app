
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

### Contents

1. [Preparation](#preparation)
    1. [Prerequisite software](#prerequisite-software)
    1. [Clone repository](#clone-repository)
    1. [Create SENZING_DIR](#create-senzing_dir)
1. [Using docker-compose](#using-docker-compose)
1. [Using docker](#using-docker)
    1. [Air Gapped Environments](#air-gapped-environments)
    1. [Building from Source](#building-from-source)
1. [Development](#development)
    1. [Development server](#development-server)
    1. [Production server](#production-server)
1. [Code scaffolding](#code-scaffolding)
1. [Running unit tests](#running-unit-tests)
1. [Renning end-to-end tests](#running-end-to-end-tests)
1. [Further help](#further-help)

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

    docker-compose up
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

1. Configure the app.
   You can do this by setting environment variables, or by setting them through a [docker-compose.yaml](docker-compose.yaml),
   or by passing them in at run-time.
   The following are the important ones:

    ```console
    SENZING_API_SERVER_URL="<http://sz-api-server:8080>"
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
      --name=sz-api-server \
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
      --env SENZING_API_SERVER_URL=http://sz-api-server:8080 \
      --env SENZING_WEB_SERVER_PORT=8081 \
      --interactive \
      --publish 8081:8081 \
      --name=sz-search-web-server \
      --network=sz-api-network \
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

### Air Gapped Environments

Obviously if your deployment environment is highly restricted you're probably going
to run in to issues downloading the latest images from that context.
Please refer to
"[Install docker image in an air-gapped environment](https://github.com/Senzing/knowledge-base/blob/master/HOWTO/install-docker-image-in-air-gapped-enviroment.md)"
for how to procedure regarding this use-case.

The short version is find a machine with network access, then:

1. Pull the docker images you need to that machine.
1. Package them as a tar file. Example:

    ```console
    sudo docker save senzing/entity-search-web-app --output senzing-entity-search-web-app-latest.tar
    ```

1. Copy that to the deployment machine.
1. Load via

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
    docker-compose up
    ```

The default api server port that the compose formation is set to communicate is *8080*. If you changed it to something else in step 1 you will have to change the environment variables in the [docker-compose.yaml](docker-compose.yaml).

## Development

To modify or make changes to the app the developer will have to clone or fork the Repository and build from source.

```console
git clone git@github.com:Senzing/entity-search-web-app.git
cd entity-search-web-app
npm install
npm start
```

You may also need to install [NodeJS](https://nodejs.org), and [AngularCLI](https://cli.angular.io/) if you haven't already done so.

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Production Server

Run `ng build --prod` which will generate a compiled version of the app in the _dist/_ directory. Compiled assets can be served by ExpressJS by running  `node webserver`.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
