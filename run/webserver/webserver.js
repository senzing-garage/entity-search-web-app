// server related
const express = require('express');
const https = require('https');
const serveStatic = require('serve-static');
const cors = require('cors');
const apiProxy = require('http-proxy-middleware');
// authentication
const authBasic = require('express-basic-auth');
// utils
const path = require('path');
const fs = require('fs');
const url = require('url');
const csp = require(`helmet-csp`);
const winston = require(`winston`);

// utils
const AuthModule = require('../authserver/auth');
const inMemoryConfig = require("../runtime.datastore");
const inMemoryConfigFromInputs = require('../runtime.datastore.config');
const runtimeOptions = new inMemoryConfig(inMemoryConfigFromInputs);

// grab env/cmdline vars
const authOptions = runtimeOptions.config.auth;
const auth        = new AuthModule( runtimeOptions.config );

// cors
var corsOptions   = runtimeOptions.config.cors;
// csp
var cspOptions    = runtimeOptions.config.csp;

// write proxy conf to file? (we need this for DEV mode)
if(inMemoryConfigFromInputs.proxyServerOptions.writeToFile) {
  runtimeOptions.writeProxyConfigToFile("../","proxy.conf.json");
}

// grab env vars
let env = process.env;
// server(s)
const app = express();
// auth module
//const authOptions = AuthModule.getOptionsFromInput();
//const adminAuth = new AdminAuth( authOptions );
let STARTUP_MSG = '';

// api config
var cfg = {
  SENZING_WEB_SERVER_PORT: (env.SENZING_WEB_SERVER_PORT ? env.SENZING_WEB_SERVER_PORT : 4200),
  SENZING_WEB_SERVER_API_PATH: (env.SENZING_WEB_SERVER_API_PATH ? env.SENZING_WEB_SERVER_API_PATH : "/api"),
  SENZING_WEB_SERVER_AUTH_PATH: (env.SENZING_WEB_SERVER_AUTH_PATH ? env.SENZING_WEB_SERVER_AUTH_PATH : "http://localhost:8080"),
  SENZING_WEB_SERVER_ADMIN_AUTH_MODE: (env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE ? env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE : "JWT"),
  SENZING_API_SERVER_URL: (env.SENZING_API_SERVER_URL ? env.SENZING_API_SERVER_URL : "http://localhost:8080"),
  SENZING_WEB_SERVER_SSL_CERT_PATH: (env.SENZING_WEB_SERVER_SSL_CERT_PATH ? env.SENZING_WEB_SERVER_SSL_CERT_PATH : "/run/secrets/server.cert"),
  SENZING_WEB_SERVER_SSL_KEY_PATH: (env.SENZING_WEB_SERVER_SSL_KEY_PATH ? env.SENZING_WEB_SERVER_SSL_KEY_PATH : "/run/secrets/server.key"),
  SENZING_WEB_SERVER_SSL_SUPPORT: (this.SENZING_WEB_SERVER_SSL_CERT_PATH && this.SENZING_WEB_SERVER_SSL_KEY_PATH ? true : false),
  SENZING_WEB_SERVER_BASIC_AUTH_JSON: (env.SENZING_WEB_SERVER_BASIC_AUTH_JSON ? env.SENZING_WEB_SERVER_BASIC_AUTH_JSON : false),
  SENZING_WEB_SERVER_BASIC_AUTH: (this.SENZING_WEB_SERVER_BASIC_AUTH_JSON ? true : false),
}

// security options and middleware
if(auth.useCors) {
  const corsOptions = JSON.parse( fs.readFileSync(__dirname + path.sep + 'auth'+ path.sep +'cors.conf.json', 'utf8') );
  STARTUP_MSG = STARTUP_MSG + '\n'+'-- CORS ENABLED --';
  app.options('*', cors(corsOptions)) // include before other routes
}
if(auth.useCsp) {
  const cspOptions = require('../../auth/csp.conf');
  STARTUP_MSG = STARTUP_MSG + '\n'+'-- CSP ENABLED --';
  app.use(csp(cspOptions)); //csp options
}
// cors test endpoint
app.get('/cors/test', (req, res, next) => {
  res.status(200).json( authOptions );
});
app.post(`/api/csp/report`, (req, res) => {
  winston.warn(`CSP header violation`, req.body[`csp-report`])
  res.status(204).end();
});

