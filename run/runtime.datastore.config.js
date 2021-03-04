const { env } = require("process");

function getCommandLineArgsAsJSON() {
  // grab cmdline args
  let cl = process.argv;
  let cmdLineArgs = undefined;
  // import args in to "cl" JSON style object
  if(cl && cl.forEach){
    cmdLineArgs = {};
    cl.forEach( (val, ind, arr) => {
      let retVal = val;
      let retKey = val;
      if(val && val.indexOf && val.indexOf('=')){
        retKey = (val.split('='))[0];
        retVal = (val.split('='))[1];
      }
      cmdLineArgs[ retKey ] = retVal;
    })
  }
  return cmdLineArgs;
}

function createCorsConfigFromInput( dirToWriteTo ) {
  // return value
  let retConfig = undefined;

  // grab env vars
  let env = process.env;
  if(env.SENZING_WEB_SERVER_CORS_ALLOWED_ORIGIN){
    retConfig = {
      "origin": env.SENZING_WEB_SERVER_CORS_ALLOWED_ORIGIN,
      "optionsSuccessStatus": 200,
      "optionsFailureStatus": 401
    };
  }

  // grab cmdline args
  let corsOpts = getCommandLineArgsAsJSON();
  if(corsOpts && corsOpts.corsAllowedOrigin) {
    retConfig = {
      "origin": corsOpts.corsAllowedOrigin,
      "optionsSuccessStatus": corsOpts.corsSuccessResponseCode ? corsOpts.corsSuccessResponseCode : 200,
      "optionsFailureStatus": corsOpts.corsFailureResponseCode ? corsOpts.corsFailureResponseCode : 401
    };
  }

  return retConfig;
}

/** get command line and env vars as options for the AuthModule */
function getOptionsFromInput() {
  // grab env vars
  let env = process.env;
  let authOpts = getCommandLineArgsAsJSON();
  /*
  if(cl && cl.forEach){
    authOpts = {};
    cl.forEach( (val, ind, arr) => {
      let retVal = val;
      let retKey = val;
      if(val && val.indexOf && val.indexOf('=')){
        retKey = (val.split('='))[0];
        retVal = (val.split('='))[1];
      }
      authOpts[ retKey ] = retVal;
    })
  }*/
  if(env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE) {
    authOpts = authOpts && authOpts !== undefined ? authOpts : {
      adminAuthMode: env.SENZING_WEB_SERVER_ADMIN_SECRET
    }
  }
  if(env.SENZING_WEB_SERVER_ADMIN_SECRET) {
    authOpts = authOpts && authOpts !== undefined ? authOpts : {
      adminSecret: env.SENZING_WEB_SERVER_ADMIN_SECRET
    }
  }
  if(env.SENZING_WEB_SERVER_ADMIN_SEED) {
    authOpts = authOpts && authOpts !== undefined ? authOpts : {
      adminToken: env.SENZING_WEB_SERVER_ADMIN_SEED
    }
  }
  return authOpts;
}

