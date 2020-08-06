import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of, forkJoin, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError, tap, first, concatMap, mergeMap } from 'rxjs/operators';
import { SzConfigurationService, SzAdminService, SzServerInfo } from '@senzing/sdk-components-ng';
import { AdminAuthService } from './admin.service';
import { AuthConfig } from './config.service';

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
      // redirect to external login page
      console.warn('REDIRECTING TO LOGIN: ', this.adminAuth.loginUrl, this.isUrlExternal(this.adminAuth.loginUrl), this.adminAuth);
      if( this.isUrlExternal(this.adminAuth.loginUrl) ) {
        this.router.navigate(['/admin/externalRedirect', { externalUrl: this.adminAuth.loginUrl }]);
      } else {
        this.router.navigateByUrl(this.adminAuth.loginUrl);
      }
    } else if(this.adminAuth.redirectOnFailure) {
      console.warn('REDIRECTING TO JWT LOGIN: ', this.adminAuth.loginUrl, this.isUrlExternal(this.adminAuth.loginUrl));
      if(this.adminAuth.loginUrl && !this.isUrlExternal(this.adminAuth.loginUrl)) {
        // probably JWT
        // use local login
        this.router.navigate( ['admin', 'login']);
      } else {
        // starts with http
        // probably external link
        this.router.navigate(['/admin/externalRedirect', { externalUrl: this.adminAuth.loginUrl }]);
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
    const onConfigLoaded = new Subject<AuthConfig>();
    const dummyDepReq = new Subject<boolean>();
    const requests: Observable<boolean>[] = [ dummyDepReq.asObservable() ];
    const responses: (AuthConfig | boolean)[] = [];
    let authConf: AuthConfig;

    const retVal = onConfigLoaded.pipe(
      tap( (res: AuthConfig) => {
        authConf = res;
        responses.push(res);
      }),
      concatMap( (res: AuthConfig) => {
        if (!(authConf.admin && authConf.admin.mode)) {
          // no auth check. WWWWHHHHYYYY!!!
          // hope you know what you're doing
          console.warn('NO AUTH CHECK!!! EXTREMELY DANGEROUS!');
          responses.push(true);
          return of(true);
        } else {
          console.info('AuthGuardService.canActivate.onConfigLoaded: setting up subsequent requests', authConf);
          if(authConf.admin.mode === 'JWT' || authConf.admin.mode === 'BUILT-IN') {
            // extra check for access token
            const encodedToken = localStorage.getItem('access_token');
            if ( !encodedToken || encodedToken === undefined || encodedToken === 'undefined' ) {
              console.log('encodedToken is null, redirect to login..', this.isUrlExternal(authConf.admin.loginUrl));

              // no token, redirect to login page
              if( this.isUrlExternal(authConf.admin.loginUrl) ) {
                console.warn('why is this messing it up? ', authConf.admin.loginUrl, this.isUrlExternal(authConf.admin.loginUrl), this.adminAuth);
                this.router.navigate(['/admin/externalRedirect', { externalUrl: this.adminAuth.loginUrl }]);
              } else {
                this.router.navigateByUrl( authConf.admin.loginUrl );
              }
            } else {
              // add token auth check to requests
              const jwtReq = this.adminAuth.verifyJWT(encodedToken).pipe(
                tap( (resi) => {
                  console.warn('ran JWT auth check', resi);
                  responses.push(resi);
                })
              );
              console.log('going to run JWT check...');
              requests.push( jwtReq );
            }
          } else if(authConf.admin.mode === 'EXTERNAL' || authConf.admin.mode === 'SSO') {
            // SSO or EXTERNAL auth check
            console.warn('going to run SSO check...');

            requests.push(
              this.adminAuth.getIsAuthorized().pipe(
                tap((resi: boolean) => {
                  console.warn('ran SSO auth check', resi);
                  responses.push(resi);
                })
              ));
          } else {
            console.warn('fallthrough: ', (authConf.admin.mode === 'JWT' || authConf.admin.mode === 'BUILT-IN'));
          }
        }
        dummyDepReq.next(true);
        console.info('\t\trequests: ', requests);

        return (requests && requests[ (requests.length - 1)]) ? requests[ (requests.length - 1)] : of(true);
      }),
      concatMap( (res: boolean) => {
        if (!(authConf.admin && authConf.admin.mode)) {
          // no auth check. WWWWHHHHYYYY!!!
          // hope you know what you're doing
          console.warn('NO AUTH CHECK!!! EXTREMELY DANGEROUS!');
          return of(true);
        } else {
          return this.adminAuth.checkServerInfo().pipe(
            tap((resi: boolean) => {
              console.warn('has admin enabled? ', resi);
              responses.push(resi);
            })
          );
        }
      }),
      tap( (results: boolean) => {
        console.warn('!!RESULT!! ', results, responses);

        if(!responses.pop()) {
          this.router.navigate( ['admin', 'error', 'admin-mode-disabled'] );
        } else if(!results[1]) {
          console.warn('redirecting to login: ', responses);
          this.redirectOnFailure();
        } else {
          return of(true);
        }
      }),
    );

    retVal.subscribe((results: any) => {
      console.warn('AuthGuardService.canActivate.onConfigLoaded Complete: ', results);
    });

    if( this.adminAuth.authConfigLoaded ) {
      onConfigLoaded.next( this.adminAuth.authConfig );
    } else {
      this.adminAuth.onAuthConfigLoaded.subscribe((res: AuthConfig) => {
        onConfigLoaded.next( res );
      });
    }
    console.log('AuthGuardService.canActivate: ', requests);

    return retVal;

    /*
    if (!this.adminAuth.authMode) {
      // no auth check. WWWWHHHHYYYY!!!
      // hope you know what you're doing
      console.warn('NO AUTH CHECK!!! EXTREMELY DANGEROUS!');
      return of(true);
    } else {
      const requests = [ this.adminAuth.checkServerInfo() ];
      if(!this.adminAuth.authConfigLoaded){
        this.adminAuth.onAuthConfigLoaded.subscribe();
      } else {}
      if(this.adminAuth.authMode === 'JWT' || this.adminAuth.authMode === 'BUILT-IN') {
        // extra check for access token
        const encodedToken = localStorage.getItem('access_token');
        if ( !encodedToken || encodedToken === undefined || encodedToken === 'undefined' ) {
          // no token, redirect to login page
          if( this.isUrlExternal(this.adminAuth.loginUrl) ) {
            console.warn('why is this messing it up? ', this.adminAuth.loginUrl, this.isUrlExternal(this.adminAuth.loginUrl), this.adminAuth);
            //this.router.navigate(['/admin/externalRedirect', { externalUrl: this.adminAuth.loginUrl }]);
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
      //console.log('AG Service: ' + this.adminAuth.authMode, requests);

      return forkJoin(requests).pipe(
        tap( (results: boolean[]) => {
          if(!results[0]) {
            this.router.navigate( ['admin', 'error', 'admin-mode-disabled'] );
          } else if(!results[1]) {
            //console.warn('redirecting to SSO: ' + (!results[1]), results[1], results);
            this.redirectOnFailure();
          } else {
            return of(true);
          }
        }),
        map( (results: boolean[]) => {
          return (results[0] && results[1]);
        }),
        catchError( (err) => {
          //console.warn('redirecting to SSO on err: ', err);
          this.redirectOnFailure();
          return of(false);
        })
      );
    }*/
  }
}
