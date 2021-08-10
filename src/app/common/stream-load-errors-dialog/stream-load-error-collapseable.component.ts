import { AfterViewInit, Component, EventEmitter, HostBinding, HostListener, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AdminBulkDataService, AdminStreamSummaryError } from '../../services/admin.bulk-data.service';

//import { AdminStreamConnProperties } from '../../services/admin.bulk-data.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'collapseable-stream-load-error',
    templateUrl: 'stream-load-error-collapseable.component.html',
    styleUrls: ['stream-load-error-collapseable.component.scss']
  })
  export class AdminStreamLoadCollapseableErrorComponent implements OnInit, OnDestroy, AfterViewInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _errorEncapsulation: AdminStreamSummaryError;
    private _occurrenceCount: number | undefined;
    private _collectionIndex: number;
    public _lastExpandedStateFromInput: boolean;

    @Input() public set data(value: AdminStreamSummaryError | undefined) {
        this._errorEncapsulation = value;
        console.info('AdminStreamLoadCollapseableErrorComponent.set data: ', value);
    }
    @Input() public set occurrenceCount(value: number | undefined) {
        this._occurrenceCount = value;
        console.info('AdminStreamLoadCollapseableErrorComponent.set occurrenceCount: ', value);
    }
    @Input() public set collectionIndex(value: number | undefined) {
        this._collectionIndex = value;
        console.info('AdminStreamLoadCollapseableErrorComponent.set _collectionIndex: ', value);
    }
    @Input() public set expanded(value: boolean | undefined) {
        if(value && value !== undefined) { 
            this._expanded = value; 
            this._lastExpandedStateFromInput = value;
        }
        //console.info('AdminStreamLoadCollapseableErrorComponent.set expanded: ', value);
    }
    @Output() public onExpansionChange = new EventEmitter<{index: number, value: boolean}>();

    public get occurrenceCount(): number | undefined {
        return this._occurrenceCount;
    }


    private _expanded: boolean = false;
    private truncationLimit = 400;

    @HostBinding('class.expanded')
    get isExpanded() { return this._expanded; }

    @HostListener('click', ['$event']) onHostClick(evt: Event) {
        evt.preventDefault();
        evt.stopPropagation();
        this.toggleExpanded();
    }

    public get descriptionTruncated(): string {
        let retVal = "";
        if(this._errorEncapsulation && this._errorEncapsulation.message) {
            retVal = this._errorEncapsulation.message.substring(0, this.truncationLimit);
        }
        return retVal;
    }
    public get descriptionFull(): string {
        let retVal = "";
        if(this._errorEncapsulation && this._errorEncapsulation.message) {
            retVal = this._errorEncapsulation.message;
        }
        return retVal;
    }

    public toggleExpanded() {
        this._expanded = !this._expanded;
        this.onExpansionChange.emit({index: this._collectionIndex, value: this._expanded});
    }

    constructor(
      private adminBulkDataService: AdminBulkDataService
    ) {
      console.info('AdminStreamLoadErrorsDialogComponent()', this._errorEncapsulation);
    }
    /**
     * listen for websocket service errors
     */
    ngOnInit() {
      
    }

    ngAfterViewInit() {

    }

    /**
     * unsubscribe event streams
     */
    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
  }