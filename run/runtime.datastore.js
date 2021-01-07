const path = require('path');
const fs = require('fs');

class inMemoryConfig {
  // default web server Configuration
  webConfiguration = {
    port: 8080,
    hostname: 'senzing-webapp',
    apiPath: '/api',
    authPath: 'http://senzing-webapp:8080',
    authMode: 'JWT',
    webServerUrl: 'http://senzing-webapp:8080',
    apiServerUrl: 'http://senzing-api-server:8080',
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
      'script-src':  [`'self'`, `'unsafe-eval'`],
      'style-src':   [`'self'`, `'unsafe-inline'`, 'https://fonts.googleapis.com'],
      'font-src':    [`'self'`, `https://fonts.gstatic.com`, `https://fonts.googleapis.com`]
    },
    reportOnly: false
  };
  // reverse proxy configuration
  // the reverse proxy allows pointing at resources
  // that are local to the webserver, but are then passed
  // to the api server
  proxyConfiguration = undefined;

  constructor(options) {
    if(options) {
      this.config = options;
    }
    //console.info("inMemoryConfig.constructor: ", "\n\n", JSON.stringify(this.config, undefined, 2));
  }

  // get an JSON object representing all of the configuration
  // options specified through either the command line args or env vars
  get config() {
    let retValue = {
      auth: this.authConfiguration
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
        } else {
          this.authConfiguration.operator = undefined;
          delete this.authConfiguration.operator;
        }

        //this.authConfiguration = value.auth;
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
            'script-src':  [`'self'`, `'unsafe-eval'`],
            'style-src':   [`'self'`, `'unsafe-inline'`, 'https://fonts.googleapis.com'],
            'font-src':    [`'self'`, `https://fonts.gstatic.com`, `https://fonts.googleapis.com`]
          },
          reportOnly: false
        };
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

}


module.exports = inMemoryConfig;
