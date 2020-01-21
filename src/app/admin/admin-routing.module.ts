import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from '../material.module';
import { SenzingSdkGraphModule } from '@senzing/sdk-graph-components';
import { ApiModule as SenzingDataServiceModule } from '@senzing/rest-api-client-ng';
import { OverlayModule } from '@angular/cdk/overlay';
import { LayoutModule } from '@angular/cdk/layout';
import { Routes, RouterModule } from '@angular/router';
import {
  SenzingSdkModule, SzRestConfiguration,
  SzBulkDataLoadComponent
 } from '@senzing/sdk-components-ng';
import { SzRestConfigurationFactory } from '../common/sdk-config.factory';

import { AdminComponent } from './admin/admin.component';
import { AdminDataSourcesComponent } from './datasources/datasources.component';
import { AdminDataLoaderComponent } from './load/load.component';
import { AdminOAuthTokensComponent } from './tokens/tokens.component';
import { AuthGuardService } from '../services/ag.service';
import { AdminErrorNoAdminModeComponent } from './errors/no-admin.component';
import { AdminLoginComponent } from './login/login.component';

const routes: Routes = [
    {
        path: 'admin',
        component: AdminComponent,
        children: [
          {
            path: 'tokens',
            component: AdminOAuthTokensComponent
          },
          {
              path: 'datasources',
              canActivate: [AuthGuardService],
              component: AdminDataSourcesComponent
          },
          {
              path: 'load',
              component: AdminDataLoaderComponent
          },
          {
            path: 'error/admin-mode-disabled',
            component: AdminErrorNoAdminModeComponent
          },
          {
            path: 'login',
            component: AdminLoginComponent
          }
        ]
    }
];


@NgModule({
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
