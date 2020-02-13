import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzConfigurationService, SzAdminService, SzBaseResponseMeta } from '@senzing/sdk-components-ng';
import { Configuration as SzConfiguration } from '@senzing/sdk-components-ng';
@Component({
  selector: 'admin-error-no-admin',
  templateUrl: './no-admin.component.html',
  styleUrls: ['./no-admin.component.scss']
})
export class AdminErrorNoAdminModeComponent implements OnInit {

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

  ngOnInit() {
    // set page title
    this.titleService.setTitle( 'Admin Mode Disabled' );
  }

}
