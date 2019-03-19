import { Component, OnInit } from '@angular/core';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';
import { EntitySearchService } from '../services/entity-search.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {
  // currently displayed entity detail id (if any)
  public currentlySelectedEntityId: number = undefined;

  constructor(
    private spinner: SpinnerService,
    private uiService: UiService,
    private router: Router,
    private search: EntitySearchService) { }

  ngOnInit() {
    this.search.entityIdChange.subscribe(
      (entityId) => {
        this.currentlySelectedEntityId = entityId;
        console.log('ToolbarComponent.onEntityIdChange: ', entityId);
      }
      );
  }
  /** whether or not to show menu options specific to detail view */
  public get showEntityOptions() {
    return (this.search.currentlySelectedEntityId && this.search.currentlySelectedEntityId >= 0) ? true : false;
  }
  /** true if the search tray is expanded. false if not. */
  public get ribbonExpanded() {
    return this.uiService.searchExpanded;
  }
  /** sets whether or not the search box tray is expanded */
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
}
