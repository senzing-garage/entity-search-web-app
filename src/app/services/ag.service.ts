import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of, forkJoin } from 'rxjs';
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
  redirectOnFailure(): void {
    // failed external check
    if (this.adminAuth.redirectOnFailure && this.adminAuth.loginUrl) {
      // redirect to external SSO login page
      console.warn('REDIRECTING TO SSO LOGIN: ', this.adminAuth.loginUrl, this.adminAuth);
      //this.router.navigateByUrl(this.adminAuth.loginUrl);
      //this.router.navigate(['/admin/externalRedirect', { externalUrl: this.adminAuth.loginUrl }]);
    } else if(this.adminAuth.redirectOnFailure) {
      console.warn('REDIRECTING TO JWT LOGIN: ', this.adminAuth.loginUrl);
      if(this.adminAuth.loginUrl && this.adminAuth.loginUrl.indexOf && this.adminAuth.loginUrl.indexOf('http') !== 0) {
        // probably JWT
        // use local login
        this.router.navigate( ['admin', 'login']);
      } else {
        // starts with http
        // probably external link
        //this.router.navigate(['/admin/externalRedirect', { externalUrl: this.adminAuth.loginUrl }]);

      }
    }
    if (this.adminAuth.authMode === 'JWT' || this.adminAuth.authMode === 'BUILT-IN') {
      // if using built-in log user out on failure
      // clears local storage JWT token
      this.adminAuth.logout();
    }
  }

  isUrlExternal(url: string) {
    return (url && url.indexOf && url.indexOf('http') === 0);
  }

  /** route guard check to see if user can access a route */
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    if (!this.adminAuth.authMode) {
      // no auth check. WWWWHHHHYYYY!!!
      // hope you know what you're doing
      console.warn('NO AUTH CHECK!!! EXTREMELY DANGEROUS!');
      return of(true);
    } else {
      const requests = [ this.adminAuth.checkServerInfo() ];
      if(this.adminAuth.authMode === 'JWT' || this.adminAuth.authMode === 'BUILT-IN') {
        // extra check for access token
        const encodedToken = localStorage.getItem('access_token');
        if ( !encodedToken || encodedToken === undefined || encodedToken === 'undefined' ) {
          // no token, redirect to login page
          if( this.isUrlExternal(this.adminAuth.loginUrl) ) {
            this.router.navigate(['/admin/externalRedirect', { externalUrl: this.adminAuth.loginUrl }]);
          } else {
            this.router.navigateByUrl( this.adminAuth.loginUrl );
          }
        } else {
          // add token auth check to requests
          requests.push( this.adminAuth.verifyJWT(encodedToken) );
        }
      } else if(this.adminAuth.authMode === 'EXTERNAL' || this.adminAuth.authMode === 'SSO') {
        // SSO or EXTERNAL auth check
        requests.push( this.adminAuth.getIsAuthorized() );
      }

      console.log('AG Service: ' + this.adminAuth.authMode, requests);

      return forkJoin(requests).pipe(
        tap( (results: boolean[]) => {
          if(!results[0]) {
            this.router.navigate( ['admin', 'error', 'admin-mode-disabled'] );
          } else if(!results[1]) {
            console.warn('redirecting to SSO: ', results);
            this.redirectOnFailure();
          } else {
            return of(true);
          }
        }),
        map( (results: boolean[]) => {
          return (results[0] && results[1]);
        }),
        catchError( (err) => {
          console.warn('redirecting to SSO: ', err);
          this.redirectOnFailure();
          return of(false);
        })
      );
    }
  }
}
