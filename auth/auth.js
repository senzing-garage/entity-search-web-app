'use strict';
const fs = require('fs');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const compile = require('template-literal');
const path = require('path');

// grab env vars
let env = process.env;
/** get command line and env vars as options for the AuthModule */
function getOptionsFromInput() {
  // grab env vars
  let env = process.env;
  // grab cmdline args
  let cl = process.argv;
  let authOpts = undefined;

  if(cl && cl.forEach){
    authOpts = {};
    cl.forEach( (val, ind, arr) => {
      let retVal = val;
      let retKey = val;
      if(val && val.indexOf && val.indexOf('=')){
        retKey = (val.split('='))[0];
        retVal = (val.split('='))[1];
      }
      authOpts[ retKey ] = retVal;
    })
  }
  if(env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE) {
    authOpts = authOpts ? authOpts : {
      adminAuthMode: env.SENZING_WEB_SERVER_ADMIN_SECRET
    }
  }
  if(env.SENZING_WEB_SERVER_ADMIN_SECRET) {
    authOpts = authOpts ? authOpts : {
      adminSecret: env.SENZING_WEB_SERVER_ADMIN_SECRET
    }
  }
  if(env.SENZING_WEB_SERVER_ADMIN_SEED) {
    authOpts = authOpts ? authOpts : {
      adminToken: env.SENZING_WEB_SERVER_ADMIN_SEED
    }
  }
  return authOpts;
}

/** get auth conf template */
function createAuthConfigFromInput( dirToWriteTo ) {
  // grab env vars
  let env = process.env;
  // grab cmdline args
  let cl = process.argv;
  let authOpts = undefined;
  // default template is no security (for now)
  let authTemplate = 'auth.conf.tmpl.json';

  if(cl && cl.forEach){
    authOpts = {};
    cl.forEach( (val, ind, arr) => {
      let retVal = val;
      let retKey = val;
      if(val && val.indexOf && val.indexOf('=')){
        retKey = (val.split('='))[0];
        retVal = (val.split('='))[1];
      }
      authOpts[ retKey ] = retVal;
    })
  }

  if(env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE && env.SENZING_WEB_SERVER_OPERATOR_AUTH_MODE){
    authOpts.adminAuthMode = authOpts.adminAuthMode ? authOpts.adminAuthMode : env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE;
    authOpts.operatorAuthMode = authOpts.operatorAuthMode ? authOpts.operatorAuthMode : env.SENZING_WEB_SERVER_OPERATOR_AUTH_MODE;
  } else if(env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE) {
    authOpts.adminAuthMode = authOpts.adminAuthMode ? authOpts.adminAuthMode : env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE;
  } else if(!authOpts.adminAuthMode) {
    authOpts.adminAuthMode    = false;
    authOpts.operatorAuthMode = false;
  }
  if(env.SENZING_WEB_SERVER_ADMIN_AUTH_REDIRECT){
    authOpts.adminAuthRedirectUrl = env.SENZING_WEB_SERVER_ADMIN_AUTH_REDIRECT;
  }
  if(env.SENZING_WEB_SERVER_OPERATOR_AUTH_REDIRECT){
    authOpts.operatorAuthRedirectUrl = env.SENZING_WEB_SERVER_OPERATOR_AUTH_REDIRECT;
  }

  if(authOpts.adminAuthMode == 'SSO') {
    authOpts.adminAuthStatusUrl = '/admin/auth/sso/status';
  } else if(authOpts.adminAuthMode == 'JWT') {
    authOpts.adminAuthStatusUrl = '/admin/auth/jwt/status';
    authOpts.adminAuthRedirectUrl = '/admin/login'
  }
  if(authOpts.operatorAuthMode == 'SSO') {
    authOpts.operatorAuthStatusUrl   = '/auth/sso/status';
  } else if(authOpts.operatorAuthMode == 'JWT') {
    authOpts.operatorAuthStatusUrl   = '/auth/jwt/status';
    authOpts.operatorAuthRedirectUrl = '/login';
  }

  if(authOpts.adminAuthMode && authOpts.operatorAuthMode) {
    authTemplate = 'auth.conf.tmpl.full.json';
  } else if(authOpts.adminAuthMode) {
    authTemplate = 'auth.conf.tmpl.admin.json';
  }
  authTemplate = __dirname + path.sep + authTemplate;

  //console.log('AUTH TEMPLATE: ', authTemplate, fs.existsSync(authTemplate));
  //console.log('AUTH OPTS: ', JSON.stringify(authOpts, null, 2));
  //console.log('ENV VARS: ', JSON.stringify(process.env.SENZING_WEB_AUTH_SERVER_ADMIN_MODE, null, 2));
  //console.log('Write to Directory: ', __dirname);

  if(fs.existsSync(authTemplate) ){
    // compile new auth conf
    let authTmpl = fs.readFileSync(authTemplate, 'utf8');
    let authTmplAction = compile(authTmpl);

    fs.writeFile(__dirname + path.sep + 'auth.conf.json', authTmplAction(authOpts), function(err){
      if(!err) {
          //file written on disk
          //console.log('wrote auth.conf.output.json \n');
      } else {
          console.log('could not write auth.conf.output.json',err);
      }
    });
  }

  return authOpts;
}

