import { Injectable, Inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of, from, interval, Subject } from 'rxjs';
import { map, catchError, tap, switchMap, take } from 'rxjs/operators';
import { SzConfigurationService, SzAdminService, SzServerInfo, SzBaseResponseMeta } from '@senzing/sdk-components-ng';
import { HttpClient } from '@angular/common/http';

export interface AuthConfig {
  hostname?: string;
  port?: number;
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
 * A service used to provide methods and services
 * used in the /admin interface
 */
@Injectable({
  providedIn: 'root'
})
export class SzWebAppConfigService {
  private _authConfig: AuthConfig;
  public get authConfig(): AuthConfig {
    return this._authConfig;
  }
  public set authConfig(value: AuthConfig) {
    this._authConfig = value;
  }
  private _onAuthConfigChange: Subject<AuthConfig> = new Subject<AuthConfig>();
  public onAuthConfigChange = this._onAuthConfigChange.asObservable();

  constructor( private http: HttpClient ) {
    this.getRuntimeAuthConfig().pipe(
      take(1)
    ).subscribe((authConf: AuthConfig) => {
      this._authConfig = authConf;
    });
  }
  public getRuntimeAuthConfig(): Observable<AuthConfig> {
    // reach out to webserver to get auth
    // config. we cant do this with static files
    // directly since container is immutable and
    // dont write to file system.
    return this.http.get<AuthConfig>('/config/auth');
  }
}
