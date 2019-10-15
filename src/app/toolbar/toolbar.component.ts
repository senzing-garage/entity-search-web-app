import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';
import { EntitySearchService } from '../services/entity-search.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit, OnDestroy {
  // currently displayed entity detail id (if any)
  public currentlySelectedEntityId: number = undefined;

  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  @Output() showSection: EventEmitter<string> = new EventEmitter<string>();

  @Input() public prefsIsShowing =  false;

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
    });
  }
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /** whether or not to show menu options specific to detail view */
  public get showEntityOptions() {
    return (this.search.currentlySelectedEntityId && this.search.currentlySelectedEntityId >= 0) ? true : false;
  }

  /** whether or not to show menu options specific to detail view */
  public get showGraphOptions() {
    if (this.search.currentlySelectedEntityId && this.search.currentlySelectedEntityId >= 0 && this.uiService.graphOpen) {
      return true;
    } else {
      return false;
    }
  }
  public showPreferences() {
    this.showSection.emit('preferences');
    this.uiService.searchExpanded = true;
  }
  public showSearch() {
    this.showSection.emit('search');
    this.uiService.searchExpanded = true;
  }

  /** true if the search tray is expanded. false if not. */
  public get ribbonExpanded() {
    return this.uiService.searchExpanded;
  }
  /** sets whether or not the search box tray is expanded */
  public set ribbonExpanded(value) {
    this.uiService.searchExpanded = value;
  }

  public get entityRouteLink() {
    return '/entity/' + this.currentlySelectedEntityId;
  }

  public get graphRouteLink() {
    return '/graph/' + this.currentlySelectedEntityId;
  }

  toggleSearch(evt?) {
    this.uiService.searchExpanded = !this.uiService.searchExpanded;
    this.showSection.emit('search');
  }
  toggleSpinner() {
    this.spinner.active = !this.spinner.active;
  }

  downloadEntityPdf() {
    this.uiService.createPdfForActiveEntity( this.search.currentlySelectedEntityId );
  }

  goHome() {
    // pop search open if its closed
    this.uiService.searchExpanded = true;
  }
}