function createCorsConfigFromInput( dirToWriteTo ) {
  // grab env vars
  let env = process.env;
  // grab cmdline args
  let cl = process.argv;
  let corsOpts = undefined;
  // default template is no security (for now)
  let corsTemplate = 'cors.conf.tmpl.json';
  corsTemplate = __dirname + path.sep + corsTemplate;

  if(cl && cl.forEach){
    corsOpts = {};
    cl.forEach( (val, ind, arr) => {
      let retVal = val;
      let retKey = val;
      if(val && val.indexOf && val.indexOf('=')){
        retKey = (val.split('='))[0];
        retVal = (val.split('='))[1];
      }
      corsOpts[ retKey ] = retVal;
    })
  }
  if(env.SENZING_WEB_SERVER_CORS_ALLOWED_ORIGIN){
    corsOpts.corsAllowedOrigin = env.SENZING_WEB_SERVER_CORS_ALLOWED_ORIGIN;
  }
  if(corsOpts && corsOpts.corsAllowedOrigin) {
    // compile new auth conf
    let corsTmpl = fs.readFileSync(corsTemplate, 'utf8');
    let corsTmplAction = compile(corsTmpl);

    fs.writeFile(__dirname + path.sep + 'cors.conf.json', corsTmplAction(corsOpts), function(err){
      if(!err) {
          //file written on disk
          console.log('wrote cors.conf.output.json \n',corsOpts);
      } else {
          console.log('could not write cors.conf.json', err);
      }
    });
  } else {
    // shrug, allow everything?
    // delete the cors.conf.json file
    fs.unlink(__dirname + path.sep + 'cors.conf.json', function(err) {
      if(!err) {
        // successfully removed file
      } else {
        console.log('could not remove cors.conf.json',err);
      }
    });
  }
}

/** Manages admin area auth token state */
class AuthModule {
  get useCsp() {
    return fs.existsSync(__dirname + path.sep + 'csp.conf.js');
  }
  get useCors() {
    return fs.existsSync(__dirname + path.sep + 'cors.conf.json');
  }
  get corsAllowedOrigin() {
    if( this.useCors ){
      // open file and read options
      let corsOpts = this.corsConfig;
      if(corsOpts && corsOpts.origin) {
        return corsOpts.origin;
      }
    }
  }
  get corsConfig() {
    let corsConfig = JSON.parse( fs.readFileSync(__dirname + path.sep + 'cors.conf.json', 'utf8') );
    return corsConfig;
  }
  get authConfig() {
    let authConfig = JSON.parse( fs.readFileSync(__dirname + path.sep + 'auth.conf.json', 'utf8') );
    return authConfig;
  }

  get token() {
    return this.CRYPTED_TOKEN;
  }

  set secret (strSec) {
    this.TOKEN_SECRET = strSec;
    this.CRYPTED_TOKEN = this.generateSignedToken();
  };
  get secret () {
    return this.TOKEN_SECRET;
  }
  set seed(value) {
    this.ADMINTOKEN = value;
  }
  get seed() {
    return this.ADMINTOKEN;
  }

  set tokenSeed(strSec) {
    this.ADMINTOKEN = strSec;
    this.CRYPTED_TOKEN = this.generateSignedToken();
  };

  constructor(options) {
    this.useRandomSecret = (options && options.adminSecret) ? false : true;
    // console.log("Use random secret? ", this.useRandomSecret, ((options && options.adminSecret) ? (options && options.adminSecret) : null));
    this.TOKEN_SECRET = this.useRandomSecret ? this.getRandomSecret() : ((options && options.adminSecret) ? options.adminSecret : undefined);
    this.ADMINTOKEN = (options && options.adminToken) ? options.adminToken : this.getRanomTokenSeed();
    this.CRYPTED_TOKEN = this.generateSignedToken();
  }

  auth(req, res, next) {
    try {
      const body = req.body;
      const encodedToken = (body && body.adminToken) ? body.adminToken : req.query.adminToken;
      //console.log('ADMIN AUTH REQ: ', encodedToken, req.query.adminToken);
      if(encodedToken == undefined) {
        throw new Error('Invalid Token "'+ encodedToken +'"');
      }
      const decodedToken = jwt.verify(encodedToken, this.TOKEN_SECRET);
      const decodedAdminToken = decodedToken.adminToken;
      //console.log('ADMIN TOKEN: ', decodedToken, decodedAdminToken, token);

      if (this.ADMINTOKEN !== decodedAdminToken) {
        //console.log("encoded: ", encodedToken);
        //console.log();
        //console.log("decoded: ", decodedToken);
        throw new Error('Token mismatch');
      } else {
        next();
      }
    } catch(err) {
      // console.log('ADMIN AUTH REQ ERROR: ', this.TOKEN_SECRET, this);
      res.status(401).json({
        error: err.message
      });
    }
  }
  getRandomSecret() {
    let secret = uuidv4();
    //console.log();
    //console.log("Random Secret: ", secret);
    return secret;
  }
  getRanomTokenSeed() {
    return "b02c708e-6fec-40c8-83b1-11bd8ed36293";
  }
  generateSignedToken() {
    const token = jwt.sign(
    { adminToken: this.ADMINTOKEN },
    this.TOKEN_SECRET,
    { expiresIn: '24h' });

    return token;
  }

  login(req, res, next) {
    const body = req.body;
    const isValid = (body && body.adminToken) ? body.adminToken : req.query.adminToken == ADMINTOKEN;
    if(isValid) {
      const token = jwt.sign(
        { adminToken: this.ADMINTOKEN },
        this.TOKEN_SECRET,
        { expiresIn: '24h' });

      res.status(200).json({
        adminToken: this.ADMINTOKEN,
        token: token
      });
    } else {
      res.status(403).json({
        error: 'Tokens do not match'
      }).end();
    }
  }

}

module.exports = {
  "module" : AuthModule,
  "getOptionsFromInput": getOptionsFromInput,
  "createAuthConfigFromInput": createAuthConfigFromInput,
  "createCorsConfigFromInput": createCorsConfigFromInput
}
