const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const expressJwt = require('express-jwt');

// utils
const path = require('path');
const fs = require('fs');
const url = require('url');

// grab env vars
let env = process.env;

// server(s)
const app = express();
app.use(bodyParser.json());


// port to run the auth server on
const SENZING_AUTH_SERVER_PORT = 8000;

// TODO: radomize secret on startup
const TOKEN_SECRET = "PI77A#$SDF99";
// TODO: gen random token if none passed in
// from cmdline
const RAND_ADMINTOKEN = "SKYWALKER";
let CRYPTED_TOKEN = undefined;

//app.use(expressJwt({secret: TOKEN_SECRET}).unless({path: ['/jwt/auth']}));

const auth = (req, res, next) => {
  try {
    const body = req.body;
    const encodedToken = (body && body.adminToken) ? body.adminToken : req.query.adminToken;
    console.log('ADMIN AUTH REQ: ', encodedToken, req.query.adminToken);
    if(encodedToken == undefined) {
      throw new Error('Invalid Token "'+ encodedToken +'"');
    }
    const decodedToken = jwt.verify(encodedToken, TOKEN_SECRET);
    const decodedAdminToken = decodedToken.adminToken;
    //console.log('ADMIN TOKEN: ', decodedToken, decodedAdminToken, token);

    if (RAND_ADMINTOKEN !== decodedAdminToken) {
      //console.log("encoded: ", encodedToken);
      //console.log();
      //console.log("decoded: ", decodedToken);
      throw new Error('Token mismatch');
    } else {
      next();
    }
  } catch(err) {
    console.log('ADMIN AUTH REQ ERROR: ', err);
    res.status(401).json({
      error: err.message
    });
  }
};

const generateSignedToken = () => {
  const token = jwt.sign(
  { adminToken: RAND_ADMINTOKEN },
  TOKEN_SECRET,
  { expiresIn: '24h' });

  return token;
}

const login = (req, res, next) => {
  const body = req.body;
  const isValid = (body && body.adminToken) ? body.adminToken : req.query.adminToken == RAND_ADMINTOKEN;
  if(isValid) {
    const token = jwt.sign(
      { adminToken: RAND_ADMINTOKEN },
      TOKEN_SECRET,
      { expiresIn: '24h' });

    res.status(200).json({
      adminToken: RAND_ADMINTOKEN,
      token: token
    });
  } else {
    res.status(403).json({
      error: 'Tokens do not match'
    }).end();
  }
}

CRYPTED_TOKEN = generateSignedToken();

const authRes = (req, res, next) => {
  const body = req.body;
  const encodedToken = (body && body.adminToken) ? body.adminToken : req.query.adminToken;

  res.status(200).json({
    tokenIsValid: true,
    adminToken: encodedToken
  });
};

app.post('/jwt/login', login);
app.post('/jwt/auth', auth, authRes);
app.get('/jwt/auth', auth, authRes);
app.get('/jwt/protected', auth, (req, res, next) => {
  const body = req.body;
  const encodedToken = (body && body.adminToken) ? body.adminToken : req.query.adminToken;

  res.status(200).json({
    tokenIsValid: true,
    adminToken: encodedToken
  });
});
/*
router.post('/', auth, stuffCtrl.createThing);
router.get('/:id', auth, stuffCtrl.getOneThing);
router.put('/:id', auth, stuffCtrl.modifyThing);
router.delete('/:id', auth, stuffCtrl.deleteThing);
*/
const ExpressSrvInstance = app.listen(SENZING_AUTH_SERVER_PORT);

console.log('Express Server started on port '+ SENZING_AUTH_SERVER_PORT);

console.log('');
console.log('To access the /admin area you will need a Admin Token.');
console.log('Admin Tokens are generated from a randomly generated secret unless one is specified with the -adminSecret flag.');
console.log('');
console.log('---------------------');
console.log('');
console.log('ADMIN TOKEN: ');
console.log(CRYPTED_TOKEN);
console.log('');
console.log('---------------------');
console.log('');

console.log('Copy and Paste the line above when prompted for the Admin Token in the admin area.');
