const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const httpProxy = require('http-proxy');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const inMemoryConfig = require("../runtime.datastore");
const inMemoryConfigFromInputs = require('../runtime.datastore.config');

const runtimeOptions = new inMemoryConfig(inMemoryConfigFromInputs);
runtimeOptions.on('initialized', () => {
    const streamOptions     = runtimeOptions.config.stream;
    const consoleOptions    = runtimeOptions.config.console;
    //console.log('--------------- CONSOLE OPTIONS ---------------');
    //console.log(consoleOptions);

    if(streamOptions) {
        // create a server
        var app     = express();
        var server  = http.createServer(app);
        var proxy   = httpProxy.createServer({ 
            target: streamOptions.target,
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
    }
    if(consoleOptions && consoleOptions.proxy) {
        // if user wants to proxy localhost to 
        var console_proxy   = httpProxy.createServer({ 
            target: consoleOptions.proxy.target,
            ws: true 
        });
        console_proxy.on('error', (err) => {
            console.log('-- WS CONSOLE ERROR: '+ err.message) +' --';
        });
        console_proxy.listen(consoleOptions.port, () => {
            console.log(`WS Console Proxy Server started on port ${consoleOptions.port}\nforwarding to ${consoleOptions.proxy.target} :)`);
        });
    }

    if(streamOptions && streamOptions.proxy) {
        //start our proxy server
        proxy.listen(streamOptions.proxy.port, () => {
            console.log(`WS Proxy Server started on port ${streamOptions.proxy.port}\nforwarding to ${streamOptions.target} :)`);
        });
    } else if(streamOptions && streamOptions.target){
        console.log(`WS Proxy Server not started. Adding direct address for ${streamOptions.target} to CSP options`);
    } else {
        console.log(`WS Proxy Server could not be started. Missing information needed to initialize correctly.`);
    }

});