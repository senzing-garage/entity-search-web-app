import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { Observable, of, EMPTY, Subject } from 'rxjs';
import { mergeMap, take, catchError } from 'rxjs/operators';

import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzSearchService,
  SzSearchResultEntityData,
  SzEntityData
} from '@senzing/sdk-components-ng';

import { SpinnerService } from './spinner.service';
import { HttpErrorResponse } from '@angular/common/http';

const getErrorRouteFromCode = (errorCode: number): string => {
  if (errorCode === 504) {
    // redirect to 504
    console.log('redirect to 504');
    return 'errors/504';
  } else if (errorCode >= 500 && errorCode < 600) {
    // show oops
    console.log('redirect to 500');
    return 'errors/500';
  } else if (errorCode === 404) {
    // show oops
    console.log('redirect to 404');
    return 'errors/404';
  }
  return 'errors/unknown';
};

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
  private _currentlySelectedEntityId: number = undefined;
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
      mergeMap(results => {
        this.spinner.hide();
        if (results && results.length > 0) {
          return of(results);
        } else { // no results
          this.router.navigate(['/errors/no-results']);
          return EMPTY;
        }
      }),
      catchError( (error: HttpErrorResponse) => {
        this.spinner.hide();
        const message = `Retrieval error: ${error.message}`;
        console.error(message);
        // this.router.navigate(['errors/404']);
        if (error && error.status) {
          this.router.navigate( [getErrorRouteFromCode(error.status)] );
        } else {
          this.router.navigate(['errors/unknown']);
        }
        return EMPTY;
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
    return this.sdkSearchService.getSearchParams();
  }
}

@Injectable({
  providedIn: 'root'
})
export class EntityDetailResolverService implements Resolve<SzEntityData> {
  constructor(
    private sdkSearchService: SzSearchService,
    private router: Router,
    private search: EntitySearchService,
    private spinner: SpinnerService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<SzEntityData> | Observable<never> {
    this.spinner.show();
    const entityId = parseInt( route.paramMap.get('entityId'), 10);
    if (entityId && entityId > 0) {
      return this.sdkSearchService.getEntityById(entityId).pipe(
        mergeMap(entityData => {
          console.info('EntityDetailResolverService: ', entityData);
          this.spinner.hide();
          if (entityData) {
            return of(entityData);
          } else { // no results
            this.search.currentlySelectedEntityId = undefined;
            this.router.navigate(['errors/404']);
            return EMPTY;
          }
        }),
        catchError( (error: HttpErrorResponse) => {
          this.spinner.hide();
          const message = `Retrieval error: ${error.message}`;
          console.error(message);
          if (error && error.status) {
            this.router.navigate( [getErrorRouteFromCode(error.status)] );
          } else {
            this.router.navigate(['errors/unknown']);
          }
          return EMPTY;
        })
      );
    } else {
      this.spinner.hide();
      this.search.currentlySelectedEntityId = undefined;
      this.router.navigate(['errors/404']);
      return EMPTY;
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class CurrentEntityUnResolverService implements Resolve<number | undefined> {
  constructor(private search: EntitySearchService, private spinner: SpinnerService, private sdkSearchService: SzSearchService, private router: Router) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<undefined> | Observable<number> | Observable<never> {
    // undefine any currently defined entity id
    this.search.currentlySelectedEntityId = undefined;
    this.spinner.hide();
    return of(this.search.currentlySelectedEntityId);
  }
}
