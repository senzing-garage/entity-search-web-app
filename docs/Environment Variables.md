## Environment Variables

### Web Server Related

Most of the options controlling the webserver are optional and are provided for an additional level of configuration that may be required for unusual or complex environments.

- `SENZING_WEB_SERVER_PORT` - The port that the webapp is running on. defaults to `8080`, commonly configured as `8251`
- `SENZING_WEB_SERVER_HOSTNAME` - the internally resolvable hostname of the webapp. default is to try to automagically figure this out from the `$SENZING_WEB_SERVER_URL` value but sometimes there can be a need to explicitly define this value.
- `SENZING_WEB_SERVER_PROTOCOL` - The protocol that the webapp is available on. 'http' or 'https'
- `SENZING_WEB_SERVER_URL` - the fully qualified _PUBLIC_ address of the webapp address ie: ` http://my.webapp.domain:8251`.
- `SENZING_WEB_SERVER_API_PATH` - The base path that _CLIENT_ api requests are made to. In most cases changing this is unnecessary but is allowed to be overridden for flexibility. This points to the built-in reverse proxy address by default, and the proxy provides the tunnel to the api server. defaults to `/api`
- `SENZING_WEB_SERVER_AUTH_PATH` - the resolvable base path to forward admin area authentication requests to(if enabled). defaults to `http://senzing-webapp:8080`
- `SENZING_WEB_SERVER_ADMIN_AUTH_MODE` - options are `JWT`, or `NONE`. Setting to `NONE` will disable authentication checks for `/admin` paths. defaults to `JWT`
- `SENZING_API_SERVER_URL` - The address and port of the Senzing API Server or Senzing POC Server resolvable from the Web App's runtime environment. If running in a container formation with a shared docker network it is recommended to use the API Server Container name ie: `http://senzing-poc-server:8250`. This is one of the most commonly mis-configured variables, the address must be resolvable from the webapp container. defaults to `http://localhost:8250`.
- `SENZING_WEB_SERVER_STREAM_CLIENT_URL` - this is the _CLIENT URL_ to open up Web Socket requests to and not the internally resolvable value. ie: `ws://my.fully.qualified.domain:8255/app/ws`. This will be automagically set from a number of other variables but sometimes it can be necessary to explicitly define this variable if not being set correctly.
- `SENZING_WEB_SERVER_SSL_CERT_PATH` - The path to the SSL certificate file. defaults to `/run/secrets/server.cert`. (See SSL documentation in README.md)
- `SENZING_WEB_SERVER_SSL_KEY_PATH` - The path to the SSL Key file. defaults to `/run/secrets/server.key`. (See SSL documentation in README.md)
- `SENZING_WEB_SERVER_BASIC_AUTH_JSON` - configures the webapp server to support _HTTP CHALLENGE RESPONSE BASIC AUTH_. _DEPRECATED_
- `SENZING_WEB_SERVER_VIRTUAL_PATH` - If the webapp server is beng load-balanced using virtual directories set this value to the base url path. ie: your webapp server is publicly available at `https://my.domain.com/er/webapp` set this value to `/er/webapp`.

### Proxy/Reverse-Proxy Options

By default all _client_ api and status requests are made to a reverse-proxy that then _forwards_ the request to the defined API Server or POC Server in the configuration. The only _required_ variable is the
`SENZING_API_SERVER_URL` variable. The value of which needs to be the _INTERNALLY_ resolvable address of the api server(the proxy server needs to be able to resolve this value to complete requests)

