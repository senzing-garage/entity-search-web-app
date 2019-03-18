import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { Observable, of, EMPTY, Subject } from 'rxjs';
import { mergeMap, take } from 'rxjs/operators';

import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzSearchService,
  SzSearchResultEntityData,
  SzEntityData
} from '@senzing/sdk-components-ng';

@Injectable({
  providedIn: 'root'
})
export class EntitySearchService {
  /** the current search results */
  public currentSearchResults: SzAttributeSearchResult[];
  /** the entity to show in the detail view */
  public currentlySelectedEntityId: number = undefined;
  /** the search parameters from the last search performed */
  public currentSearchParameters: SzEntitySearchParams;

  constructor(private sdkSearchService: SzSearchService) {
  }
}

@Injectable({
  providedIn: 'root'
})
export class SearchResultsResolverService implements Resolve<SzAttributeSearchResult[]> {
  private entitySearchResults: Subject<SzAttributeSearchResult[]>;
  constructor(private entitySearchService: EntitySearchService, private sdkSearchService: SzSearchService, private router: Router) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<SzAttributeSearchResult[]> | Observable<never> {
    const sparams = this.sdkSearchService.getSearchParams();
    console.info('SearchResultsResolverService: params: ', sparams);

    return this.sdkSearchService.searchByAttributes( sparams ).pipe(
      take(1),
      mergeMap(results => {
        if (results && results.length > 0) {
          return of(results);
        } else { // no results
          this.router.navigate(['/search']);
          return EMPTY;
        }
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class SearchParamsResolverService implements Resolve<SzEntitySearchParams> {
  constructor(private sdkSearchService: SzSearchService, private router: Router) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): SzEntitySearchParams | Observable<never> {
    const sparams = this.sdkSearchService.getSearchParams();
    console.info('SearchParamsResolverService: params: ', sparams);
    return this.sdkSearchService.getSearchParams();
  }
}

@Injectable({
  providedIn: 'root'
})
export class EntityDetailResolverService implements Resolve<SzEntityData> {
  constructor(private sdkSearchService: SzSearchService, private router: Router) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<SzEntityData> | Observable<never> {
    const entityId = parseInt( route.paramMap.get('entityId'), 10);
    if (entityId && entityId > 0) {
      return this.sdkSearchService.getEntityById(entityId).pipe(
        take(1),
        mergeMap(entityData => {
          console.info('EntityDetailResolverService: ', entityData);
          if (entityData) {
            return of(entityData);
          } else { // no results
            this.router.navigate(['error/404']);
            return EMPTY;
          }
        })
      );
    } else {
      this.router.navigate(['error/404']);
      return EMPTY;
    }
  }
}
