import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';
import { EntitySearchService } from '../services/entity-search.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import {Overlay, CdkOverlayOrigin, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { AboutComponent } from '../about/about.component';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit, OnDestroy {
  // currently displayed entity detail id (if any)
  public currentlySelectedEntityId: number = undefined;

  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  @Output() showSection: EventEmitter<string> = new EventEmitter<string>();

  @Input() public prefsIsShowing =  false;
  private aboutInfoIsShowing = false;
  private overlayRef: OverlayRef;

  @ViewChild(CdkOverlayOrigin) _overlayOrigin: CdkOverlayOrigin;
  @ViewChild('poweredByOrigin') poweredByOrigin: CdkOverlayOrigin;


  constructor(
    private spinner: SpinnerService,
    public uiService: UiService,
    private router: Router,
    public overlay: Overlay,
    private search: EntitySearchService) { }

  ngOnInit() {
    this.search.entityIdChange.subscribe(
      (entityId) => {
        this.currentlySelectedEntityId = entityId;
        console.log('ToolbarComponent.onEntityIdChange: ', entityId);
    });
  }
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /** whether or not to show menu options specific to detail view */
  public get showEntityOptions() {
    return (this.search.currentlySelectedEntityId && this.search.currentlySelectedEntityId >= 0) ? true : false;
  }

  /** whether or not to show menu options specific to detail view */
  public get showGraphOptions() {
    if (this.uiService.graphOpen) {
      return true;
    } else {
      return false;
    }
  }
  public showPreferences() {
    this.showSection.emit('preferences');
    this.uiService.searchExpanded = true;
  }
  public showSearch() {
    this.showSection.emit('search');
    this.uiService.searchExpanded = true;
  }

  public get searchById(): boolean {
    return this.uiService.searchType === 'id';
  }
  public set searchById(value: boolean) {
    this.uiService.searchType = (value === true) ? 'id' : 'default';
    //this.uiService.searchType = (value) ? 'id' : 'default';
    //this.showSection.emit('searchById');
    console.log('set searchById to: ', this.searchById, value, (value === true), this.uiService.searchType);
  }

  /** true if the search tray is expanded. false if not. */
  public get ribbonExpanded() {
    return this.uiService.searchExpanded;
  }
  /** sets whether or not the search box tray is expanded */
  public set ribbonExpanded(value) {
    this.uiService.searchExpanded = value;
  }

  public get entityRouteLink() {
    return '/entity/' + this.currentlySelectedEntityId;
  }

  public get graphRouteLink() {
    return '/graph/' + this.currentlySelectedEntityId;
  }

  toggleAboutInfo() {
    // TODO(jelbourn): separate overlay demo for connected positioning.
    if( this.aboutInfoIsShowing && this.overlayRef) {
      // dispose
      this.overlayRef.detach();
      this.aboutInfoIsShowing = false;
    } else {
      if(this.overlayRef) {
        // reattach
        this.overlayRef.attach(new ComponentPortal(AboutComponent));
      } else {
        // create
        const strategy = this.overlay.position()
        .connectedTo(
            this._overlayOrigin.elementRef,
            {originX: 'end', originY: 'bottom'},
            {overlayX: 'end', overlayY: 'top'} );

        const config = new OverlayConfig({
          positionStrategy: strategy,
          width: '170px'
        });

        this.overlayRef = this.overlay.create(config);
        this.overlayRef.attach(new ComponentPortal(AboutComponent));
      }
      this.aboutInfoIsShowing = true;
    }
  }

  toggleSearch(evt?) {
    this.uiService.searchExpanded = !this.uiService.searchExpanded;
    this.showSection.emit('search');
  }
  toggleSpinner() {
    this.spinner.active = !this.spinner.active;
  }

  downloadEntityPdf() {
    this.uiService.createPdfForActiveEntity( this.search.currentlySelectedEntityId );
  }

  goHome() {
    // pop search open if its closed
    this.uiService.searchExpanded = true;
  }
}
