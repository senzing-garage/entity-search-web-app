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
const AuthModule = require('../authserver/auth');
const inMemoryConfig = require("../runtime.datastore");
const inMemoryConfigFromInputs = require('../runtime.datastore.config');
const runtimeOptions = new inMemoryConfig(inMemoryConfigFromInputs);

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

// ----------------- start config endpoints -----------------
const app = express();

app.get('/conf/auth', (req, res, next) => {
    res.status(200).json( authOptions );
});

app.get('/conf/cors', (req, res, next) => {
    res.status(200).json( corsOptions );
});

app.get('/conf/csp', (req, res, next) => {
    res.status(200).json( cspOptions );
});

app.get('/conf/server', (req, res, next) => {
    res.status(200).json( serverOptions );
});

app.get('/conf/streams', (req, res, next) => {
    res.status(200).json( streamOptions );
});
// ----------------- start config endpoints -----------------

const ExpressSrvInstance = app.listen(4201);

console.log('Config Server started on port '+ 4201);
console.log('');