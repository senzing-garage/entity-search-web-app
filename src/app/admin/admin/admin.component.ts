import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzAdminService, SzBulkDataService } from '@senzing/sdk-components-ng';
import { SzWebAppConfigService } from '../../services/config.service';

@Component({
  selector: 'admin-home',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  /** whether or not the eda tools console is enabled */
  public get consoleEnabled(): boolean {
    return this.configService.isConsoleEnabled;
  }

  constructor(
    public adminService: SzAdminService,
    public bulkLoaderService: SzBulkDataService,
    private configService: SzWebAppConfigService,
    private titleService: Title) { }

  ngOnInit() {
    // set page title
    this.titleService.setTitle( 'Admin Area' );
  }

}
