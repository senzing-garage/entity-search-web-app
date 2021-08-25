
let getHostnameFromUrl = function(url) {
    if(!url) return;
    if(url) {
        var hostname  = url;
        if(hostname.indexOf && hostname.indexOf('://') > -1) {
            // strip protocol off
            let urlTokened = hostname.split('://');
            hostname  = urlTokened[1];
        }
        if(hostname.indexOf && hostname.indexOf(':') > -1) {
            // strip port off
            _ntemp = hostname.split(':')[0];
            hostname = _ntemp;
        }
        if(hostname.indexOf && hostname.indexOf('/') > -1){
            // strip off anything in path
            _ntemp = hostname.split('/')[0];
            hostname = _ntemp;
        }
        //console.log(`set hostname to: "${hostname}"`);

        return hostname;
    }
    return;
}

let getPortFromUrl  = function(url) {
    if(!url) return;
    if(url) {
        var hostname    = url;
        var portnumber  = 8250;
        if(hostname.indexOf('://') > -1) {
            // strip protocol off
            let urlTokened = hostname.split('://');
            hostname  = urlTokened[1];
        }
        if(hostname.indexOf(':') > -1) {
            // keep port
            let _ntemp = hostname.split(':');
            if(_ntemp.length > 1 && _ntemp[1]) {
                portnumber    = parseInt(_ntemp[1]);
            }
        }
        return portnumber;
    }
}

let getProtocolFromUrl = function(url) {
    if(!url) return;
    if( url ) {
        let protocol    = 'http';
        if(url.indexOf && url.indexOf('://') > -1) {
            let urlTokened = url.split('://');
            protocol  = urlTokened[0];
        }
        return protocol;
    }
}

let replaceProtocol = function(protoStr, url) {
    if(!url) return;
    if( url ) {
        if(url.indexOf && url.indexOf('://') > -1) {
            let urlTokened = url.split('://');
            urlTokened[0] = protoStr;
            url = urlTokened.join('://');
        }
    }
    return url;
}

let getRootFromUrl = function(url) {
    if(!url) return;
    if( url ) {
        if(url.indexOf && url.indexOf('://') > -1) {
            let urlTokened = url.split('://');
            let urlBase    = urlTokened[1];
            if(urlBase && urlBase.indexOf('/') > -1) {
                urlBase = urlBase.substring(0, urlBase.indexOf('/'));
                urlTokened[1] = urlBase;
            }
            url = urlTokened.join('://');
        }
    }
    return url;
}

module.exports = {
    "getHostnameFromUrl": getHostnameFromUrl,
    "getPortFromUrl": getPortFromUrl,
    "getProtocolFromUrl": getProtocolFromUrl,
    "getRootFromUrl": getRootFromUrl,
    "replaceProtocol": replaceProtocol
}