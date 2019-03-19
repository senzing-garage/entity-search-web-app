import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private _active = false;
  public spinnerObservable = new Subject<boolean>();

  // hard logic (equivalent of state force)
  public get active(): boolean {
    return this._active;
  }
  public set active(value: boolean) {
    this._active = value;
  }

  // soft logic (obeys minTime and maxTime)
  public show() {
    this.spinnerObservable.next( true );
  }
  public hide() {
    this.spinnerObservable.next( false );
  }

  constructor() {
    this.spinnerObservable.asObservable().subscribe(
      (state) => this._active = state
    );
  }
}
