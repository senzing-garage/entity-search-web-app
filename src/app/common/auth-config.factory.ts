
import { apiConfig, securityConfig, environment } from '../../environments/environment';

export interface AuthConfig {
    admin: {
      mode: string | boolean;
      checkUrl?: string;
      redirectOnFailure: boolean;
      loginUrl?: string;
    };
    operator?: {
      mode: string | boolean;
      checkUrl?: string;
      redirectOnFailure: boolean;
      loginUrl?: string;
    };
}

/**
 * create exportable config factory
 * for AOT compilation.
 *
 * @export
 */
export function AuthConfigFactory(): AuthConfig {
  return securityConfig;
}
