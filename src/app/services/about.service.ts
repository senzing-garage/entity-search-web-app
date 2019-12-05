import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { Observable, of, EMPTY, Subject } from 'rxjs';
import { AdminService, SzBaseResponse, SzBaseResponseMeta } from '@senzing/rest-api-client-ng';
import { map } from 'rxjs/operators';
import { version as appVersion, dependencies as appDependencies } from '../../../package.json';

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

  constructor(private adminService: AdminService, private router: Router) {
    this.appVersion = appVersion;
    if(appDependencies) {
      // check to see if we can pull sdk-components-ng and sdk-graph-components
      // versions from the package json
      if (appDependencies['@senzing/sdk-components-ng']) {
        this.sdkComponentsVersion = appDependencies['@senzing/sdk-components-ng'];
      }
      if (appDependencies['@senzing/sdk-graph-components']) {
        this.graphComponentsVersion = appDependencies['@senzing/sdk-graph-components'];
      }
      if (appDependencies['@senzing/rest-api-client-ng']) {
        this.restApiClientVersion = appDependencies['@senzing/rest-api-client-ng'];
      }
    }
    // get information from api server from adminService
    this.getHealthInfo().subscribe( (info: any) => {
      //console.warn('heartbeat data: ', info);
      this.restApiVersion = info.restApiVersion;
      this.apiServerVersion = info.version;
    });
  }
  /** get diagnostic information from the rest-api-server host */
  public getHealthInfo(): Observable<SzBaseResponseMeta> {
    // get attributes
    return this.adminService.heartbeat()
    .pipe(
      map( (resp: SzBaseResponse) => resp.meta )
    );
  }
}
