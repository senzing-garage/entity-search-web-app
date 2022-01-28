import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';
import { EntitySearchService } from '../services/entity-search.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { Overlay, CdkOverlayOrigin, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { AboutComponent } from '../about/about.component';
import { SzAttributeSearchResult } from '@senzing/sdk-components-ng';
import { AboutInfoService } from '../services/about.service';
import { SzWebAppConfigService } from '../services/config.service';

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
  private aboutInfoIsShowing = false;
  private overlayRef: OverlayRef;

  @ViewChild(CdkOverlayOrigin) _overlayOrigin: CdkOverlayOrigin;
  @ViewChild('poweredByOrigin') poweredByOrigin: CdkOverlayOrigin;

  constructor(
    public aboutService: AboutInfoService,
    public overlay: Overlay,
    private router: Router,
    private search: EntitySearchService,
    private configService: SzWebAppConfigService,
    private spinner: SpinnerService,
    private titleService: Title,
    public uiService: UiService
  ) { }

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

  /** whether or not the eda tools console is enabled */
  public get consoleEnabled(): boolean {
    return this.configService.isConsoleEnabled;
  }

  /** whether or not to show menu options specific to detail view */
  public get showGraphOptions() {
    if (this.uiService.graphOpen) {
      return true;
    } else {
      return false;
    }
  }
  /** whether or not to show menu options specific to search results */
  public get showResultsOptions() {
    if (this.search.currentSearchResults && this.search.currentSearchResults.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  /** when admin is enabled in the poc/api server the "Admin" sub menu is shown */
  public get showAdminOptions(): boolean {
    return this.aboutService.isAdminEnabled;
  }

  public get headerTitle(): string {
    return this.titleService.getTitle();
  }

  public showPreferences() {
    this.showSection.emit('preferences');
    this.uiService.searchExpanded = true;
  }
  public showSearch() {
    this.showSection.emit('search');
    this.uiService.searchExpanded = true;
  }

  /** show the search form if hidden and scroll window to top */
  public showSearchByAttributeForm() {
    this.uiService.searchType = 'default';
    this.showSearch();
    this.scrollToTop();
  }

  public get searchById(): boolean {
    return this.uiService.searchType === 'id';
  }
  public set searchById(value: boolean) {
    this.uiService.searchType = (value === true) ? 'id' : 'default';
    this.showSearch();
    this.scrollToTop();
    //console.log('set searchById to: ', this.searchById, value, (value === true), this.uiService.searchType);
  }
  public get showResultsAsList(): boolean {
    return (this.uiService.resultsViewType === 'list' || this.uiService.resultsViewType === 'default');
  }
  public set showResultsAsList(value: boolean) {
    this.uiService.resultsViewType = (value === true) ? 'list' : 'default';
    //console.log('set showResultsAsList to: ', this.searchById, value, (value === true), this.uiService.searchType);
  }
  public get showResultsAsGraph(): boolean {
    return this.uiService.resultsViewType === 'graph';
  }
  public set showResultsAsGraph(value: boolean) {
    this.uiService.resultsViewType = (value === true) ? 'graph' : 'list';
    //console.log('set showResultsAsGraph to: ', this.showResultsAsGraph, value, (value === true), this.uiService);
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
  public get graphSearchResultsRouteLink() {
    if(this.search.currentSearchResults && this.search.currentSearchResults.length > 0) {
      return '/graph/' + this.search.currentSearchResults.map( (result: SzAttributeSearchResult) => {
        return result.entityId;
      }).join(',');
    }
  }
  public get listSearchResultsRouteLink() {
    return '/search';
  }

  toggleAboutInfo() {
    // TODO(jelbourn): separate overlay demo for connected positioning.
    if( this.aboutInfoIsShowing && this.overlayRef) {
      // dispose
      this.overlayRef.detach();
      this.aboutInfoIsShowing = false;
    } else {
      if(this.overlayRef) {
        // reattach
        this.overlayRef.attach(new ComponentPortal(AboutComponent));
      } else {
        // create
        const strategy = this.overlay.position()
        .flexibleConnectedTo(this._overlayOrigin.elementRef)
        .withPositions([
          {
            overlayX: 'end', overlayY: 'top',
            originX: 'end', originY: 'bottom'
          }
        ]);

        const config = new OverlayConfig({
          positionStrategy: strategy,
          width: '170px'
        });

        this.overlayRef = this.overlay.create(config);
        this.overlayRef.attach(new ComponentPortal(AboutComponent));
      }
      this.aboutInfoIsShowing = true;
    }
  }

  /** helper method for scrolling the window to top */
  public scrollToTop() 
  { 
    (function smoothscroll() 
    { var currentScroll = document.documentElement.scrollTop || document.body.scrollTop; 
      if (currentScroll > 0) 
      {
        window.requestAnimationFrame(smoothscroll);
        window.scrollTo(0, currentScroll - (currentScroll / 5));
      }
    })();
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

  goAdmin() {

  }
}
