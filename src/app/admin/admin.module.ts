import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin/admin.component';
import { AdminDataSourcesComponent } from './datasources/datasources.component';
import { AdminDataLoaderComponent } from './load/load.component';

@NgModule({
  declarations: [
    AdminComponent,
    AdminDataSourcesComponent,
    AdminDataLoaderComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }
