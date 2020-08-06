import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { map, catchError, tap, concatMap } from 'rxjs/operators';
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
    private adminAuth: AdminAuthService,
    private router: Router
  ) { }

  /** when an authcheck step fails, take them back to kansas */
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

  /** check whether or not a url is an external or local dest */
  isUrlExternal(url: string) {
    return (url && url.indexOf && url.indexOf('http') === 0);
  }

  /** route guard check to see if user can access a route */
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    // subject to emit once the auth config is available
    const onConfigLoaded = new Subject<AuthConfig>();

    // the result Subject/Observeable returned to method
    const _canActivateResult: Subject<boolean> = new Subject();
    const canActivateResult = _canActivateResult.asObservable();

    // map of responses from various steps in the auth sequence.
    // originally this was an array, but it's easier this way.
    const responseMap: {
      config?: AuthConfig,
      jwt?: boolean,
      sso?: boolean,
      noAuth?: boolean,
      adminEnabled?: boolean,
      error?: any
    } = {};

    // authStream is the event chain for the actual
    // authorization sequence. triggered only on result from
    // the "onConfigLoaded" subject so that's kicked off last but
    // before canActivateResult Observeable handle is returned.
    const authStream = onConfigLoaded.pipe(
      tap( (res: AuthConfig) => {
        responseMap.config = res;
      }),
      concatMap( (authConf: AuthConfig) => {
        let retReq: Observable<boolean>;
        if (!(authConf.admin && authConf.admin.mode)) {
          // no auth check. WWWWHHHHYYYY!!!
          // hope you know what you're doing
          console.warn('NO AUTH CHECK!!! EXTREMELY DANGEROUS!');
          responseMap.noAuth = true;
          retReq = of(true);
          return of(true);
        } else {
          if(authConf.admin.mode === 'JWT' || authConf.admin.mode === 'BUILT-IN') {
            // extra check for access token
            const encodedToken = localStorage.getItem('access_token');
            if ( !encodedToken || encodedToken === undefined || encodedToken === 'undefined' ) {
              // no token, redirect to login page
              if( this.isUrlExternal(authConf.admin.loginUrl) ) {
                this.router.navigate(['/admin/externalRedirect', { externalUrl: this.adminAuth.loginUrl }]);
              } else {
                this.router.navigateByUrl( authConf.admin.loginUrl );
              }
              retReq = of(false);
            } else {
              // add token auth check to requests
              const jwtReq = this.adminAuth.verifyJWT(encodedToken).pipe(
                tap( (resi) => {
                  responseMap.jwt = resi;
                }),
                catchError( (err) => {
                  responseMap.jwt = false;
                  responseMap.error = err;
                  return of(false);
                })
              );
              retReq = jwtReq;
            }
          } else if(authConf.admin.mode === 'EXTERNAL' || authConf.admin.mode === 'SSO') {
            // SSO or EXTERNAL auth check
            retReq = this.adminAuth.getIsAuthorized().pipe(
                tap((resi: boolean) => {
                  responseMap.sso = resi;
                }),
                catchError( (err) => {
                  responseMap.sso = false;
                  responseMap.error = err;
                  return of(false);
                })
              );
          } else {
            console.warn('fallthrough: ', (authConf.admin.mode === 'JWT' || authConf.admin.mode === 'BUILT-IN'));
          }
        }
        return (retReq) ? retReq : of(true);
      }),
      concatMap( (res: boolean) => {
        if (!(responseMap.config.admin && responseMap.config.admin.mode)) {
          // no auth check. WWWWHHHHYYYY!!!
          // hope you know what you're doing
          console.warn('NO AUTH CHECK!!! EXTREMELY DANGEROUS!');
          responseMap.noAuth = true;
          return of(true);
        } else {
          return this.adminAuth.checkServerInfo().pipe(
            tap((resi: boolean) => {
              //console.warn('has admin enabled? ', resi);
              responseMap.adminEnabled = resi;
              //responses.push(resi);
            })
          );
        }
      }),
      tap( (results: boolean) => {
        //console.warn('!!RESULT!! ', responseMap, results);
        if(!responseMap.adminEnabled) {
          this.router.navigate( ['admin', 'error', 'admin-mode-disabled'] );
        } else if(!responseMap.noAuth && !responseMap.sso && !responseMap.jwt) {
          console.warn('redirecting to login: ', responseMap);
          this.redirectOnFailure();
        } else {
          return of(true);
        }
      }),
      map( (results: boolean) => {
        let retCanActivate = false;
        if(responseMap.noAuth || responseMap.sso || responseMap.jwt) {
          retCanActivate = true;
        }
        return retCanActivate;
      })
    );

    // we subscribe to the authStream then trigger the
    // actual return observable of canActivateResult on result
    authStream.subscribe(
      (canActivate: boolean) => {
        //console.warn('AuthGuardService.canActivate Complete: ', canActivate);
        _canActivateResult.next(canActivate);
      }
    );
    // kick off the authStream by emitting on "onConfigLoaded" either
    // immediately(we already have authConfig) or after authConfig is retrieved.
    if( this.adminAuth.authConfigLoaded ) {
      onConfigLoaded.next( this.adminAuth.authConfig );
    } else {
      this.adminAuth.onAuthConfigLoaded.subscribe((res: AuthConfig) => {
        onConfigLoaded.next( res );
      });
    }

    // return the observeable for "_canActivateResult" before
    // the requests from "authStream" are even created..
    // yeah. I know, little bit Marty McFly
    return canActivateResult;
  }
}
