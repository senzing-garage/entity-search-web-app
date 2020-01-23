import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError, tap, first } from 'rxjs/operators';
import { SzConfigurationService, SzAdminService, SzServerInfo } from '@senzing/sdk-components-ng';
import { AdminAuthService } from './admin.service';

/**
 * A service that provides authentication checks for routes
 * available in the /admin section
*/
@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {
  constructor(
    private httpClient: HttpClient,
    private configService: SzConfigurationService,
    private adminService: SzAdminService,
    private adminAuth: AdminAuthService,
    private router: Router
  ) { }
  /** route guard check to see if user can access a route */
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    // console.log("guard!");
    const encodedToken = localStorage.getItem('access_token');
    // const hasToken = (localStorage.getItem('access_token')) ? true : false;

    if ( !encodedToken || encodedToken === undefined || encodedToken === 'undefined' ) {
      // no token, redirect to /login
      //console.warn('redirecting to login..', encodedToken);
      this.router.navigate( ['admin', 'login']);
    } else {
      //console.warn(`verifying token: "${encodedToken}"`, typeof encodedToken, encodedToken === undefined);

      return this.adminAuth.verifyJWT(encodedToken).pipe(
        tap( (isValid) => {
          //console.warn('redirecting to login..', isValid);
          if(!isValid) {
            this.adminAuth.logout();
            this.router.navigate( ['admin', 'login']);
          }
        }),
        catchError( (err) => {
          this.router.navigate( ['admin', 'login']);
          this.adminAuth.logout();
          return of(false);
        })
      );
    }
  }
}
