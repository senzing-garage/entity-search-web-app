import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from './spinner.component';
import { SpinnerService } from '../../services/spinner.service';

@NgModule({
  declarations: [
    SpinnerComponent
  ],
  imports: [
    CommonModule
  ],
  providers: [
    SpinnerService
  ],
  exports: [
    SpinnerComponent
  ]
})
export class SpinnerModule { }