- `SENZING_WEB_SERVER_PROXY_LOGLEVEL` - The verbosity level that the reverse proxy uses for console/log output. options are `debug` | `warn` | `error`
- `SENZING_AUTH_SERVER_HOSTNAME` - The hostname of the server to check for admin authentication(if configured). defaults to "localhost"
- `SENZING_AUTH_SERVER_PORT` - The port of the server to check for admin authentication(if configured). defaults to "8080"
- `SENZING_WEB_SERVER_AUTH_PATH` - the resolvable base path to forward admin area authentication requests to(if enabled). defaults to `http://senzing-webapp:8080`
- `SENZING_WEB_SERVER_ADMIN_AUTH_PATH` - The concatenation of `SENZING_AUTH_SERVER_HOSTNAME` and `SENZING_AUTH_SERVER_PORT` variables. The ability to override for special cases is provided and should be set to the resolvable base url that auth requests can be forwarded to, most commonly the name of the webapp container and port `8251` ie `http://senzing-webapp:8251`.
- `SENZING_API_SERVER_URL` - The address and port of the Senzing API Server or Senzing POC Server resolvable from the Web App's runtime environment. If running in a container formation with a shared docker network it is recommended to use the API Server Container name ie: `http://senzing-poc-server:8250`. This is one of the most commonly mis-configured variables, the address must be resolvable from the webapp container. defaults to `http://localhost:8250`.
- `SENZING_WEB_SERVER_URL` - the fully qualified _PUBLIC_ address of the webapp address ie: ` http://my.webapp.domain:8251`.
- `SENZING_WEB_SERVER_INTERNAL_URL` - is used for setting the _config_ base path when the _internally resolvable url_ is different from what the _client url_ resolves to ie: when running the webapp behind a gateway service the public address ie "https://www.my.public.url/webapp" may not be available from inside the formation context ie "http://this-is-a-private-address:8569"
- `SENZING_AUTH_SERVER_JWTPATH_REWRITE` - paths starting with "/auth/jwt/\*" are rewritten as the value of this variable before being passed on to `$SENZING_WEB_SERVER_ADMIN_AUTH_PATH/jwt`. you almost always do not want to override this but you can if you like suffering.
- `SENZING_AUTH_SERVER_ADMIN_JWTPATH_REWRITE` - Any request starting with "/admin/auth/jwt/\*" will be re-written using this regex before being forwarded to "$SENZING_WEB_SERVER_ADMIN_AUTH_PATH". defaults to "/jwt/admin"
- `SENZING_AUTH_SERVER_WRITE_CONFIG_TO_FILE` - Write runtime configuration in JSON format to persistent locations. Proxy configuration written to `/proxy.conf.json`. This is used for debugging. _CAUTION "WILL BREAK IMMUTABILITY"_

### Admin Area Security

The `/admin` area features a built-in token authentication mechanism by default. It can be disabled when running the webapp container behind an authentication gateway like cognito(recommended). The built-in mechanism is a _minimal level_ of security and not recommended for production environments.

- `SENZING_WEB_SERVER_ADMIN_AUTH_MODE` - options are `JWT` or `NONE`. Setting to `NONE` will disable authentication checks for `/admin` paths. defaults to `JWT`
- `SENZING_WEB_SERVER_ADMIN_SECRET` - secret used ot generate JWT token. defaults to autogenerated.
- `SENZING_WEB_SERVER_ADMIN_SEED` - seed value used to generate JWT token. defaults to autogenerated.
- `SENZING_WEB_SERVER_ADMIN_AUTH_STATUS` - defaults to `SENZING_WEB_SERVER_VIRTUAL_PATH +"/admin/auth/jwt/status"`
- `SENZING_WEB_SERVER_ADMIN_AUTH_REDIRECT` - defaults to `SENZING_WEB_SERVER_VIRTUAL_PATH +"/admin/login"`
- `SENZING_WEB_SERVER_OPERATOR_AUTH_MODE` - authentication mode for non-admin users. options are `JWT`, or `NONE`. _CURRENTLY NOT FULLY IMPLEMENTED_
- `SENZING_WEB_SERVER_OPERATOR_AUTH_STATUS` - defaults to `SENZING_WEB_SERVER_VIRTUAL_PATH +"/auth/jwt/status"`. _CURRENTLY NOT FULLY IMPLEMENTED_
- `SENZING_WEB_SERVER_OPERATOR_AUTH_REDIRECT` - where to redirect unauthenticated non-admin users. defaults to `SENZING_WEB_SERVER_VIRTUAL_PATH +"/login"`. _CURRENTLY NOT FULLY IMPLEMENTED_

