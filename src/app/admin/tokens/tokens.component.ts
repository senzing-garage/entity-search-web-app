import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzConfigurationService, SzAdminService, SzBaseResponseMeta } from '@senzing/sdk-components-ng';
import { Configuration as SzConfiguration } from '@senzing/sdk-components-ng';
@Component({
  selector: 'admin-api-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss']
})
export class AdminOAuthTokensComponent implements OnInit {

  constructor(
    private titleService: Title,
    private configService: SzConfigurationService,
    private adminService: SzAdminService
    ) { }

  public set apiToken(value: string) {
    this.configService.accessToken = value;
  }

  public get apiConfiguration() {
    return this.configService.apiConfiguration;
  }

  public onTokenValueChange(event) {
    console.log('onTokenValueChange: ', event);
    if(event && event.srcElement && event.srcElement.value) {
      console.log('onTokenValueChange2: ', event.srcElement.value);
      this.apiToken = event.srcElement.value;
    }
  }

  public verifyToken() {
    console.log('make api call to check against api endpoint /tokens/valid stub ', this.configService.apiConfiguration);
    this.adminService.getHeartbeat().subscribe(
      (resp: SzBaseResponseMeta) => {
        console.log('token verified! ', resp);
      }
    );
  }

  ngOnInit() {
    // set page title
    this.titleService.setTitle( 'Admin Area - OAuth Tokens' );
  }

}
