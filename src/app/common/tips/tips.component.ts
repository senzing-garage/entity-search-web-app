import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tips',
  templateUrl: './tips.component.html',
  styleUrls: ['./tips.component.scss']
})
export class TipsComponent implements OnInit {
  private imageDir = 'assets/getting-started/';
  public MENU_OPEN_IN_NEW: string;

  constructor() { }

  ngOnInit() {
    this.MENU_OPEN_IN_NEW = this.imageDir + 'open-in-new-window.png';
  }

}
