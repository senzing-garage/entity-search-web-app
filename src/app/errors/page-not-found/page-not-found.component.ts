import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss']
})
export class PageNotFoundComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor() { }

  ngAfterViewInit() {
    document.querySelector('body').classList.add('not-found');
  }
  ngOnDestroy() {
    document.querySelector('body').classList.remove('not-found');
  }
  ngOnInit() {
  }

}
