// server related
const express = require('express');
const https = require('https');
const serveStatic = require('serve-static');
const cors = require('cors');
const apiProxy = require('http-proxy-middleware');
// authentication
const auth = require('express-basic-auth');
// utils
const path = require('path');
const fs = require('fs');
const url = require('url');

// grab env vars
let env = process.env;

// server(s)
const app = express();

// api config
var cfg = {
  SENZING_WEB_SERVER_PORT: (env.SENZING_WEB_SERVER_PORT ? env.SENZING_WEB_SERVER_PORT : 4200),
  SENZING_WEB_SERVER_API_PATH: (env.SENZING_WEB_SERVER_API_PATH ? env.SENZING_WEB_SERVER_API_PATH : "/api"),
  SENZING_API_SERVER_URL: (env.SENZING_API_SERVER_URL ? env.SENZING_API_SERVER_URL : "http://localhost:8080"),
  SENZING_WEB_SERVER_SSL_CERT_DIR: (env.SENZING_WEB_SERVER_SSL_CERT_DIR ? env.SENZING_WEB_SERVER_SSL_CERT_DIR : "cert"),
  SENZING_WEB_SERVER_SSL_SUPPORT: (env.SENZING_WEB_SERVER_SSL_CERT_DIR && SENZING_WEB_SERVER_SSL_SUPPORT ? env.SENZING_WEB_SERVER_SSL_SUPPORT : true),
  SENZING_WEB_SERVER_BASIC_AUTH: true,
  SENZING_WEB_SERVER_BASIC_AUTH_JSON: (env.SENZING_WEB_SERVER_BASIC_AUTH_JSON ? env.SENZING_WEB_SERVER_BASIC_AUTH_JSON : "users/users.json")
}

// ------------------------------------------------------------------------

// use basic authentication middleware ?
if( cfg.SENZING_WEB_SERVER_BASIC_AUTH ){
  const _authJSONPath = path.join(__dirname + path.sep + cfg.SENZING_WEB_SERVER_BASIC_AUTH_JSON);
  console.log('-- AUTH MODULE ENABLED --');
  console.log(_authJSONPath, '\n\r');
  // Basic Auth
  app.use(auth({
    challenge: true,
    users: require( _authJSONPath )
  }));
}

// borrow proxy config from webpack proxy conf
var proxyCfg = require('./proxy.conf.json');
// set up proxy tunnels
for(proxyPath in proxyCfg){
  let proxyTargetOptions = proxyCfg[proxyPath];
  //console.log('Proxy CFG: '+ proxyPath);
  //console.log(proxyTargetOptions);
  app.use(proxyPath, apiProxy(proxyTargetOptions));
}

// static files
app.use('/node_modules/@senzing/sdk-components-web', express.static(__dirname + '/node_modules/@senzing/sdk-components-web/'));
app.use(express.static(__dirname + '/dist/entity-search-web-app/'));

// SPA page
app.use('*',function(req, res) {
    res.sendFile(path.join(__dirname + path.sep +'dist/entity-search-web-app/index.html'));
});

// set up server(s) instance(s)
var ExpressSrvInstance;
if( cfg.SENZING_WEB_SERVER_SSL_SUPPORT ){
  // https
  const _ssl_key_location  = (cfg.SENZING_WEB_SERVER_SSL_CERT_DIR ? cfg.SENZING_WEB_SERVER_SSL_CERT_DIR + '/' : '') + 'server.key';
  const _ssl_cert_location = (cfg.SENZING_WEB_SERVER_SSL_CERT_DIR ? cfg.SENZING_WEB_SERVER_SSL_CERT_DIR + '/' : '') + 'server.cert';

  const ssl_opts = {
    key: fs.readFileSync(_ssl_key_location),
    cert: fs.readFileSync(_ssl_cert_location)
  }
  ExpressSrvInstance = https.createServer(ssl_opts, app).listen(cfg.SENZING_WEB_SERVER_PORT)
  console.log('SSL Express Server started on port '+ cfg.SENZING_WEB_SERVER_PORT);
  console.log('\tKEY: ', _ssl_key_location);
  console.log('\tCERT: ', _ssl_cert_location);
} else {
  // http
  ExpressSrvInstance = app.listen(cfg.SENZING_WEB_SERVER_PORT);
  console.log(`not using SSL (${cfg.SENZING_WEB_SERVER_SSL_SUPPORT})`);
  console.log('Express Server started on port '+ cfg.SENZING_WEB_SERVER_PORT);
}
