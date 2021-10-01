import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute, UrlSegment } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, map } from 'rxjs/operators';

import { slideInAnimation } from './animations';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzEntityRecord,
  SzEntityData,
  SzSearchByIdFormParams
} from '@senzing/sdk-components-ng';

import { EntitySearchService } from './services/entity-search.service';
import { SpinnerService } from './services/spinner.service';
import { UiService } from './services/ui.service';
import { PrefsManagerService } from './services/prefs-manager.service';
import { SzWebAppConfigService } from './services/config.service';
import { NavItem } from './sidenav/sidenav.component';

 @Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [ slideInAnimation ]
})
export class AppComponent implements OnInit, OnDestroy {
  /** the current search results */
  public currentSearchResults: SzAttributeSearchResult[];
  /** the entity to show in the detail view */
  public currentlySelectedEntityId: number = undefined;
  /** the search parameters from the last search performed */
  public currentSearchParameters: SzEntitySearchParams;
  /** whether or not to show the search form expanded */
  public get searchExpanded() {
    return this.ui.searchExpanded;
  }
  public get navExpanded() {
    return this.ui.navExpanded;
  }
  public set navExpanded(value: boolean) {
    this.ui.navExpanded = value;
  }
  public get subNavExpanded() {
    return this.ui.subNavExpanded;
  }

  /** whether or not to display prefs in the interface ribbon */
  public showPrefs = false;
  /** prefs storage mode (do not directly modify)
   * local | session | memory
  */
  public isGraphOpen = false;
  public get prefsStorageMode() {
    if ( this.prefsManager.storePrefsInLocalStorage ) {
      return 'local';
    } else if ( this.prefsManager.storePrefsInSessionStorage ) {
      return 'session';
    } else {
      return 'memory';
    }
  }

  public onSideNavLeave(event) {
    console.log('onSideNavLeave: ', event);
    this.ui.navExpanded = false;
  }
  public onSideNavEnter(event) {
    console.log('onSideNavEnter: ', event);
    this.ui.navExpanded = true;
  }
  public onSideNavItemHover(navItem: NavItem) {
    console.log('onSideNavItemHover: ', event);
    if(!this.navExpanded && navItem && navItem.submenuItems && navItem.submenuItems.length > 0) {
      // has subnav, make sure nav is expanded on rollover
      this.ui.navExpanded = true;
      this.ui.subNavExpanded = true;
    }
  }
  public expandNavDrawer() {
    this.ui.navExpanded = true;
  }

  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  private layoutMediaQueries = [
    '(min-width: 1021px) and (max-width: 1120px)',
    '(min-width: 700px) and (max-width: 1120px)',
    '(min-width: 501px) and (max-width: 699px)',
    '(max-width: 500px)',
  ];
  @HostBinding('class') layoutClasses = [];

