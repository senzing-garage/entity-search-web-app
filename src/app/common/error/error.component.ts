import { Component, OnInit, Input, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-error-page',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  public code: number;

  @Input()
  public title: string;

  @Input()
  public text: string;

  public shadeGrowVals = [
    .2,
    .8,
    3,
    .01,
    2
  ];

  constructor() {

  }
  ngOnInit() {
    // kick off animation changes
    setTimeout( this.periodicallyChangeShadeValue.bind(this, 0, 0, 1), 1000);
    setTimeout( this.periodicallyChangeShadeValue.bind(this, 1, 1, 3), 20000);
    setTimeout( this.periodicallyChangeShadeValue.bind(this, 2, 0, 3), 2000);
    setTimeout( this.periodicallyChangeShadeValue.bind(this, 3, 2, 5), 20000);
    setTimeout( this.periodicallyChangeShadeValue.bind(this, 4, 0, 5), 4000);
  }

  ngAfterViewInit() {
    document.querySelector('body').classList.add('error-' + this.code);
  }
  ngOnDestroy() {
    document.querySelector('body').classList.remove('error-' + this.code);
  }

  private genRand(min: number, max: number, decimalPlaces: number): number {
      const rand  = Math.random() * (max - min) + min;
      const power = Math.pow(10, decimalPlaces);
      return Math.floor(rand * power) / power;
  }

  private periodicallyChangeShadeValue(shadePos, min, max) {
    if ( this.shadeGrowVals[shadePos] ) {
      this.shadeGrowVals[shadePos] = this.genRand(min, max, 2); // random value between 0.01 and 20
      setTimeout( this.periodicallyChangeShadeValue.bind(this, shadePos, min, max), 5000);
    }
  }

  public getShadeStyle(shadePos): any {
    return {
      'flex-grow': this.shadeGrowVals[shadePos]
    };
  }

}
