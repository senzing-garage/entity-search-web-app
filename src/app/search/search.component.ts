import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute, UrlSegment } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Title } from '@angular/platform-browser';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, map } from 'rxjs/operators';

import { slideInAnimation } from '../animations';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzEntityRecord,
  SzEntityData,
  SzSearchByIdFormParams
} from '@senzing/sdk-components-ng';

import { EntitySearchService } from '../services/entity-search.service';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';
import { PrefsManagerService } from '../services/prefs-manager.service';
import { SzWebAppConfigService } from '../services/config.service';
import { NavItem } from '../sidenav/sidenav.component';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class AppSearchComponent implements OnInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    /** the current search results */
    public currentSearchResults: SzAttributeSearchResult[];
    /** the entity to show in the detail view */
    public currentlySelectedEntityId: number = undefined;
    /** the search parameters from the last search performed */
    public currentSearchParameters: SzEntitySearchParams;

    constructor(
        private configService: SzWebAppConfigService,
        private entitySearchService: EntitySearchService,
        private router: Router,
        private route: ActivatedRoute,
        public breakpointObserver: BreakpointObserver,
        private spinner: SpinnerService,
        private ui: UiService,
        private titleService: Title,
        public uiService: UiService,
        public search: EntitySearchService,
        private prefsManager: PrefsManagerService
    ) {
        // get "/config/api" for immutable api path configuration
        this.configService.getRuntimeApiConfig();
    }

    ngOnInit() {
        /*
        const layoutChanges = this.breakpointObserver.observe(this.layoutMediaQueries);
        layoutChanges.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe( this.onBreakPointStateChange.bind(this) );
        */
        this.route.data
            .subscribe((data: { results: SzAttributeSearchResult[], parameters: SzEntitySearchParams }) => {
            this.currentSearchParameters = data.parameters;
            this.currentSearchResults = data.results;
            // clear out any globally stored value;
            this.search.currentlySelectedEntityId = undefined;
            // set page title
            this.titleService.setTitle( this.search.searchTitle );
        });

        // listen for global search data
        this.search.results.subscribe((results: SzAttributeSearchResult[]) => {
            this.currentSearchResults = results;
            // set page title
            this.titleService.setTitle( this.search.searchTitle );
            // stop spinner (jic)
            this.spinner.hide();
        });

        if(this.search.currentSearchResults) {
            this.currentSearchResults = this.search.currentSearchResults;
        }
    }
    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.spinner.hide();
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    
    /**
     * Event handler for when a search has been performed in
     * the SzSearchComponent.
     */
    onSearchResults(evt: SzAttributeSearchResult[]) {
        console.info('onSearchResultsChange: ', evt);
        this.spinner.hide();
        if (this.uiService.graphOpen) {
            // show results in graph
            this.entitySearchService.currentSearchResults = evt;
        } else {
            /*
            // show results
            this.router.navigate(['search/results'], {
                queryParams: {refresh: new Date().getTime()}
            });
            */
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
  public onSearchEnd(evt) {
    console.log('onSearchStart: ', evt);
    this.spinner.hide();
  }
  /** when user clicks on a search result item */
  onSearchResultClick(param) {
    this.router.navigate(['search/by-attribute/entity/' + param.entityId]);
  }
  /** when user clicks the "open results in graph" button */
  onOpenInGraph($event) {
    const entityIds = this.currentSearchResults.map( (ent) => {
      return ent.entityId;
    });
    if(entityIds && entityIds.length === 1) {
      // single result
      this.router.navigate(['graph/' + entityIds[0] ]);
    } else if(entityIds && entityIds.length > 1) {
      // multiple matches
      this.router.navigate(['graph/' + entityIds.join(',') ]);
    }
  }

}
