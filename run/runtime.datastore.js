const path = require('path');
const fs = require('fs');
const http = require('http');
const { getPortFromUrl, getHostnameFromUrl, replaceProtocol } = require('./utils');
let EventEmitter = require('events').EventEmitter;

class inMemoryConfig extends EventEmitter {
  // default web server Configuration
  webConfiguration = {
    protocol: 'http',
    port: 8080,
    hostname: 'senzing-webapp',
    path: '/',
    apiPath: '/api',
    authPath: 'http://senzing-webapp:8080',
    authMode: 'JWT',
    webServerUrl: 'http://senzing-webapp:8080',
    apiServerUrl: 'http://senzing-api-server:8080',
    /*streamServerUrl: 'ws://localhost:8255', // usually(99%) the address of the LOCAL stream server/proxy
    streamServerPort: 8255, // port number the local stream server proxy should run on
    streamServerDestUrl: 'ws://localhost:8256', // url that the stream proxy should forward sockets to (streamproducer, api server)*/
    ssl: {
      certPath: "/run/secrets/server.cert",
      keyPath: "/run/secrets/server.key"
    }
  };

  // default Auth Configuration
  // we default to "JWT" since we don't want admin functionality
  // to be wide open
  authConfiguration = {
    "hostname": "localhost",
    "port": 8080,
    "admin": {
      "mode": "JWT",
      "checkUrl": "/admin/auth/jwt/status",
      "redirectOnFailure": true,
      "loginUrl": "/admin/login"
    }
  };
  // CORS(cross-origin-request) configuration
  corsConfiguration = undefined;
  // CSP (content-security-policy) configuration
  cspConfiguration  = {
    directives: {
      'default-src': [`'self'`],
      'connect-src': [`'self'`],
      'script-src':  [`'self'`, `'unsafe-eval'`,`'unsafe-inline'`],
      'img-src':     [`'self'`, `data:`],
      'style-src':   [`'self'`, `'unsafe-inline'`, 'https://fonts.googleapis.com'],
      'font-src':    [`'self'`, `https://fonts.gstatic.com`, `https://fonts.googleapis.com`]
    },
    reportOnly: false
  };
  // xterm console options
  consoleConfiguration = {
    enabled: false
  }
  // reverse proxy configuration
  // the reverse proxy allows pointing at resources
  // that are local to the webserver, but are then passed
  // to the api server
  proxyConfiguration = undefined;

  // Stream related configuration
  // defines endpoints, proxy ports/domains etc
  streamServerConfiguration = undefined;

  // initial timer for checking if API Server is up
  apiServerInitializedTimer = undefined;

  // options used for package information
  configServerOptions = {
    port: 8080
  };

  // options used for testing purposes
  testOptionsConfiguration = undefined;

  // will be set to "true" if initial response 
  // from api server recieved
  _apiServerIsReady   = false;
  _initialized        = false;

  constructor(options, noApiServerConfirmation) {
    super();
    if(options) {
      this.config = options;
    }
    let waitForApiServerConfirmation = noApiServerConfirmation ? false : true;
    if(waitForApiServerConfirmation) {
      this.on('apiServerReady', this.onApiServerReady.bind(this));
      this.apiServerInitializedTimer = setInterval(this.checkIfApiServerInitialized.bind(this), 2000);
      this.checkIfApiServerInitialized();
      //console.info("inMemoryConfig.constructor: ", "\n\n", JSON.stringify(this.config, undefined, 2));
    }
  }

  get apiServerIsReady() {
    return this._apiServerIsReady === true;
  }
  get initialized() {
    return this._apiServerIsReady === true;
  }  

