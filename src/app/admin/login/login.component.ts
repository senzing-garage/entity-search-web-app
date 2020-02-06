import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { SzDataSourcesService } from '@senzing/sdk-components-ng';
import { AdminAuthService } from 'src/app/services/admin.service';
import { Observable } from 'rxjs';
import { map, first } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'admin-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class AdminLoginComponent implements OnInit {
  public adminToken: string;
  public error: string;

  constructor(
    private titleService: Title,
    private adminAuth: AdminAuthService,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    this.titleService.setTitle( 'Login' );
    this.adminAuth.onAdminModeChange.subscribe( (newVal) => {
      console.log('AdminLoginComponent.onAdminModeChange: ', newVal);
      if(this.adminAuth.isAdminModeEnabled && this.adminAuth.isAuthenticated ) {
        // redirect to home instead
      }
    });

  }

  login(adminToken: string): Observable<boolean> {
    /**
     * in the future we might want to use the /admin/auth/jwt/login to
     * go from straight token validation to masking by looking up against secret.
     */
    return this.adminAuth.verifyJWT(adminToken);
  }

  logout() {
    this.adminAuth.logout();
    localStorage.removeItem('access_token');
  }

  public get loggedIn(): boolean {
    return (localStorage.getItem('access_token') !== null);
  }

  private stripUnsafeChars(str: string): string {
    if(str && str.replace) {
      str = str.replace(/[^a-z0-9_\.\-]+/gi, '');
    }
    return str;
  }

  public submit() {
    let safeToken = this.adminToken;
    safeToken = this.stripUnsafeChars(safeToken);

    this.adminAuth.login(safeToken)
      .subscribe(
        (token) => {
          if( token && typeof token === 'string') {
           localStorage.setItem('access_token', token);
          }
          // set local storage
          this.router.navigate(['/admin']);
        },
        err => this.error = 'Could not authenticate'
      );
  }
}
