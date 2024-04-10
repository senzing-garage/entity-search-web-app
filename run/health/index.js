const http = require('http');
const https = require('https');
let EventEmitter = require('events').EventEmitter;
const { replacePortNumber } = require("../utils");

class HealthCheckerUtility extends EventEmitter {
    inMemoryConfig;
    isProxyAlive = false;
    isApiServerAlive = false;
    isWebserverAlive = false;
    pingTime = 2000;

    constructor(inMemoryConfigObj) {
        super();

        if(inMemoryConfigObj) {
            this.inMemoryConfig = inMemoryConfigObj;
        }
        // set up interval timers to check status
        this.apiServerAliveTimer    = setInterval(this.checkIfApiServerAlive.bind(this), this.pingTime);
        this.webServerAliveTimer    = setInterval(this.checkIfWebServerAlive.bind(this), this.pingTime);
        this.proxyAliveTimer        = setInterval(this.checkIfProxyServerAlive.bind(this), this.pingTime);
    }
    get status() {
        return {
            "isProxyAlive": this.isProxyAlive,
            "isApiServerAlive": this.isApiServerAlive,
            "isWebserverAlive": this.isWebserverAlive
        }
    }
    get config() {
        return this.inMemoryConfig.config;
    }
    checkIfWebServerAlive() {
        let reqUrl      = this.config.web.url;
        let protocol    = this.config.web.protocol ? this.config.web.protocol : undefined;
        if(protocol === undefined && reqUrl && reqUrl.indexOf && reqUrl.indexOf('://')) {
            // try and get it from web url
            let url_parts = reqUrl.split('://');
            if(url_parts && url_parts[0]) {
                protocol = url_parts[0];
            }
        }
        console.log('---------------------------- checkIfWebServerAlive: url: '+reqUrl);
        console.log('---------------------------- checkIfWebServerAlive: protocol: '+protocol);
        if(protocol === 'https') {
            // use ssl
            let req = https.get(reqUrl, (res => {
                //console.log('checkIfWebServerAlive.response:   ', res.statusCode);  
                //res.on('end',(() => {
                  if(res.statusCode === 200) {
                    if(this.isWebserverAlive !== true) {
                        this.isWebserverAlive = true;
                        this.emit('statusChange', this.status);
                    }
                    //console.log('Response ended: \n', _dataRes);
                  } else if(this.isWebserverAlive == true) {
                    this.isWebserverAlive = false;
                    this.emit('statusChange', this.status);
                  }
                //}).bind(this));
          
            }).bind(this)).on('error', (error => {
                //console.log('checkIfWebServerAlive:   '+ error.code +' | ['+ reqUrl +']');
                if(this.isWebserverAlive == true) {
                    this.isWebserverAlive = false;
                    this.emit('statusChange', this.status);
                }
                this.isWebserverAlive = false;
                //console.log(error)
            }).bind(this))
        } else {
            // assume http
            let req = http.get(reqUrl, (res => {
                //console.log('checkIfWebServerAlive.response:   ', res.statusCode);  
                //res.on('end',(() => {
                  if(res.statusCode === 200) {
                    if(this.isWebserverAlive !== true) {
                        this.isWebserverAlive = true;
                        this.emit('statusChange', this.status);
                    }
                    //console.log('Response ended: \n', _dataRes);
                  } else if(this.isWebserverAlive == true) {
                    this.isWebserverAlive = false;
                    this.emit('statusChange', this.status);
                  }
                //}).bind(this));
          
            }).bind(this)).on('error', (error => {
                //console.log('checkIfWebServerAlive:   '+ error.code +' | ['+ reqUrl +']');
                if(this.isWebserverAlive == true) {
                    this.isWebserverAlive = false;
                    this.emit('statusChange', this.status);
                }
                this.isWebserverAlive = false;
                //console.log(error)
            }).bind(this))
        }
        
    }
    checkIfApiServerAlive() {
        let reqUrl  = this.config.web.apiServerUrl+'/server-info';    
        let req = http.get(reqUrl, (res => {
          //console.log('checkIfApiServerAlive.response:   ', res.statusCode);
          //res.on('end',(() => {
            if(res.statusCode === 200) {
                if(this.isApiServerAlive !== true) {
                    this.isApiServerAlive = true;
                    this.emit('statusChange', this.status);
                }
                //console.log('Response ended: \n', _dataRes);
            } else if(this.isApiServerAlive == true) {
                this.isApiServerAlive = false;
                this.emit('statusChange', this.status);
            }
          //}).bind(this));
    
        }).bind(this)).on('error', (error => {
            //console.log('checkIfApiServerAlive:   '+ error.code +' | ['+ reqUrl +']');
            if(this.isApiServerAlive == true) {
                this.isApiServerAlive = false;
                this.emit('statusChange', this.status);
            }
            this.isApiServerAlive = false;
          //console.log(error)
        }).bind(this))
    }
    checkIfProxyServerAlive() {
        let reqUrl  = this.config.web.url + '/health/proxy';
        //let reqUrl  = replacePortNumber(this.config.configServer.port, (this.config.web.url + '/health/proxy'));
        //console.log('checkIfProxyServerAlive: port', this.config.configServer.port);
        //console.log('checkIfProxyServerAlive: url', reqUrl);
        //console.log(this.config);
        let protocol    = this.config.web.protocol ? this.config.web.protocol : undefined;
        if(protocol === undefined && reqUrl && reqUrl.indexOf && reqUrl.indexOf('://')) {
            // try and get it from web url
            let url_parts = reqUrl.split('://');
            if(url_parts && url_parts[0]) {
                protocol = url_parts[0];
            }
        }
        if(protocol === 'https') {
            // use ssl
            let req = https.get(reqUrl, (res => {
                //console.log('checkIfProxyServerAlive.response: ', res.statusCode);  
                //res.on('end',(() => {
                    if(res.statusCode === 200) {
                        //console.log('\t isProxyAlive('+ this.isProxyAlive +')', (this.isProxyAlive !== true));
                        if(this.isProxyAlive !== true) {
                            this.isProxyAlive = true;
                            this.emit('statusChange', this.status);
                        }
                        //console.log('Response ended: \n', _dataRes);
                    } else if(this.isProxyAlive == true) {
                        this.isProxyAlive = false;
                        this.emit('statusChange', this.status);
                    }
                //}).bind(this));
          
            }).bind(this)).on('error', (error => {
                //console.log('checkIfProxyServerAlive: '+ error.code +' | ['+ reqUrl +']');
                if(this.isProxyAlive == true) {
                    this.isProxyAlive = false;
                    this.emit('statusChange', this.status);
                }
                this.isProxyAlive = false;
                //console.log(error)
            }).bind(this))
        } else {
            //assume http
            let req = http.get(reqUrl, (res => {
                //console.log('checkIfProxyServerAlive.response: ', res.statusCode);  
                //res.on('end',(() => {
                    if(res.statusCode === 200) {
                        //console.log('\t isProxyAlive('+ this.isProxyAlive +')', (this.isProxyAlive !== true));
                        if(this.isProxyAlive !== true) {
                            this.isProxyAlive = true;
                            this.emit('statusChange', this.status);
                        }
                        //console.log('Response ended: \n', _dataRes);
                    } else if(this.isProxyAlive == true) {
                        this.isProxyAlive = false;
                        this.emit('statusChange', this.status);
                    }
                //}).bind(this));
          
            }).bind(this)).on('error', (error => {
                //console.log('checkIfProxyServerAlive: '+ error.code +' | ['+ reqUrl +']');
                if(this.isProxyAlive == true) {
                    this.isProxyAlive = false;
                    this.emit('statusChange', this.status);
                }
                this.isProxyAlive = false;
                //console.log(error)
            }).bind(this))
        }
    }
}

module.exports = HealthCheckerUtility;