function createCspConfigFromInput() {
  let retConfig = undefined;

  // ------------- set sane defaults
  retConfigDefaults = {
    directives: {
      'default-src': [`'self'`],
      'connect-src': [`'self'`],
      'script-src':  [`'self'`, `'unsafe-eval'`],
      'style-src':   [`'self'`, `'unsafe-inline'`,'https://fonts.googleapis.com'],
      'font-src':    [`'self'`, `https://fonts.gstatic.com`,`https://fonts.googleapis.com`]
    },
    reportOnly: false
  };
  retConfig = Object.assign({}, retConfigDefaults);
  // ------------- check ENV vars
  if(env.SENZING_WEB_SERVER_CSP_DEFAULT_SRC) {
    retConfig.directives['default-src'].push(env.SENZING_WEB_SERVER_CSP_DEFAULT_SRC);
  }
  if(env.SENZING_WEB_SERVER_CSP_CONNECT_SRC) {
    retConfig.directives['connect-src'].push(env.SENZING_WEB_SERVER_CSP_CONNECT_SRC);
  }
  if(env.SENZING_WEB_SERVER_CSP_SCRIPT_SRC) {
    retConfig.directives['script-src'].push(env.SENZING_WEB_SERVER_CSP_SCRIPT_SRC);
  }
  if(env.SENZING_WEB_SERVER_CSP_STYLE_SRC) {
    retConfig.directives['style-src'].push(env.SENZING_WEB_SERVER_CSP_STYLE_SRC);
  }
  if(env.SENZING_WEB_SERVER_CSP_FONT_SRC) {
    retConfig.directives['font-src'].push(env.SENZING_WEB_SERVER_CSP_FONT_SRC);
  }
  // ------------- now get cmdline options and override any defaults or ENV options
  let cmdLineOpts = getCommandLineArgsAsJSON();
  if(cmdLineOpts && cmdLineOpts !== undefined) {
    if(cmdLineOpts.webServerCspDefaultSrc){
      retConfig.directives['default-src'] = retConfigDefaults.directives['default-src']
      retConfig.directives['default-src'].push(cmdLineOpts.webServerCspDefaultSrc);
    }
    if(cmdLineOpts.webServerCspConnectSrc){
      retConfig.directives['connect-src'] = retConfigDefaults.directives['connect-src']
      retConfig.directives['connect-src'].push(cmdLineOpts.webServerCspConnectSrc);
    }
    if(cmdLineOpts.webServerCspScriptSrc){
      retConfig.directives['script-src'] = retConfigDefaults.directives['script-src']
      retConfig.directives['script-src'].push(cmdLineOpts.webServerCspScriptSrc);
    }
    if(cmdLineOpts.webServerCspStyleSrc){
      retConfig.directives['style-src'] = retConfigDefaults.directives['style-src']
      retConfig.directives['style-src'].push(cmdLineOpts.webServerCspStyleSrc);
    }
    if(cmdLineOpts.webServerCspFontSrc){
      retConfig.directives['font-src'] = retConfigDefaults.directives['font-src']
      retConfig.directives['font-src'].push(cmdLineOpts.webServerCspFontSrc);
    }
  }

  return retConfig;
}

