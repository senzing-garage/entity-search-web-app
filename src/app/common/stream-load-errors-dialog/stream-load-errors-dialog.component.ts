import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WebSocketService } from '../../services/websocket.service';
import { AdminBulkDataService, AdminStreamSummaryError } from '../../services/admin.bulk-data.service';

import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'stream-load-errors-dialog',
    templateUrl: 'stream-load-errors-dialog.component.html',
    styleUrls: ['stream-load-errors-dialog.component.scss'],
    standalone: false
})
  export class AdminStreamLoadErrorsDialogComponent implements OnDestroy, AfterViewInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private expandedStateStore = {};

    constructor(
      public dialogRef: MatDialogRef<AdminStreamLoadErrorsDialogComponent>,
      private webSocketService: WebSocketService,
      private adminBulkDataService: AdminBulkDataService,
      @Inject(MAT_DIALOG_DATA) public data: [{error?: AdminStreamSummaryError, occurrenceCount?: number}]) {
      
    }

    public get totalCount(): number | undefined {
      let retVal = undefined;
      if(this.data && this.data.length > 0 && this.data.forEach) {
        retVal = 0;
        this.data.forEach((value) => {
          if(value && value.occurrenceCount) {
            retVal = retVal + value.occurrenceCount;
          } else {
            retVal++;
          }
        });
      }
      return retVal
    }

    public get dataReverseOrder(): {error?: AdminStreamSummaryError, occurrenceCount?: number}[] {
      return this.data && this.data.reverse ? this.data.reverse() : this.data;
    }

    public getExpandedStateFromIndex(indexPos: number): boolean {
      let retVal = false;
      if(this.expandedStateStore && this.expandedStateStore[ (indexPos) ] !== undefined) {
        retVal = this.expandedStateStore[ (indexPos) ];
      }
      return retVal;
    }

    ngAfterViewInit() {
      // grab any updates coming from service so we're up to date
      this.adminBulkDataService.onStreamLoadErrors.pipe(
        takeUntil(this.unsubscribe$),
        /** only bother updating if we have new errors */
        filter((errors: [{error?: AdminStreamSummaryError, occurrenceCount?: number}]) => {
          return errors.length !== this.data.length;
        }),
        debounceTime(2000)
      ).subscribe((errors: [{error?: AdminStreamSummaryError, occurrenceCount?: number}]) => {
        this.data = errors;
      });
    }

    /**
     * unsubscribe event streams
     */
    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
  
    onNoClick(): void {
      this.dialogRef.close();
    }

    public onItemExpandedStateChange(expansionStateChangeEvent: {index: number, value: boolean}) {
      if( this.expandedStateStore && expansionStateChangeEvent && expansionStateChangeEvent.index ) {
        this.expandedStateStore[ (expansionStateChangeEvent.index) ] = expansionStateChangeEvent.value;
      }
    }
  }