import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, interval, from, of, EMPTY, Subject } from 'rxjs';
import { AdminService, SzBaseResponse, SzBaseResponseMeta, SzVersionResponse, SzVersionInfo } from '@senzing/rest-api-client-ng';
import { switchMap, tap, takeWhile } from 'rxjs/operators';
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
  /** version of the OAS senzing-rest-api spec being used */
  public restApiVersion: string;
  /** release version of the ui app */
  public appVersion: string;
  /** release version of the @senzing/sdk-components-ng package*/
  public sdkComponentsVersion: string;
  /** version of the @senzing/sdk-graph-components package being used */
  public graphComponentsVersion: string;
  /** version of the @senzing/rest-api-client-ng package */
  public restApiClientVersion: string;

  public configCompatibilityVersion: number | string;
  public nativeApiBuildDate: Date;
  public nativeApiBuildNumber: string;
  public nativeApiVersion: string;
  public isReadOnly: boolean;
  public isAdminEnabled: boolean;
  private pollingInterval = 60 * 1000;
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
        takeWhile( (resp: SzBaseResponseMeta) => resp.httpStatusCode !== 403 && resp.httpStatusCode !== 500 ),
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
    this.pollForVersionInfo().subscribe();
    //this.pollForHeartbeat().subscribe();
    this.pollForServerInfo().subscribe();
  }
  /** get heartbeat information from the rest-api-server host */
  public getHealthInfo(): Observable<SzBaseResponseMeta> {
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
  private setHeartbeatInfo(resp: SzBaseResponseMeta) {
    //
  }
  private setServerInfo(info: SzServerInfo) {
    console.info('SzAdminService.setServerInfo: ', this.isReadOnly, info.readOnly, this.isAdminEnabled, info.adminEnabled);
    //this.concurrency = info.concurrency;
    //this.activeConfigId = info.activeConfigId;
    //this.dynamicConfig = info.dynamicConfig;
    this.isReadOnly = info.readOnly;
    this.isAdminEnabled = info.adminEnabled;
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