### SQS Streaming Support

- `SENZING_WEB_SERVER_STREAM_CLIENT_URL` - this is the _CLIENT URL_ to open up Web Socket requests to and not the internally resolvable value. ie: `ws://my.fully.qualified.domain:8255/app/ws`. This will be automagically set from a number of other variables but sometimes it can be necessary to explicitly define this variable if not being set correctly.
- `SENZING_STREAM_SERVER_PORT` - The port that the server is listening for web socket connections on to support SQS loading. defaults to `8255`

### CSP related

Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross-Site Scripting (XSS) and data injection attacks. Configuring Content Security Policy involves adding the Content-Security-Policy HTTP header to a web page and giving it values to control what resources the user agent is allowed to load for that page. see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

- `SENZING_WEB_SERVER_CSP_DEFAULT_SRC` - default src placed in the `default-src` namespace in the `Content-Security-Policy` tag in the main SPA page.
- `SENZING_WEB_SERVER_CSP_CONNECT_SRC` - string placed in the `connect-src` namespace in the `Content-Security-Policy` tag in the main SPA page.
- `SENZING_WEB_SERVER_CSP_SCRIPT_SRC` - string placed in to the `script-src` namespace in the `Content-Security-Policy` meta tag in the main SPA page.
- `SENZING_WEB_SERVER_CSP_IMG_SRC` - string placed in to the `img-src` namespace in the `Content-Security-Policy` meta tag in the main SPA page.
- `SENZING_WEB_SERVER_CSP_STYLE_SRC` - string placed in to the `style-src` namespace in the `Content-Security-Policy` meta tag in the main SPA page.
- `SENZING_WEB_SERVER_CSP_FONT_SRC` - string placed in to the `font-src` namespace in the `Content-Security-Policy` meta tag in the main SPA page.

### CORS related

- `SENZING_WEB_SERVER_CORS_ALLOWED_ORIGIN` - if set specifies the `Access-Control-Allow-Origin` header to provide non-local/non-container asynchronous javascript requests to resources located on the running webapp server. (useful for developing locally but connecting to a running containers api reverse proxy)

## Command Line Switches

### Web Server Related

Most of the options controlling the webserver are optional and are provided for an additional level of configuration that may be required for unusual or complex environments.

- `protocol` - The protocol that the webapp is available on. 'http' or 'https'
- `webServerPortNumber` - The port that the webapp is running on. defaults to `8080`, commonly configured as `8251`
- `webServerHostName` - the internally resolvable hostname of the webapp. default is to try to automagically figure this out from the `$webServerUrl` value but sometimes there can be a need to explicitly define this value.
- `webServerUrl` - the fully qualified _PUBLIC_ address of the webapp address ie: ` http://my.webapp.domain:8251`.
- `webServerApiPath` - The base path that _CLIENT_ api requests are made to. In most cases changing this is unnecessary but is allowed to be overridden for flexibility. This points to the built-in reverse proxy address by default, and the proxy provides the tunnel to the api server. Like M.C. Hammer _don't touch this_. defaults to `/api`
- `webServerAuthPath` - the resolvable base path to forward admin area authentication requests to(if enabled). defaults to `http://senzing-webapp:8080`
- `webServerAuthMode` - The same as `$adminAuthMode`
- `apiServerUrl` - The address and port of the Senzing API Server or Senzing POC Server resolvable from the Web App's runtime environment. If running in a container formation with a shared docker network it is recommended to use the API Server Container name ie: `http://senzing-poc-server:8250`. This is one of the most commonly mis-configured variables, the address must be resolvable from the webapp container. defaults to `http://localhost:8250`.
- `virtualPath` - If the webapp server is beng load-balanced using virtual directories set this value to the base url path. ie: your webapp server is publicly available at `https://my.domain.com/er/webapp` set this value to `/er/webapp`.
- `streamClientUrl` - this is the _CLIENT URL_ to open up Web Socket requests to and not the internally resolvable value. ie: `ws://my.fully.qualified.domain:8255/app/ws`. This will be automagically set from a number of other variables but sometimes it can be necessary to explicitly define this variable if not being set correctly.
- `sslCertPath` - The path to the SSL certificate file. defaults to `/run/secrets/server.cert`. (See SSL documentation in README.md)
- `sslKeyPath` - The path to the SSL Key file. defaults to `/run/secrets/server.key`. (See SSL documentation in README.md)

