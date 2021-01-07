import { SzRestConfigurationParameters } from '@senzing/sdk-components-ng';

export const environment = {
  production: true,
  test: false
};

// api configuration parameters
export const apiConfig: SzRestConfigurationParameters = {
  'basePath': '/api',
  'withCredentials': true
};

/** security options for admin area */
//import * as SEC_OPTS from '../../auth/auth.conf.json';
//export const securityConfig = SEC_OPTS;
