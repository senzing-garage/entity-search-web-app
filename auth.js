'use strict';
const fs = require('fs');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');

// let authConfig = JSON.parse( fs.readFileSync('./auth.conf.json', 'utf8') );
// let authConfig = require('./auth.conf.json');

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
/** Manages admin area auth token state */
class AuthModule {
  get authConfig() {
    let authConfig = JSON.parse( fs.readFileSync('./auth.conf.json', 'utf8') );
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
  "getOptionsFromInput": getOptionsFromInput
}
