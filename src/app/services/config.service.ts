import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, interval, from, throwError } from 'rxjs';
import { catchError, filter, switchMap, map, take, tap } from 'rxjs/operators';
import { SzAdminService, SzRestConfigurationParameters, SzConfigurationService, SzServerInfo, SzMeta } from '@senzing/sdk-components-ng';
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
export interface POCStreamConfig {
  proxy?: {
    hostname?: string;
    port?: number;
    url: string;
    protocol?: string;
    path?: string;
  }
  target?: string;
  protocol?: string;
}
export interface WebAppPackageInfo {
  'name': string,
  'version':              string,
  'angular':              string,
  'material':             string,
  'sdk-components-ng':    string,
  'sdk-graph-components': string,
  'rest-api-client-ng':   string,
  'd3':                   string
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
  private _serverInfo: SzServerInfo;
  private _serverInfoMetadata: SzMeta;
  private _packageInfo: WebAppPackageInfo;
  private _isStreamingConfigured: boolean = false;
  private pollingInterval = 60 * 1000;

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
  public get isReadOnly(): boolean {
    return this._serverInfo && this._serverInfo.readOnly;
  }
  public get isAdminEnabled(): boolean {
    return this._serverInfo && this._serverInfo.adminEnabled;
  }
  public get infoQueueConfigured(): boolean {
    return this._serverInfo && this._serverInfo.infoQueueConfigured !== undefined ? this._serverInfo.infoQueueConfigured : false;
  }
  public get loadQueueConfigured(): boolean {
    return this._serverInfo && this._serverInfo.loadQueueConfigured !== undefined ? this._serverInfo.loadQueueConfigured : false;
  }
  public get isPocServerInstance(): boolean {
    return this._serverInfoMetadata && this._serverInfoMetadata.pocApiVersion !== undefined ? true : false;
  }
  public get packageInfo(): WebAppPackageInfo {
    return this._packageInfo;
  }
  public set packageInfo(value: WebAppPackageInfo) {
    this._packageInfo = value;
  }
  public set isStreamingConfigured(value: boolean) {
    this._isStreamingConfigured = value;
  }
  public get isStreamingConfigured(): boolean {
    return this._isStreamingConfigured;
  }

  /** provide a event subject to notify listeners of updates */
  private _onAuthConfigChange: Subject<AuthConfig>                    = new Subject<AuthConfig>();
  public onAuthConfigChange                                           = this._onAuthConfigChange.asObservable();
  private _onApiConfigChange: Subject<SzRestConfigurationParameters>  = new Subject<SzRestConfigurationParameters>();
  public onApiConfigChange                                            = this._onApiConfigChange.asObservable();
  private _onPocStreamConfigChange: BehaviorSubject<POCStreamConfig>  = new BehaviorSubject<POCStreamConfig>(undefined);
  public onPocStreamConfigChange                                      = this._onPocStreamConfigChange.asObservable();
  private _onServerInfoUpdated: BehaviorSubject<SzServerInfo>         = new BehaviorSubject<SzServerInfo>(undefined);
  public onServerInfoUpdated                                          = this._onServerInfoUpdated.asObservable();

