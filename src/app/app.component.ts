import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { slideInAnimation } from './animations';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult
} from '@senzing/sdk-components-ng';

import { EntitySearchService } from './services/entity-search.service';
import { SpinnerService } from './services/spinner.service';
import { UiService } from './services/ui.service';

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

  constructor(
    private entitySearchService: EntitySearchService,
    private router: Router,
    public breakpointObserver: BreakpointObserver,
    private spinner: SpinnerService,
    private ui: UiService
  ) { }

  ngOnInit() {
    /*
    this.spinner.spinnerObservable.subscribe( (params) => {
      console.log('AppComponent.onSpinnerStateChange: ', params);
    });*/
    /*
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe( (event) => {
      console.info('router event: ', event, this.route);
      this.spinner.hide();
      //console.log(this.route.root);
    });*/

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

    console.log('hit breakpoint: ', this.layoutClasses, state);
  }

  /**
   * Event handler for when a search has been performed in
   * the SzSearchComponent.
   */
  onSearchResults(evt: SzAttributeSearchResult[]) {
    console.info('onSearchResultsChange: ', evt);
    // show results
    this.router.navigate(['search/results'], {
      queryParams: {refresh: new Date().getTime()}
    });
    this.entitySearchService.currentSearchResults = evt;
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
   * the SzSearchComponent has changed. This only happens on submit button click
   */
  public onSearchParameterChange(searchParams: SzEntitySearchParams) {
    console.log('onSearchParameterChange: ', searchParams);
    this.entitySearchService.currentSearchParameters = searchParams;
  }

  public onSearchStart(evt) {
    console.log('onSearchStart: ', evt);
    this.spinner.show();
  }


  public toggleRibbonState(evt) {
    this.ui.searchExpanded = !this.ui.searchExpanded;
  }
}
