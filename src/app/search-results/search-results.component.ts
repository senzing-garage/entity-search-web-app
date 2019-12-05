import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult
} from '@senzing/sdk-components-ng';
import { SpinnerService } from '../services/spinner.service';
import { EntitySearchService } from '../services/entity-search.service';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {
  /** the current search results */
  public currentSearchResults: SzAttributeSearchResult[];
  public currentSearchParameters: SzEntitySearchParams;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private search: EntitySearchService,
    private titleService: Title,
    private spinner: SpinnerService) { }

  ngOnInit() {
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
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe( (event) => {
      this.spinner.hide();
    });

  }
  /** when user clicks on a search result item */
  onSearchResultClick(param) {
    this.router.navigate(['entity/' + param.entityId]);
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
