var http = require("http");
const https = require('https');
// utils
const inMemoryConfig            = require("../runtime.datastore");
const inMemoryConfigFromInputs  = require('../runtime.datastore.config');

if(inMemoryConfigFromInputs && inMemoryConfigFromInputs.web && inMemoryConfigFromInputs.web.url) {
    let hcUrl = inMemoryConfigFromInputs.web.url + '/health';
    let protocol = inMemoryConfigFromInputs.web.protocol ? inMemoryConfigFromInputs.web.protocol : undefined;
    if(protocol === undefined && hcUrl && hcUrl.indexOf && hcUrl.indexOf('://')) {
        // try and get it from web url
        let url_parts = hcUrl.split('://');
        if(url_parts && url_parts[0]) {
            protocol = url_parts[0];
        }
    }
    if(protocol === 'https') {
        // use ssl
        var request = https.get(hcUrl, (res) => {
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
        // assume http
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
    }
} else {
    process.exit(1);
}