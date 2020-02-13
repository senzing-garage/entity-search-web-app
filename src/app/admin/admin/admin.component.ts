import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzAdminService, SzBulkDataService } from '@senzing/sdk-components-ng';

@Component({
  selector: 'admin-home',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  constructor(
    public adminService: SzAdminService,
    public bulkLoaderService: SzBulkDataService,
    private titleService: Title) { }

  ngOnInit() {
    // set page title
    this.titleService.setTitle( 'Admin Area' );
  }

}
