/** core angular, material, and senzing modules */
import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule, InjectionToken } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { SenzingSdkModule, SzRestConfiguration } from '@senzing/sdk-components-ng';
import { ApiModule as SenzingDataServiceModule } from '@senzing/rest-api-client-ng';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService } from '../../e2e/data/services/in-memory-data.service';
import { OverlayModule } from '@angular/cdk/overlay';
import { LayoutModule } from '@angular/cdk/layout';
import { PlatformModule } from '@angular/cdk/platform';
import { DragDropModule } from '@angular/cdk/drag-drop';

// local components and modules
import { AppRoutingModule } from './app-routing.module';
// import { AdminModule } from './admin/admin.module';
import { AdminModule } from './admin/admin.module';

import { SpinnerModule } from './common/spinner/spinner.module';
import { EntitySearchService } from './services/entity-search.service';
import { AboutInfoService } from './services/about.service';
// components
//import { AdminComponent } from './admin/admin.component';
//import { AdminDataSourcesComponent } from './admin/datasources.component';
import { AppComponent } from './app.component';
import { AlertDialogComponent } from './common/alert-dialog/alert-dialog.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { DetailComponent } from './detail/detail.component';
import { GraphComponent } from './graph/graph.component';
import { SearchRecordComponent } from './record/record.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { UiService } from './services/ui.service';
import { PrefsManagerService } from './services/prefs-manager.service';
import { TipsComponent } from './common/tips/tips.component';
import { BlankComponent } from './common/blank/blank.component';
import { NoDecorationComponent } from './common/no-decoration/no-decoration.component';
import { NoResultsComponent } from './errors/no-results/no-results.component';
import { AboutComponent } from './about/about.component';

// admin dialog components that "FREAK-OUT" for no good reason
import { AdminStreamLoadQueueInfoComponent } from './common/stream-load-queue-dialog/stream-load-queue-info.component';
import { AdminStreamLoadQueueDialogComponent } from './common/stream-load-queue-dialog/stream-load-queue-dialog.component';
import { AdminStreamConnDialogComponent } from './common/stream-conn-dialog/stream-conn-dialog.component';
import { AdminStreamAbortDialogComponent } from './common/stream-abort-dialog/stream-abort-dialog.component';
import { AdminStreamLoadErrorsDialogComponent } from './common/stream-load-errors-dialog/stream-load-errors-dialog.component';
import { AdminStreamLoadCollapseableErrorComponent } from './common/stream-load-errors-dialog/stream-load-error-collapseable.component';

// services
import { SzXtermSocket } from './services/xterm.socket.service';

// errors
import { PageNotFoundComponent } from './errors/page-not-found/page-not-found.component';
import { GatewayTimeoutErrorComponent } from './errors/timeout/timeout.component';
import { ServerErrorComponent } from './errors/server/server.component';
import { UnknownErrorComponent } from './errors/uknown/uknown.component';
import { ErrorPageComponent } from './common/error/error.component';

// config factory for sdk(s)
/**
* Pull in api configuration(SzRestConfigurationParameters)
* from: environments/environment
*
* @example
* ng build -c production
* ng serve -c docker
*/
import { apiConfig, environment } from './../environments/environment';
import { SzRestConfigurationFactory } from './common/sdk-config.factory';
//import { AuthConfigFactory } from './common/auth-config.factory';
import { AuthGuardService } from './services/ag.service';
import { AdminAuthService } from './services/admin.service';
import { SzWebAppConfigService } from './services/config.service';
import { AdminBulkDataService } from './services/admin.bulk-data.service';

@NgModule({
  declarations: [
    AlertDialogComponent,
    AppComponent,
    SearchResultsComponent,
    SearchRecordComponent,
    DetailComponent,
    GraphComponent,
    ToolbarComponent,
    ErrorPageComponent,
    PageNotFoundComponent,
    NoDecorationComponent,
    NoResultsComponent,
    GatewayTimeoutErrorComponent,
    ServerErrorComponent,
    UnknownErrorComponent,
    BlankComponent,
    TipsComponent,
    AboutComponent,
    AdminStreamConnDialogComponent,
    AdminStreamAbortDialogComponent,
    AdminStreamLoadCollapseableErrorComponent,
    AdminStreamLoadErrorsDialogComponent,
    AdminStreamLoadQueueDialogComponent,
    AdminStreamLoadQueueInfoComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    OverlayModule,
    MaterialModule,
    DragDropModule,
    PlatformModule,
    AdminModule,
    AppRoutingModule,
    LayoutModule,
    SenzingSdkModule.forRoot( SzRestConfigurationFactory ),
    SenzingDataServiceModule.forRoot( SzRestConfigurationFactory ),
    SpinnerModule,
    environment.test ? HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, { delay: 100 }) : []
  ],
  entryComponents: [ AlertDialogComponent, AdminStreamConnDialogComponent, AdminStreamAbortDialogComponent, AdminStreamLoadErrorsDialogComponent, AdminStreamLoadQueueDialogComponent, AdminStreamLoadQueueInfoComponent ],
  providers: [
    SzWebAppConfigService,
    EntitySearchService,
    AdminAuthService,
    AuthGuardService,
    UiService,
    PrefsManagerService,
    AboutInfoService,
    AdminBulkDataService,
    Title,
    SzXtermSocket
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
