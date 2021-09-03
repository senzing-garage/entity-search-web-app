import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, filter, take } from 'rxjs/operators';
import { SzRestConfigurationParameters, SzConfigurationService } from '@senzing/sdk-components-ng';
import { HttpClient } from '@angular/common/http';
import { AboutInfoService } from './about.service';

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
export interface POCStreamConfig {
  proxy?: {
    hostname?: string;
    port?: number;
    url: string;
    protocol?: string;
    path?: string;
  }
  target: string;
  protocol?: string;
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
  private _pocStreamConfig: POCStreamConfig;

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
  public get pocStreamConfig(): POCStreamConfig {
    return this._pocStreamConfig;
  }
  public set pocStreamConfig(value: POCStreamConfig) {
    this._pocStreamConfig = value;
  }
  private _onAuthConfigChange: Subject<AuthConfig>                    = new Subject<AuthConfig>();
  public onAuthConfigChange                                           = this._onAuthConfigChange.asObservable();
  private _onApiConfigChange: Subject<SzRestConfigurationParameters>  = new Subject<SzRestConfigurationParameters>();
  public onApiConfigChange                                            = this._onApiConfigChange.asObservable();
  private _onPocStreamConfigChange: Subject<POCStreamConfig>          = new BehaviorSubject<POCStreamConfig>(undefined);
  public onPocStreamConfigChange                                      = this._onPocStreamConfigChange.asObservable();

  constructor( 
    private aboutInfoService: AboutInfoService,
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
    if(this.aboutInfoService.isPocServerInstance && this.aboutInfoService.isAdminEnabled) {
      this.getRuntimeStreamConfig().pipe(
        filter(() => {
          return this.aboutInfoService.isPocServerInstance && this.aboutInfoService.isAdminEnabled;
        }),
        take(1)
      ).subscribe((pocConf: POCStreamConfig) => {
        this._pocStreamConfig = pocConf;
        this._onPocStreamConfigChange.next( this._pocStreamConfig );
        console.warn('POC STREAM CONFIG!', this._pocStreamConfig);
      });
    } else {
      this.aboutInfoService.onServerInfoUpdated.pipe(
        filter(() => {
          return this.aboutInfoService.isPocServerInstance && this.aboutInfoService.isAdminEnabled;
        })
      ).subscribe((result) => {
        this.getRuntimeStreamConfig().pipe(
          filter(() => {
            return this.aboutInfoService.isPocServerInstance && this.aboutInfoService.isAdminEnabled;
          }),
          take(1)
        ).subscribe((pocConf: POCStreamConfig) => {
          this._pocStreamConfig = pocConf;
          this._onPocStreamConfigChange.next( this._pocStreamConfig );
          console.warn('POC STREAM CONFIG!', this._pocStreamConfig);
        });
      });
    }
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
  public getRuntimeStreamConfig(): Observable<POCStreamConfig | undefined> {
    // reach out to webserver to get api
    // config. we cant do this with static files
    // directly since container is immutable and
    // doesnt write to file system.
    return this.http.get<POCStreamConfig | undefined>('./config/streams').pipe(
      catchError((err) => {
        // return default payload for local developement when "/config/api" not available
        return of(undefined);
      })
    );
  }

}
