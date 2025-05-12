const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const httpProxy = require('http-proxy');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// set up server(s) instance(s)
var ExpressSrvInstance;
var WebSocketProxyInstance;
var StartupPromises = [];

// utils
const AuthModule = require('../authserver/auth');
const inMemoryConfig = require("../runtime.datastore");
const inMemoryConfigFromInputs = require('../runtime.datastore.config');
const runtimeOptions = new inMemoryConfig(inMemoryConfigFromInputs);

// auth options
const authOptions = runtimeOptions.config.auth;
const auth        = new AuthModule( runtimeOptions.config );
// cors
var corsOptions   = runtimeOptions.config.cors;
// csp
var cspOptions    = runtimeOptions.config.csp;
// proxy config
var proxyOptions  = runtimeOptions.config.proxy;
// web server config
let serverOptions = runtimeOptions.config.web;
// stream server config
let streamOptions = runtimeOptions.config.stream;

// server(s)
const app = express();
var server  = http.createServer(app);
let STARTUP_MSG = '';

//console.log('stream options: ', streamOptions);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {

    //connection is up, let's add a simple simple event
    ws.on('message', (message) => {

        //log the received message and send it back to the client
        console.log('received: %s', message);
        ws.send(message);
    });

    //send immediately a feedback to the incoming connection
    ws.send('{"connected": true, "uuid": "'+ uuidv4() +'"}');
});

wss.on('close', (ws) => {
    // socket was closing
    ws.send('closing connection');
});

// check if we need a websocket proxy
let streamServerPromise = new Promise((resolve) => {
    let streamServerDestUrl = ((streamOptions.ssl ? "wss://" : "ws://") + streamOptions.host + (streamOptions.port ? ":"+streamOptions.port : ""));
    if(streamOptions && streamOptions.proxyPort) {
        var wsProxy   = httpProxy.createServer({
            target: streamServerDestUrl,
            ws: true
        });
        wsProxy.on('error', function(e) {
            console.log('WS Proxy Error: '+ e.message);
        });
        WebSocketProxyInstance = wsProxy.listen(streamOptions.proxyPort || 8255, () => {
            console.log('[started] WS Proxy Server on port '+ (streamOptions.proxyPort || 8255) +'. Forwarding to "'+ streamServerDestUrl +'"');
            resolve();
        });
        //STARTUP_MSG = 'WS Proxy Server started on port '+ (serverOptions.streamServerPort || 8255) +'. Forwarding to "'+ serverOptions.streamServerDestUrl +'"\n'+ STARTUP_MSG;
    } else {
        //STARTUP_MSG = STARTUP_MSG + '\n NO WS PROXY!!';
        console.log('NO WS PROXY!!', serverOptions);
        resolve();
    }
}, (reason) => {
    console.log('[error] WS Proxy Server: ', reason);
    reject();
});
StartupPromises.push(streamServerPromise);

// http
let webServerPromise = new Promise((resolve) => {
    streamServerPort = streamOptions.proxyPort ? (streamOptions.port ? streamOptions.port : 8256) : (streamOptions.port ? streamOptions.port : 8255);
    ExpressSrvInstance = server.listen(streamServerPort, () => {
        console.log('[started] Web Socket Server on port '+ streamServerPort);
        resolve();
    });
}, (reason) => {
    console.log('[error] Web Socket Server', reason);
    reject();
});
StartupPromises.push(webServerPromise);

console.log( STARTUP_MSG +'\n');
(async() => {
  await Promise.all(StartupPromises);
  //console.log('\n\nPress any key to exit...');
  //rl.prompt();
})()
