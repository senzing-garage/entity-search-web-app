const express = require('express');
const serveStatic = require('serve-static');
const cors = require('cors');
const apiProxy = require('http-proxy-middleware');
const path = require('path');
const url = require('url');

// grab env vars
let env = process.env;

// servers
const app = express();

// api config
var cfg = {
  SENZING_WEB_SERVER_PORT: (env.SENZING_WEB_SERVER_PORT ? env.SENZING_WEB_SERVER_PORT : 4200),
  SENZING_WEB_SERVER_API_PATH: (env.SENZING_WEB_SERVER_API_PATH ? env.SENZING_WEB_SERVER_API_PATH : "/api"),
  SENZING_API_SERVER_URL: (env.SENZING_API_SERVER_URL ? env.SENZING_API_SERVER_URL : "http://localhost:8080")
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


// everything else
app.use('*',function(req, res) {
    res.sendFile(path.join(__dirname + path.sep +'dist/entity-search-web-app/index.html'));
});

var ExpressSrvInstance = app.listen(cfg.SENZING_WEB_SERVER_PORT);
console.log('Express Server started on port '+ cfg.SENZING_WEB_SERVER_PORT);
