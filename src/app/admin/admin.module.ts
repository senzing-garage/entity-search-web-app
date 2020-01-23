import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import { FormsModule } from '@angular/forms';
import { JwtModule } from '@auth0/angular-jwt';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin/admin.component';
import { AdminDataSourcesComponent } from './datasources/datasources.component';
import { AdminDataLoaderComponent } from './load/load.component';
import { AdminOAuthTokensComponent } from './tokens/tokens.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { OAuthInterceptor } from '../services/oAuthInterceptor';
import { AdminErrorNoAdminModeComponent } from './errors/no-admin.component';
import { AdminLoginComponent } from './login/login.component';
import { AdminServerInfoComponent } from './server-info/server-info.component';
import { AdminLicenseInfoComponent } from './license-info/license-info.component';

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

// ...
export function tokenGetter() {
  return localStorage.getItem('access_token');
}
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
    AdminOAuthTokensComponent,
    AdminErrorNoAdminModeComponent,
    AdminLicenseInfoComponent,
    AdminLoginComponent,
    AdminServerInfoComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    AdminRoutingModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        whitelistedDomains: ['localhost:8000'],
        blacklistedRoutes: ['localhost:8000/authsdfsdf']
      }
    })
  ],
  providers: [
    {  provide: HTTP_INTERCEPTORS,
       useClass: OAuthInterceptor,
       multi: true
    }
  ]
})
export class AdminModule { }
