import { Component, OnInit, ViewChild, Input, TemplateRef, ViewContainerRef, Output } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { EntitySearchService } from '../services/entity-search.service';
import { tap, filter, take } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { Subscription, fromEvent } from 'rxjs';
import { UiService } from '../services/ui.service';

@Component({
  selector: 'app-how',
  templateUrl: './how.component.html',
  styleUrls: ['./how.component.scss']
})
export class HowComponent {
    private _entityId: string;

    sub: Subscription;
    overlayRef: OverlayRef | null;

    /** local setter that sets selected entity at service level */
    public set entityId(value: any) {
        this._entityId = value;
    }
    /** get the currently selected entity from service level */
    public get entityId(): any {
        return this._entityId;
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private search: EntitySearchService,
        public overlay: Overlay,
        public uiService: UiService,
        public viewContainerRef: ViewContainerRef,
        private titleService: Title
        ) {
        this.route.params.subscribe( (params) => this.entityId = parseInt(params.entityId, 10) );
    }
}