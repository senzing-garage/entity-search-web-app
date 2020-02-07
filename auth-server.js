const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const expressJwt = require('express-jwt');
const path = require('path');

// utils
const AuthModule = require('./auth');
const Auth = AuthModule.module;

// grab env/cmdline vars
const authOptions = AuthModule.getOptionsFromInput();
const auth = new Auth( authOptions );

// server(s)
const app = express();
app.use(bodyParser.json());
// port to run the auth server on
const SENZING_AUTH_SERVER_PORT = 8000;

let STARTUP_MSG = '';

/** just for testing */
/*
app.get('/sso/auth/401', (req, res, next) => {
  res.status(401).json({
    authorized: false
  });
});
app.get('/sso/auth/403', (req, res, next) => {
  res.status(403).json({
    authorized: false
  });
});
app.get('/sso/auth/fail', (req, res, next) => {
  res.status(401).json({
    authorized: false
  });
});
app.get('/sso/auth/success', (req, res, next) => {
  res.status(200).json({
    authorized: true
  });
});
*/

if(auth.authConfig) {
  app.get('/config/auth', (req, res, next) => {
    res.status(200).json( auth.authConfig );
  });
  app.get('/config/auth/admin', (req, res, next) => {
    res.status(200).json( auth.authConfig.admin );
  });
  app.get('/config/auth/operator', (req, res, next) => {
    res.status(200).json( auth.authConfig.operator );
  });

  if(auth.authConfig.admin && auth.authConfig.admin.mode === 'SSO' || auth.authConfig.admin.mode === 'EXTERNAL') {
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
      res.sendFile(path.join(__dirname+'/sso-login.html'));
    });
    //STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'---------------------';
    STARTUP_MSG = STARTUP_MSG + '\n'+'--- Auth SETTINGS ---';
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    //STARTUP_MSG = STARTUP_MSG + '\n'+'/admin area:';
    STARTUP_MSG = STARTUP_MSG + '\n'+ JSON.stringify(auth.authConfig, null, "  ");
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    //STARTUP_MSG = STARTUP_MSG + '\n'+'/ operators:';
    //STARTUP_MSG = STARTUP_MSG + '\n'+ JSON.stringify(auth.authConfig.admin, null, "  ");
    STARTUP_MSG = STARTUP_MSG + '\n'+'---------------------';

  } else if(auth.authConfig.admin.mode === 'JWT' || auth.authConfig.admin.mode === 'BUILT-IN') {
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
    app.post('/jwt/admin/status', auth.auth.bind(auth), jwtRes);
    app.post('/jwt/admin/login', auth.login.bind(auth));
    app.get('/jwt/admin/status', auth.auth.bind(auth), jwtRes);
    app.get('/jwt/admin/login', auth.auth.bind(auth), jwtRes);
    /** operator endpoints */
    if(auth.authConfig.operator && auth.authConfig.operator.mode === 'JWT') {
      // token auth for operators
      app.post('/jwt/status', auth.auth.bind(auth), jwtRes);
      app.post('/jwt/login', auth.login.bind(auth));
      app.get('/jwt/status', auth.auth.bind(auth), jwtRes);
      app.get('/jwt/login', auth.auth.bind(auth), jwtRes);
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
    STARTUP_MSG = STARTUP_MSG + '\n'+'ADMIN SECRET: ', auth.secret;
    STARTUP_MSG = STARTUP_MSG + '\n'+'ADMIN SEED:   ', auth.seed;
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'ADMIN TOKEN:  ';
    STARTUP_MSG = STARTUP_MSG + '\n'+auth.token;
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
    STARTUP_MSG = STARTUP_MSG + '\n'+'Hopefully this is just an oversight ';
    STARTUP_MSG = STARTUP_MSG + '\n'+'or there is another method like transparent ';
    STARTUP_MSG = STARTUP_MSG + '\n'+'proxy that is configured to handle authorization ';
    STARTUP_MSG = STARTUP_MSG + '\n'+'for this path.';
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
    STARTUP_MSG = STARTUP_MSG + '\n'+'---------------------';
    STARTUP_MSG = STARTUP_MSG + '\n'+'';
  }

}


const ExpressSrvInstance = app.listen(SENZING_AUTH_SERVER_PORT);

console.log('Express Server started on port '+ SENZING_AUTH_SERVER_PORT);
console.log('');
console.log( STARTUP_MSG );
console.log('');

