import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, interval, from, of, EMPTY, Subject, BehaviorSubject } from 'rxjs';
import { AdminService, SzBaseResponse, SzMeta, SzVersionResponse, SzVersionInfo } from '@senzing/rest-api-client-ng';
import { switchMap, tap, takeWhile, map, take } from 'rxjs/operators';
//import { version as appVersion, dependencies as appDependencies } from '../../../package.json';
import { SzAdminService, SzServerInfo } from '@senzing/sdk-components-ng';
import { SzWebAppConfigService, WebAppPackageInfo } from './config.service';
import { SzXtermSocket } from './xterm.socket.service';

/**
 * Service to provide package and release versions of key
 * dependencies. used for diagnostics.
 */
@Injectable({
  providedIn: 'root'
})
export class AboutInfoService {
  /** release version of the senzing-rest-api server being used */
  public apiServerVersion: string;
  /** release version of the senzing-poc-api server being used */
  public pocServerVersion: string;
  /** version of the OAS senzing-rest-api spec being used */
  public restApiVersion: string;
  /** version of the OAS senzing-rest-api spec being used in the POC server*/
  public pocApiVersion: string;
  /** version of app in package.json */
  public appName: string                = 'entity-search-webapp';
  /** release version of the ui app */
  public appVersion: string             = 'unknown';
  /** release version of the @senzing/sdk-components-ng package*/
  public sdkComponentsVersion: string   = 'unknown';
  /** version of the @senzing/sdk-graph-components package being used */
  public graphComponentsVersion: string = 'unknown';
  /** version of the @senzing/rest-api-client-ng package */
  public restApiClientVersion: string   = 'unknown';
  /** version of angular being used */
  public angularVersion: string         = 'unknown';
  /** version of angular material being used */
  public materialVersion                = 'unknown';
  /** version of D3 library being used */
  public d3Version: string              = 'unknown';

  /** The maximum size for inbound text or binary messages when invoking end-points via Web Sockets `ws://` protocol. */
  public webSocketsMessageMaxSize?: number;
  /** Whether or not an asynchronous INFO queue has been configured for automatically sending \"INFO\" messages when records are loaded, reevaluated or deleted. */
  public infoQueueConfigured?: boolean;
  /** Whether or not an asynchronous LOAD queue has been configured for asynchronously loading records. */
  public loadQueueConfigured?: boolean;

  public configCompatibilityVersion: number | string;
  public nativeApiBuildDate: Date;
  public nativeApiBuildNumber: string;
  public nativeApiVersion: string;
  public isReadOnly: boolean;
  public isAdminEnabled: boolean;
  public isPocServerInstance: boolean = false;
  private pollingInterval = 60 * 1000;

  /** provide a event subject to notify listeners of updates */
  private _onServerInfoUpdated = new BehaviorSubject(this);
  public onServerInfoUpdated = this._onServerInfoUpdated.asObservable();

  /** poll for version info */
  public pollForVersionInfo(): Observable<SzVersionInfo> {
    return interval(this.pollingInterval).pipe(
        switchMap(() => from( this.adminService.getVersionInfo() )),
        tap( this.setVersionInfo.bind(this) )
    );
  }
  /** poll for server health */
  public pollForHeartbeat(): Observable<SzVersionInfo> {
    return interval(this.pollingInterval).pipe(
        switchMap(() => from( this.adminService.getHeartbeat() )),
        takeWhile( (resp: SzMeta) => resp.httpStatusCode !== 403 && resp.httpStatusCode !== 500 ),
        tap( this.setHeartbeatInfo.bind(this) )
    );
  }
  /** poll for server info */
  public pollForServerInfo(): Observable<SzServerInfo> {
    return interval(this.pollingInterval).pipe(
        switchMap(() => from( this.adminService.getServerInfo() )),
        tap( this.setServerInfo.bind(this) )
    );
  }
  constructor(
    private adminService: SzAdminService, 
    private configService: SzWebAppConfigService,
    private socket: SzXtermSocket,
    private router: Router) {
    // get version info from SzAdminService
    this.getVersionInfo().pipe(take(1)).subscribe( this.setVersionInfo.bind(this) );
    this.getServerInfo().pipe(take(1)).subscribe( this.setServerInfo.bind(this) );
    this.getServerInfoMetadata().pipe(take(1)).subscribe( this.setPocServerInfo.bind(this) );
    this.pollForVersionInfo().subscribe();
    //this.pollForHeartbeat().subscribe();
    this.pollForServerInfo().subscribe();

    this.configService.onApiConfigChange.subscribe(() => {
      console.warn('AboutInfoService() config updated, making new info calls..');
      this.getVersionInfo().pipe(take(1)).subscribe( this.setVersionInfo.bind(this) );
      this.getServerInfo().pipe(take(1)).subscribe( this.setServerInfo.bind(this) );
      this.getServerInfoMetadata().pipe(take(1)).subscribe( this.setPocServerInfo.bind(this) );
    });
    // pull package info
    this.getPackageInfo().pipe(take(1)).subscribe( this.setPackageInfo.bind(this) );
  }

