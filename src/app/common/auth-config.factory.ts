
import { apiConfig, environment } from '../../environments/environment';

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
