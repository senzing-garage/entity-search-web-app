import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatButtonModule,
  MatCheckboxModule,
  MatToolbarModule,
  MatMenuModule,
  MatIconModule
} from '@angular/material';

@NgModule({
  declarations: [],
  imports: [ MatButtonModule, MatCheckboxModule, MatToolbarModule, MatMenuModule, MatIconModule],
  exports: [ MatButtonModule, MatCheckboxModule, MatToolbarModule, MatMenuModule, MatIconModule],
})
export class MaterialModule { }
