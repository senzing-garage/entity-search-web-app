import { Component, OnInit } from '@angular/core';
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
    private spinner: SpinnerService) { }

  ngOnInit() {
    this.route.data
    .subscribe((data: { results: SzAttributeSearchResult[], parameters: SzEntitySearchParams }) => {
      this.currentSearchParameters = data.parameters;
      this.currentSearchResults = data.results;
      // clear out any globally stored value;
      this.search.currentlySelectedEntityId = undefined;
    });

    // listen for global search data
    this.search.results.subscribe((results: SzAttributeSearchResult[]) => {
      this.currentSearchResults = results;
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe( (event) => {
      this.spinner.hide();
    });

  }

  onSearchResultClick(param) {
    this.router.navigate(['entity/' + param.entityId]);
  }

}
