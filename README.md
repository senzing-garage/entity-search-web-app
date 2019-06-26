
# Entity Search Web App

[![Build Status](https://travis-ci.com/Senzing/entity-search-web-app.svg?branch=master)](https://travis-ci.com/Senzing/entity-search-web-app) [![License](https://img.shields.io/github/license/senzing/entity-search-web-app.svg)](https://github.com/Senzing/entity-search-web-app/blob/master/LICENSE)

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

## Docker Support

1. You can pull the latest release of this app from [Docker Hub](https://hub.docker.com/r/senzing/entity-search-web-app). Simply do a `docker pull senzing/entity-search-web-app` to download it to the machine you want to run the app on. While you're at it, you might want to also grab latest of the api server with `docker pull senzing/senzing-api-server`.
2. Configure the app. You can do this by setting environment variables, or by setting them through a [docker-compose.yaml](docker-compose.yaml), or by passing them in at run-time. The Following are the important ones.
   1. SENZING_API_SERVER_URL="<http://senzing-api-server:8080>"
   2. SENZING_WEB_SERVER_PORT=8081
   3. SENZING_WEB_SERVER_API_PATH="/api"
  
3. Create Network
in order to have the docker containers talk to one another it is suggested that you create a network for your docker containers to communicate with each other. If using docker-compose.yaml to run the formation you can skip steps 3-5 as this is handled in the docker-compose.yaml
`docker network create -d bridge sz-api-network`
4. Attach senzing-api-server w/
`sudo docker run -it --publish 8080:8080 --rm --name=senzing-api-server --network=sz-api-network --tty --volume /opt/senzing:/opt/senzing senzing/senzing-api-server -concurrency 10 -httpPort 8080 -bindAddr all -iniFile /opt/senzing/g2/python/G2Module.ini`.
5. Run entity search web app:
`sudo docker run -it --publish 8081:8081 --name=senzing-webapp --network=sz-api-network --env SENZING_API_SERVER_URL=http://senzing-api-server:8080 --env SENZING_WEB_SERVER_PORT=8081 senzing/entity-search-web-app`
6. Run in a formation:
If using the compose formation just do `docker-compose up senzing-webapp` and you should be ready to go.
7. Open a browser to <http://machine-host-name:8081> or do a `curl http://machine-host-name:8081` to verify that the containers are running and accessible.

### Air Gapped Environments

Obviously if your deployment environment is highly restricted you're probably going to run in to issues downloading the latest images from that context. Please refer to <https://github.com/Senzing/knowledge-base/blob/master/HOWTO/install-docker-image-in-air-gapped-enviroment.md> for how to procedure regarding this use-case.

The short version is find a machine with network access, pull the docker images you need to that machine, package them as a tar file w `docker save senzing/entity-search-web-app --output senzing-entity-search-web-app-latest.tar`, copy that to the deployment machine, and load via `docker load --input senzing-entity-search-web-app-latest.tar`.

### Building from Source

1. Build Senzing api server. tag it as *senzing/senzing-api-server *. Following the instructions at ["Senzing API server"](https://github.com/Senzing/senzing-api-server).
  `cd ../senzing-api-server`
  `docker build --tag senzing/senzing-api-server .`
2. Build the web app.
   `docker build --tag senzing/entity-search-web-app .`
3. Run the app. `docker-compose up senzing-webapp`

The default api server port that the compose formation is set to communicate is *8080*. If you changed it to something else in step 1 you will have to change the environment variables in the [docker-compose.yaml](docker-compose.yaml).

## Development

To modify or make changes to the app the developer will have to clone or fork the Repository and build from source.

```sh
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

There are several ways to run unit tests. For developers run `npm run test` to execute the unit tests via [Karma](https://karma-runner.github.io) using the default [karma config file](src/karma.conf.js). These tests can also be run in a headless mode by running `npm run test:headless`.

For running unit tests from inside a docker container make sure you have the latest docker container, the script or [docker-compose.yaml](docker-compose.yaml) should pass the appropriate test script command to the container by `docker-compose up --abort-on-container-exit senzing-webapp-test`.

## Running end-to-end tests

For running e2e tests from inside a docker container make sure you have the latest docker container, the script or docker-compose.yml should pass the appropriate e2e script command to the container by `docker-compose up --abort-on-container-exit senzing-webapp-e2e`. Alternately you can pass the commands directly to the container by adding a `e2e:docker` to the end of your docker run command. ie:
`sudo docker run -it --publish 8081:8081 --name=senzing-webapp-e2e --network=sz-api-network --env SENZING_API_SERVER_URL=http://sz-api-server:8080 --env SENZING_WEB_SERVER_PORT=8081 senzing/entity-search-web-app e2e:docker`

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
