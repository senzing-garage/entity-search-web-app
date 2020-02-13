import { Component, OnInit, Input, Inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzConfigurationService, SzAdminService, SzBaseResponseMeta, SzRestConfiguration } from '@senzing/sdk-components-ng';
import { Configuration as SzConfiguration } from '@senzing/sdk-components-ng';
import { AdminAuthService } from 'src/app/services/admin.service';
import { Router } from '@angular/router';
@Component({
  selector: 'admin-api-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss']
})
export class AdminOAuthTokensComponent implements OnInit {

  private _hideTitle = false;
  private _hideInstructions = false;
  private _isValid = false;
  private _configVerified: boolean = false;
  private _proxyVerified: boolean = false;

  @Input() public set hideTitle(value: boolean) {
    this._hideTitle = value;
  }
  public get hideTitle(): boolean {
    return this._hideTitle;
  }
  @Input() public set hideInstructions(value: boolean) {
    this._hideInstructions = value;
  }
  public get hideInstructions(): boolean {
    return this._hideInstructions;
  }
  public get tokenIsValid(): boolean {
    return this._isValid;
  }
  public get isVerifyEnabled(): boolean {
    return true;
  }
  public get isSaveEnabled(): boolean {
    return this._configVerified;
  }

  constructor(
    private titleService: Title,
    private adminService: SzAdminService,
    private authService: AdminAuthService,
    @Inject(SzRestConfiguration) public apiConfiguration: SzRestConfiguration,
    private router: Router
    ) { }

  public set apiToken(value: string | (() => string)) {
    this.apiConfiguration.accessToken = value;
  }
  public get apiToken(): string | (() => string) {
    return this.apiConfiguration.accessToken;
  }

  public verifyConfig() {
    this._configVerified = true;
  }
  public saveConfig() {

  }

  ngOnInit() {
    // set page title
    this.titleService.setTitle( 'Admin Area - OAuth Tokens' );
    if( this.apiConfiguration.accessToken ) {
      // if we already have a token
      // lets check to see if it's valid
      this.verifyToken();
    }
  }

  /** when the token changes set the api config to the token */
  public onTokenValueChange(event) {
    this.onConfigValueChange('accessToken', event);
  }
  /** verify that token in config is valid against api server instance */
  public verifyToken() {
    // make call to service to verify API token
  }

  public getUndefinedAsEmpty(value: any) {
    return value && value !== undefined ? value : '';
  }

  public onConfigValueChange(propertyKey: string, event) {
    if(event && event.srcElement && event.srcElement.value) {
      //console.log('onTokenValueChange2: ', event.srcElement.value);
      if(this.apiConfiguration) {
        try {
          this.apiConfiguration[ propertyKey ] = event.srcElement.value;
          this._configVerified = false;
        } catch(err) {
          console.warn('onConfigValueChange: Error: ', err);
        }
      }
    }
  }

}