/** get auth conf template */
function createAuthConfigFromInput() {
  // return value
  let retConfig = undefined;

  // -------------------- start ENV vars import ------------------
    // grab env vars
    let env = process.env;
    if(env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE) {
      retConfig = retConfig !== undefined ? retConfig : {};
      retConfig.admin = {};
      if(env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE === 'JWT'){
        retConfig.admin = {
          "mode": "JWT",
          "checkUrl": env.SENZING_WEB_SERVER_ADMIN_AUTH_STATUS ? env.SENZING_WEB_SERVER_ADMIN_AUTH_STATUS : "/admin/auth/jwt/status",
          "redirectOnFailure": true,
          "loginUrl": env.SENZING_WEB_SERVER_ADMIN_AUTH_REDIRECT ? env.SENZING_WEB_SERVER_ADMIN_AUTH_REDIRECT : "/admin/login"
        }
      } else if(env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE === 'SSO') {
        retConfig.admin = {
          "mode": "SSO",
          "checkUrl": env.SENZING_WEB_SERVER_ADMIN_AUTH_STATUS ? env.SENZING_WEB_SERVER_ADMIN_AUTH_STATUS : "/admin/auth/sso/status",
          "redirectOnFailure": true,
          "loginUrl": env.SENZING_WEB_SERVER_ADMIN_AUTH_REDIRECT ? env.SENZING_WEB_SERVER_ADMIN_AUTH_REDIRECT : "/admin/login"
        }
      }
    }
    if(env.SENZING_WEB_SERVER_OPERATOR_AUTH_MODE) {
      retConfig = retConfig !== undefined ? retConfig : {};
      retConfig.operator = {};
      if(SENZING_WEB_SERVER_OPERATOR_AUTH_MODE === 'JWT'){
        retConfig.operator = {
          "mode": "JWT",
          "checkUrl": env.SENZING_WEB_SERVER_OPERATOR_AUTH_STATUS ? env.SENZING_WEB_SERVER_OPERATOR_AUTH_STATUS : "/auth/jwt/status",
          "redirectOnFailure": true,
          "loginUrl": env.SENZING_WEB_SERVER_OPERATOR_AUTH_REDIRECT ? env.SENZING_WEB_SERVER_OPERATOR_AUTH_REDIRECT : "/login"
        }
      } else if(env.SENZING_WEB_SERVER_OPERATOR_AUTH_MODE === 'SSO') {
        retConfig.operator = {
          "mode": "SSO",
          "checkUrl": env.SENZING_WEB_SERVER_OPERATOR_AUTH_STATUS ? env.SENZING_WEB_SERVER_OPERATOR_AUTH_STATUS : "/auth/sso/status",
          "redirectOnFailure": true,
          "loginUrl": env.SENZING_WEB_SERVER_OPERATOR_AUTH_REDIRECT ? env.SENZING_WEB_SERVER_OPERATOR_AUTH_REDIRECT : "/login"
        }
      }
  }
  if(env.SENZING_WEB_SERVER_PORT) {
    retConfig = retConfig !== undefined ? retConfig : {};
    retConfig.port = env.SENZING_WEB_SERVER_PORT;
  }
  if(env.SENZING_WEB_SERVER_HOSTNAME) {
    retConfig = retConfig !== undefined ? retConfig : {};
    retConfig.hostname = env.SENZING_WEB_SERVER_HOSTNAME;
  }
  if(env.SENZING_WEB_SERVER_ADMIN_SECRET) {
    retConfig = retConfig !== undefined ? retConfig : {};
    retConfig.adminSecret = env.SENZING_WEB_SERVER_ADMIN_SECRET;
  }
  if(env.SENZING_WEB_SERVER_ADMIN_SEED) {
    retConfig = retConfig !== undefined ? retConfig : {};
    retConfig.adminToken = env.SENZING_WEB_SERVER_ADMIN_SEED;
  }
  // -------------------- end ENV vars import ------------------
  // -------------------- start CMD LINE ARGS import -----------
    // grab cmdline args
    let cl = process.argv;
    let authOpts = getCommandLineArgsAsJSON();
    /*
    // import args in to "cl" JSON style object
    if(cl && cl.forEach){
      authOpts = {};
      cl.forEach( (val, ind, arr) => {
        let retVal = val;
        let retKey = val;
        if(val && val.indexOf && val.indexOf('=')){
          retKey = (val.split('='))[0];
          retVal = (val.split('='))[1];
        }
        authOpts[ retKey ] = retVal;
      })
    }*/
    // now check our imported cmdline args
    if(authOpts && authOpts !== undefined && authOpts.adminAuthMode && authOpts.adminAuthMode !== undefined) {
      retConfig = retConfig !== undefined ? retConfig : {};
      retConfig.admin = retConfig && retConfig.admin ? retConfig.admin : {};
      if(authOpts.adminAuthMode === 'JWT') {
        retConfig.admin = {
          "mode": "JWT",
          "checkUrl": authOpts.adminAuthStatusUrl ? authOpts.adminAuthStatusUrl : "/admin/auth/jwt/status",
          "redirectOnFailure": true,
          "loginUrl": authOpts.adminAuthRedirectUrl ? authOpts.adminAuthRedirectUrl : "/admin/login"
        }
      } else if (authOpts.adminAuthMode === 'SSO') {
        retConfig.admin = {
          "mode": "SSO",
          "checkUrl": authOpts.adminAuthStatusUrl ? authOpts.adminAuthStatusUrl : "/admin/auth/sso/status",
          "redirectOnFailure": authOpts.adminAuthRedirectOnFailure ? authOpts.adminAuthRedirectOnFailure : true,
          "loginUrl": authOpts.adminAuthRedirectUrl ? authOpts.adminAuthRedirectUrl : "/admin/login"
        }
      }
    }
    if(authOpts && authOpts !== undefined && authOpts.operatorAuthMode && authOpts.operatorAuthMode !== undefined) {
      retConfig = retConfig !== undefined ? retConfig : {};
      retConfig.operator = retConfig && retConfig.operator ? retConfig.operator : {};
      if(authOpts.operatorAuthMode === 'JWT') {
        retConfig.operator = {
          "mode": "JWT",
          "checkUrl": authOpts.operatorAuthStatusUrl ? authOpts.operatorAuthStatusUrl : "/auth/jwt/status",
          "redirectOnFailure": true,
          "loginUrl": authOpts.operatorAuthRedirectUrl ? authOpts.operatorAuthRedirectUrl : "/login"
        }
      } else if (authOpts.adminAuthMode === 'SSO') {
        retConfig.operator = {
          "mode": "SSO",
          "checkUrl": authOpts.operatorAuthStatusUrl ? authOpts.operatorAuthStatusUrl : "/auth/sso/status",
          "redirectOnFailure": true,
          "loginUrl": authOpts.operatorAuthRedirectUrl ? authOpts.operatorAuthRedirectUrl : "/login"
        }
      }
    }
    if(authOpts && authOpts !== undefined && authOpts.authServerPortNumber && authOpts.authServerPortNumber !== undefined) {
      retConfig.port = authOpts.authServerPortNumber;
    }
    if(authOpts && authOpts !== undefined && authOpts.authServerHostName && authOpts.authServerHostName !== undefined) {
      retConfig.hostname = authOpts.authServerHostName;
    }

  // -------------------- end CMD LINE ARGS import -----------

  //console.log('AUTH TEMPLATE: ', authTemplate, fs.existsSync(authTemplate));
  //console.log('AUTH OPTS: ', JSON.stringify(authOpts, null, 2));
  //console.log('ENV VARS: ', JSON.stringify(process.env.SENZING_WEB_AUTH_SERVER_ADMIN_MODE, null, 2));
  //console.log('Write to Directory: ', __dirname);

  return retConfig;
}
function getWebServerOptionsFromInput() {
  let retOpts = {
    port: 4200,
    hostname: 'localhost',
    apiPath: '/api',
    authPath: 'http://localhost:8080',
    authMode: 'JWT',
    apiServerUrl: 'http://localhost:8250',
    ssl: {
      certPath: "/run/secrets/server.cert",
      keyPath: "/run/secrets/server.key"
    }
  }
  // update defaults with ENV options(if present)
  if(env){
    retOpts.port          = env.SENZING_WEB_SERVER_PORT ?             env.SENZING_WEB_SERVER_PORT             : retOpts.port;
    retOpts.hostname      = env.SENZING_WEB_SERVER_HOSTNAME ?         env.SENZING_WEB_SERVER_HOSTNAME         : retOpts.hostname;
    retOpts.apiPath       = env.SENZING_WEB_SERVER_API_PATH ?         env.SENZING_WEB_SERVER_API_PATH         : retOpts.apiPath;
    retOpts.authPath      = env.SENZING_WEB_SERVER_AUTH_PATH ?        env.SENZING_WEB_SERVER_AUTH_PATH        : retOpts.authPath;
    retOpts.authMode      = env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE ?  env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE  : retOpts.authMode;
    retOpts.apiServerUrl  = env.SENZING_API_SERVER_URL ?              env.SENZING_API_SERVER_URL              : retOpts.apiServerUrl;
    if(env.SENZING_WEB_SERVER_SSL_CERT_PATH) {
      retOpts.ssl.certPath = env.SENZING_WEB_SERVER_SSL_CERT_PATH;
    }
    if(env.SENZING_WEB_SERVER_SSL_KEY_PATH) {
      retOpts.ssl.keyPath = env.SENZING_WEB_SERVER_SSL_KEY_PATH;
    }
    if(env.SENZING_WEB_SERVER_BASIC_AUTH_JSON) {
      retOpts.authBasicJson = env.SENZING_WEB_SERVER_BASIC_AUTH_JSON;
    }
  }

  // now get cmdline options and override any defaults or ENV options
  let cmdLineOpts = getCommandLineArgsAsJSON();
  if(cmdLineOpts && cmdLineOpts !== undefined) {
    retOpts.port          = cmdLineOpts.webServerPortNumber ?   cmdLineOpts.webServerPortNumber   : retOpts.port;
    retOpts.hostname      = cmdLineOpts.webServerHostName ?     cmdLineOpts.webServerHostName     : retOpts.hostname;
    retOpts.apiPath       = cmdLineOpts.webServerApiPath ?      cmdLineOpts.webServerApiPath      : retOpts.apiPath;
    retOpts.authPath      = cmdLineOpts.webServerAuthPath ?     cmdLineOpts.webServerAuthPath     : retOpts.authPath;
    retOpts.authMode      = cmdLineOpts.webServerAuthMode ?     cmdLineOpts.webServerAuthMode     : retOpts.authMode;
    retOpts.apiServerUrl  = cmdLineOpts.webServerApiServerUrl ? cmdLineOpts.webServerApiServerUrl : retOpts.apiServerUrl;
    if(retOpts.sslCertPath) {
      retOpts.ssl = retOpts.ssl ? retOpts.ssl : {};
      retOpts.ssl.certPath  = retOpts.sslCertPath;
    }
    if(retOpts.sslKeyPath) {
      retOpts.ssl = retOpts.ssl ? retOpts.ssl : {};
      retOpts.ssl.keyPath   = retOpts.sslKeyPath;
    }
  }

  if(retOpts.ssl && retOpts.ssl !== undefined && retOpts.ssl.certPath && retOpts.ssl.keyPath) {

  } else {
    // for SSL support we need both options
    // remove "ssl" node when invalid
    retOpts.ssl = undefined;
    delete retOpts.ssl;
  }

  return retOpts;
}

