# Entity Search Web App

## Overview
This is a more complex example of SDK component usage. It differs from the example web apps in the following features:
* Routing (bookmarkable urls)
* Resolvers
* Activity Spinner
* Angular Material
* Direct interaction with SDK Services, not just components
* Error feedback
* Legacy browser support (Internet Explorer)
* Reverse proxy support
* ExpressJS web server(for production deployment)
* Open detail view in new tab

It's not mean to be followed along by a developer. Rather it serves as both an example of what a more full-featured implementation looks like, as well as a ready to build and deploy docker container.

## Development server
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Production Server
Run `ng build --prod` which will generate a compiled version of the app in the _dist/_ directory. Compiled assets can be served by ExpressJS by running  `node webserver`.

## Docker Support
1. Build Senzing api server. tag it as *senzing/senzing-api-server *. Following the instructions at "Senzing API server".
  `cd ../senzing-api-server`
  `docker build --tag senzing/senzing-api-server .`
2. Build the web app.
   `docker build --tag senzingiris/entity-search-web-app .`
3. Run the app. `docker-compose up`

The default api server port that the compose formation is set to communicate is *8080*. If you changed it to something else in step 1 you will have to change the environment variables in the [docker-compose.yaml](docker-compose.yaml).

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