  constructor( 
    private adminService: SzAdminService, 
    private http: HttpClient,
    private sdkConfigService: SzConfigurationService
  ) {

    // ---------------------------------------  set up event handlers -------------------------------------------

    // if the api config changes we need to grab a new versions of 
    // stream config and auth config
    // _serverInfo and _serverInfoMetadata
    this.onApiConfigChange.pipe(
      take(5)
    ).subscribe(() => {
      console.warn('AboutInfoService() config updated, making new info calls..');

      // get updated runtime auth config
      this.getRuntimeAuthConfig().pipe(
        take(1)
      ).subscribe((authConf: AuthConfig) => {
        this._authConfig = authConf;
      });
      // get updated stream config
      this.getRuntimeStreamConfig().pipe(
        take(1)
      ).subscribe((resp: POCStreamConfig | Error) => {
          this._isStreamingConfigured = true;
          this._pocStreamConfig = (resp as POCStreamConfig);
          if(this._pocStreamConfig && !this.loadQueueConfigured) {
            this._isStreamingConfigured = false;
          }
          this._onPocStreamConfigChange.next( this._pocStreamConfig );
          //console.warn('POC STREAM CONFIG!', this._pocStreamConfig);
      });
      // get updated server info if api config has changed
      this.adminService.getServerInfo().pipe(take(1)).subscribe( (resp: SzServerInfo) => {
        this._serverInfo = resp;
        this._onServerInfoUpdated.next(this._serverInfo);
      } );
      // get updated server info metadata if api config has changed
      this.adminService.getServerInfoMetadata().pipe(take(1)).subscribe( (resp: SzMeta) => {
        this._serverInfoMetadata = resp;
        this._onServerInfoUpdated.next(this._serverInfo);
      });
    });

    // If the server info or server info metadata has been updated we need to 
    // requery for runtime stream config (maybe)
    this.onServerInfoUpdated.pipe(
      filter((srvInfo: undefined | SzServerInfo) => {
        return srvInfo !== undefined && this.isPocServerInstance && this.isAdminEnabled;
      })
    ).subscribe((result) => {
      this.getRuntimeStreamConfig().pipe(
        filter(() => {
          return this.isPocServerInstance && this.isAdminEnabled;
        }),
        take(1)
      ).subscribe((resp: POCStreamConfig) => {
        
          this._isStreamingConfigured = true;
          this._pocStreamConfig = (resp as POCStreamConfig);
          if(this._pocStreamConfig && !this.loadQueueConfigured) {
            this._isStreamingConfigured = false;
          }
          this._onPocStreamConfigChange.next( this._pocStreamConfig );
          console.warn('POC STREAM CONFIG! '+ this._isStreamingConfigured, this._pocStreamConfig);
      });
    });

    // -----------------------------------------  initial requests ---------------------------------------------
    // get initial runtime config for /api requests
    this.getRuntimeApiConfig().pipe(
      take(1)
    ).subscribe((apiConf: SzRestConfigurationParameters) => {
      //console.warn('SzWebAppConfigService.getRuntimeApiConfig: response', apiConf);
      this._apiConfig = apiConf;
      if(this._apiConfig.basePath !== this.sdkConfigService.basePath) {
        this.sdkConfigService.basePath    = this._apiConfig.basePath;
        this._onApiConfigChange.next( this._apiConfig );
        //console.warn('SzWebAppConfigService.getRuntimeApiConfig: set SDK basePath', apiConf);
      }
    });
    // get initial runtime config for /auth requests
    this.getRuntimeAuthConfig().pipe(
      take(1)
    ).subscribe((authConf: AuthConfig) => {
      this._authConfig = authConf;
    });
    // get initial "ServerInfo"
    this.adminService.getServerInfo().pipe(take(1)).subscribe( (resp: SzServerInfo) => {
      this._serverInfo = resp;
      this._onServerInfoUpdated.next(this._serverInfo);
    });
    // in order to get "POC" specific properties we neet the metadata node instead
    this.adminService.getServerInfoMetadata().pipe(take(1)).subscribe((resp: SzMeta) => {
      this._serverInfoMetadata = resp;
      this._onServerInfoUpdated.next(this._serverInfo);
    });

    // -------------------------------------  set up polling requests -----------------------------------------
    /** now set up polling for updates of server-info properties */
    this.pollForServerInfo().subscribe();
  }
  /** poll for server info */
  private pollForServerInfo(): Observable<SzServerInfo> {
    return interval(this.pollingInterval).pipe(
        switchMap(() => from( this.adminService.getServerInfo() )),
        tap( (resp: SzServerInfo) => {
          this._serverInfo = resp;
        } )
    );
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
  public getRuntimeStreamConfig(): Observable<POCStreamConfig> {
    // reach out to webserver to get api
    // config. we cant do this with static files
    // directly since container is immutable and
    // doesnt write to file system.
    return this.http.get<POCStreamConfig>('./config/streams');
  }
  public getAppPackageInfo(): Observable<WebAppPackageInfo> {
    return this.http.get<WebAppPackageInfo>('./config/package').pipe(
      catchError((err) => {
        // return default payload for local developement when "/config/package" not available
        return of({
          'name':                 'entity-search-webapp',
          'version':              'unknown',
          'angular':              'unknown',
          'material':             'unknown',
          'sdk-components-ng':    'unknown',
          'sdk-graph-components': 'unknown',
          'rest-api-client-ng':   'unknown',
          'd3':                   'unknown'
        });
      })
    );
  }

}
