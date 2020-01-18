import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatInputModule,
  MatBadgeModule,
  MatButtonModule,
  MatCheckboxModule,
  MatToolbarModule,
  MatTooltipModule,
  MatMenuModule,
  MatIconModule,
  MatGridListModule,
  MatTableModule,
  MatSortModule,
  MatPaginatorModule
} from '@angular/material';
import { MatSidenavModule } from '@angular/material/sidenav';

@NgModule({
  declarations: [],
  imports: [ MatBadgeModule, MatInputModule, MatTableModule, MatPaginatorModule, MatSortModule, MatSidenavModule, MatButtonModule, MatCheckboxModule, MatToolbarModule, MatTooltipModule, MatMenuModule, MatIconModule, MatGridListModule],
  exports: [ MatBadgeModule, MatInputModule, MatTableModule, MatPaginatorModule, MatSortModule, MatSidenavModule, MatButtonModule, MatCheckboxModule, MatToolbarModule, MatTooltipModule, MatMenuModule, MatIconModule, MatGridListModule],
})
export class MaterialModule { }
