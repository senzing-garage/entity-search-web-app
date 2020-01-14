import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { StudentComponent } from './student/student.component';
import { AdminDataSourcesComponent } from './datasources/datasources.component';
import { StudentDetailComponent } from './student-detail/student-detail.component';

@NgModule({
  declarations: [StudentComponent, AdminDataSourcesComponent, StudentDetailComponent],
  imports: [
    CommonModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }
