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
  /** route guard check to see if user can access a route */
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const encodedToken = localStorage.getItem('access_token');
    if ( !encodedToken || encodedToken === undefined || encodedToken === 'undefined' ) {
      // no token, redirect to /login
      this.router.navigate( ['admin', 'login']);
    } else {
      const sInfo      = this.adminAuth.checkServerInfo();
      const tokenValid = this.adminAuth.verifyJWT(encodedToken);
      return forkJoin([sInfo, tokenValid]).pipe(
        tap( (results: boolean[]) => {
          if(!results[0]) {
            this.router.navigate( ['admin', 'error', 'admin-mode-disabled'] );
          } else if(!results[1]) {
            this.adminAuth.logout();
            this.router.navigate( ['admin', 'login'] );
          }
        }),
        map( (results: boolean[]) => {
          return (results[0] && results[1]);
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
