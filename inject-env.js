const fs = require('fs');
const path = require('path');
const compile = require('template-literal');
const AuthModule = require('./auth/auth');
const Auth = AuthModule.module;

// grab env vars
let envVars = process.env;

// compile new proxy conf
let proxyTmpl = fs.readFileSync('./proxy.conf.tmpl.json', 'utf8');
let proxyTemplAction = compile(proxyTmpl);
//let indexTemplAction = compile(indexTmpl);

//console.log(proxyTemplAction(envVars));
//console.log(indexTemplAction(envVars));

console.log('SENZING_API_SERVER_URL: "'+ envVars.SENZING_API_SERVER_URL +'"\n');

// now write proxy template to file
fs.writeFile('proxy.conf.json', proxyTemplAction(envVars), function(err){
    if(!err){
        //file written on disk
        console.log('wrote proxy.conf\n');
    } else {
        console.log('could not write proxy.conf',err);
    }
});

// now write auth config template to file
AuthModule.createAuthConfigFromInput( path.resolve(__dirname,'auth') );
