

class inMemoryConfig {
  // default Auth Configuration
  // we default to "JWT" since we don't want admin functionality
  // to be wide open
  authConfiguration = {
    "admin": {
      "mode": "JWT",
      "checkUrl": "/admin/auth/jwt/status",
      "redirectOnFailure": true,
      "loginUrl": "/admin/login"
    }
  };
  corsConfiguration = undefined;
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
  proxyConfiguration = undefined;

  constructor(options) {
    if(options) {
      this.config = options;
    }
    console.info("inMemoryConfig.constructor: ", "\n\n", JSON.stringify(this.config, undefined, 2));
  }

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
    return retValue;
  }
  set config(value) {
    if(value) {
      if(value.proxy) {
        this.proxyConfiguration = value.proxy;
      }
      if(value.auth) {
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
}


module.exports = inMemoryConfig;
