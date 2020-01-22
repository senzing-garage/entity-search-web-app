import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzDataSourcesService } from '@senzing/sdk-components-ng';
import { AdminAuthService } from 'src/app/services/admin.service';
import { AboutInfoService } from 'src/app/services/about.service';

@Component({
  selector: 'admin-server-info',
  templateUrl: './server-info.component.html',
  styleUrls: ['./server-info.component.scss']
})
export class AdminServerInfoComponent implements OnInit {

  constructor(
    private titleService: Title,
    private adminAuth: AdminAuthService,
    public aboutService: AboutInfoService
  ) { }

  ngOnInit() {
    this.titleService.setTitle( 'Debugging Info' );
    this.adminAuth.onAdminModeChange.subscribe( (newVal) => {
      console.log('AdminLoginComponent.onAdminModeChange: ', newVal);
      if(this.adminAuth.isAdminModeEnabled && this.adminAuth.isAuthenticated ) {
        // redirect to home instead
      }
    });
  }
}
