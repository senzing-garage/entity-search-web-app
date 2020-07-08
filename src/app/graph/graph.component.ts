import { Component, OnInit, ViewChild, Input, TemplateRef, ViewContainerRef, Output, ElementRef, EventEmitter, OnDestroy, ChangeDetectorRef, Inject, AfterViewInit, Renderer2, HostBinding } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { EntitySearchService } from '../services/entity-search.service';
import { tap, filter, take, takeUntil } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription, fromEvent, Subject } from 'rxjs';
import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzEntityDetailComponent,
  SzPdfUtilService,
  SzResolvedEntity,
  SzRelatedEntity,
  SzRelationshipNetworkComponent,
  SzPrefsService,
  SzSdkPrefsModel,
  SzStandaloneGraphComponent,
  SzSearchService,
  SzEntityData,
  SzEntityDetailGraphFilterComponent
} from '@senzing/sdk-components-ng';
import { UiService } from '../services/ui.service';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit, AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  public currentSearchResults: SzAttributeSearchResult[];
  public currentlySelectedEntityId: number;
  public searchResultEntityIds: number[];
  public currentSearchParameters: SzEntitySearchParams;
  public showSearchResults = false;
  public showSpinner = false;
  // prefs related vars
  /** local cached json model of prefs */
  private _prefsJSON: SzSdkPrefsModel;

  public _showGraphMatchKeys = true;
  @Input() public set showGraphMatchKeys( value: boolean ) {
    this._showGraphMatchKeys = value;
  }
  public showEntityDetail: boolean = false;

  public showFilters: boolean = true;
  public get showSearchResultDetail(): boolean {
    if (this.currentlySelectedEntityId && this.currentlySelectedEntityId > 0) {
      return true;
    }
    return false;
  }

  sub: Subscription;
  overlayRef: OverlayRef | null;

  /** local setter that sets selected entity at service level */
  public set entityId(value: any) {
    this.search.currentlySelectedEntityId = value;
  }
  /** get the currently selected entity from service level */
  public get entityId(): any {
    return this.search.currentlySelectedEntityId;
  }
  /** get the currently selected entity ids from service level */
  public get entityIds(): any {
    return [this.search.currentlySelectedEntityId];
  }

  @Input() public data: {
    resolvedEntity: SzResolvedEntity,
    relatedEntities: SzRelatedEntity[]
  };

  public _showMatchKeys = false;
  /** sets the visibility of edge labels on the node links */
  @Input() public set showMatchKeys(value: boolean) {
    this._showMatchKeys = value;
    // console.log('@senzing/sdk-components-ng:sz-entity-detail-graph.showMatchKeys: ', value);
  }

  @Input() sectionIcon: string;
  @Input() maxDegrees: number = 1;
  @Input() maxEntities: number = 20;
  @Input() buildOut: number = 1;

  /** array of data sources to limit "filter by datasource" to. */
  public _showDataSourcesInFilter: string[];
  /** whether or not to show the right-rail element */
  private _showRightRail = true;
  @HostBinding('class.right-rail-open')
  get showRightRail() { return this._showRightRail; }
  @HostBinding('class.right-rail-closed')
  get hideFilters() { return !this._showRightRail; }

  @ViewChild('graphContainer') graphContainerEle: ElementRef;
  // @ViewChild(SzEntityDetailGraphControlComponent) graphControlComponent: SzEntityDetailGraphControlComponent;
  @ViewChild(SzRelationshipNetworkComponent) graph: SzRelationshipNetworkComponent;
  // @ViewChild('searchBox') searchBox: SzSearchComponent;
  @ViewChild('graphContextMenu') graphContextMenu: TemplateRef<any>;
    /** entity detail component */
  @ViewChild(SzEntityDetailComponent) entityDetailComponent: SzEntityDetailComponent;
  /** graph component */
  @ViewChild(SzStandaloneGraphComponent) graphComponent: SzStandaloneGraphComponent;
  /** graph filters */
  @ViewChild(SzEntityDetailGraphFilterComponent) graphFilter: SzEntityDetailGraphFilterComponent;

  /**
   * emitted when the player right clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() contextMenuClick: EventEmitter<any> = new EventEmitter<any>();

  /**
   * emitted when the player clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() entityClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the player clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() entityDblClick: EventEmitter<any> = new EventEmitter<any>();

  private _graphIds: number[];
  public get graphIds(): number[] {
    return this._graphIds;
  }
  public set graphIds(value: number[]) {
    this._graphIds = value;
  }

  /**
   * on entity node click in the graph.
   * proxies to synthetic "entityClick" event.
   */
  public onEntityClick(event: any) {
    this.entityClick.emit(event);
  }
  /**
   * on entity node click in the graph.
   * proxies to synthetic "entityClick" event.
   */
  public onEntityDblClick(event: any) {
    this.entityDblClick.emit(event);
  }
  /**
   * on entity node right click in the graph.
   * proxies to synthetic "contextMenuClick" event.
   * automatically adds the container ele page x/y to relative svg x/y for total x/y offset
   */
  public onRightClick(event: any) {
    if(this.graphContainerEle && this.graphContainerEle.nativeElement) {
      interface EvtModel {
        address?: string;
        entityId?: number;
        iconType?: string;
        index?: number;
        isCoreNode?: false;
        isQueriedNode?: false;
        name?: string;
        orgName?: string;
        phone?: string;
        x?: number;
        y?: number;
      }

      const pos: {x, y} = this.graphContainerEle.nativeElement.getBoundingClientRect();
      const evtSynth: EvtModel = Object.assign({}, event);
      // change x/y to include element relative offset
      evtSynth.x = (Math.floor(pos.x) + Math.floor(event.x));
      evtSynth.y = (Math.floor(pos.y) + Math.floor(event.y));
      // console.warn('onRightClick: ', pos, event);
      this.contextMenuClick.emit( evtSynth );
    }
  }

  public onOptionChange(event: {name: string, value: any}) {
    console.log('GraphComponent.onOptionChange: ', event);
    switch(event.name) {
      case 'showLinkLabels':
        this.showMatchKeys = event.value;
        break;
    }
  }

  /** toggle the visibility of the right rail section */
  public onToggleFilters(event) {
    this._showRightRail = !this._showRightRail;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private search: EntitySearchService,
    public pdfUtil: SzPdfUtilService,
    public overlay: Overlay,
    public uiService: UiService,
    public viewContainerRef: ViewContainerRef,
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef,
    public searchService: SzSearchService,
    private renderer: Renderer2,
    private titleService: Title
    ) {

      this.route.data.subscribe((data) => {
        // we're using the route resolver to activate spinner
        // this could be more efficient and use networkData to feed
        // directly to component views
        // console.warn('GraphComponent.route.data change: ', data);
      });
      this.route.params.subscribe(
        (params) => {
          if(params && params.entityId) {
            // if entityId has "," in it
            // assume collection of ids
            this.graphIds = (params.entityId && params.entityId.indexOf(',')) ? params.entityId.split(',').map( (strEntId) => parseInt(strEntId, 10) ) : [parseInt(params.entityId, 10)];
            // console.log('GraphComponent.route.params change: ', this.graphIds, params.entityId);
            this.showSearchResults = true;
          } else if(params && params.entityIds) {
            this.showSearchResults = true;
          }
          if(params && params.detailId) {
            this.currentlySelectedEntityId = params.detailId;
            this.showEntityDetail = true;
            this.showFilters = false;
          } else if(params && params.entityId) {
            // no detail view
            // check if they have a search entityId and use that
            this.currentlySelectedEntityId = parseInt(params.entityId, 10);
            this.showEntityDetail = false;
            this.showFilters = true;
          }
        }
      );
      // set body class based on isGraphShowing
      this.renderer.addClass(document.body, 'graph-open');
      // set page title
      this.titleService.setTitle( 'Explore Networks' );
  }

  ngAfterViewInit() {
    // current results

    // future results
    this.search.results.subscribe((results: SzAttributeSearchResult[]) => {
      //console.log('GraphComponent.search.results = ', results);
    });

    this.prefs.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (srprefs) => {
      this._prefsJSON = srprefs;
      // this.savePrefsToLocalStorage();
      // console.warn('consumer prefs change: ', srprefs);
    });
  }

  /** handler for graph components dataLoaded event */
  onDataLoaded(evt: any) {
      //console.log('onDataLoaded: ', evt);
  }
  /** handler for graph components dataSourcesChange event */
  onDataSourcesChange(evt: any) {
      this._showDataSourcesInFilter = evt;
  }
  onSearchException(err: Error) {
    throw (err.message);
  }

  onRequestStarted(evt: any) {
    //console.log('onRequestStarted: ', evt);
    this.uiService.spinnerActive = false;
  }
  onRequestComplete(evt: any) {
    //console.log('onRequestComplete: ', evt);
  }
  onRenderComplete(evt: any) {
    //console.log('onRenderComplete: ', evt);
    this.uiService.spinnerActive = false;
  }
  onTabClick(tabName: string) {
    switch (tabName) {
      case 'detail':
        this.showFilters = false;
        this.showEntityDetail = true;
        this._showRightRail = true;
        break;
      case 'filters':
        this.showFilters = true;
        this.showEntityDetail = false;
        this._showRightRail = true;
    }
    this.graphComponent.showFiltersControl = false;
  }

  ngOnInit() {
    this.uiService.createPdfClicked.subscribe((entityId: number) => {
      this.createPDF();
    });
    //this.uiService.graphOpen = true;

    // set up search hooks
    this.route.data
    .pipe(
      takeUntil(this.unsubscribe$),
    )
    .subscribe((data: { results: SzAttributeSearchResult[], parameters: SzEntitySearchParams }) => {
      this.currentSearchParameters = data.parameters;
      this.currentSearchResults = data.results;
      // clear out any globally stored value;
      // this.search.currentlySelectedEntityId = undefined;
    });

    // listen for global search data
    this.search.results.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((results: SzAttributeSearchResult[]) => {
      this.currentSearchResults = results;
      if(results && results.map) {
        this.graphIds = results.map((result: SzAttributeSearchResult) => result.entityId);
      }
      this.showSearchResults = (this.graphIds && this.graphIds.length > 0);
      this.uiService.spinnerActive = false;
      //console.log('Search results changed! ', this.graphIds, title);
      this.titleService.setTitle( 'Explore Networks: ' + this.search.searchTitle );
    });

    // graph prefs
    // NOTE: I had a "debounceTime" in the pipe throttle
    // change intervals, but the reality is no one is gonna be sitting
    // there incrementing prefchange values constantly. if that becomes a problem
    // add it back
    this.prefs.graph.prefsChanged.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe( this.onPrefsChange.bind(this) );

    // entity prefs
    this.prefs.entityDetail.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (prefs: any) => {
      /*
      let changedStateOnZero = false;
      if(prefs.hideGraphWhenZeroRelations && this.data && this.data.relatedEntities.length == 0){
        this.isOpen = false;
        changedStateOnZero = true;
      } else if(this.data && this.data.relatedEntities.length == 0 && this.isOpen == false) {
        this.isOpen = true;
        changedStateOnZero = true;
      }
      if(!changedStateOnZero) {
        if(!prefs.graphSectionCollapsed !== this.isOpen){
          // sync up
          this.isOpen = !prefs.graphSectionCollapsed;
        }
      }
      */
    });

    // keep track of whether or not the graph has been rendered
    // this is to get around publishing a new 0.0.7 sdk-graph-components
    // for a simple bugfix to the "rendered" property. There is a property called
    // "rendered" in the component but its not wired in to the lifecycle properly
    /*
    if(this.graphNetworkComponent){
      this.graphNetworkComponent.renderComplete.pipe(
        takeUntil(this.unsubscribe$),
        takeUntil(this._graphComponentRenderCompleted)
      ).subscribe( (ren: boolean) => {
        this._graphComponentRendered = true;
        this._graphComponentRenderCompleted.next(true);
      });
    }
    */
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.uiService.graphOpen = false;
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.renderer.removeClass(document.body, 'graph-open');
  }

  /**
   * when the graph component returns no results on its data response
   * this handler is invoked.
   * @param data
   */
  public onNoResults(data: any) {
    // when set to autocollapse on no results
    // collapse tray
    if(this.prefs.entityDetail.hideGraphWhenZeroRelations) {
      // this.isOpen = false;
    }
  }

  /** handler for when the entityId of the sdkcomponent is changed.
   * eg: when a user clicks a related entity name.
  */
  public onEntityIdChanged(entityId: number): void {
    if (this.entityId && this.entityId !== entityId) {
      // update route if needed
      this.router.navigate(['graph/' + entityId]);
    }
  }

  public toggleGraphMatchKeys(event): void {
    let _checked = false;
    if (event.target) {
      _checked = event.target.checked;
    } else if (event.srcElement) {
      _checked = event.srcElement.checked;
    }
    this.showGraphMatchKeys = _checked;
  }

  /**
   * gets a filename based on entity name for generating a pdf document.
  */
  private get pdfFileName(): string {
    const filename = 'entity';
    /*
    if ( this.entityDetailComponent.entity && this.entityDetailComponent.entity.resolvedEntity ) {
      if ( this.entityDetailComponent.entity.resolvedEntity.bestName ) {
        filename = this.entityDetailComponent.entity.resolvedEntity.bestName.replace(/ /g, '_');
      } else if (this.entityDetailComponent.entity.resolvedEntity.entityName) {
        filename = this.entityDetailComponent.entity.resolvedEntity.entityName.replace(/ /g, '_');
      }
    }
    filename = filename + '.pdf';
    */
    return filename;
  }
  /**
   * creates a PDF document from the currently visible entity
   */
  private createPDF(): void {
    const filename = this.pdfFileName;
    // this.pdfUtil.createPdfFromHtmlElement(this.entityDetailComponent.nativeElement, filename);
  }

  public onGraphEntityClick(event: any): void {
    console.log('clicked on graph entity #' + event.entityId);
    this.currentlySelectedEntityId = event.entityId;
    this.showEntityDetail = true;
    this.showFilters = false;
  }

  public toggleSpinner() {
    this.uiService.spinnerActive = !this.uiService.spinnerActive;
  }

  /**
   * open up a context menu on graph entity right-click
   */
  public onGraphContextClick(event: any): void {
    this.openContextMenu(event);
  }
  /**
   * open up a entity route from graph right click in new tab/window
  */
  public openGraphItemInNewMenu(entityId: number) {
    window.open('/entity/' + entityId, '_blank');
  }

  /**
   * create context menu for graph options
   */
  public openContextMenu(event: any) {
    // console.log('openContextMenu: ', event);
    this.closeContextMenu();
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo({ x: Math.ceil(event.x) + 80, y: Math.ceil(event.y) + 50 })
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'bottom',
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });

    this.overlayRef.attach(new TemplatePortal(this.graphContextMenu, this.viewContainerRef, {
      $implicit: event
    }));

    this.sub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter(evt => {
          const clickTarget = evt.target as HTMLElement;
          return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
        }),
        take(1)
      ).subscribe(() => this.closeContextMenu());

    return false;
  }
  /**
   * close graph context menu
   */
  closeContextMenu() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    // console.log('@senzing/sdk-components-ng/sz-entity-detail-graph.onPrefsChange(): ', prefs, this.prefs.graph);
    this._showMatchKeys = prefs.showMatchKeys;
    this.maxDegrees = prefs.maxDegreesOfSeparation;
    this.maxEntities = prefs.maxEntities;
    this.buildOut = prefs.buildOut;

    if(this.graph) {
      // update graph with new properties
      this.graph.maxDegrees = this.maxDegrees;
      this.graph.maxEntities = this.maxEntities;
      this.graph.buildOut = this.buildOut;
      //if(this._graphComponentRendered){
      //  this.reload();
      //}
    }

    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }
}
