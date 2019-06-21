import { SzRestConfigurationParameters } from '@senzing/sdk-components-ng';

export const environment = {
  production: true,
  test: true
};

// api configuration parameters
export const apiConfig: SzRestConfigurationParameters = {
  'basePath': '/api',
  'withCredentials': true
};
