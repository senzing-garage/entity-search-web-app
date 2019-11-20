import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { Observable, of, EMPTY, Subject } from 'rxjs';
import { AdminService, SzBaseResponse, SzBaseResponseMeta } from '@senzing/rest-api-client-ng';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AboutInfoService {

  constructor(private adminService: AdminService, private router: Router) {

  }

  public getHealthInfo(): Observable<SzBaseResponseMeta> {
    // get attributes
    return this.adminService.heartbeat()
    .pipe(
      map( (resp: SzBaseResponse) => resp.meta )
    );
  }
}
