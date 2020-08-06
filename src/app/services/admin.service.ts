import { Injectable, Inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of, from, interval, Subject } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { SzConfigurationService, SzAdminService, SzServerInfo, SzBaseResponseMeta } from '@senzing/sdk-components-ng';
import { HttpClient } from '@angular/common/http';
import { AuthConfig, SzWebAppConfigService } from './config.service';

/**
 * A service used to provide methods and services
 * used in the /admin interface
 */
@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  /** options are 'JWT' | 'EXTERNAL' | false */
  public get authMode(): string | boolean {
    return (this._authConfig && this._authConfig.admin && this._authConfig.admin.mode !== undefined) ? this._authConfig.admin.mode : 'SSO';
  }
  public get redirectOnFailure(): boolean {
    return (this._authConfig && this._authConfig.admin && this._authConfig.admin.redirectOnFailure !== undefined) ? this._authConfig.admin.redirectOnFailure : true;
  }
  public get authCheckUrl(): string {
    return this._authConfig && this._authConfig.admin && this._authConfig.admin.checkUrl ? this._authConfig.admin.checkUrl : '/admin/auth/sso/status';
  }
  public get loginUrl(): string {
    return this._authConfig && this._authConfig.admin && this._authConfig.admin.loginUrl ? this._authConfig.admin.loginUrl : 'http://localhost:8000/sso/auth/login';
  }
  private _authConfig: AuthConfig;
  private _configLoadedFromResource = false;

  public get authConfig(): AuthConfig | undefined {
    return this._authConfig;
  }

  public get authConfigLoaded(): boolean {
    return (this._authConfig && this._authConfig !== undefined) ? true : false;
  }

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
  /**
   * when the config file is updated
   */
  private _onAuthConfigLoaded: Subject<AuthConfig> =  new Subject<AuthConfig>();
  public onAuthConfigLoaded = this._onAuthConfigLoaded.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: SzConfigurationService,
    private adminService: SzAdminService,
    private webappConfigService: SzWebAppConfigService
  ) {
    //console.warn('AUTH config! ', authConfig);
    this._authConfig = this.webappConfigService.authConfig;
    this.webappConfigService.onAuthConfigChange.subscribe((authConf: AuthConfig) => {
      this._authConfig = authConf;
      this._onAuthConfigLoaded.next(authConf);
    });

    // make initial requests
    this.checkServerInfo();
    this.updateAuthConfig().subscribe((aConf) => {
      if(aConf) {
        this._configLoadedFromResource = true;
        this._authConfig = aConf;
        this._onAuthConfigLoaded.next(aConf);
        //console.log('got initial auth config! ', this._authConfig);
      }
    });
    // poll for updates
    this.pollForIsAdminEnabled().subscribe();
    this.pollForAuthConfigUpdates().subscribe();
  }

  updateAuthConfig(): Observable<AuthConfig> {
    return this.webappConfigService.getRuntimeAuthConfig();
    //return this.http.get<AuthConfig>('/config/auth');
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
        console.warn('NO AUTH CHECK URL for SSO! ', this.authCheckUrl);
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
  /** poll for auth config changes */
  public pollForAuthConfigUpdates(): Observable<AuthConfig> {
    return interval(this._pollingInterval).pipe(
        switchMap(() => from( this.updateAuthConfig() )),
        tap((aConf) => {
          if(aConf) {
            this._authConfig = aConf;
            this._onAuthConfigLoaded.next(aConf);
          }
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
