import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin/admin.component';
import { AdminDataSourcesComponent } from './datasources/datasources.component';
import { AdminDataLoaderComponent } from './load/load.component';

/**
 * bulk data components. these are workaround clones.
 * @TODO remove after issue #90 is fixed
 */
import { AdminBulkDataAnalysisComponent } from './bulk-data/admin-bulk-data-analysis.component';
import { AdminBulkDataAnalysisReportComponent } from './bulk-data/admin-bulk-data-analysis-report.component';
import { AdminBulkDataAnalysisSummaryComponent } from './bulk-data/admin-bulk-data-analysis-summary.component';
import { AdminBulkDataLoadComponent } from './bulk-data/admin-bulk-data-load.component';
import { AdminBulkDataLoadReportComponent } from './bulk-data/admin-bulk-data-load-report.component';
import { AdminBulkDataLoadSummaryComponent } from './bulk-data/admin-bulk-data-load-summary.component';
import { AdminOAuthTokensComponent } from './tokens/tokens.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { OAuthInterceptor } from '../services/oAuthInterceptor';

@NgModule({
  declarations: [
    AdminComponent,
    AdminDataSourcesComponent,
    AdminDataLoaderComponent,
    AdminBulkDataAnalysisComponent,
    AdminBulkDataAnalysisReportComponent,
    AdminBulkDataAnalysisSummaryComponent,
    AdminBulkDataLoadComponent,
    AdminBulkDataLoadReportComponent,
    AdminBulkDataLoadSummaryComponent,
    AdminOAuthTokensComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    AdminRoutingModule
  ],
  providers: [
    {  provide: HTTP_INTERCEPTORS,
       useClass: OAuthInterceptor,
       multi: true
    }
  ]
})
export class AdminModule { }