  // get an JSON object representing all of the configuration
  // options specified through either the command line args or env vars
  get config() {
    let retValue = {
      auth: this.authConfiguration
    }
    if(this.consoleConfiguration && this.consoleConfiguration !== undefined && this.consoleConfiguration !== null) {
      retValue.console = this.consoleConfiguration;
    }
    if(this.corsConfiguration && this.corsConfiguration !== undefined && this.corsConfiguration !== null) {
      retValue.cors = this.corsConfiguration;
    }
    if(this.cspConfiguration && this.cspConfiguration !== undefined && this.cspConfiguration !== null) {
      retValue.csp = this.cspConfiguration;
    }
    if(this.proxyConfiguration && this.proxyConfiguration !== undefined && this.proxyConfiguration !== null) {
      retValue.proxy = this.proxyConfiguration;
    }
    if(this.webConfiguration && this.webConfiguration !== undefined && this.webConfiguration !== null) {
      retValue.web = this.webConfiguration;
    }
    if(this.streamServerConfiguration && this.streamServerConfiguration !== undefined && this.streamServerConfiguration !== null) {
      retValue.stream = this.streamServerConfiguration;
    }
    if(this.testOptionsConfiguration && this.testOptionsConfiguration !== undefined && this.testOptionsConfiguration !== null) {
      retValue.testing = this.testOptionsConfiguration;
    }
    if(this.configServerOptions && this.configServerOptions !== undefined && this.configServerOptions !== null) {
      retValue.configServer = this.configServerOptions;
    }    
    return retValue;
  }
  // set the configuration objects representing
  // options specified through either the command line args or env vars
  set config(value) {
    if(value) {
      if(value.proxy) {
        this.proxyConfiguration = value.proxy;
      }
      if(value.web) {
        this.webConfiguration = value.web;
      }
      if(value.auth) {
        if(value.auth.hostname && value.auth.hostname !== undefined) {
          this.authConfiguration.hostname = value.auth.hostname;
        }
        if(value.auth.port && value.auth.port !== undefined) {
          this.authConfiguration.port = value.auth.port;
        }
        if(value.auth.virtualPath && value.auth.virtualPath !== undefined) {
          this.authConfiguration.virtualPath = value.auth.virtualPath;
        }
        if(value.auth.admin) {
          this.authConfiguration.admin = {};
          if(value.auth.admin.mode === 'JWT') {
            this.authConfiguration.admin = {
              "mode": value.auth.admin.mode,
              "checkUrl": value.auth.admin.checkUrl ? value.auth.admin.checkUrl : "/admin/auth/jwt/status",
              "redirectOnFailure": value.auth.admin.redirectOnFailure !== undefined ? value.auth.admin.redirectOnFailure : true,
              "loginUrl": value.auth.admin.loginUrl ? value.auth.admin.loginUrl : "/admin/login"
            }
          } else if(value.auth.admin.mode === 'SSO') {
            this.authConfiguration.admin = value.auth.admin;
          } else {
            // no auth configuraton
            this.authConfiguration.admin = {
              "mode": false,
              "redirectOnFailure": false
            }
          }
          if(value.auth.admin.token) {
            this.authConfiguration.admin.token = value.auth.admin.token;
          }
          if(value.auth.admin.secret) {
            this.authConfiguration.admin.secret = value.auth.admin.secret;
          }
        } else {
          this.authConfiguration.admin = undefined;
          delete this.authConfiguration.admin;
        }

        if(value.auth.operator) {
          this.authConfiguration.operator = {};
          if(value.auth.operator.mode === 'JWT') {
            this.authConfiguration.operator = {
              "mode": value.auth.operator.mode,
              "checkUrl": value.auth.operator.checkUrl ? value.auth.operator.checkUrl : "/admin/auth/jwt/status",
              "redirectOnFailure": value.auth.operator.redirectOnFailure !== undefined ? value.auth.operator.redirectOnFailure : true,
              "loginUrl": value.auth.operator.loginUrl ? value.auth.operator.loginUrl : "/admin/login"
            }
          } else if(value.auth.operator.mode === 'SSO') {
            this.authConfiguration.operator = value.auth.operator;
          } else {
            // no auth configuraton
            this.authConfiguration.operator = {
              "mode": false,
              "redirectOnFailure": false
            }
          }
          if(value.auth.operator.token) {
            this.authConfiguration.operator.token = value.auth.operator.token;
          }
          if(value.auth.operator.secret) {
            this.authConfiguration.operator.secret = value.auth.operator.secret;
          }
        } else {
          this.authConfiguration.operator = undefined;
          delete this.authConfiguration.operator;
        }

        //this.authConfiguration = value.auth;
      }
      if(value.console) {
        this.consoleConfiguration = value.console;
      }
      if(value.cors) {
        this.authConfiguration  = value.cors;
      }
      if(value.csp) {
        this.cspConfiguration   = value.csp;
      } else {
        // default to this so there is at least a base policy enabled
        this.cspConfiguration = {
          directives: {
            'default-src': [`'self'`],
            'connect-src': [`'self'`],
            'script-src':  [`'self'`, `'unsafe-eval'`,`'unsafe-inline'`],
            'style-src':   [`'self'`, `'unsafe-inline'`, 'https://fonts.googleapis.com'],
            'font-src':    [`'self'`, `https://fonts.gstatic.com`, `https://fonts.googleapis.com`]
          },
          reportOnly: false
        };
      }
      if(value.stream) {
        this.streamServerConfiguration = value.stream;
      }
      if(value.testing) {
        this.testOptionsConfiguration = value.testing;
      }
      if(value.configServerOptions) {
        this.configServerOptions = value.configServerOptions;
      }
    }
  }

