import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { Observable, of, EMPTY, Subject } from 'rxjs';
import { AdminService, SzBaseResponse, SzBaseResponseMeta, SzVersionResponse, SzVersionInfo } from '@senzing/rest-api-client-ng';
import { map } from 'rxjs/operators';
import { version as appVersion, dependencies as appDependencies } from '../../../package.json';
import { SzAdminService } from '@senzing/sdk-components-ng';

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
    this.getVersionInfo().subscribe( (info: any) => {
      console.warn('version data: ', info, this.adminService);
      this.apiServerVersion           = this.adminService.versionInfo.apiServerVersion;
      this.configCompatibilityVersion = this.adminService.versionInfo.configCompatibilityVersion;
      this.nativeApiVersion           = this.adminService.versionInfo.nativeApiVersion;
      this.restApiVersion             = this.adminService.versionInfo.restApiVersion;
      this.nativeApiBuildNumber       = this.adminService.versionInfo.nativeApiBuildNumber;
      this.nativeApiBuildDate         = this.adminService.versionInfo.nativeApiBuildDate;

    });
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
}
