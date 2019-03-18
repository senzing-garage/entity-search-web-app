import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult
} from '@senzing/sdk-components-ng';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {
  /** the current search results */
  public currentSearchResults: SzAttributeSearchResult[];
  public currentSearchParameters: SzEntitySearchParams;

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.data
    .subscribe((data: { results: SzAttributeSearchResult[], parameters: SzEntitySearchParams }) => {
      this.currentSearchParameters = data.parameters;
      this.currentSearchResults = data.results;
      console.info('SearchResultsComponent.onSearchResultsChange: ', this.currentSearchResults, this.currentSearchParameters );
    });
  }

  onSearchResultClick(param) {
    console.log('search result click: ', param);
    this.router.navigate(['entity/' + param.entityId]);
  }

}