  writeProxyConfigToFile(filepath, filename) {
    let fileExists = false;
    let dirExists = false;
    filename = filename && filename !== undefined ? filename : 'proxy.conf.json';

    let fullDir   = path.resolve(__dirname, filepath);
    let fullPath  = path.resolve(fullDir, filename);

    try{
      dirExists  = fs.existsSync(fullDir);
      fileExists = fs.existsSync(fullPath);
    } catch(err){
      fileExists = false;
    }

    if(dirExists) {
      // now write proxy template to file
      try{
        fs.writeFileSync(fullPath, JSON.stringify(this.config.proxy, undefined, 2));
        //file written on disk
        //console.log('wrote ', fullPath ,'\n');
      }catch(err){
        console.log('could not write ', fullPath, '\n', err);
      }
    }
    /*
    console.log("\nwriteProxyConfigToFile: ");
    console.log(filepath, '? ', dirExists);
    console.log(filename, '? ', fileExists);
    console.log('\n');
    console.log(fullDir, '? ', dirExists);
    console.log(fullPath, '? ', fileExists);
    */

  }

  checkIfApiServerInitialized() {
    let reqUrl  = this.webConfiguration.apiServerUrl+'/server-info';    
    let req = http.get(reqUrl, (res => {
      //console.log('checkIfApiServerInitialized.response: ', res.statusCode);
      let data = [];
      res.on('data', ((d) => {
        data.push(d);
      }).bind(this))

      res.on('end',(() => {
        if(res.statusCode === 200) {
          const _dataRes = JSON.parse(Buffer.concat(data).toString());
          //console.log('Response ended: \n', _dataRes);
          if(_dataRes) {
            //this.onApiServerReady(_dataRes);
            this.emit('apiServerReady', _dataRes);
          }
        }
      }).bind(this));

    }).bind(this)).on('error', error => {
      console.log('checking if api server up yet: '+ error.code +' | ['+ reqUrl +']');
      //console.log(error)
    })
  }
  /**
   * When we get a response back from the API_SERVER or POC_SERVER 
   * we do some extra parameter updates and emit the 'initialized' event
   * 
   * @param {*} serverInfo 
   */
  onApiServerReady( serverInfo ) {
    if(this.apiServerInitializedTimer) {
      clearInterval(this.apiServerInitializedTimer)
    }
    //console.log('------- API SERVER INITIALIZED -------\n', serverInfo);

    // are we using a POC Server or an API Server ?
    if(serverInfo.meta) {
      if(serverInfo.meta.pocServerVersion || serverInfo.meta.pocApiVersion) {
        // poc server
        this.webConfiguration.streamLoading = true;
        if(serverInfo.data && !serverInfo.data.adminEnabled) {
          // poc server supports adding datasources and importing data
          this.streamServerConfiguration = undefined;
          this.webConfiguration.streamLoading = false;
          this.emit('streamLoadingChanged',this.webConfiguration.streamLoading);
        }
        if(!serverInfo.data.loadQueueConfigured) {
          // poc server does not support loading through stream socket
          this.streamServerConfiguration = undefined;
          this.webConfiguration.streamLoading = false;
          this.emit('streamLoadingChanged',this.webConfiguration.streamLoading);
        }
      } else if(serverInfo.data && !serverInfo.data.adminEnabled) {
        // standard rest server that supports loading data
        this.streamServerConfiguration = undefined;
        this.webConfiguration.streamLoading = false;
        this.emit('streamLoadingChanged',this.webConfiguration.streamLoading);
      }
    } else {
      this.webConfiguration.streamLoading = false;
      this.emit('streamLoadingChanged',this.webConfiguration.streamLoading);
    }
    // now notify any listeners that we fully have the data we need
    this._apiServerIsReady = true;
    this._initialized = true;
    this.emit('initialized');
  }

}


module.exports = inMemoryConfig;
