import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
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
export class AppComponent implements OnInit {
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
