
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

let replacePortNumber = function(portNumber, url) {
    if(!url) return;
    if( url ) {
        if(url.indexOf && url.indexOf(':') > -1) {
            let replInd     = 1;
            let urlTokened  = url.split(':');
            // does it start with (https|http|ws|wss)
            if(url.indexOf && url.indexOf('://') > -1) {
                // has protocol
                replInd = 2;
            } else {
                // no protocol
                replInd = 1;
            }
            let replToken = urlTokened[replInd];
            if(replToken.indexOf('/') > -1){
                // just replace the part before teh "/"
                replToken = portNumber + replToken.substring(replToken.indexOf('/'));
            } else {
                replToken = portNumber;
            }
            console.log('replacePortNumber: ',urlTokened[replInd], replInd, urlTokened);

            urlTokened[( replInd )] = replToken;
            url = urlTokened.join(':');
        }
    }
    return url
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

let getPathFromUrl = function(url) {
    if(!url) return;
    if( url ) {
        let path    = '';
        if(url.indexOf && url.indexOf('://') > -1) {
            let urlTokened = url.split('://');
            let strPath  = urlTokened[1];
            if(strPath.indexOf && strPath.indexOf('/') > -1) {
                path = strPath.substring(strPath.indexOf('/'));
            } else {
                // no "/" in url
            }
        } else if(url.indexOf && url.indexOf('/') > -1) {
            // no protocol, assume first "/" to end
            path = url.substring(url.indexOf('/'));
        }
        return path;
    }
}

module.exports = {
    "getHostnameFromUrl": getHostnameFromUrl,
    "getPathFromUrl": getPathFromUrl,
    "getPortFromUrl": getPortFromUrl,
    "getProtocolFromUrl": getProtocolFromUrl,
    "getRootFromUrl": getRootFromUrl,
    "replaceProtocol": replaceProtocol,
    "replacePortNumber": replacePortNumber
}