const fs = require('fs');
const path = require('path');
const compile = require('template-literal');
const AuthModule = require('./auth/auth');
const Auth = AuthModule.module;

// grab env vars
let env = process.env;
var cfg = {
  SENZING_WEB_SERVER_PORT:            (env.SENZING_WEB_SERVER_PORT ? env.SENZING_WEB_SERVER_PORT : 4200),
  SENZING_WEB_SERVER_API_PATH:        (env.SENZING_WEB_SERVER_API_PATH ? env.SENZING_WEB_SERVER_API_PATH : "/api"),
  SENZING_WEB_SERVER_AUTH_PATH:       (env.SENZING_WEB_SERVER_AUTH_PATH ? env.SENZING_WEB_SERVER_AUTH_PATH : "http://localhost:4200"),
  SENZING_WEB_SERVER_ADMIN_AUTH_PATH: (env.SENZING_WEB_SERVER_ADMIN_AUTH_PATH) ? env.SENZING_WEB_SERVER_ADMIN_AUTH_PATH : 'http://localhost:4200',
  SENZING_WEB_SERVER_ADMIN_AUTH_MODE: (env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE ? env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE : "JWT"),
  SENZING_API_SERVER_URL:             (env.SENZING_API_SERVER_URL ? env.SENZING_API_SERVER_URL : "http://localhost:8080"),
  SENZING_WEB_SERVER_SSL_CERT_PATH:   (env.SENZING_WEB_SERVER_SSL_CERT_PATH ? env.SENZING_WEB_SERVER_SSL_CERT_PATH : "/run/secrets/server.cert"),
  SENZING_WEB_SERVER_SSL_KEY_PATH:    (env.SENZING_WEB_SERVER_SSL_KEY_PATH ? env.SENZING_WEB_SERVER_SSL_KEY_PATH : "/run/secrets/server.key"),
  SENZING_WEB_SERVER_SSL_SUPPORT:     (this.SENZING_WEB_SERVER_SSL_CERT_PATH && this.SENZING_WEB_SERVER_SSL_KEY_PATH ? true : false),
  SENZING_WEB_SERVER_BASIC_AUTH_JSON: (env.SENZING_WEB_SERVER_BASIC_AUTH_JSON ? env.SENZING_WEB_SERVER_BASIC_AUTH_JSON : false),
  SENZING_WEB_SERVER_BASIC_AUTH:      (this.SENZING_WEB_SERVER_BASIC_AUTH_JSON ? true : false),
}

// compile new proxy conf
let proxyTmpl = fs.readFileSync('./proxy.conf.tmpl.json', 'utf8');
let proxyTemplAction = compile(proxyTmpl);
//let indexTemplAction = compile(indexTmpl);

//console.log(proxyTemplAction(env));
//console.log(indexTemplAction(env));

console.log('SENZING_API_SERVER_URL: "'+ env.SENZING_API_SERVER_URL +'"\n');

// now write proxy template to file
fs.writeFile('proxy.conf.json', proxyTemplAction(env), function(err){
    if(!err){
        //file written on disk
        console.log('wrote proxy.conf\n');
    } else {
        console.log('could not write proxy.conf',err);
    }
});

// now write auth config template to file
AuthModule.createAuthConfigFromInput( path.resolve(__dirname,'auth') );

// write cors conf so only api requests from self are allowed
AuthModule.createCorsConfigFromInput( path.resolve(__dirname,'auth') );
