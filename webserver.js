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
/*
var cfg = {
    SENZING_WEB_SERVER_PORT: (env.SENZING_WEB_SERVER_PORT ? env.SENZING_WEB_SERVER_PORT : 8081),
    SENZING_WEB_SERVER_API_PATH: (env.SENZING_WEB_SERVER_API_PATH ? env.SENZING_WEB_SERVER_API_PATH : "/api"),
    SENZING_API_SERVER_URL: (env.SENZING_API_SERVER_URL ? env.SENZING_API_SERVER_URL : "http://localhost:2080")
}
*/
var cfg = {
  SENZING_WEB_SERVER_PORT: (env.SENZING_WEB_SERVER_PORT ? env.SENZING_WEB_SERVER_PORT : 4200),
  SENZING_WEB_SERVER_API_PATH: (env.SENZING_WEB_SERVER_API_PATH ? env.SENZING_WEB_SERVER_API_PATH : "/api"),
  SENZING_API_SERVER_URL: (env.SENZING_API_SERVER_URL ? env.SENZING_API_SERVER_URL : "http://localhost:8080")
}


// proxy middleware options
var proxyOpts = {
    target: cfg.SENZING_API_SERVER_URL, // target host
    changeOrigin: true, // needed for virtual hosted sites
    ws: true, // proxy websockets
    pathRewrite: {} // path rewrites
}
proxyOpts.pathRewrite[ ('^'+cfg.SENZING_WEB_SERVER_API_PATH) ] = '/'; // remove base path

console.log('SENZING_API_SERVER_URL: "'+ env.SENZING_API_SERVER_URL +'"\n');


// redirect /api/**  to api server url
app.use(cfg.SENZING_WEB_SERVER_API_PATH.replace(('^'+cfg.SENZING_WEB_SERVER_API_PATH), (cfg.SENZING_WEB_SERVER_API_PATH)), apiProxy(proxyOpts))

// static files
app.use('/node_modules/@senzing/sdk-components-web', express.static(__dirname + '/node_modules/@senzing/sdk-components-web/'));
app.use(express.static(__dirname + '/dist/ready-to-run-web-app/'));


// everything else

app.use('*',function(req, res) {
    res.sendFile(path.join(__dirname + path.sep +'dist/ready-to-run-web-app/index.html'));
});

var ExpressSrvInstance = app.listen(cfg.SENZING_WEB_SERVER_PORT);
console.log('Express Server started on port '+ cfg.SENZING_WEB_SERVER_PORT);
