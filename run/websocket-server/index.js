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

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {

    //connection is up, let's add a simple simple event
    ws.on('message', (message) => {

        //log the received message and send it back to the client
        console.log('received: %s', message);
        ws.send(message);
    });

    //send immediatly a feedback to the incoming connection    
    ws.send('{"connected": true, "uuid": "'+ uuidv4() +'"}');
});

wss.on('close', (ws) => {
    // socket was closing
    ws.send('closing connection');
});

//start our server
server.listen(process.env.PORT || 8256, () => {
    console.log(`WS Server started on port ${server.address().port} :)`);
});