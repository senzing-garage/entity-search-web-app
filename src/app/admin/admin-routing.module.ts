import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StudentComponent } from './student/student.component';
import { AdminDataSourcesComponent } from './datasources/datasources.component';
import { StudentDetailComponent } from './student-detail/student-detail.component';

const routes: Routes = [
    {
        path: 'admin',
        component: StudentComponent,
        children: [
            {
                path: 'datasources',
                component: AdminDataSourcesComponent
            },
            {
                path: 'detail',
                component: StudentDetailComponent
            }
        ]
    }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