### Proxy/Reverse-Proxy Related

By default all _client_ api and status requests are made to a reverse-proxy that then _forwards_ the request to the defined API Server or POC Server in the configuration. The only _required_ variable is the
`SENZING_API_SERVER_URL` variable. The value of which needs to be the _INTERNALLY_ resolvable address of the api server(the proxy server needs to be able to resolve this value to complete requests)

- `proxyLogLevel` - The verbosity level that the reverse proxy uses for console/log output. options are `debug` | `warn` | `error`
- `adminAuthPath` -
- `apiServerUrl` - The address and port of the Senzing API Server or Senzing POC Server resolvable from the Web App's runtime environment. If running in a container formation with a shared docker network it is recommended to use the API Server Container name ie: `http://senzing-poc-server:8250`. This is one of the most commonly mis-configured variables, the address must be resolvable from the webapp container. defaults to `http://localhost:8250`.
- `webServerUrl` - the fully qualified _PUBLIC_ address of the webapp address ie: ` http://my.webapp.domain:8251`.
- `webServerInternalUrl` - is used for setting the _config_ base path when the _internally resolvable url_ is different from what the _client url_ resolves to ie: when running the webapp behind a gateway service the public address ie "https://www.my.public.url/webapp" may not be available from inside the formation context ie "http://this-is-a-private-address:8569"
- `proxyJWTPathRewrite` - paths starting with "/auth/jwt/\*" are rewritten as the value of this variable before being passed on to `$adminAuthPath/jwt`. you almost always do not want to override this.
- `proxyAdminJWTPathRewrite` - Any request starting with "/admin/auth/jwt/\*" will be re-written using this regex before being forwarded to "$adminAuthPath". defaults to "/jwt/admin"
- `writeProxyConfigToFile` - Write runtime configuration in JSON format to persistent locations. Proxy configuration written to `/proxy.conf.json`. This is used for debugging. _CAUTION "WILL BREAK IMMUTABILITY"_

### Admin Related

The `/admin` area features a built-in token authentication mechanism by default. It can be disabled when running the webapp container behind an authentication gateway like cognito(recommended). The built-in mechanism is a _minimal level_ of security and not recommended for production environments.

- `adminAuthMode` - options are `JWT`, or `NONE`. Setting to `NONE` will disable authentication checks for `/admin` paths. defaults to `JWT`
- `adminAuthStatusUrl` - defaults to `virtualPath +"/admin/auth/jwt/status"`
- `adminAuthRedirectOnFailure` - boolean whether or not to redirect unauthenticated admin user on status check rejection.
- `adminAuthRedirectUrl` - where to redirect unauthenticated admin users. defaults to `virtualPath +"/admin/login"`
- `operatorAuthMode` - authentication mode for non-admin users. options are `JWT`,or `NONE`. _CURRENTLY NOT FULLY IMPLEMENTED_
- `operatorAuthStatusUrl` - defaults to `$virtualPath +"/auth/jwt/status"`. _CURRENTLY NOT FULLY IMPLEMENTED_
- `operatorAuthRedirectUrl` - where to redirect unauthenticated non-admin users. defaults to `$virtualPath +"/login"`. _CURRENTLY NOT FULLY IMPLEMENTED_
- `authServerPortNumber` - The port of the server to check for admin authentication(if configured). defaults to "8080"
- `authServerHostName` - The hostname of the server to check for admin authentication(if configured). defaults to "localhost"
- `adminAuthSecret` - secret used ot generate JWT token. defaults to autogenerated.
- `adminAuthToken` - override the token pre-crypt randomly generated value.
- `operatorAuthSecret` - secret value to use in token crypt for non-admin users.
- `operatorAuthStatusUrl` - defaults to `$virtualPath +"/auth/jwt/status"`. _CURRENTLY NOT FULLY IMPLEMENTED_
- `operatorAuthToken` - override the token pre-crypt randomly generated value for non-admin users.

