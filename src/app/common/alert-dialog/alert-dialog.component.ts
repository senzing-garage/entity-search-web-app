import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { WebSocketService } from '../../services/websocket.service';
import { AdminBulkDataService } from '../../services/admin.bulk-data.service';
import { AdminStreamConnProperties, AdminStreamAnalysisConfig, AdminStreamLoadConfig } from '../models/AdminStreamConnection';
import { Subject } from 'rxjs';

@Component({
    selector: 'alert-dialog',
    templateUrl: 'alert-dialog.component.html',
    styleUrls: ['alert-dialog.component.scss']
  })
  export class AlertDialogComponent implements OnInit, OnDestroy, AfterViewInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    public testStatus = "";
    public isTesting  = false;
    public title = "Alert";
    public message = '';
    public okButtonText = "Ok";
    public cancelButtonText = "Cancel";
    public showOkButton = true;
    public showCancelButton = false;

    constructor(
      public dialogRef: MatDialogRef<AlertDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {
        title: string,
        message: string,
        okText?: string,
        cancelText?: string,
        showOkButton?: boolean,
        showCancelButton?: boolean
      }) {
      this.title = (data && data.title) ? data.title : this.title;
      this.message = (data && data.message) ? data.message : this.message;
      this.okButtonText = (data && data.okText) ? data.okText : this.okButtonText;
      this.cancelButtonText = (data && data.cancelText) ? data.cancelText : this.cancelButtonText;
      this.showOkButton = (data && data.showOkButton !== undefined) ? data.showOkButton : this.showOkButton;
      this.showCancelButton = (data && data.showCancelButton !== undefined) ? data.showCancelButton : this.showCancelButton;
    }
    /**
     * listen for websocket service errors
     */
    ngOnInit() {
      
    }

    ngAfterViewInit() {}

    /**
     * unsubscribe event streams
     */
    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
  
    onNoClick(): void {
      this.dialogRef.close(false);
    }
    onOkClick(): void {
      this.dialogRef.close(true)
    }
  }