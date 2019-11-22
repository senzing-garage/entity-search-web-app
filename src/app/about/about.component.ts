import { Component, OnInit, ViewChild, Input, TemplateRef, ViewContainerRef, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntitySearchService } from '../services/entity-search.service';
import { tap, filter, take } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription, fromEvent } from 'rxjs';
import { SzEntityDetailComponent, SzPdfUtilService } from '@senzing/sdk-components-ng';
import { UiService } from '../services/ui.service';
import { AboutInfoService } from '../services/about.service';
/**
 * a component to display dependency version info
 * for diagnostics.
 *
 * @export
 * @class AboutComponent
 */
@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  constructor(public aboutService: AboutInfoService) {}
}
