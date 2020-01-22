import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError, tap } from 'rxjs/operators';
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
    return this.adminAuth.checkServerInfo().pipe(
      tap( (isAuthed) => {
        //console.log('AuthGuardService.canActivate: ', isAuthed, this.adminAuth);
        if(!this.adminAuth.isAdminModeEnabled) {
          // rest server operating in read-only mode
          this.router.navigate( ['admin', 'error', 'admin-mode-disabled'] );
        } else if(this.adminAuth.isAdminModeEnabled && !this.adminAuth.isAuthenticated) {
          // we are using the token validator for the time being to act as a login
          // mechanism. for the time being that's the best way to auth SU
          this.router.navigate( ['admin'] );
        }
      })
    );
  }
}
