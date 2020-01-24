const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const expressJwt = require('express-jwt');

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

const authRes = (req, res, next) => {
  const body = req.body;
  const encodedToken = (body && body.adminToken) ? body.adminToken : req.query.adminToken;

  res.status(200).json({
    tokenIsValid: true,
    adminToken: encodedToken
  });
};

app.post('/jwt/login', auth.login.bind(auth));
app.post('/jwt/auth', auth.auth.bind(auth), authRes);
app.get('/jwt/auth', auth.auth.bind(auth), authRes);
app.get('/jwt/protected', auth.auth.bind(auth), authRes);

const ExpressSrvInstance = app.listen(SENZING_AUTH_SERVER_PORT);

console.log('Express Server started on port '+ SENZING_AUTH_SERVER_PORT);

console.log('');
console.log('To access the /admin area you will need a Admin Token.');
console.log('Admin Tokens are generated from a randomly generated secret unless one is specified with the -adminSecret flag.');
console.log('');
console.log('---------------------');
console.log('');
console.log('ADMIN SECRET: ', auth.secret);
console.log('ADMIN SEED:   ', auth.seed);
console.log('');
console.log('ADMIN TOKEN:  ');
console.log(auth.token);
console.log('');
console.log('---------------------');
console.log('');

console.log('Copy and Paste the line above when prompted for the Admin Token in the admin area.');