function createWebServerConfigFromInput() {
  let retOpts = getWebServerOptionsFromInput();
  return retOpts;
}

function getProxyServerOptionsFromInput() {
  let retOpts = {
    authServerHostName: "localhost",
    authServerPortNumber: 8080,
    logLevel: "error",
    apiServerUrl: "",
    adminAuthPath: "http://localhost:8080",
    jwtPathRewrite: "/jwt",
    ssoPathRewrite: "/sso",
    adminJwtPathRewrite: "/jwt/admin",
    adminSsoPathRewrite: "/sso/admin",
    writeToFile: false,
  };

  // update defaults with ENV options(if present)
  if(env){
    if(env.SENZING_WEB_SERVER_PROXY_LOGLEVEL) {
      retOpts.logLevel = env.SENZING_WEB_SERVER_PROXY_LOGLEVEL;
    }
    if(env.SENZING_AUTH_SERVER_HOSTNAME || env.SENZING_WEB_SERVER_HOSTNAME) {
      retOpts.authServerHostName    = (env.SENZING_AUTH_SERVER_HOSTNAME) ? env.SENZING_AUTH_SERVER_HOSTNAME : env.SENZING_WEB_SERVER_HOSTNAME;
    }
    if(env.SENZING_AUTH_SERVER_PORT || env.SENZING_WEB_SERVER_PORT) {
      retOpts.authServerPortNumber  = (env.SENZING_AUTH_SERVER_PORT) ? env.SENZING_AUTH_SERVER_PORT : env.SENZING_WEB_SERVER_PORT;
      retOpts.adminAuthPath         = "http://"+ retOpts.authServerHostName +":"+ retOpts.authServerPortNumber;
    }
    if(env.SENZING_WEB_SERVER_AUTH_PATH) {
      retOpts.adminAuthPath = env.SENZING_WEB_SERVER_AUTH_PATH;
    }
    if(env.SENZING_WEB_SERVER_ADMIN_AUTH_PATH) {
      retOpts.adminAuthPath = env.SENZING_WEB_SERVER_ADMIN_AUTH_PATH;
    }
    if(env.SENZING_API_SERVER_URL) {
      retOpts.apiServerUrl = env.SENZING_API_SERVER_URL;
    }
    /*if(env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE) {
      retOpts.authMode = env.SENZING_WEB_SERVER_ADMIN_AUTH_MODE;
    }*/

    if(env.SENZING_AUTH_SERVER_JWTPATH_REWRITE) {
      retOpts.jwtPathRewrite = env.SENZING_AUTH_SERVER_JWTPATH_REWRITE;
    }
    if(env.SENZING_AUTH_SERVER_SSOPATH_REWRITE) {
      retOpts.ssoPathRewrite = env.SENZING_AUTH_SERVER_SSOPATH_REWRITE;
    }
    if(env.SENZING_AUTH_SERVER_ADMIN_JWTPATH_REWRITE) {
      retOpts.adminJwtPathRewrite = env.SENZING_AUTH_SERVER_ADMIN_JWTPATH_REWRITE;
    }
    if(env.SENZING_AUTH_SERVER_ADMIN_SSOPATH_REWRITE) {
      retOpts.adminSsoPathRewrite = env.SENZING_AUTH_SERVER_ADMIN_SSOPATH_REWRITE;
    }
    if(env.SENZING_AUTH_SERVER_WRITE_CONFIG_TO_FILE === 'true' || env.SENZING_AUTH_SERVER_WRITE_CONFIG_TO_FILE === 'TRUE') {
      retOpts.writeToFile = true;
    }
  }

  // now get cmdline options and override any defaults or ENV options
  let cmdLineOpts = getCommandLineArgsAsJSON();
  if(cmdLineOpts && cmdLineOpts !== undefined) {
    if(cmdLineOpts.authServerPortNumber) {
      retOpts.authServerPortNumber  = cmdLineOpts.authServerPortNumber;
      retOpts.adminAuthPath         = "http://localhost:"+ retOpts.authServerPortNumber;
    }
    if(cmdLineOpts.proxyLogLevel) {
      retOpts.logLevel = cmdLineOpts.proxyLogLevel;
    }
    if(cmdLineOpts.adminAuthPath) {
      retOpts.adminAuthPath = cmdLineOpts.adminAuthPath;
    }
    if(cmdLineOpts.apiServerUrl && cmdLineOpts.apiServerUrl !== undefined) {
      retOpts.apiServerUrl = cmdLineOpts.apiServerUrl;
    }
    if(cmdLineOpts.proxyJWTPathRewrite) {
      retOpts.jwtPathRewrite = cmdLineOpts.proxyJWTPathRewrite;
    }
    if(cmdLineOpts.proxySSOPathRewrite) {
      retOpts.ssoPathRewrite = cmdLineOpts.proxySSOPathRewrite;
    }
    if(cmdLineOpts.proxyAdminJWTPathRewrite) {
      retOpts.adminJwtPathRewrite = cmdLineOpts.proxyAdminJWTPathRewrite;
    }
    if(cmdLineOpts.proxyAdminSSOPathRewrite) {
      retOpts.adminSsoPathRewrite = cmdLineOpts.proxyAdminSSOPathRewrite;
    }
    if(cmdLineOpts.writeProxyConfigToFile === 'true' || cmdLineOpts.writeProxyConfigToFile === 'TRUE') {
      retOpts.writeToFile = true;
    }
  }
  return retOpts;
}

