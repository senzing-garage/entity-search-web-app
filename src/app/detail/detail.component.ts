import { Component, OnInit, ViewChild, Input, TemplateRef, ViewContainerRef, Output } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { EntitySearchService } from '../services/entity-search.service';
import { tap, filter, take } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription, fromEvent } from 'rxjs';
import { SzEntityDetailComponent, SzPdfUtilService } from '@senzing/sdk-components-ng';
import { UiService } from '../services/ui.service';
import {
  SzEntityData
} from '@senzing/rest-api-client-ng';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  @ViewChild('entityDetailComponent') entityDetailComponent: SzEntityDetailComponent;
  @ViewChild('graphContextMenu') graphContextMenu: TemplateRef<any>;
  public _showGraphMatchKeys = true;
  @Input() public set showGraphMatchKeys( value: boolean ) {
    this._showGraphMatchKeys = value;
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private search: EntitySearchService,
    public pdfUtil: SzPdfUtilService,
    public overlay: Overlay,
    public uiService: UiService,
    public viewContainerRef: ViewContainerRef,
    private titleService: Title
    ) {
    this.route.params.subscribe( (params) => this.entityId = parseInt(params.entityId, 10) );
  }

  ngOnInit() {
    this.uiService.createPdfClicked.subscribe((entityId: number) => {
      this.createPDF();
    });

  }

  /** handler for when the entityId of the sdkcomponent is changed.
   * eg: when a user clicks a related entity name.
  */
  public onEntityIdChanged(entityId: number): void {
    if (this.entityId && this.entityId !== entityId) {
      // update route if needed
      this.router.navigate(['entity/' + entityId]);
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
    let filename = 'entity';
    if ( this.entityDetailComponent.entity && this.entityDetailComponent.entity.resolvedEntity ) {
      if ( this.entityDetailComponent.entity.resolvedEntity.bestName ) {
        filename = this.entityDetailComponent.entity.resolvedEntity.bestName.replace(/ /g, '_');
      } else if (this.entityDetailComponent.entity.resolvedEntity.entityName) {
        filename = this.entityDetailComponent.entity.resolvedEntity.entityName.replace(/ /g, '_');
      }
    }
    filename = filename + '.pdf';
    return filename;
  }
  /**
   * creates a PDF document from the currently visible entity
   */
  private createPDF(): void {
    const filename = this.pdfFileName;
    this.pdfUtil.createPdfFromHtmlElement(this.entityDetailComponent.nativeElement, filename);
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
  /** update the page title to the entity name */
  onEntityDataChanged(data: SzEntityData) {
    const titleCaseWord = (word: string) => {
      if (!word) { return word; }
      return word[0].toUpperCase() + word.substr(1).toLowerCase();
    };
    const titleCaseSentence = (words: string) => {
      if (!words) { return words; }
      return (words.split(' ').map( titleCaseWord ).join(' '));
    };
    if(data && data.resolvedEntity) {
      if(data.resolvedEntity.entityName) {
        this.titleService.setTitle( titleCaseSentence(data.resolvedEntity.entityName) + ': Details');
      }
    }
  }
  onGraphPopout(event) {
    console.log('on graph popout: ', event);
    this.router.navigate(['graph/' + this.entityId]);
  }
}
