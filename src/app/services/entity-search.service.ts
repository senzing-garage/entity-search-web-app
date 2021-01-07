import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { Observable, of, EMPTY, Subject } from 'rxjs';
import { mergeMap, take, catchError, tap, map } from 'rxjs/operators';

import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzSearchService,
  SzSearchResultEntityData,
  SzEntityData,
  SzEntityRecord,
  SzSearchByIdFormParams
} from '@senzing/sdk-components-ng';
import { EntityGraphService, SzEntityNetworkData, SzFeatureMode } from '@senzing/rest-api-client-ng';
import { SpinnerService } from './spinner.service';
import { HttpErrorResponse } from '@angular/common/http';
import { PrefsManagerService } from './prefs-manager.service';

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
  private _currentRecord: SzEntityRecord;
  private _recordChange = new Subject<SzEntityRecord>();

  public set currentSearchResults(value) {
    this._currentSearchResults = value;
    this._results.next(value);
  }
  public get currentSearchResults(): SzAttributeSearchResult[] {
    // TODO: pull from last subject
    return this._currentSearchResults;
  }
  public set currentRecord(value: SzEntityRecord) {
    this._currentRecord = value;
    this._recordChange.next(value);
  }
  public get currentRecord(): SzEntityRecord {
    return this._currentRecord;
  }
  public get results(): Observable<SzAttributeSearchResult[]> {
    return this._results.asObservable();
  }
  public get record(): Observable<SzEntityRecord> {
    return this._recordChange.asObservable();
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
  /** the search parameters from the last search-by-id performed */
  public currentSearchByIdParameters: SzSearchByIdFormParams;

  constructor(private sdkSearchService: SzSearchService) {
  }
  /** get the page title for the current search */
  public get searchTitle(): string {
    let retVal = '(0) Results';
    const params = [];
    if(this.currentSearchParameters) {
      // build title by search params
      if (this.currentSearchParameters.NAME_FULL) {
        params.push(this.currentSearchParameters.NAME_FULL);
      }
      if (this.currentSearchParameters.DATE_OF_BIRTH) {
        params.push(this.currentSearchParameters.DATE_OF_BIRTH);
      }
      if (this.currentSearchParameters.IDENTIFIER) {
        params.push(this.currentSearchParameters.IDENTIFIER);
        // IDENTIFIER_TYPE
      }
      if (this.currentSearchParameters.ADDR_FULL) {
        params.push(this.currentSearchParameters.ADDR_FULL);
      }
      if (this.currentSearchParameters.PHONE_NUMBER) {
        params.push(this.currentSearchParameters.PHONE_NUMBER);
      }
      if (this.currentSearchParameters.EMAIL_ADDRESS) {
        params.push(this.currentSearchParameters.EMAIL_ADDRESS);
      }
    } else if(this.currentRecord && this.currentRecord !== undefined) {
      params.push(this.currentRecord.recordId);
      retVal = params.join(', ');
      retVal = '(1) Result for "' + retVal + '"';
    } else if(this.currentlySelectedEntityId) {
      params.push(this.currentlySelectedEntityId);
      retVal = params.join(', ');
      retVal = '(1) Result for "' + retVal + '"';
    }
    if (params && params.length > 0) {
      retVal = params.join(', ');
      if(this.currentSearchResults && this.currentSearchResults.length > 0) {
        retVal = '(' + this.currentSearchResults.length + ') Result' + (this.currentSearchResults.length > 1 ? 's' : '') + ' for "' + retVal + '"';
      }
    }
    return retVal;
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
export class SearchByIdParamsResolverService implements Resolve<SzSearchByIdFormParams> {
  constructor(
    private search: EntitySearchService,
    private sdkSearchService: SzSearchService,
    private router: Router) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): SzSearchByIdFormParams | Observable<never> {
    const sparams = this.search.currentSearchByIdParameters;
    return sparams;
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
      return this.sdkSearchService.getEntityById(entityId, true).pipe(
        mergeMap(entityData => {
          //console.info('EntityDetailResolverService: ', entityData);
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
export class RecordResolverService implements Resolve<SzEntityRecord> {
  constructor(
    private sdkSearchService: SzSearchService,
    private router: Router,
    private search: EntitySearchService,
    private spinner: SpinnerService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<SzEntityRecord> | Observable<never> {
    this.spinner.show();
    const dsName = route.paramMap.get('datasource');
    const recordId = route.paramMap.get('recordId');
    if (dsName && recordId && recordId !== undefined && recordId !== null) {
      return this.sdkSearchService.getEntityByRecordId(dsName, recordId).pipe(
        map(res => (res as SzEntityRecord)),
        mergeMap(recordData => {
          console.info('RecordResolverService: ', recordData);
          this.spinner.hide();
          if (recordData) {
            return of(recordData);
          } else { // no results
            this.search.currentlySelectedEntityId = undefined;
            this.search.currentRecord = undefined;
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
      this.search.currentRecord = undefined;
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

@Injectable({
  providedIn: 'root'
})
export class GraphEntityNetworkResolverService implements Resolve<SzEntityNetworkData> {
  constructor(
    private sdkSearchService: SzSearchService,
    private graphService: EntityGraphService,
    private prefsService: PrefsManagerService,
    private router: Router,
    private search: EntitySearchService,
    private spinner: SpinnerService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<SzEntityNetworkData> | Observable<never> {
    this.spinner.show();
    const entityId = parseInt( route.paramMap.get('entityId'), 10);
    if (entityId && entityId > 0) {
      return this.graphService.findEntityNetwork(
        [entityId],
        undefined,
        this.prefsService.prefs.graph.maxDegreesOfSeparation,
        this.prefsService.prefs.graph.buildOut,
        this.prefsService.prefs.graph.maxEntities,
        SzFeatureMode.NONE,
        true,
        false,
        false,
        true).pipe(
          map(res => (res.data as SzEntityNetworkData)),
          mergeMap((networkData) => {
            this.spinner.hide();
            if (networkData) {
              return of(networkData);
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
          }
        )
      );
      /*
      return this.graphService.findNetworkByEntityID(
        [entityId],
        this.prefsService.prefs.graph.maxDegreesOfSeparation,
        this.prefsService.prefs.graph.buildOut,
        this.prefsService.prefs.graph.maxEntities,
        false ).pipe(
          map(res => (res.data as SzEntityNetworkData)),
          mergeMap((networkData) => {
            this.spinner.hide();
            if (networkData) {
              return of(networkData);
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
          }
        )
      );*/

    } else {
      this.spinner.hide();
      this.search.currentlySelectedEntityId = undefined;
      this.router.navigate(['errors/404']);
      return EMPTY;
    }
  }
}
