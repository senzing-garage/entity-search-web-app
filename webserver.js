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
const AuthModule = require('./auth');
const AdminAuth = AuthModule.module;

// grab env vars
let env = process.env;
// server(s)
const app = express();
// auth module
const adminAuthOptions = AuthModule.getOptionsFromInput();
const adminAuth = new AdminAuth( adminAuthOptions );

// api config
var cfg = {
  SENZING_WEB_SERVER_PORT: (env.SENZING_WEB_SERVER_PORT ? env.SENZING_WEB_SERVER_PORT : 4200),
  SENZING_WEB_SERVER_API_PATH: (env.SENZING_WEB_SERVER_API_PATH ? env.SENZING_WEB_SERVER_API_PATH : "/api"),
  SENZING_API_SERVER_URL: (env.SENZING_API_SERVER_URL ? env.SENZING_API_SERVER_URL : "http://localhost:8080"),
  SENZING_WEB_SERVER_SSL_CERT_PATH: (env.SENZING_WEB_SERVER_SSL_CERT_PATH ? env.SENZING_WEB_SERVER_SSL_CERT_PATH : "/run/secrets/server.cert"),
  SENZING_WEB_SERVER_SSL_KEY_PATH: (env.SENZING_WEB_SERVER_SSL_KEY_PATH ? env.SENZING_WEB_SERVER_SSL_KEY_PATH : "/run/secrets/server.key"),
  SENZING_WEB_SERVER_SSL_SUPPORT: (this.SENZING_WEB_SERVER_SSL_CERT_PATH && this.SENZING_WEB_SERVER_SSL_KEY_PATH ? true : false),
  SENZING_WEB_SERVER_BASIC_AUTH_JSON: (env.SENZING_WEB_SERVER_BASIC_AUTH_JSON ? env.SENZING_WEB_SERVER_BASIC_AUTH_JSON : false),
  SENZING_WEB_SERVER_BASIC_AUTH: (this.SENZING_WEB_SERVER_BASIC_AUTH_JSON ? true : false),
}

// ------------------------------------------------------------------------

// check if SSL file(s) exist
if(cfg.SENZING_WEB_SERVER_SSL_CERT_PATH && cfg.SENZING_WEB_SERVER_SSL_KEY_PATH){
  try {
    if (fs.existsSync(cfg.SENZING_WEB_SERVER_SSL_CERT_PATH) && fs.existsSync(cfg.SENZING_WEB_SERVER_SSL_KEY_PATH)) {
      //file exists
      console.log('-- SSL ENABLED --');
      cfg.SENZING_WEB_SERVER_SSL_SUPPORT = true;
    } else {
      cfg.SENZING_WEB_SERVER_SSL_SUPPORT = false;
    }
  } catch(err) {
    cfg.SENZING_WEB_SERVER_SSL_SUPPORT = false;
  }
}

// use basic authentication middleware ?
if( cfg.SENZING_WEB_SERVER_BASIC_AUTH_JSON ){
  // check that file exists
  const _authJSONPath = (cfg.SENZING_WEB_SERVER_BASIC_AUTH_JSON && cfg.SENZING_WEB_SERVER_BASIC_AUTH_JSON.substr(0,1) !== '/') ? path.join(__dirname + path.sep + cfg.SENZING_WEB_SERVER_BASIC_AUTH_JSON) : cfg.SENZING_WEB_SERVER_BASIC_AUTH_JSON ;
  try {
    if (fs.existsSync(_authJSONPath)) {
      //file exists
      // Basic Auth
      app.use(auth({
        challenge: true,
        users: require( _authJSONPath )
      }));
      console.log('-- AUTH MODULE ENABLED --');
      console.log('\tJSON DB PATH:',_authJSONPath, '\n\r');
    } else {
      console.log('-- AUTH MODULE ERROR: auth JSON not found ('+ _authJSONPath +') --\n\r');
    }
  } catch(err) {
    console.log('-- AUTH MODULE DISABLED : '+ err +' --\n\r');
    cfg.SENZING_WEB_SERVER_BASIC_AUTH = false;
  }
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
// admin auth tokens
const authRes = (req, res, next) => {
  const body = req.body;
  const encodedToken = (body && body.adminToken) ? body.adminToken : req.query.adminToken;

  res.status(200).json({
    tokenIsValid: true,
    adminToken: encodedToken
  });
};
app.post('/jwt/login', adminAuth.login.bind(adminAuth));
app.post('/jwt/auth', adminAuth.auth.bind(adminAuth), authRes);
app.get('/jwt/auth', adminAuth.auth.bind(adminAuth), authRes);
app.get('/jwt/protected', adminAuth.auth.bind(adminAuth), authRes);
app.post('/admin/auth/jwt/auth', adminAuth.auth.bind(adminAuth), authRes);
app.get('/admin/auth/jwt/auth', adminAuth.auth.bind(adminAuth), authRes);
// SPA page
app.use('*',function(req, res) {
    res.sendFile(path.join(__dirname + path.sep +'dist/entity-search-web-app/index.html'));
});

// set up server(s) instance(s)
var ExpressSrvInstance;
if( cfg.SENZING_WEB_SERVER_SSL_SUPPORT ){
  // https
  const ssl_opts = {
    key: fs.readFileSync(cfg.SENZING_WEB_SERVER_SSL_KEY_PATH),
    cert: fs.readFileSync(cfg.SENZING_WEB_SERVER_SSL_CERT_PATH)
  }
  ExpressSrvInstance = https.createServer(ssl_opts, app).listen(cfg.SENZING_WEB_SERVER_PORT)
  console.log('\nSSL Express Server started on port '+ cfg.SENZING_WEB_SERVER_PORT);
  console.log('\tKEY: ', cfg.SENZING_WEB_SERVER_SSL_KEY_PATH);
  console.log('\tCERT: ', cfg.SENZING_WEB_SERVER_SSL_CERT_PATH);
} else {
  // http
  ExpressSrvInstance = app.listen(cfg.SENZING_WEB_SERVER_PORT);
  console.log('Express Server started on port '+ cfg.SENZING_WEB_SERVER_PORT);
  console.log('');
  console.log('To access the /admin area you will need a Admin Token.');
  console.log('Admin Tokens are generated from a randomly generated secret unless one is specified with the -adminSecret flag.');
  console.log('');
  console.log('---------------------');
  console.log('');
  console.log('ADMIN SECRET: ', adminAuth.secret);
  console.log('ADMIN SEED:   ', adminAuth.seed);
  console.log('');
  console.log('ADMIN TOKEN:  ');
  console.log(adminAuth.token);
  console.log('');
  console.log('---------------------');
  console.log('');
}
