import { Component, Input, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'sz-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss']
})
export class SzProgressBarComponent implements OnInit, OnDestroy {
  private _mode = 'indeterminate';
  private _value = 0;
  private _text;

  public get mode(): string {
    return this._mode;
  }

  @Input() public set mode(value: string) {
    this._mode = value;
  }
  public get value(): number {
    return this._value;
  }

  @Input() public set value(value: number) {
    this._value = value;
  }

  public get barWidth(): string {
      return (this.value+'%');
  }

  @Input() public set text(value: string) {
    this._text = value;
  }

  public get text(): string {
      return this._text;
  }

  public get percent(): string {
    return (this.value+'%') + (this.value < 10 ? '&nbsp;':'');
  }

  public get percRightAdjust(): string {
    let retValue = (this.value < 6 ? (this.value < 2 ? "-20px" : "-40px") : "-55px");
    return retValue;
  }

  public get isComplete(): boolean {
    return this._value >= 100 ?  true : false; // enforce
  }

  constructor() {
    
  }
  ngOnInit() { }

  ngOnDestroy() {

  }

}
