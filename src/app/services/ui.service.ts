import { Injectable } from '@angular/core';
import { SpinnerService } from './spinner.service';
import { BehaviorSubject, delay, Observable, Subject } from 'rxjs';
import { Router, ActivatedRoute, UrlSegment, NavigationEnd } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private _searchExpanded     = true;
  private _searchType         = 'default';
  public createPdfClicked     = new Subject<number>();
  private _graphOpen          = false;
  private _noDecoration       = false;
  private _consolePopOutOpen  = false;
  private _resultsViewType    = 'default';
  /** when the search tray expansion state changes */
  private _onSearchExpanded: BehaviorSubject<boolean>   = new BehaviorSubject<boolean>(this._searchExpanded);
  /** delay the observeable by time of tray animation */
  public onSearchExpanded: Observable<boolean>          = this._onSearchExpanded.asObservable().pipe(
    delay(1000)
  );

  public get searchExpanded(): boolean {
    return this._searchExpanded;
  }
  public set searchExpanded(value) {
    this._searchExpanded = value;
    this._onSearchExpanded.next( this._searchExpanded );
  }
  public get searchType(): string {
    return this._searchType;
  }
  public set searchType(value: string) {
    this._searchType = value;
  }
  public get resultsViewType(): string {
    return this._resultsViewType;
  }
  public set resultsViewType(value: string) {
    this._resultsViewType = value;
  }
  public get noDecoration(): boolean {
    return this._noDecoration;
  }
  public get consolePopOutOpen(): boolean {
    return this._consolePopOutOpen;
  }
  public set consolePopOutOpen(value: boolean) {
    this._consolePopOutOpen = value;
  }
  public get graphOpen(): boolean {
    return this._graphOpen;
  }
  public set graphOpen(value: boolean) {
    this._graphOpen = value;
  }

  public get spinnerActive(): boolean {
    return this.spinner.active;
  }
  public set spinnerActive(value) {
    // use soft sets
    if (value) {
      this.spinner.show();
    } else {
      this.spinner.hide();
    }
  }

  public createPdfForActiveEntity(entityId: number) {
    if (entityId && entityId >= 0) {
      this.createPdfClicked.next(entityId);
    }
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private spinner: SpinnerService
    ) {
    // we need route senzing for graph sensing
    // because there is also an embedded graph
    route.url.subscribe( (url: UrlSegment[]) => {
      const urlStr = url.join();
      this._graphOpen         = (urlStr && urlStr.indexOf && urlStr.indexOf('/graph/') >= 0);
      this._noDecoration      = (urlStr && urlStr.indexOf && urlStr.indexOf('/no-decorator') >= 0);
      //this._consolePopOutOpen = (urlStr && urlStr.indexOf && urlStr.indexOf('/no-decorator(popup:console)') >= 0);
    });
    router.events.subscribe((event) => {
      if (event instanceof NavigationEnd ) {
        this._graphOpen         = (event && event.urlAfterRedirects && event.urlAfterRedirects.indexOf('/graph/') >= 0);
        this._noDecoration      = (event && event.urlAfterRedirects && event.urlAfterRedirects.indexOf('/no-decorator') >= 0);
        //this._consolePopOutOpen = (event && event.urlAfterRedirects && event.urlAfterRedirects.indexOf('/no-decorator(popup:console)') >= 0);
      }
    });
  }
}
