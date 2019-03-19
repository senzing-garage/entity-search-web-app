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

import { SpinnerService } from './spinner.service';

@Injectable({
  providedIn: 'root'
})
export class EntitySearchService {
  /** the current search results */
  private _currentSearchResults: SzAttributeSearchResult[];
  private _results = new Subject<SzAttributeSearchResult[]>();

  public set currentSearchResults(value) {
    this._currentSearchResults = value;
    this._results.next(value);
  }
  public get currentSearchResults(): SzAttributeSearchResult[] {
    // TODO: pull from last subject
    return this._currentSearchResults;
  }
  public get results(): Observable<SzAttributeSearchResult[]> {
    return this._results.asObservable();
  }

  /** the entity to show in the detail view */
  public _currentlySelectedEntityId: number = undefined;
  private _entityId = new Subject<number>();
  public get entityIdChange() {
    return this._entityId.asObservable();
  }
  public get currentlySelectedEntityId(): number | undefined {
    return this._currentlySelectedEntityId;
  }
  public set currentlySelectedEntityId(value: number | undefined) {
    this._currentlySelectedEntityId = value;
    this._entityId.next(value);
  }
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
  constructor(private sdkSearchService: SzSearchService, private router: Router, private spinner: SpinnerService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<SzAttributeSearchResult[]> | Observable<never> {
    const sparams = this.sdkSearchService.getSearchParams();
    console.info('SearchResultsResolverService: params: ', sparams);
    this.spinner.show();

    return this.sdkSearchService.searchByAttributes( sparams ).pipe(
      take(1),
      mergeMap(results => {
        this.spinner.hide();
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
  constructor(private sdkSearchService: SzSearchService, private router: Router, private spinner: SpinnerService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<SzEntityData> | Observable<never> {
    this.spinner.show();

    const entityId = parseInt( route.paramMap.get('entityId'), 10);
    if (entityId && entityId > 0) {
      return this.sdkSearchService.getEntityById(entityId).pipe(
        take(1),
        mergeMap(entityData => {
          console.info('EntityDetailResolverService: ', entityData);
          this.spinner.hide();
          if (entityData) {
            return of(entityData);
          } else { // no results
            this.router.navigate(['error/404']);
            return EMPTY;
          }
        })
      );
    } else {
      this.spinner.hide();
      this.router.navigate(['error/404']);
      return EMPTY;
    }
  }
}
