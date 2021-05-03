import { Injectable, Inject } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { SzRestConfigurationParameters, SzConfigurationService, SzAdminService, SzServerInfo, SzBaseResponseMeta } from '@senzing/sdk-components-ng';
import { HttpClient } from '@angular/common/http';

export interface AuthConfig {
  hostname?: string;
  port?: number;
  virtualPath?: string;
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
  private _apiConfig: SzRestConfigurationParameters;

  public get authConfig(): AuthConfig {
    return this._authConfig;
  }
  public set authConfig(value: AuthConfig) {
    this._authConfig = value;
  }
  public get apiConfig(): SzRestConfigurationParameters {
    return this._apiConfig;
  }
  public set apiConfig(value: SzRestConfigurationParameters) {
    this._apiConfig = value;
  }
  private _onAuthConfigChange: Subject<AuthConfig>                    = new Subject<AuthConfig>();
  public onAuthConfigChange                                           = this._onAuthConfigChange.asObservable();
  private _onApiConfigChange: Subject<SzRestConfigurationParameters>  = new Subject<SzRestConfigurationParameters>();
  public onApiConfigChange                                            = this._onApiConfigChange.asObservable();

  constructor( 
    private http: HttpClient,
    private sdkConfigService: SzConfigurationService
  ) {
    this.getRuntimeApiConfig().pipe(
      take(1)
    ).subscribe((apiConf: SzRestConfigurationParameters) => {
      //console.warn('SzWebAppConfigService.getRuntimeApiConfig: response', apiConf);
      this._apiConfig = apiConf;
      if(this._apiConfig.basePath !== this.sdkConfigService.basePath) {
        this.sdkConfigService.basePath    = this._apiConfig.basePath;
        //console.warn('SzWebAppConfigService.getRuntimeApiConfig: set SDK basePath', apiConf);
      }
    });
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
    // doesnt write to file system.
    return this.http.get<AuthConfig>('./config/auth');
  }
  public getRuntimeApiConfig(): Observable<SzRestConfigurationParameters> {
    // reach out to webserver to get api
    // config. we cant do this with static files
    // directly since container is immutable and
    // doesnt write to file system.
    return this.http.get<SzRestConfigurationParameters>('./config/api').pipe(
      catchError((err) => {
        // return default payload for local developement when "/config/api" not available
        return of({
          basePath: "/api"
        })
      })
    );
  }
}