function createProxyConfigFromInput() {
  let retConfig = undefined;
  let proxyOpts = getProxyServerOptionsFromInput();

  if(env.SENZING_API_SERVER_URL) {
    retConfig = retConfig !== undefined ? retConfig : {};
    retConfig["/api/*"] = {
      "target": env.SENZING_API_SERVER_URL,
      "secure": true,
      "logLevel": proxyOpts.logLevel,
      "pathRewrite": {
        "^/api": ""
      }
    }
  }

  if(env.SENZING_WEB_SERVER_ADMIN_AUTH_PATH) {
    retConfig = retConfig !== undefined ? retConfig : {};
    let mergeObj = {
      "/admin/auth/jwt/*": {
        "target": env.SENZING_WEB_SERVER_ADMIN_AUTH_PATH,
        "secure": true,
        "logLevel": proxyOpts.logLevel,
        "pathRewrite": {
          "^/admin/auth/jwt": proxyOpts.adminJwtPathRewrite
        }
      },
      "/admin/auth/sso/*": {
        "target": env.SENZING_WEB_SERVER_ADMIN_AUTH_PATH,
        "secure": true,
        "logLevel": proxyOpts.logLevel,
        "pathRewrite": {
          "^/admin/auth/sso": proxyOpts.adminSsoPathRewrite
        }
      },
      "/auth/jwt/*": {
        "target": env.SENZING_WEB_SERVER_ADMIN_AUTH_PATH + "/jwt/",
        "secure": true,
        "logLevel": proxyOpts.logLevel,
        "pathRewrite": {
          "^/auth/jwt": proxyOpts.jwtPathRewrite
        }
      },
      "/auth/sso/*": {
        "target": env.SENZING_WEB_SERVER_ADMIN_AUTH_PATH + "/sso/",
        "secure": true,
        "logLevel": proxyOpts.logLevel,
        "pathRewrite": {
          "^/auth/sso": proxyOpts.ssoPathRewrite
        }
      },
      "/config/auth": {
        "target": env.SENZING_WEB_SERVER_ADMIN_AUTH_PATH + "/conf/auth/",
        "secure": true,
        "logLevel": proxyOpts.logLevel,
        "pathRewrite": {
          "^/config/auth": ""
        }
      },
      "/cors/test": {
        "target": env.SENZING_WEB_SERVER_ADMIN_AUTH_PATH + "/cors/test/",
        "secure": true,
        "logLevel": proxyOpts.logLevel,
        "withCredentials": true,
        "pathRewrite": {
          "^/cors/test": ""
        }
      }
    }
    retConfig = Object.assign(retConfig, mergeObj);
  }
  // -------------------- start CMD LINE ARGS import -----------
    // now check our imported cmdline args
    if(proxyOpts.apiServerUrl && proxyOpts.apiServerUrl !== undefined) {
      retConfig = retConfig !== undefined ? retConfig : {};
      retConfig["/api/*"] = {
        "target": proxyOpts.apiServerUrl,
        "secure": true,
        "logLevel": proxyOpts.logLevel,
        "pathRewrite": {
          "^/api": ""
        }
      }
    }
    if(proxyOpts.adminAuthPath && proxyOpts.adminAuthPath !== undefined) {
      retConfig = retConfig !== undefined ? retConfig : {};
      let mergeObj = {
        "/admin/auth/jwt/*": {
          "target": proxyOpts.adminAuthPath,
          "secure": true,
          "logLevel": proxyOpts.logLevel,
          "pathRewrite": {
            "^/admin/auth/jwt": proxyOpts.adminJwtPathRewrite
          }
        },
        "/admin/auth/sso/*": {
          "target": proxyOpts.adminAuthPath,
          "secure": true,
          "logLevel": proxyOpts.logLevel,
          "pathRewrite": {
            "^/admin/auth/sso": proxyOpts.adminSsoPathRewrite
          }
        },
        "/auth/jwt/*": {
          "target": proxyOpts.adminAuthPath + "/jwt/",
          "secure": true,
          "logLevel": proxyOpts.logLevel,
          "pathRewrite": {
            "^/auth/jwt": proxyOpts.jwtPathRewrite
          }
        },
        "/auth/sso/*": {
          "target": proxyOpts.adminAuthPath + "/sso/",
          "secure": true,
          "logLevel": proxyOpts.logLevel,
          "pathRewrite": {
            "^/auth/sso": proxyOpts.ssoPathRewrite
          }
        },
        "/config/auth": {
          "target": proxyOpts.adminAuthPath + "/conf/auth/",
          "secure": true,
          "logLevel": proxyOpts.logLevel,
          "pathRewrite": {
            "^/config/auth": ""
          }
        },
        "/cors/test": {
          "target": proxyOpts.adminAuthPath + "/cors/test/",
          "secure": true,
          "logLevel": proxyOpts.logLevel,
          "withCredentials": true,
          "pathRewrite": {
            "^/cors/test": ""
          }
        }
      }
      retConfig = Object.assign(retConfig, mergeObj);
    }
  // -------------------- end CMD LINE ARGS import -----------

  return retConfig;
}

module.exports = {
  "web": createWebServerConfigFromInput(),
  "auth": createAuthConfigFromInput(),
  "cors": createCorsConfigFromInput(),
  "csp": createCspConfigFromInput(),
  "proxy": createProxyConfigFromInput(),
  "proxyServerOptions": getProxyServerOptionsFromInput(),
  "webServerOptions": getWebServerOptionsFromInput()
}
