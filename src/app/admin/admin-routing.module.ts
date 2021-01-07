import { NgModule, InjectionToken } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from '../material.module';
import { SenzingSdkGraphModule } from '@senzing/sdk-graph-components';
import { ApiModule as SenzingDataServiceModule } from '@senzing/rest-api-client-ng';
import { OverlayModule } from '@angular/cdk/overlay';
import { LayoutModule } from '@angular/cdk/layout';
import { Routes, RouterModule, ActivatedRouteSnapshot } from '@angular/router';
import {
  SenzingSdkModule
 } from '@senzing/sdk-components-ng';
import { SzRestConfigurationFactory } from '../common/sdk-config.factory';
//import { AuthConfigFactory } from '../common/auth-config.factory';
import { SzWebAppConfigService } from '../services/config.service';

import { AdminComponent } from './admin/admin.component';
import { AdminDataSourcesComponent } from './datasources/datasources.component';
import { AdminDataLoaderComponent } from './load/load.component';
import { AdminOAuthTokensComponent } from './tokens/tokens.component';
import { AuthGuardService } from '../services/ag.service';
import { AdminErrorNoAdminModeComponent } from './errors/no-admin.component';
import { AdminServerInfoComponent } from './server-info/server-info.component';
import { AdminLicenseInfoComponent } from './license-info/license-info.component';
import { AdminLoginComponent } from './login/login.component';

/** injection token for external redirects */
const externalUrlProvider = new InjectionToken('externalUrlRedirectResolver');

const routes: Routes = [
    {
        path: 'admin',
        component: AdminComponent,
        children: [
          {
            path: 'tokens',
            canActivate: [AuthGuardService],
            component: AdminOAuthTokensComponent
          },
          {
              path: 'datasources',
              canActivate: [AuthGuardService],
              component: AdminDataSourcesComponent
          },
          {
              path: 'load',
              canActivate: [AuthGuardService],
              component: AdminDataLoaderComponent
          },
          {
            path: 'login',
            component: AdminLoginComponent
          },
          {
            path: 'server/info',
            component: AdminServerInfoComponent
          },
          {
            path: 'license/info',
            canActivate: [AuthGuardService],
            component: AdminLicenseInfoComponent
          },
          {
            path: 'error/admin-mode-disabled',
            component: AdminErrorNoAdminModeComponent
          },
          {
            path: 'externalRedirect',
            resolve: {
                url: externalUrlProvider,
            },
            // We need a component here because we cannot define the route otherwise
            component: AdminLoginComponent,
          },
          { path: '', redirectTo: 'datasources', pathMatch: 'full' }
        ]
    }
];

@NgModule({
  providers: [
    {
      provide: externalUrlProvider,
      useValue: (route: ActivatedRouteSnapshot) => {
          const externalUrl = route.paramMap.get('externalUrl');
          window.open(externalUrl, '_self');
      },
    },
    SzWebAppConfigService
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    OverlayModule,
    MaterialModule,
    LayoutModule,
    SenzingSdkModule.forRoot( SzRestConfigurationFactory ),
    SenzingSdkGraphModule.forRoot( SzRestConfigurationFactory ),
    SenzingDataServiceModule.forRoot( SzRestConfigurationFactory ),
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
