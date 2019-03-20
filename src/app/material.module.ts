import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatButtonModule,
  MatCheckboxModule,
  MatToolbarModule,
  MatMenuModule,
  MatIconModule,
  MatGridListModule
} from '@angular/material';

@NgModule({
  declarations: [],
  imports: [ MatButtonModule, MatCheckboxModule, MatToolbarModule, MatMenuModule, MatIconModule, MatGridListModule],
  exports: [ MatButtonModule, MatCheckboxModule, MatToolbarModule, MatMenuModule, MatIconModule, MatGridListModule],
})
export class MaterialModule { }
