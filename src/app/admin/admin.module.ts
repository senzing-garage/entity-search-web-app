import { NgModule, InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

import { MaterialModule } from '../material.module';
import { FormsModule } from '@angular/forms';
import { JwtModule, JwtConfig } from '@auth0/angular-jwt';
import { ApiModule as SenzingDataServiceModule } from '@senzing/rest-api-client-ng';
import { SenzingSdkModule } from '@senzing/sdk-components-ng';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin/admin.component';
import { AdminDataSourcesComponent, NewDataSourceDialogComponent } from './datasources/datasources.component';
//import { AdminEntityTypesComponent } from './entity-types/entity-types.component';
import { AdminDataLoaderComponent } from './load/load.component';
import { AdminOAuthTokensComponent } from './tokens/tokens.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { OAuthInterceptor } from '../services/oAuthInterceptor';
import { AdminErrorNoAdminModeComponent } from './errors/no-admin.component';
import { AdminLoginComponent } from './login/login.component';
import { AdminServerInfoComponent } from './server-info/server-info.component';
import { AdminLicenseInfoComponent } from './license-info/license-info.component';
import { WebSocketService } from '../services/websocket.service';
import { XtermComponent } from './xterm/xterm.component';

/**
 * bulk data components. these are workaround clones.
 * @TODO remove after issue #90 is fixed
 */
import { AdminBulkDataAnalysisComponent } from './bulk-data/admin-bulk-data-analysis.component';
import { AdminBulkDataAnalysisReportComponent } from './bulk-data/admin-bulk-data-analysis-report.component';
import { AdminBulkDataStreamAnalysisReportComponent } from './bulk-data/admin-bulk-data-stream-analysis-report.component';
import { AdminBulkDataAnalysisSummaryComponent } from './bulk-data/admin-bulk-data-analysis-summary.component';
import { AdminBulkDataLoadComponent } from './bulk-data/admin-bulk-data-load.component';
import { AdminBulkDataLoadReportComponent } from './bulk-data/admin-bulk-data-load-report.component';
import { AdminBulkDataStreamLoadReportComponent } from './bulk-data/admin-bulk-data-stream-load-report.component';
import { AdminBulkDataLoadSummaryComponent } from './bulk-data/admin-bulk-data-load-summary.component';
import { SzProgressBarComponent } from '../common/progress-bar/progress-bar.component';
import { AppFileDragAndDrop as AdminFileDragAndDrop } from '../common/file-drag-and-drop/file-drag-and-drop.directive';
import { AdminConsoleComponent } from './admin-console/admin-console.component';

// ...
export function tokenGetter() {
  return localStorage.getItem('access_token');
}
import { SzRestConfigurationFactory } from '../common/sdk-config.factory';
import { SzWebAppConfigService } from '../services/config.service';

@NgModule({ declarations: [
        AdminComponent,
        AdminConsoleComponent,
        AdminDataSourcesComponent,
        /*AdminEntityTypesComponent,*/
        AdminDataLoaderComponent,
        AdminBulkDataAnalysisComponent,
        AdminBulkDataAnalysisReportComponent,
        AdminBulkDataAnalysisSummaryComponent,
        AdminBulkDataLoadComponent,
        AdminBulkDataLoadReportComponent,
        AdminBulkDataLoadSummaryComponent,
        AdminBulkDataStreamAnalysisReportComponent,
        AdminBulkDataStreamLoadReportComponent,
        AdminFileDragAndDrop,
        AdminOAuthTokensComponent,
        AdminErrorNoAdminModeComponent,
        AdminLicenseInfoComponent,
        AdminLoginComponent,
        AdminServerInfoComponent,
        NewDataSourceDialogComponent,
        SzProgressBarComponent,
        XtermComponent
    ], imports: [AdminRoutingModule,
        CommonModule,
        FormsModule,
        JwtModule.forRoot({
            config: {
                tokenGetter: tokenGetter,
                allowedDomains: ['localhost:8000'],
                disallowedRoutes: ['localhost:8000/authsdfsdf']
            }
        }),
        MaterialModule,
        SenzingSdkModule.forRoot(SzRestConfigurationFactory),
        SenzingDataServiceModule.forRoot(SzRestConfigurationFactory)], providers: [
        { provide: HTTP_INTERCEPTORS,
            useClass: OAuthInterceptor,
            multi: true
        },
        SzWebAppConfigService,
        WebSocketService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AdminModule { }
