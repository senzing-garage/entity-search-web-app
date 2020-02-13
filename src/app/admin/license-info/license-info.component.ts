import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzDataSourcesService, SzAdminService, SzLicenseInfo } from '@senzing/sdk-components-ng';
import { AdminAuthService } from 'src/app/services/admin.service';
import { AboutInfoService } from 'src/app/services/about.service';

@Component({
  selector: 'admin-license-info',
  templateUrl: './license-info.component.html',
  styleUrls: ['./license-info.component.scss']
})
export class AdminLicenseInfoComponent implements OnInit {
  public licenseInfo: SzLicenseInfo = {};

  constructor(
    private titleService: Title,
    private adminAuth: AdminAuthService,
    public aboutService: AboutInfoService,
    private sdkAdminService: SzAdminService
  ) { }

  ngOnInit() {
    this.titleService.setTitle( 'Debugging Info' );
    this.sdkAdminService.onLicenseInfo.subscribe( (resp: SzLicenseInfo) => {
      this.licenseInfo = resp;
    });
    this.adminAuth.onAdminModeChange.subscribe( (newVal) => {
      console.log('AdminLoginComponent.onAdminModeChange: ', newVal);
      if(this.adminAuth.isAdminModeEnabled && this.adminAuth.isAuthenticated ) {
        // redirect to home instead
      }
    });
  }
}
