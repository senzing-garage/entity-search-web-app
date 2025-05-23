import { Component, OnInit, OnDestroy, HostBinding, ViewChild } from '@angular/core';
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
  SzSearchByIdFormParams,
  SzSearchComponent
} from '@senzing/sdk-components-ng';
import { v4 as uuidv4 } from 'uuid';

import { EntitySearchService } from './services/entity-search.service';
import { SpinnerService } from './services/spinner.service';
import { UiService } from './services/ui.service';
import { PrefsManagerService } from './services/prefs-manager.service';
import { SzWebAppConfigService } from './services/config.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from './common/alert-dialog/alert-dialog.component';

 @Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    animations: [slideInAnimation],
    standalone: false
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
  /** whether or not to display prefs in the interface ribbon */
  public showPrefs = false;
  /** prefs storage mode (do not directly modify)
   * local | session | memory
  */
  public isGraphOpen = false;
  private _isLandingPage = false;
  public get prefsStorageMode() {
    if ( this.prefsManager.storePrefsInLocalStorage ) {
      return 'local';
    } else if ( this.prefsManager.storePrefsInSessionStorage ) {
      return 'session';
    } else {
      return 'memory';
    }
  }
  public get noDecoration(): boolean {
    return this.uiService.noDecoration;
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

  @HostBinding("class.landing-page") get classIsLanding() {
    return this._isLandingPage;
  }

  public get isLandingPage(): boolean {
    return this._isLandingPage;
  }

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
    public dialog: MatDialog,
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
    this.route.url.subscribe(this.onActiveRouteChange.bind(this))
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

  public onActiveRouteChange(url: UrlSegment[]) {
    if(url && url[0]) {
      // if first part of url is "" we're on the landing page
      this._isLandingPage = url[0].path === '';
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
  /** the search form component as child */
  @ViewChild('searchComponent') searchComponent: SzSearchComponent;
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
      // store results
      let searchParams  = this.searchComponent.getSearchParams();
      let searchGUID    = uuidv4();
      if(searchParams) {
        // store last successful search by guid in localStorage
        this.entitySearchService.storeLastSearch(searchGUID, searchParams);
      }
      // show results
      this.router.navigate(['search/results/', searchGUID]);
      this.entitySearchService.currentSearchResults = evt;
    }
  }
  /**
   * When the Search-by-id form performs a query but throws
   * an exception(99% of the time its because the entity doesn't exist)
   * This handler is called.
   */
  onSearchByIdException(evt){
    console.log('onSearchByIdException: ', evt);
    if(evt && ((evt.status && evt.status === 404) || (evt.statusCode && evt.statusCode === 404))) {
      let dialogRef = this.dialog.open(AlertDialogComponent, {
        height: '200px',
        width: '400px',
        data: {
          title: 'Entity Not Found',
          message: 'The entity specified by search criteria could not be found'
        }
      });
    } else if(evt && evt.statusMessage) {
      let dialogRef = this.dialog.open(AlertDialogComponent, {
        height: '200px',
        width: '400px',
        data: {
          title: 'Search Exception',
          message: evt.statusMessage + (evt.url ? ':\n' + evt.url : '')
        }
      });
    } else if(evt && evt.statusText) {
      let dialogRef = this.dialog.open(AlertDialogComponent, {
        height: '200px',
        width: '400px',
        data: {
          title: 'Search Exception',
          message: evt.statusText + (evt.url ? ':\n' + evt.url : '')
        }
      });
    } else {
      let dialogRef = this.dialog.open(AlertDialogComponent, {
        height: '200px',
        width: '400px',
        data: {
          title: 'Unknown Exception',
          message: 'An unknown exception has occurred.'
        }
      });
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
