import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of, from, interval, Subject } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { SzConfigurationService, SzAdminService, SzServerInfo, SzBaseResponseMeta } from '@senzing/sdk-components-ng';
/**
 * A service used to provide methods and services
 * used in the /admin interface
 */
@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
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
    private configService: SzConfigurationService,
    private adminService: SzAdminService,
  ) {
    // make initial requests
    this.checkServerInfo();
    // poll for updates
    this.pollForIsAdminEnabled().subscribe();
  }
  /** check whether a token is authentic or not */
  public isTokenAuthentic( token: string | (() => string) ) {

    this.adminService.getHeartbeat().subscribe(
      (resp: SzBaseResponseMeta) => {
        // TODO: plug this is to a real auth endpoint to verify the tokens match
        // for now just return true
        this._isAuthenticated = true;
        this.onAdminAuthenticatedChange.next( this._isAuthenticated );
        return this.isAuthenticated;
      }
    );
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
