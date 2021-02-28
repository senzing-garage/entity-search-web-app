import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WebSocketService } from '../../services/websocket.service';
import { AdminBulkDataService } from '../../services/admin.bulk-data.service';

//import { AdminStreamConnProperties } from '../../services/admin.bulk-data.service';
import { AdminStreamConnProperties, AdminStreamAnalysisConfig, AdminStreamLoadConfig } from '@senzing/sdk-components-ng';

@Component({
    selector: 'stream-conn-dialog',
    templateUrl: 'stream-conn-dialog.component.html',
    styleUrls: ['stream-conn-dialog.component.scss']
  })
  export class AdminStreamConnDialogComponent {
    public set streamHost(value: string) {
      this.data.streamConnectionProperties.hostname = value;
    }
    public get streamHost() {
      return this.data.streamConnectionProperties.hostname;
    }
    public get wsUUID(): string {
      return this.data.streamConnectionProperties.clientId;
    }
    public set wsUUID(value: string) {
      this.data.streamConnectionProperties.clientId = value;
    }
    public get wsAnalysisSampleSize() {
        return (this.data && this.data.streamAnalysisConfig && this.data.streamAnalysisConfig.sampleSize) ? this.data.streamAnalysisConfig.sampleSize : 1000;
    }
    public set wsAnalysisSampleSize(value: number) {
        this.data.streamAnalysisConfig.sampleSize = value;
    }
    public get wsConnectionIsValid(): boolean {
      return (this.data && this.data.streamConnectionProperties && this.data.streamConnectionProperties.connectionTest) ?  this.data.streamConnectionProperties.connectionTest : false;
    }

    public wsAnalysisSampleSizes = [
      100,
      1000,
      5000,
      10000,
      20000,
      50000,
      100000
    ];

    public testStatus = "";

    constructor(
      public dialogRef: MatDialogRef<AdminStreamConnDialogComponent>,
      private webSocketService: WebSocketService,
      private adminBulkDataService: AdminBulkDataService,
      @Inject(MAT_DIALOG_DATA) public data: {
        streamConnectionProperties: AdminStreamConnProperties,
        streamAnalysisConfig: AdminStreamAnalysisConfig,
        streamLoadConfig: AdminStreamLoadConfig
      }) {
      console.info('AdminStreamConnDialogComponent()', this.data);
      if(!this.data) {
        this.data = {
          streamConnectionProperties: this.adminBulkDataService.streamConnectionProperties,
          streamAnalysisConfig: this.adminBulkDataService.streamAnalysisConfig,
          streamLoadConfig: this.adminBulkDataService.streamLoadConfig,
        }
      } else {
        // make sure each node has an initialized value
        if(!this.data.streamAnalysisConfig) {
          this.data.streamAnalysisConfig = {
            sampleSize: 10000
          }
        }
        if(!this.data.streamConnectionProperties) {
          this.data.streamConnectionProperties = {
            "hostname": 'localhost:8555',
            "connected": false,
            "connectionTest": false,
            "reconnectOnClose": false,
            "reconnectConsecutiveAttemptLimit": 10
          }
        }
        if(!this.data.streamLoadConfig) {
          this.data.streamLoadConfig.autoCreateMissingDataSources = false;
        }
      }
      if(this.data && this.data.streamConnectionProperties && this.data.streamConnectionProperties.connectionTest) {
        this.data.streamConnectionProperties.connectionTest = false;
      }
    }
  
    onNoClick(): void {
      this.dialogRef.close();
    }
 
    public testConnection(event: Event) {
      this.testStatus = "Opening Connection.."
      this.webSocketService.testConnection(this.data.streamConnectionProperties).subscribe((isValid: boolean) => {
        if(isValid) {
          this.data.streamConnectionProperties.connectionTest = true;
          this.testStatus = "Connection Opened Successfully"
          setTimeout(() => {
            // hide status message
            this.testStatus = "Closing Connection.."
            setTimeout(() => {
              this.testStatus = undefined;
            }, 2000);
          }, 10000)
        } else {
          this.data.streamConnectionProperties.connectionTest = false;
        }
      })
    }
  }