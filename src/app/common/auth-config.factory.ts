
import { apiConfig, securityConfig, environment } from '../../environments/environment';

/**
 * create exportable config factory
 * for AOT compilation.
 *
 * @export
 */
export function AuthConfigFactory() {
  return securityConfig;
}
