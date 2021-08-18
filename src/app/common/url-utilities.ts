export function getHostnameFromUrl(url: string) {
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
            let _ntemp = hostname.split(':')[0];
            hostname = _ntemp;
        }
        if(hostname.indexOf && hostname.indexOf('/') > -1){
            // strip off anything in path
            let _ntemp = hostname.split('/')[0];
            hostname = _ntemp;
        }
        //console.log(`set hostname to: "${hostname}"`);

        return hostname;
    }
    return;
}

export function getPortFromUrl(url: string) {
    if(!url) return;
    if(url) {
        var hostname    = url;
        let portnumber  = 8250;
        if(hostname.indexOf && hostname.indexOf('://') > -1) {
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

export function getProtocolFromUrl(url: string) {
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