  public getAnimationData(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  /** set the prefsManager storage mode via radio button change */
  public onPrefsStorageModeUIChange (value) {
    // console.warn('onPrefsStorageModeUIChange: ', value);
    switch ( value ) {
      case 'local':
        this.prefsManager.storePrefsInLocalStorage = true;
        this.prefsManager.storePrefsInSessionStorage = false;
        break;
      case 'session':
        this.prefsManager.storePrefsInLocalStorage = false;
        this.prefsManager.storePrefsInSessionStorage = true;
        break;
      default:
        this.prefsManager.storePrefsInLocalStorage = false;
        this.prefsManager.storePrefsInSessionStorage = false;
        break;
    }
  }


  /**
   * Getter for whether or not the SzEntityDetail panel
   * should be shown.
   */
  public get showSearchResultDetail(): boolean {
    if (this.currentlySelectedEntityId && this.currentlySelectedEntityId > 0) {
      return true;
    }
    return false;
  }

  public get showSearchById(): boolean {
    return (this.uiService && this.uiService.searchType === 'id');
  }

  constructor(
    private configService: SzWebAppConfigService,
    private entitySearchService: EntitySearchService,
    private router: Router,
    private route: ActivatedRoute,
    public breakpointObserver: BreakpointObserver,
    private spinner: SpinnerService,
    private ui: UiService,
    public uiService: UiService,
    public search: EntitySearchService,
    private prefsManager: PrefsManagerService
  ) {
    // get "/config/api" for immutable api path configuration
    this.configService.getRuntimeApiConfig();
  }

  ngOnInit() {
    const layoutChanges = this.breakpointObserver.observe(this.layoutMediaQueries);
    layoutChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( this.onBreakPointStateChange.bind(this) );
  }
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /** when the toolbar wants to trigger a ribbon section change */
  public onToolBarSectionChange(section: any) {
    switch ( section ) {
      case 'preferences':
        this.showPrefs = true;
        break;
      case 'searchById':
          this.uiService.searchType = 'id';
          this.showPrefs = false;
          break;
      default:
        this.showPrefs = false;
    }
  }

  /** hide preferences section */
  public exitPrefs() {
    this.showPrefs = false;
  }
  /** clear prefs from local/session storage */
  public clearPrefs(deleteFromStorage?: boolean) {
    if ( deleteFromStorage === true) {
      // also clear from storage
      this.prefsManager.clearPrefsFromStorage(true, true);
    } else {
      this.prefsManager.resetPrefsToDefaults();
    }
  }

  /** when a breakpoint change happens, add oor remove css classes */
  private onBreakPointStateChange(state: BreakpointState) {
    /**
    {cssClass: 'layout-wide', minWidth: 1021 },
    {cssClass: 'layout-medium', minWidth: 700, maxWidth: 1120 },
    {cssClass: 'layout-narrow', maxWidth: 699 }
    {cssClass: 'layout-super-narrow', maxWidth: 699 }
    */
    this.layoutClasses = [];

    if ( state.breakpoints[ this.layoutMediaQueries[0] ] && this.layoutClasses.indexOf('layout-wide') < 0) {
      this.layoutClasses.push('layout-wide');
    }
    if ( state.breakpoints[ this.layoutMediaQueries[1] ] && this.layoutClasses.indexOf('layout-medium') < 0) {
      this.layoutClasses.push('layout-medium');
    }
    if ( state.breakpoints[ this.layoutMediaQueries[2] ] && this.layoutClasses.indexOf('layout-narrow') < 0) {
      this.layoutClasses.push('layout-narrow');
    }
    if ( state.breakpoints[ this.layoutMediaQueries[3] ] && this.layoutClasses.indexOf('layout-super-narrow') < 0) {
      this.layoutClasses.push('layout-super-narrow');
    }

    // console.log('hit breakpoint: ', this.layoutClasses, state);
  }

  /** whether or not to show menu options specific to detail view */
  public get showGraphOptions() {
    return this.uiService.graphOpen && this.search.currentSearchResults && this.search.currentSearchResults.length > 0;
  }

  /**
   * Event handler for when a search has been performed in
   * the SzSearchComponent.
   */
  onSearchResults(evt: SzAttributeSearchResult[]) {

    console.info('onSearchResultsChange: ', evt, this.isGraphOpen);
    if (this.uiService.graphOpen) {
      // show results in graph
      this.entitySearchService.currentSearchResults = evt;
    } else {
      // show results
      this.router.navigate(['search/results'], {
        queryParams: {refresh: new Date().getTime()}
      });
      this.entitySearchService.currentSearchResults = evt;
    }
  }

  /**
   * Event handler for when the fields in the SzSearchComponent
   * are cleared.
   */
  public onSearchResultsCleared(searchParams: SzEntitySearchParams) {
    // hide search results
    this.entitySearchService.currentSearchResults = undefined;
    this.entitySearchService.currentlySelectedEntityId = undefined;
    this.router.navigate(['/search']);
  }

  /**
   * Event handler for when the parameters of the search performed from
   * the SzSearchComponent | SzSearchByIdComponent has changed.
   * This only happens on submit button click
   */
  public onSearchParameterChange(searchParams: SzEntitySearchParams | SzSearchByIdFormParams) {
    //console.log('onSearchParameterChange: ', searchParams);
    let isByIdParams = false;
    const byIdParams = (searchParams as SzSearchByIdFormParams);
    if ( byIdParams && ((byIdParams.dataSource && byIdParams.recordId) || byIdParams.entityId)  ) {
      isByIdParams = true;
    } else {
      // console.warn('not by id: ' + isByIdParams, byIdParams);
    }
    if (!isByIdParams) {
      this.entitySearchService.currentSearchParameters = (searchParams as SzEntitySearchParams);
    } else {
      this.entitySearchService.currentSearchByIdParameters = (searchParams as SzSearchByIdFormParams);
    }
  }

  public onSearchStart(evt) {
    console.log('onSearchStart: ', evt);
    this.spinner.show();
  }

  /** when the value from the sz-search-by-id component changes */
  onRecordChange(evt: SzEntityRecord) {
    console.log('onRecordChange: ', evt);
    this.entitySearchService.currentSearchResults = undefined;
    this.entitySearchService.currentlySelectedEntityId = undefined;
    this.entitySearchService.currentRecord = evt;
    this.router.navigate(['datasources', this.entitySearchService.currentSearchByIdParameters.dataSource, 'records', evt.recordId ]);
  }
  /** when the by entity id result from the sz-search-by-id component changes */
  onEntityResult(evt: SzEntityData) {
    console.log('onEntityResult: ', evt);
    this.entitySearchService.currentSearchResults = undefined;
    this.entitySearchService.currentRecord = undefined;
    this.entitySearchService.currentlySelectedEntityId = evt.resolvedEntity.entityId;
    this.router.navigate(['entity', this.entitySearchService.currentlySelectedEntityId ]);
  }

  /** toggle the ui state of the ribbon */
  public toggleRibbonState(evt) {
    this.ui.searchExpanded = !this.ui.searchExpanded;
  }
}
