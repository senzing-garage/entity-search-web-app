const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const httpProxy = require('http-proxy');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { getCommandLineArgsAsJSON: getCommandLineArgsAsJSON } = require('../runtime.datastore.config');

// ENV vars
let streamServerProxyHost   = process.env.streamServerProxyHost || 'localhost';
let streamServerProxyPort   = process.env.streamServerProxyPort || 8255;
let streamServerDestUrl     = process.env.streamServerDestUrl || 'ws://americium.local:8255';

let cmdOpts = getCommandLineArgsAsJSON();
if(cmdOpts) {
    //console.log('cmdline opts: \n', cmdOpts);
    streamServerProxyHost   = cmdOpts.streamServerProxyHost ? cmdOpts.streamServerProxyHost : streamServerProxyHost;
    streamServerProxyPort   = cmdOpts.streamServerProxyPort ? cmdOpts.streamServerProxyPort : streamServerProxyPort;
    streamServerDestUrl     = cmdOpts.streamServerDestUrl ? cmdOpts.streamServerDestUrl : streamServerDestUrl;
}

// create a server
var app     = express();
var server  = http.createServer(app);
var proxy   = httpProxy.createServer({ 
    target: streamServerDestUrl,
    ws: true 
});

// Proxy websockets
server.on('upgrade', function (req, socket, head) {
    console.log("proxying upgrade request", req.url);
    proxy.ws(req, socket, head);
});
proxy.on('error', (err) => {
    console.log('-- WS ERROR: '+ err.message) +' --';
})

//start our proxy server
proxy.listen(streamServerProxyPort, () => {
    console.log(`WS Proxy Server started on port ${streamServerProxyPort}\nforwarding to ${streamServerDestUrl} :)`);
});