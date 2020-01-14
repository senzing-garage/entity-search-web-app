import { Component } from '@angular/core';
import { AboutInfoService } from '../services/about.service';
import { SzAdminService, SzBulkDataService } from '@senzing/sdk-components-ng';

/**
 * a component to allow administrator functions.
 * Provides an interface to load and create datasources.
 *
 * @export
 * @class AdminComponent
 */
@Component({
  selector: 'app-admin-datasources',
  templateUrl: './datasources.component.html',
  styleUrls: ['./datasources.component.scss']
})
export class AdminDataSourcesComponent {
  constructor(
    public adminService: SzAdminService,
    public bulkLoaderService: SzBulkDataService) {

  }
}
