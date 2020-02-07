import { Injectable, Inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of, from, interval, Subject } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { SzConfigurationService, SzAdminService, SzServerInfo, SzBaseResponseMeta } from '@senzing/sdk-components-ng';
import { HttpClient } from '@angular/common/http';

/**
 * A service used to provide methods and services
 * used in the /admin interface
 */
@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  /** options are 'JWT' | 'EXTERNAL' | false */
  public authMode: string | boolean = 'SSO';
  public redirectOnFailure = false;
  public authCheckUrl = '/admin/auth/sso/success';
  public loginUrl = 'http://localhost:8000/sso/auth/login';

  /** whether or not a user is granted admin rights */
  private _isAuthenticated: boolean = true;
  /** interval that the service queries for session authentication check */
  private _pollingInterval = 120 * 1000;
  /** whether or not a user is granted admin rights */
  public get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }
  /**
   * is rest server in admin mode
   */
  public get isAdminModeEnabled() {
    return this.adminService.adminEnabled;
  }
  /**
   * when the state of the rest server "enableAdmin" flag is changed.
   */
  public onAdminModeChange: Subject<boolean> =  new Subject<boolean>();
  /**
   * when the authenticated status of the current user has changed
   */
  public onAdminAuthenticatedChange: Subject<boolean> =  new Subject<boolean>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: SzConfigurationService,
    private adminService: SzAdminService,
    @Inject('authConfigProvider') private authConfig
  ) {
    console.warn('AUTH config! ', authConfig);
    // make initial requests
    this.checkServerInfo();
    // poll for updates
    this.pollForIsAdminEnabled().subscribe();
  }

  getIsAuthorized(adminToken?: string) {
    if(!this.authMode) {
      // auth check disabled
      return of(true);
    }
    if(this.authMode === 'JWT' || this.authMode === 'BUILT-IN') {
      if(!adminToken) {
        return of(false);
      }
      return this.verifyJWT(adminToken);
    }
    if(this.authMode === 'EXTERNAL' || this.authMode === 'SSO') {
      if(!this.authCheckUrl) {
        return of(false);
      }
      return this.verifyExternalAuthByCode();
    }
  }

  /** verify that an external resource(ie: SSO or proxy path) returns a non-401 or 403 code */
  verifyExternalAuthByCode(): Observable<boolean> {
    return this.http.get<any>(this.authCheckUrl)
      .pipe(
        map( (resp) => {
          return true;
        })
      );
  }

  /** verify a provided JWT token against service */
  verifyJWT(adminToken: string): Observable<boolean> {
    /**
     * in the future we might want to use the /admin/auth/jwt/login to
     * go from straight token validation to masking by looking up against secret.
     */
    if(!adminToken || adminToken === undefined) {
      //throw new Error('no token');
      return  of(false);
    }
    return this.http.get<{adminToken: string | undefined}>(this.authCheckUrl, {
      params: {adminToken: adminToken}})
      .pipe(
        map(result => {
          //console.info('AdminAuthService.login: ', result.adminToken);
          return (result.adminToken ? true : false);
        })
      );
  }
  /** log a user in with a provided admin token */
  login(adminToken: string): Observable<string | boolean | undefined> {
    /**
     * in the future we might want to use the /admin/auth/jwt/login to
     * go from straight token validation to masking by looking up against secret.
     */
    const res = new Subject<string | boolean>();
    this.verifyJWT(adminToken).subscribe((isValid: boolean) => {
      res.next(adminToken);
    }, (err) => {
      res.next(false);
    });
    return res.asObservable();
  }
  /** clears the JWT token set in local storage */
  logout() {
    localStorage.removeItem('access_token');
  }

  /** poll for server info */
  public pollForIsAdminEnabled(): Observable<boolean> {
    return interval(this._pollingInterval).pipe(
        switchMap(() => from( this.adminService.getServerInfo() )),
        map( (resp: SzServerInfo) => resp.adminEnabled ),
        tap( (resp: boolean) => {
          const _isChanged = (this.adminService.adminEnabled !== resp);
          this.adminService.adminEnabled = resp;
          //console.info('AdminAuthService.pollForIsAdminEnabled: ', this.isAdminModeEnabled);
          if( _isChanged ) { this.onAdminModeChange.next( this.adminService.adminEnabled ); }
        })
    );
  }
  /** reach out to rest server to check whether or not the "adminEnabled" flag is set to true */
  public checkServerInfo(): Observable<boolean> {
    return this.adminService.getServerInfo().pipe(
      map( (resp: SzServerInfo) => resp.adminEnabled ),
      tap( (resp: boolean) => {
        const _isChanged = (this.adminService.adminEnabled !== resp);
        this.adminService.adminEnabled = resp;
        //console.info('AdminAuthService.pollForIsAdminEnabled: ', this.isAdminModeEnabled);
        if( _isChanged ) { this.onAdminModeChange.next( this.adminService.adminEnabled ); }
      })
    );
  }
}
