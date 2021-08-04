import { AfterViewInit, Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WebSocketService } from '../../services/websocket.service';
import { AdminBulkDataService } from '../../services/admin.bulk-data.service';

//import { AdminStreamConnProperties } from '../../services/admin.bulk-data.service';
import { AdminStreamConnProperties, AdminStreamAnalysisConfig, AdminStreamLoadConfig, AdminStreamUploadRates, SzQueueInfoResponse, SzQueueInfo } from '@senzing/sdk-components-ng';
import { switchMap, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, Subject, timer } from 'rxjs';

@Component({
    selector: 'stream-load-queue-info',
    templateUrl: 'stream-load-queue-info.component.html',
    styleUrls: ['stream-load-queue-info.component.scss']
  })
  export class AdminStreamLoadQueueInfoComponent implements OnInit, OnDestroy, AfterViewInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _intervalPoller;

    private _onResponseData = new BehaviorSubject<SzQueueInfo | undefined>(undefined);
    public onDataUpdated    = this._onResponseData.asObservable();
    public data: SzQueueInfo | undefined;

    private _onError        = new Subject<Error | undefined>();
    public onError          = this._onError.asObservable();
    public lastKnownError: Error | unknown | undefined;
    public lastKnownErrors: {code?: number, message?: string} | undefined;
    public showPrefetchMessage = true;

    private _interval       = 10000;
    @Input() public set interval(value) {
        if(value && value > 0){ this._interval = value; }
    }

    constructor(
      public dialogRef: MatDialogRef<AdminStreamLoadQueueInfoComponent>,
      private webSocketService: WebSocketService,
      private adminBulkDataService: AdminBulkDataService) {
      console.info('AdminStreamLoadQueueInfoComponent()');
    }
    /**
     * listen for websocket service errors
     */
    ngOnInit() {
        this.onDataUpdated.pipe(
            takeUntil( this.unsubscribe$ )
        ).subscribe((data) => {
            this.lastKnownError = undefined;
            this.data = data;
        });
        this.onError.pipe(
            takeUntil( this.unsubscribe$ )
        ).subscribe((error) => {
            this.lastKnownError = error;
            if(error && (error as any).error && (error as any).error.errors && (error as any).error.errors.length > 0) {
                this.lastKnownErrors = (error as any).error.errors;
            } else {
                console.log('cant set last known error', (error as any).error.errors, (error as any));
            }
            this.data = undefined;
        })
    }

    ngAfterViewInit() {
        this.startPolling();
    }

    /**
     * unsubscribe event streams
     */
    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }

    private onPollingResponse(data: SzQueueInfoResponse) {
        console.log('AdminStreamLoadQueueInfoComponent: ', data);
        this.showPrefetchMessage = false;
        if(data && data.data && this._onResponseData && this._onResponseData.next){
            this._onResponseData.next( data.data );
        } else if(!this._onResponseData || (this._onResponseData && !this._onResponseData.next)) {
            console.error('cannot broadwave error: ', this);
        }
    }
    private onErrorResponse(error) {
        this.showPrefetchMessage = false;
        console.warn('AdminStreamLoadQueueInfoComponent Error: ', error, this.onError, this);
        this._onError.next(error);
    }

    private startPolling() {
        console.info('AdminStreamLoadQueueInfoComponent.startPolling: ', this._interval);
        this._intervalPoller = timer(0, this._interval).pipe(
            takeUntil(this.unsubscribe$),
            switchMap( _ => { return this.adminBulkDataService.getStreamLoadQueue(); })
        ).subscribe( this.onPollingResponse.bind(this), this.onErrorResponse.bind(this) )
    }
  }