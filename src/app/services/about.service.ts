import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, interval, from, of, EMPTY, Subject, BehaviorSubject } from 'rxjs';
import { AdminService, SzBaseResponse, SzMeta, SzVersionResponse, SzVersionInfo } from '@senzing/rest-api-client-ng';
import { switchMap, tap, takeWhile, map } from 'rxjs/operators';
import { version as appVersion, dependencies as appDependencies } from '../../../package.json';
import { SzAdminService, SzServerInfo } from '@senzing/sdk-components-ng';

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
  /** release version of the ui app */
  public appVersion: string;
  /** release version of the @senzing/sdk-components-ng package*/
  public sdkComponentsVersion: string;
  /** version of the @senzing/sdk-graph-components package being used */
  public graphComponentsVersion: string;
  /** version of the @senzing/rest-api-client-ng package */
  public restApiClientVersion: string;

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
  constructor(private adminService: SzAdminService, private router: Router) {
    this.appVersion = appVersion;
    if(appDependencies) {
      // check to see if we can pull sdk-components-ng and sdk-graph-components
      // versions from the package json
      if (appDependencies['@senzing/sdk-components-ng']) {
        this.sdkComponentsVersion = this.getVersionFromLocalTarPath( appDependencies['@senzing/sdk-components-ng'], 'senzing-sdk-components-ng-' );
      }
      if (appDependencies['@senzing/sdk-graph-components']) {
        this.graphComponentsVersion = this.getVersionFromLocalTarPath( appDependencies['@senzing/sdk-graph-components'], 'senzing-sdk-graph-components-' );
      }
      if (appDependencies['@senzing/rest-api-client-ng']) {
        this.restApiClientVersion = this.getVersionFromLocalTarPath( appDependencies['@senzing/rest-api-client-ng'], 'senzing-rest-api-client-ng-' );
      }
    }

    // get version info from SzAdminService
    this.getVersionInfo().subscribe( this.setVersionInfo.bind(this) );
    this.getServerInfo().subscribe( this.setServerInfo.bind(this) );
    this.getServerInfoMetadata().subscribe( this.setPocServerInfo.bind(this) );
    this.pollForVersionInfo().subscribe();
    //this.pollForHeartbeat().subscribe();
    this.pollForServerInfo().subscribe();
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
  public getVersionFromLocalTarPath(packagePath: string | undefined, packagePrefix?: string | undefined ): undefined | string {
    let retVal = packagePath;
    if (packagePath && packagePath.indexOf && packagePath.indexOf('file:') === 0) {
      const pathArr = packagePath.split('/');
      const fileName = pathArr.pop();
      if (fileName && fileName.indexOf && fileName.indexOf('.tgz') > -1) {
        let startAt = 0;
        if(packagePrefix && fileName.indexOf(packagePrefix) > -1) {
          startAt = fileName.indexOf(packagePrefix) + packagePrefix.length;
        }
        retVal = fileName.substring(startAt, fileName.indexOf('.tgz'));
      } else if (fileName) {
        retVal = fileName;
      }
    }
    return retVal;
  }
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
    this.loadQueueConfigured      = info && info.loadQueueConfigured !== undefined ? info.loadQueueConfigured : this.loadQueueConfigured;
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