  /** get heartbeat information from the rest-api-server host */
  public getHealthInfo(): Observable<SzMeta> {
    // get heartbeat
    return this.adminService.getHeartbeat();
  }
  /** get version information from the rest-api-server host */
  public getVersionInfo(): Observable<SzVersionInfo> {
    // get version info
    return this.adminService.getVersionInfo();
  }
  /** get the server information from the rest-api-server host */
  public getServerInfo(): Observable<SzServerInfo> {
    return this.adminService.getServerInfo();
  }
  public getServerInfoMetadata(): Observable<SzMeta> {
    return this.adminService.getServerInfoMetadata();
  }
  /** get information about the packages listed in the package.json */
  public getPackageInfo(): Observable<WebAppPackageInfo> {
    return this.configService.getAppPackageInfo();
  }
  /** set properties retrieved from the package.json */
  private setPackageInfo(value: WebAppPackageInfo) {
    this.appName                = value.name;
    this.appVersion             = value.version;
    this.angularVersion         = value.angular;
    this.materialVersion        = value.material;
    this.d3Version              = value.d3;
    this.sdkComponentsVersion   = value['sdk-components-ng'];
    this.restApiClientVersion   = value['rest-api-client-ng'];
    this.graphComponentsVersion = value['sdk-graph-components'];
  }
  /** 
   * set health related info 
   * @todo make this do something
   **/
  private setHeartbeatInfo(resp: SzMeta) {
    //
  }
  private setServerInfo(info: SzServerInfo) {
    //this.concurrency = info.concurrency;
    //this.activeConfigId = info.activeConfigId;
    //this.dynamicConfig = info.dynamicConfig;
    this.isReadOnly               = info.readOnly;
    this.isAdminEnabled           = info.adminEnabled;
    this.infoQueueConfigured      = info && info.infoQueueConfigured !== undefined ? info.infoQueueConfigured : this.infoQueueConfigured;
    //this.loadQueueConfigured      = info && info.loadQueueConfigured !== undefined ? info.loadQueueConfigured : this.loadQueueConfigured;
    this.loadQueueConfigured      = false;
    this.webSocketsMessageMaxSize = info && info.webSocketsMessageMaxSize !== undefined ? info.webSocketsMessageMaxSize : this.webSocketsMessageMaxSize;
    this._onServerInfoUpdated.next(this);
  }

  private setPocServerInfo(resp: SzMeta) {
    this.pocServerVersion     = resp && resp.pocServerVersion ? resp.pocServerVersion : this.pocApiVersion;
    this.pocApiVersion        = resp && resp.pocApiVersion ? resp.pocApiVersion : this.pocApiVersion;
    this.isPocServerInstance  = resp && resp.pocApiVersion !== undefined ? true : this.isPocServerInstance;
    this._onServerInfoUpdated.next(this);
  }

  private setVersionInfo(serverInfo: SzVersionInfo): void {
    this.apiServerVersion           = serverInfo.apiServerVersion;
    this.configCompatibilityVersion = serverInfo.configCompatibilityVersion;
    this.nativeApiVersion           = serverInfo.nativeApiVersion;
    this.restApiVersion             = serverInfo.restApiVersion;
    this.nativeApiBuildNumber       = serverInfo.nativeApiBuildNumber;
    this.nativeApiBuildDate         = serverInfo.nativeApiBuildDate;
  }

}
