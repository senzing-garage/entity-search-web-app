export function getHostnameFromUrl(url: string) {
    if(!url) return;
    if(url) {
        let oUrl        = new URL(url);
        return oUrl.hostname;
    }
    return;
}

export function getPortFromUrl(url: string): number {
    if(!url) return;
    if(url) {
        let oUrl        = new URL(url);
        let portnumber  = oUrl.port ? parseInt(oUrl.port) : 8250;
        return portnumber;
    }
}

export function getProtocolFromUrl(url: string) {
    if(!url) return;
    if( url ) {
        let oUrl        = new URL(url);
        let protocol    = oUrl.protocol ? oUrl.protocol : 'http';
        return protocol;
    }
}

export function getBasePathFromUrl(url: string) {
    if(!url) return;
    if( url ) {
        let oUrl        = new URL(url);
        return oUrl.origin;
    }
}

export function getPathFromUrl(url: string) {
    if(!url) return;
    if( url ) {
        let oUrl        = new URL(url);
        return oUrl.pathname;
    }
}

export function replaceProtocol(protoStr, url: string) {
    if(!url) return;
    if(!protoStr) return url; 
    if( url ) {
        let oUrl        = new URL(url);
        oUrl.protocol   = protoStr;
        return oUrl.href;
    }
    return url;
}

export function replacePortNumber(portNumber, url: string) {
    if(!url) return;
    if( url ) {
        let oUrl    = new URL(url);
        oUrl.port   = portNumber;
        return (oUrl.href);
    }
    return url
}

export function replaceHostname(hostname: string, url: string) {
    if(!url) return;
    if(!hostname) { return url; }
    if(url) {
        let oUrl = new URL(url);
        return url.replace(oUrl.hostname, hostname);
    }
}