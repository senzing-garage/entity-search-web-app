import { Injectable } from '@angular/core';
import { SpinnerService } from './spinner.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { Router, ActivatedRoute, UrlSegment, NavigationEnd } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private _navExpanded = true;
  private _subNavExpanded = true;
  private _searchExpanded = true;
  private _searchType = 'default';
  public createPdfClicked = new Subject<number>();
  private _graphOpen = false;
  private _resultsViewType = 'default';
  private _graphFilterDataSources: string[] = [];

  public get searchExpanded(): boolean {
    return this._searchExpanded;
  }
  public set searchExpanded(value) {
    this._searchExpanded = value;
  }
  public get navExpanded(): boolean {
    return this._navExpanded;
  }
  public set navExpanded(value: boolean) {
    this._navExpanded = value
  }
  public get subNavExpanded(): boolean {
    return this._subNavExpanded;
  }
  public set subNavExpanded(value: boolean) {
    this._subNavExpanded = value
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

  public get graphOpen(): boolean {
    return this._graphOpen;
  }
  public set graphOpen(value: boolean) {
    this._graphOpen = value;
  }
  public get graphFilterDataSources(): string[] {
    return this._graphFilterDataSources;
  }
  public set graphFilterDataSources(value: string[]) {
    this._graphFilterDataSources = value;
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
      this._graphOpen = (urlStr && urlStr.indexOf && urlStr.indexOf('/graph/') >= 0);
    });
    router.events.subscribe((event) => {
      if (event instanceof NavigationEnd ) {
        this._graphOpen = (event && event.urlAfterRedirects && event.urlAfterRedirects.indexOf('/graph/') >= 0);
      }
    });
  }
}