### SQS Streaming Support

- `streamClientUrl` - this is the _CLIENT URL_ to open up Web Socket requests to and not the internally resolvable value. ie: `ws://my.fully.qualified.domain:8255/app/ws`. This will be automagically set from a number of other variables but sometimes it can be necessary to explicitly define this variable if not being set correctly.
- `streamServerPort` - The port that the server is listening for web socket connections on to support SQS loading. defaults to `8255`

### CSP related

Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross-Site Scripting (XSS) and data injection attacks. Configuring Content Security Policy involves adding the Content-Security-Policy HTTP header to a web page and giving it values to control what resources the user agent is allowed to load for that page. see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

- `webServerCspDefaultSrc` - default src placed in the `default-src` namespace in the `Content-Security-Policy` tag in the main SPA page.
- `webServerCspConnectSrc` - string placed in the `connect-src` namespace in the `Content-Security-Policy` tag in the main SPA page.
- `webServerCspScriptSrc` - string placed in to the `script-src` namespace in the `Content-Security-Policy` meta tag in the main SPA page.
- `webServerCspImgSrc` - string placed in to the `img-src` namespace in the `Content-Security-Policy` meta tag in the main SPA page.
- `webServerCspStyleSrc` - string placed in to the `style-src` namespace in the `Content-Security-Policy` meta tag in the main SPA page.
- `webServerCspFontSrc` - string placed in to the `font-src` namespace in the `Content-Security-Policy` meta tag in the main SPA page.

### CORS related

- `corsAllowedOrigin` - if set specifies the `Access-Control-Allow-Origin` header to provide non-local/non-container asynchronous javascript requests to resources located on the running webapp server. (useful for developing locally but connecting to a running containers api reverse proxy)
- `corsSuccessResponseCode` - defaults to 200
- `corsFailureResponseCode` - defaults to 401
- `streamServerPort` - The port that the server is listening for web socket connections on to support SQS loading. defaults to `8255`
- `streamClientUrl` - this is the _CLIENT URL_ to open up Web Socket requests to and not the internally resolvable value. ie: `ws://my.fully.qualified.domain:8255/app/ws`. This will be automagically set from a number of other variables but sometimes it can be necessary to explicitly define this variable if not being set correctly.

## All Environment Variables

