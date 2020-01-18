import { Component, AfterViewInit } from '@angular/core';
import { AboutInfoService } from '../services/about.service';
/**
 * a component to display dependency version info
 * for diagnostics.
 *
 * @export
 * @class AboutComponent
 */
@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements AfterViewInit {
  constructor(public aboutService: AboutInfoService) {}

  ngAfterViewInit() {}
}
