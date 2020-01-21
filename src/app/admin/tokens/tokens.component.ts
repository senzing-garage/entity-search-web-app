import { Component, OnInit, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzConfigurationService, SzAdminService, SzBaseResponseMeta } from '@senzing/sdk-components-ng';
import { Configuration as SzConfiguration } from '@senzing/sdk-components-ng';
import { AdminAuthService } from 'src/app/services/admin.service';
@Component({
  selector: 'admin-api-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss']
})
export class AdminOAuthTokensComponent implements OnInit {

  private _hideTitle = false;
  private _hideInstructions = false;
  private _isValid = false;

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

  constructor(
    private titleService: Title,
    private configService: SzConfigurationService,
    private adminService: SzAdminService,
    private authService: AdminAuthService
    ) { }

  public set apiToken(value: string) {
    this.configService.accessToken = value;
  }

  public get apiConfiguration() {
    return this.configService.apiConfiguration;
  }
  /** when the token changes set the api config to the token */
  public onTokenValueChange(event) {
    //console.log('onTokenValueChange: ', event);
    if(event && event.srcElement && event.srcElement.value) {
      //console.log('onTokenValueChange2: ', event.srcElement.value);
      this.apiToken = event.srcElement.value;
    }
  }
  /** verify that token in config is valid against api server instance */
  public verifyToken() {
    this.authService.isTokenAuthentic( this.apiToken );
  }

  ngOnInit() {
    // set page title
    this.titleService.setTitle( 'Admin Area - OAuth Tokens' );
    if( this.configService.accessToken ) {
      // if we already have a token
      // lets check to see if it's valid
      this.verifyToken();
    }
  }

}
