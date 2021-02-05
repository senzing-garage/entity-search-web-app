const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const httpProxy = require('http-proxy');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// create a server
var app     = express();
var server  = http.createServer(app);
var proxy   = httpProxy.createServer({ 
    target: 'ws://localhost:8256',
    ws: true 
});

//initialize the WebSocket server instance
//const wss = new WebSocket.Server({ server });
/*
wss.on('connection', (ws) => {

    //connection is up, let's add a simple simple event
    ws.on('message', (message) => {

        //log the received message and send it back to the client
        console.log('received: %s', message);
        ws.send(message);
    });

    //send immediatly a feedback to the incoming connection    
    ws.send('{"connected": true, uuid: "'+ uuidv4() +'"}');
});

wss.on('close', (ws) => {
    // socket was closing
    ws.send('closing connection');
})
*/

// Proxy websockets
server.on('upgrade', function (req, socket, head) {
    console.log("proxying upgrade request", req.url);
    proxy.ws(req, socket, head);
});

//start our server
/*
server.listen(process.env.PORT || 8255, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});*/

proxy.listen(process.env.PORT || 8255, () => {
    console.log(`WS Proxy Server started on port ${process.env.PORT || 8255} :)`);
});