// ------------------------------------------------------------------------

// check if SSL file(s) exist
if(cfg.SENZING_WEB_SERVER_SSL_CERT_PATH && cfg.SENZING_WEB_SERVER_SSL_KEY_PATH){
  try {
    if (fs.existsSync(cfg.SENZING_WEB_SERVER_SSL_CERT_PATH) && fs.existsSync(cfg.SENZING_WEB_SERVER_SSL_KEY_PATH)) {
      //file exists
      STARTUP_MSG = STARTUP_MSG + '\n'+'-- SSL ENABLED --';
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
      app.use(authBasic({
        challenge: true,
        users: require( _authJSONPath )
      }));
      STARTUP_MSG = STARTUP_MSG + '\n'+'-- AUTH MODULE ENABLED --';
      STARTUP_MSG = STARTUP_MSG + '\n'+'\tJSON DB PATH:'+ _authJSONPath +'\n';
    } else {
      STARTUP_MSG = STARTUP_MSG + '\n'+'-- AUTH MODULE ERROR: auth JSON not found ('+ _authJSONPath +') --\n';
    }
  } catch(err) {
    STARTUP_MSG = STARTUP_MSG + '\n'+'-- AUTH MODULE DISABLED : '+ err +' --\n';
    cfg.SENZING_WEB_SERVER_BASIC_AUTH = false;
  }
}