- `SENZING_API_SERVER_URL` - The address and port of the Senzing API Server or Senzing POC Server resolvable from the Web App's runtime environment. If running in a container formation with a shared docker network it is recommended to use the API Server Container name ie: `http://senzing-poc-server:8250`. This is one of the most commonly mis-configured variables, the address must be resolvable from the webapp container. defaults to `http://localhost:8250`.
- `SENZING_AUTH_SERVER_ADMIN_JWTPATH_REWRITE` - Any request starting with "/admin/auth/jwt/\*" will be re-written using this regex before being forwarded to "$SENZING_WEB_SERVER_ADMIN_AUTH_PATH". defaults to "/jwt/admin"
- `SENZING_AUTH_SERVER_HOSTNAME` - The hostname of the server to check for admin authentication(if configured). defaults to "localhost"
- `SENZING_AUTH_SERVER_JWTPATH_REWRITE` - paths starting with "/auth/jwt/\*" are rewritten as the value of this variable before being passed on to `$SENZING_WEB_SERVER_ADMIN_AUTH_PATH/jwt`. you almost always do not want to override this but you can if you like suffering.
- `SENZING_AUTH_SERVER_PORT` - The port of the server to check for admin authentication(if configured). defaults to "8080"
- `SENZING_AUTH_SERVER_WRITE_CONFIG_TO_FILE` - Write runtime configuration in JSON format to persistent locations. Proxy configuration written to `/proxy.conf.json`. This is used for debugging. _CAUTION "WILL BREAK IMMUTABILITY"_
- `SENZING_WEB_SERVER_API_PATH` - The base path that _CLIENT_ api requests are made to. In most cases changing this is unnecessary but is allowed to be overridden for flexibility. This points to the built-in reverse proxy address by default, and the proxy provides the tunnel to the api server. defaults to `/api`
- `SENZING_WEB_SERVER_ADMIN_AUTH_MODE` - options are `JWT`, or `NONE`. Setting to `NONE` will disable authentication checks for `/admin` paths. defaults to `JWT`
- `SENZING_WEB_SERVER_ADMIN_AUTH_PATH` - The concatenation of `SENZING_AUTH_SERVER_HOSTNAME` and `SENZING_AUTH_SERVER_PORT` variables. The ability to override for special cases is provided and should be set to the resolvable base url that auth requests can be forwarded to, most commonly the name of the webapp container and port `8251` ie `http://senzing-webapp:8251`.
- `SENZING_WEB_SERVER_ADMIN_AUTH_STATUS` - defaults to `SENZING_WEB_SERVER_VIRTUAL_PATH +"/admin/auth/jwt/status"`
- `SENZING_WEB_SERVER_ADMIN_AUTH_REDIRECT` - where to redirect unauthenticated admin users. defaults to `SENZING_WEB_SERVER_VIRTUAL_PATH +"/admin/login"`
- `SENZING_WEB_SERVER_ADMIN_SECRET` - secret used ot generate JWT token. defaults to autogenerated.
- `SENZING_WEB_SERVER_ADMIN_SEED` - seed value used to generate JWT token. defaults to autogenerated.
- `SENZING_WEB_SERVER_AUTH_PATH` - the resolvable base path to forward admin area authentication requests to(if enabled). defaults to `http://senzing-webapp:8080`
- `SENZING_WEB_SERVER_BASIC_AUTH_JSON` - configures the webapp server to support _HTTP CHALLENGE RESPONSE BASIC AUTH_. _DEPRECATED_
- `SENZING_WEB_SERVER_CORS_ALLOWED_ORIGIN` - if set specifies the `Access-Control-Allow-Origin` header to provide non-local/non-container asynchronous javascript requests to resources located on the running webapp server. (useful for developing locally but connecting to a running containers api reverse proxy)
- `SENZING_WEB_SERVER_CSP_DEFAULT_SRC` - default src placed in the `default-src` namespace in the `Content-Security-Policy` tag in the main SPA page.
- `SENZING_WEB_SERVER_CSP_CONNECT_SRC` - string placed in the `connect-src` namespace in the `Content-Security-Policy` tag in the main SPA page.
- `SENZING_WEB_SERVER_CSP_FONT_SRC` - string placed in to the `font-src` namespace in the `Content-Security-Policy` meta tag in the main SPA page.
- `SENZING_WEB_SERVER_CSP_IMG_SRC` - string placed in to the `img-src` namespace in the `Content-Security-Policy` meta tag in the main SPA page.
- `SENZING_WEB_SERVER_CSP_SCRIPT_SRC` - string placed in to the `script-src` namespace in the `Content-Security-Policy` meta tag in the main SPA page.
- `SENZING_WEB_SERVER_CSP_STYLE_SRC` - string placed in to the `style-src` namespace in the `Content-Security-Policy` meta tag in the main SPA page.
- `SENZING_WEB_SERVER_HOSTNAME` - the internally resolvable hostname of the webapp. default is to try to automagically figure this out from the `$SENZING_WEB_SERVER_URL` value but sometimes there can be a need to explicitly define this value.
- `SENZING_WEB_SERVER_INTERNAL_URL` - is used for setting the _config_ base path when the _internally resolvable url_ is different from what the _client url_ resolves to ie: when running the webapp behind a gateway service the public address ie "https://www.my.public.url/webapp" may not be available from inside the formation context ie "http://this-is-a-private-address:8569"
- `SENZING_WEB_SERVER_OPERATOR_AUTH_MODE` - authentication mode for non-admin users. options are `JWT`, or `NONE`. _CURRENTLY NOT FULLY IMPLEMENTED_
- `SENZING_WEB_SERVER_OPERATOR_AUTH_REDIRECT` - where to redirect unauthenticated non-admin users. defaults to `SENZING_WEB_SERVER_VIRTUAL_PATH +"/login"`. _CURRENTLY NOT FULLY IMPLEMENTED_
- `SENZING_WEB_SERVER_OPERATOR_AUTH_STATUS` - defaults to `SENZING_WEB_SERVER_VIRTUAL_PATH +"/auth/jwt/status"`. _CURRENTLY NOT FULLY IMPLEMENTED_
- `SENZING_WEB_SERVER_PORT` - The port that the webapp is running on. defaults to `8080`, commonly configured as `8251`
- `SENZING_WEB_SERVER_PROTOCOL` - The protocol that the webapp is available on. 'http' or 'https'
- `SENZING_WEB_SERVER_PROXY_LOGLEVEL` - The verbosity level that the reverse proxy uses for console/log output. options are `debug` | `warn` | `error`
- `SENZING_WEB_SERVER_SSL_CERT_PATH` - The path to the SSL certificate file. defaults to `/run/secrets/server.cert`. (See SSL documentation in README.md)
- `SENZING_WEB_SERVER_SSL_KEY_PATH` - The path to the SSL Key file. defaults to `/run/secrets/server.key`. (See SSL documentation in README.md)
- `SENZING_WEB_SERVER_STREAM_CLIENT_URL` - this is the _CLIENT URL_ to open up Web Socket requests to and not the internally resolvable value. ie: `ws://my.fully.qualified.domain:8255/app/ws`. This will be automagically set from a number of other variables but sometimes it can be necessary to explicitly define this variable if not being set correctly.
- `SENZING_WEB_SERVER_URL` - the fully qualified _PUBLIC_ address of the webapp address ie: ` http://my.webapp.domain:8251`.
- `SENZING_WEB_SERVER_VIRTUAL_PATH` - If the webapp server is beng load-balanced using virtual directories set this value to the base url path. ie: your webapp server is publicly available at `https://my.domain.com/er/webapp` set this value to `/er/webapp`.
- `SENZING_STREAM_SERVER_PORT` - The port that the server is listening for web socket connections on to support SQS loading. defaults to `8255`

