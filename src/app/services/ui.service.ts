import { Injectable } from '@angular/core';
import { SpinnerService } from './spinner.service';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private _searchExpanded = true;

  public get searchExpanded(): boolean {
    return this._searchExpanded;
  }
  public set searchExpanded(value) {
    this._searchExpanded = value;
  }

  public get spinnerActive(): boolean {
    return this.spinner.active;
  }
  public set spinnerActive(value) {
    // use soft sets
    if (value) {
      this.spinner.show();
    } else {
      this.spinner.hide();
    }
  }

  constructor(private spinner: SpinnerService) {

  }
}