// borrow proxy config from webpack proxy conf
var proxyCfg = require('../../proxy.conf.json');
// set up proxy tunnels
for(proxyPath in proxyCfg){
  let proxyTargetOptions = proxyCfg[proxyPath];
  // add custom error handler to prevent XSS/Injection in to error response
  function onError(err, req, res) {
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('proxy encountered an error.');
  }
  proxyTargetOptions.onError = onError;
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

if(authOptions) {
  app.get('/conf/auth', (req, res, next) => {
    res.status(200).json( authOptions );
  });
  app.get('/conf/auth/admin', (req, res, next) => {
    res.status(200).json( authOptions.admin );
  });
  app.get('/conf/auth/operator', (req, res, next) => {
    res.status(200).json( authOptions.operator );
  });

  if(authOptions.admin && authOptions.admin.mode === 'SSO' || authOptions.admin.mode === 'EXTERNAL') {
    const ssoResForceTrue = (req, res, next) => {
      res.status(200).json({
        authorized: true,
      });
    };
    const ssoResForceFalse = (req, res, next) => {
      res.status(401).json({
        authorized: false,
      });
    };
    // dunno if this should be a reverse proxy req or not
    // especially if the SSO uses cookies etc
    app.get('/sso/admin/status', ssoResForceTrue);
    app.get('/sso/admin/login', (req, res, next) => {
      res.sendFile(path.join(__dirname+'/auth/sso-login.html'));
    });
    //STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'---------------------';
    STARTUP_MSG = STARTUP_MSG + '\n'+'--- Auth SETTINGS ---';
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    //STARTUP_MSG = STARTUP_MSG + '\n'+'/admin area:';
    STARTUP_MSG = STARTUP_MSG + '\n'+ JSON.stringify(authOptions, null, "  ");
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    //STARTUP_MSG = STARTUP_MSG + '\n'+'/ operators:';
    //STARTUP_MSG = STARTUP_MSG + '\n'+ JSON.stringify(adminAuth.authConfig.admin, null, "  ");
    STARTUP_MSG = STARTUP_MSG + '\n'+'---------------------';

  } else if(authOptions.admin.mode === 'JWT' || authOptions.admin.mode === 'BUILT-IN') {
    const jwtRes = (req, res, next) => {
      const body = req.body;
      const encodedToken = (body && body.adminToken) ? body.adminToken : req.query.adminToken;

      res.status(200).json({
        tokenIsValid: true,
        adminToken: encodedToken
      });
    };
    const jwtResForceTrue = (req, res, next) => {
      res.status(200).json({
        tokenIsValid: true,
      });
    };
    /** admin endpoints */
    /*
    app.post('/jwt/admin/status', jwtResForceTrue);
    app.post('/jwt/admin/login', jwtResForceTrue);
    app.get('/jwt/admin/status', jwtResForceTrue);
    app.get('/jwt/admin/login', jwtResForceTrue);
    */

    app.post('/jwt/admin/status', auth.auth.bind(auth), jwtRes);
    app.post('/jwt/admin/login', auth.login.bind(auth));
    app.get('/jwt/admin/status', auth.auth.bind(auth), jwtRes);
    app.get('/jwt/admin/login', auth.auth.bind(auth), jwtRes);

    /** operator endpoints */
    if(authOptions.operator && authOptions.operator.mode === 'JWT') {
      // token auth for operators
      app.post('/jwt/status', auth.auth.bind(adminAuth), jwtRes);
      app.post('/jwt/login', auth.login.bind(adminAuth));
      app.get('/jwt/status', auth.auth.bind(adminAuth), jwtRes);
      app.get('/jwt/login', auth.auth.bind(adminAuth), jwtRes);
    } else {
      // always return true for operators
      app.post('/jwt/status', jwtResForceTrue);
      app.post('/jwt/login', jwtResForceTrue);
      app.get('/jwt/status', jwtResForceTrue);
      app.get('/jwt/login', jwtResForceTrue);
    }

    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'To access the /admin area you will need a Admin Token.';
    STARTUP_MSG = STARTUP_MSG + '\n'+'Admin Tokens are generated from a randomly generated secret unless one is specified with the -adminSecret flag.';
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'---------------------';
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'ADMIN SECRET: '+ auth.secret;
    STARTUP_MSG = STARTUP_MSG + '\n'+'ADMIN SEED:   '+ auth.seed;
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'ADMIN TOKEN:  ';
    STARTUP_MSG = STARTUP_MSG + '\n'+ auth.token;
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'---------------------';
    STARTUP_MSG = STARTUP_MSG + '\n'+'Copy and Paste the line above when prompted for the Admin Token in the admin area.';
  } else {
    // no auth
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'---------------------';
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'    CAUTION    ';
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'/admin path not protected via ';
    STARTUP_MSG = STARTUP_MSG + '\n'+'authentication mechanism.';
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'To add built-in Token authentication for the /admin path '
    STARTUP_MSG = STARTUP_MSG + '\n'+'set the \'SENZING_WEB_SERVER_ADMIN_AUTH_MODE="JWT"\' env variable ';
    STARTUP_MSG = STARTUP_MSG + '\n'+'or the \'adminAuthMode="JWT"\' command line arg.'
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'To add an external authentication check configure your ';
    STARTUP_MSG = STARTUP_MSG + '\n'+'proxy to resolve with a 401 or 403 header for ';
    STARTUP_MSG = STARTUP_MSG + '\n'+'"/admin/auth/status" requests to this instance.';
    STARTUP_MSG = STARTUP_MSG + '\n'+'Set the auth mode to SSO by setting \'SENZING_WEB_SERVER_ADMIN_AUTH_MODE="SSO"\'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'A failure can be redirected by setting "SENZING_WEB_SERVER_ADMIN_AUTH_REDIRECT="https://my-sso.my-domain.com/path-to/login""';
    STARTUP_MSG = STARTUP_MSG + '\n'+'or via cmdline \'adminAuthRedirectUrl="https://my-sso.my-domain.com/path-to/login"\''

    STARTUP_MSG = STARTUP_MSG + '\n'+'---------------------';
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
  }
}

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
  STARTUP_MSG_POST = '\n'+'SSL Express Server started on port '+ cfg.SENZING_WEB_SERVER_PORT;
  STARTUP_MSG_POST = STARTUP_MSG_POST + '\n'+'\tKEY: ', cfg.SENZING_WEB_SERVER_SSL_KEY_PATH;
  STARTUP_MSG_POST = STARTUP_MSG_POST + '\n'+'\tCERT: ', cfg.SENZING_WEB_SERVER_SSL_CERT_PATH;
  STARTUP_MSG_POST = STARTUP_MSG_POST + '\n'+'';
  STARTUP_MSG = STARTUP_MSG_POST + STARTUP_MSG;
} else {
  // http
  ExpressSrvInstance = app.listen(cfg.SENZING_WEB_SERVER_PORT);
  STARTUP_MSG = '\n'+'Express Server started on port '+ cfg.SENZING_WEB_SERVER_PORT +'\n'+ STARTUP_MSG;

}

console.log( STARTUP_MSG );