## All Command Line Switches

- `adminAuthMode` - options are `JWT` or `NONE`. Setting to `NONE` will disable authentication checks for `/admin` paths. defaults to `JWT`
- `adminAuthPath` - The concatenation of `authServerHostName` and `authServerPortNumber` variables. The ability to override for special cases is provided and should be set to the resolvable base url that auth requests can be forwarded to, most commonly the name of the webapp container and port `8251` ie `http://senzing-webapp:8251`.
- `adminAuthRedirectOnFailure` - boolean whether or not to redirect unauthenticated admin user on status check rejection.
- `adminAuthRedirectUrl` - where to redirect unauthenticated admin users. defaults to `virtualPath +"/admin/login"`
- `adminAuthSecret` - secret used ot generate JWT token. defaults to autogenerated.
- `adminAuthStatusUrl` - defaults to `virtualPath +"/admin/auth/jwt/status"`
- `adminAuthToken` - override the token pre-crypt randomly generated value.
- `apiServerUrl` - The address and port of the Senzing API Server or Senzing POC Server resolvable from the Web App's runtime environment. If running in a container formation with a shared docker network it is recommended to use the API Server Container name ie: `http://senzing-poc-server:8250`. This is one of the most commonly mis-configured variables, the address must be resolvable from the webapp container. defaults to `http://localhost:8250`.
- `authServerHostName` - The hostname of the server to check for admin authentication(if configured). defaults to "localhost"
- `authServerPortNumber` - The port of the server to check for admin authentication(if configured). defaults to "8080"
- `corsAllowedOrigin` - if set specifies the `Access-Control-Allow-Origin` header to provide non-local/non-container asynchronous javascript requests to resources located on the running webapp server. (useful for developing locally but connecting to a running containers api reverse proxy)
- `corsFailureResponseCode` - defaults to 401
- `corsSuccessResponseCode` - defaults to 200
- `operatorAuthMode` - authentication mode for non-admin users. options are `JWT`,or `NONE`. _CURRENTLY NOT FULLY IMPLEMENTED_
- `operatorAuthRedirectUrl` - where to redirect unauthenticated non-admin users. defaults to `$virtualPath +"/login"`. _CURRENTLY NOT FULLY IMPLEMENTED_
- `operatorAuthSecret` - secret value to use in token crypt for non-admin users.
- `operatorAuthStatusUrl` - defaults to `$virtualPath +"/auth/jwt/status"`. _CURRENTLY NOT FULLY IMPLEMENTED_
- `operatorAuthToken` - override the token pre-crypt randomly generated value for non-admin users.
- `protocol` - The protocol that the webapp is available on. 'http' or 'https'
- `proxyAdminJWTPathRewrite` - Any request starting with "/admin/auth/jwt/\*" will be re-written using this regex before being forwarded to "$adminAuthPath". defaults to "/jwt/admin"
- `proxyJWTPathRewrite` - paths starting with "/auth/jwt/\*" are rewritten as the value of this variable before being passed on to `$adminAuthPath/jwt`. you almost always do not want to override this.
- `proxyLogLevel` - The verbosity level that the reverse proxy uses for console/log output. options are `debug` | `warn` | `error`
- `sslCertPath` - The path to the SSL certificate file. defaults to `/run/secrets/server.cert`. (See SSL documentation in README.md)
- `sslKeyPath` - The path to the SSL Key file. defaults to `/run/secrets/server.key`. (See SSL documentation in README.md)
- `streamClientUrl` - this is the _CLIENT URL_ to open up Web Socket requests to and not the internally resolvable value. ie: `ws://my.fully.qualified.domain:8255/app/ws`. This will be automagically set from a number of other variables but sometimes it can be necessary to explicitly define this variable if not being set correctly.
- `streamServerPort` - The port that the server is listening for web socket connections on to support SQS loading. defaults to `8255`
- `webServerApiPath` - The base path that _CLIENT_ api requests are made to. In most cases changing this is unnecessary but is allowed to be overridden for flexibility. This points to the built-in reverse proxy address by default, and the proxy provides the tunnel to the api server. defaults to `/api`
- `webServerAuthPath` - the resolvable base path to forward admin area authentication requests to(if enabled). defaults to `http://senzing-webapp:8080`
- `webServerAuthMode` - The same as `$adminAuthMode`
- `webServerHostName` - the internally resolvable hostname of the webapp. default is to try to automagically figure this out from the `$webServerUrl` value but sometimes there can be a need to explicitly define this value.
- `webServerInternalUrl` - is used for setting the _config_ base path when the _internally resolvable url_ is different from what the _client url_ resolves to ie: when running the webapp behind a gateway service the public address ie "https://www.my.public.url/webapp" may not be available from inside the formation context ie "http://this-is-a-private-address:8569"
- `webServerPortNumber` - The port that the webapp is running on. defaults to `8080`, commonly configured as `8251`
- `webServerUrl` - the fully qualified _PUBLIC_ address of the webapp address ie: ` http://my.webapp.domain:8251`.
- `writeProxyConfigToFile` - Write runtime configuration in JSON format to persistent locations. Proxy configuration written to `/proxy.conf.json`. This is used for debugging. _CAUTION "WILL BREAK IMMUTABILITY"_
- `virtualPath` - If the webapp server is beng load-balanced using virtual directories set this value to the base url path. ie: your webapp server is publicly available at `https://my.domain.com/er/webapp` set this value to `/er/webapp`.
