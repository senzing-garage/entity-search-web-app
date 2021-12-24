var http = require("http");
const https = require('https');
// utils
const inMemoryConfig            = require("../runtime.datastore");
const inMemoryConfigFromInputs  = require('../runtime.datastore.config');

if(inMemoryConfigFromInputs && inMemoryConfigFromInputs.web && inMemoryConfigFromInputs.web.url) {
    let hcUrl = inMemoryConfigFromInputs.web.url + '/health';    
    var request = http.get(hcUrl, (res) => {
        if (res.statusCode == 200) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    });
    request.on("error", function (err) {
        process.exit(1);
    });
    request.end();
} else {
    process.exit(1);
}