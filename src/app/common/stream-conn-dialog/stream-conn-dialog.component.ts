import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WebSocketService } from '../../services/websocket.service';
//import { AdminStreamConnProperties } from '../../services/admin.bulk-data.service';
import { AdminStreamConnProperties } from '@senzing/sdk-components-ng';

@Component({
    selector: 'stream-conn-dialog',
    templateUrl: 'stream-conn-dialog.component.html',
    styleUrls: ['stream-conn-dialog.component.scss']
  })
  export class AdminStreamConnDialogComponent {
    public set streamHost(value: string) {
      this.data.hostname = value;
    }
    public get streamHost() {
      return this.data.hostname;
    }
    public get wsUUID(): string {
      return this.data.clientId;
    }
    public set wsUUID(value: string) {
      this.data.clientId = value;
    }
  
    public get wsAnalysisSampleSize() {
        return (this.data.sampleSize) ? this.data.sampleSize : 1000;
    }
    public set wsAnalysisSampleSize(value: number) {
        this.data.sampleSize = value;
    }

    public wsAnalysisSampleSizes = [
      100,
      1000,
      10000,
      100000
    ];

    public testStatus = "";

    constructor(
      public dialogRef: MatDialogRef<AdminStreamConnDialogComponent>,
      private webSocketService: WebSocketService,
      @Inject(MAT_DIALOG_DATA) public data: AdminStreamConnProperties) {
      if(this.data && this.data.connectionTest) {
        this.data.connectionTest = false;
      }
    }
  
    onNoClick(): void {
      this.dialogRef.close();
    }
 
    public testConnection(event: Event) {
      this.testStatus = "Opening Connection.."
      this.webSocketService.testConnection(this.data).subscribe((isValid: boolean) => {
        if(isValid) {
          this.data.connectionTest = true;
          this.testStatus = "Connection Opened Successfully"
          setTimeout(() => {
            // hide status message
            this.testStatus = "Closing Connection.."
            setTimeout(() => {
              this.testStatus = undefined;
            }, 2000);
          }, 10000)
        } else {
          this.data.connectionTest = false;
        }
      })
    }
  }