// server related
const express = require('express');
const https = require('https');
const serveStatic = require('serve-static');
const cors = require('cors');
const apiProxy = require('http-proxy-middleware');
const httpProxy = require('http-proxy');
// authentication
const authBasic = require('express-basic-auth');
// utils
const path = require('path');
const fs = require('fs');
const csp = require(`helmet-csp`);
const winston = require(`winston`);
const sanitize = require("sanitize-filename");

// utils
const AuthModule                = require('../authserver/auth');
const inMemoryConfig            = require("../runtime.datastore");
const inMemoryConfigFromInputs  = require('../runtime.datastore.config');
const runtimeOptions            = new inMemoryConfig(inMemoryConfigFromInputs);
const packageInfo               = require('../package-info').asJSON();

// auth options
const authOptions = runtimeOptions.config.auth;
const auth        = new AuthModule( runtimeOptions.config );
// cors
var corsOptions   = runtimeOptions.config.cors;
// csp
var cspOptions    = runtimeOptions.config.csp;
// proxy config
var proxyOptions  = runtimeOptions.config.proxy;

// web server config
let serverOptions = runtimeOptions.config.web;

// stream options
let streamOptions = runtimeOptions.config.stream;

// config options
let configOptions = runtimeOptions.config.configServer;
/*
console.log('-------------------------------------');
console.log(inMemoryConfigFromInputs)
console.log('-------------------------------------');
console.log(runtimeOptions.config)
*/
// ----------------- start config endpoints -----------------
const app = express();

let _confBasePath = '';
if(runtimeOptions.config && 
  runtimeOptions.config.web && 
  runtimeOptions.config.web.path && runtimeOptions.config.web.path !== '/') {
    _confBasePath = runtimeOptions.config.web.path;
}
// package options
app.get(_confBasePath+'/conf/package', (req, res, next) => {
    res.status(200).json( packageInfo );
});
// auth config
app.get(_confBasePath+'/conf/auth', (req, res, next) => {
    res.status(200).json( authOptions );
});
// cors config
app.get(_confBasePath+'/conf/cors', (req, res, next) => {
    res.status(200).json( corsOptions );
});
// csp config
app.get(_confBasePath+'/conf/csp', (req, res, next) => {
    res.status(200).json( cspOptions );
});
// server config
app.get(_confBasePath+'/conf/server', (req, res, next) => {
    res.status(200).json( serverOptions );
});
// stream config
app.get(_confBasePath+'/conf/streams', (req, res, next) => {
    res.status(200).json( streamOptions );
});
// ----------------- start config endpoints -----------------

const ExpressSrvInstance = app.listen(configOptions.port);

console.log('Config Server started on port '+ configOptions.port);
console.log('');