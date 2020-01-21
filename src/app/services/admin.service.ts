import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of, from, interval } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { SzConfigurationService, SzAdminService, SzServerInfo, SzBaseResponseMeta } from '@senzing/sdk-components-ng';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {

  private _isAuthenticated: boolean = false;
  private _isAdminModeEnabled: boolean = false;
  private _pollingInterval = 60 * 1000;

  public get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }
  public get isAdminModeEnabled() {
    return this.adminService.adminEnabled;
  }

  constructor(
    private configService: SzConfigurationService,
    private adminService: SzAdminService,
  ) {
    // make initial requests
    this.checkServerInfo();
    // poll for updates
    this.pollForIsAdminEnabled().subscribe();
  }

  public isTokenAuthentic( token: string ) {
    this.adminService.getHeartbeat().subscribe(
      (resp: SzBaseResponseMeta) => {
        console.log('token verified! ', resp);
        // TODO: plug this is to a real auth endpoint to verify the tokens match
        // for now just return true
        this._isAuthenticated = true;
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
          this._isAdminModeEnabled = resp;
        })
    );
  }
  public checkServerInfo() {
    return this.adminService.getServerInfo().subscribe((resp: SzServerInfo) => {
      this._isAdminModeEnabled = resp.adminEnabled;
    });
  }
}
