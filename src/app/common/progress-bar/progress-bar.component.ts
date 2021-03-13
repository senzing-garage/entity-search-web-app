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

  constructor() {
    
  }
  ngOnInit() { }

  ngOnDestroy() {

  }

}
