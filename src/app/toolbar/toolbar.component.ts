import { Component, OnInit } from '@angular/core';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  constructor(private spinner: SpinnerService, private uiService: UiService) { }

  ngOnInit() {}

  public get ribbonExpanded() {
    return this.uiService.searchExpanded;
  }
  public set ribbonExpanded(value) {
    this.uiService.searchExpanded = value;
  }

  toggleSearch() {
    this.uiService.searchExpanded = !this.uiService.searchExpanded;
  }
  toggleSpinner() {
    this.spinner.active = !this.spinner.active;
  }

  goHome() {
    // pop search open if its closed
    this.uiService.searchExpanded = true;
  }

  openEntity() {
    console.log('grab current entity id');
  }

}
