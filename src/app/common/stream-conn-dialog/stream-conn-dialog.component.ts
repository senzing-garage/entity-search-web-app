import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WebSocketService } from '../../services/websocket.service';
import { AdminBulkDataService } from '../../services/admin.bulk-data.service';

//import { AdminStreamConnProperties } from '../../services/admin.bulk-data.service';
import { AdminStreamConnProperties, AdminStreamAnalysisConfig, AdminStreamLoadConfig, AdminStreamUploadRates } from '@senzing/sdk-components-ng';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'stream-conn-dialog',
    templateUrl: 'stream-conn-dialog.component.html',
    styleUrls: ['stream-conn-dialog.component.scss']
  })
  export class AdminStreamConnDialogComponent implements OnInit, OnDestroy, AfterViewInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    
    public set streamHost(value: string) {
      this.data.streamConnectionProperties.hostname = value;
    }
    public get streamHost() {
      return this.data.streamConnectionProperties.hostname;
    }
    public set streamPort(value: number) {
      this.data.streamConnectionProperties.port = value;
    }
    public get streamPort() {
      return this.data.streamConnectionProperties.port;
    }
    public get streamReconnect(): boolean {
      return this.data.streamConnectionProperties.reconnectOnClose;
    }
    public set streamReconnect(value: boolean) {
      this.data.streamConnectionProperties.reconnectOnClose = value;
    }
    public get streamReconnectionAttempts() {
      return (this.data && this.data.streamConnectionProperties && this.data.streamConnectionProperties.reconnectConsecutiveAttemptLimit) ? this.data.streamConnectionProperties.reconnectConsecutiveAttemptLimit : -2;
    }
    public set streamReconnectionAttempts(value: number) {
      this.data.streamConnectionProperties.reconnectConsecutiveAttemptLimit = value;
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
    public get wsLoadUploadRate() {
      return (this.data && this.data.streamLoadConfig && this.data.streamLoadConfig.uploadRate) ? this.data.streamLoadConfig.uploadRate : -1;
    }
    public set wsLoadUploadRate(value: number) {
        this.data.streamLoadConfig.uploadRate = value;
    }
    public get wsConnectionIsValid(): boolean {
      return (this.data && this.data.streamConnectionProperties && this.data.streamConnectionProperties.connectionTest) ?  this.data.streamConnectionProperties.connectionTest : false;
    }

    public get autoCreateMissingDataSources(): boolean {
      return (this.data && this.data.streamLoadConfig && this.data.streamLoadConfig.autoCreateMissingDataSources) ? true : false;
    }
    public set autoCreateMissingDataSources(value: boolean) {
      this.data.streamLoadConfig.autoCreateMissingDataSources = value;
    }
    public get mapEmptyDataSourcesTo(): string {
      return (this.data && this.data.streamLoadConfig && this.data.streamLoadConfig.assignMissingDataSourceRecordsToStaticTarget) ? (this.data.streamLoadConfig.assignMissingDataSourceRecordsToStaticTarget as string) : "";
    }
    public set mapEmptyDataSourcesTo(value: string) {
      this.data.streamLoadConfig.assignMissingDataSourceRecordsToStaticTarget = value;
    }
    private _mapEmptyDataSourcesToValue = false;
    public get mapEmptyDataSourcesToValue(): boolean {
      return this._mapEmptyDataSourcesToValue;
    }
    public set mapEmptyDataSourcesToValue(value: boolean) {
      this._mapEmptyDataSourcesToValue = value;
    }

    public wsAnalysisSampleSizes = [
      100,
      500,
      1000,
      5000,
      10000,
      20000,
      50000,
      100000
    ];
    public wsReconnectionAttemptsOptions = [
      {value: -2, text: 'unlimited'},
      {value: -1, text: 'none'},
      {value: 1, text: '1'},
      {value: 2, text: '2'},
      {value: 3, text: '3'},
      {value: 5, text: '5'},
      {value: 10, text: '10'},
      {value: 20, text: '20'}
    ]

    /** available upload rates */
    private _wsLoadUploadRates = [];
    public get wsLoadUploadRates(): {key: string, value: number}[] {
      let retValues = this._wsLoadUploadRates;
      if(retValues && retValues.length <= 0) {
        for(let key in AdminStreamUploadRates) {
          this._wsLoadUploadRates.push( { 'key': key, 'value': AdminStreamUploadRates[key] } );
        }
        retValues = this._wsLoadUploadRates;
      }
      return retValues;
    }

    public testStatus = "";
    public isTesting  = false;

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
            sampleSize: 10000,
            uploadRate: -1
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
          this.data.streamLoadConfig = {
            autoCreateMissingDataSources: false,
            uploadRate: -1
          }
        }
      }
      if(this.data && this.data.streamConnectionProperties && this.data.streamConnectionProperties.connectionTest) {
        this.data.streamConnectionProperties.connectionTest = false;
      }
    }
    /**
     * listen for websocket service errors
     */
    ngOnInit() {
      this.webSocketService.onError.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe((error: Error) => {
        if(this.isTesting) {
          this.isTesting  = false;
          this.testStatus = 'Test failed';
          this.data.streamConnectionProperties.connectionTest = false;
        }
      });
    }

    ngAfterViewInit() {
      if(this.data && this.data.streamLoadConfig && this.data.streamLoadConfig.assignMissingDataSourceRecordsToStaticTarget !== undefined) {
        this._mapEmptyDataSourcesToValue = true;
      }
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
 
    public testConnection(event: Event) {
      this.testStatus = "Opening Connection.."
      this.isTesting  = true;
      this.webSocketService.testConnection(this.data.streamConnectionProperties).subscribe((isValid: boolean) => {
        if(isValid) {
          this.data.streamConnectionProperties.connectionTest = true;
          this.isTesting = false;
          this.testStatus = "Connection Opened Successfully"
          setTimeout(() => {
            // hide status message
            this.testStatus = "Closing Connection.."
            setTimeout(() => {
              this.testStatus = undefined;
              this.isTesting = false;
            }, 2000);
          }, 10000)
        } else {
          this.data.streamConnectionProperties.connectionTest = false;
          this.isTesting = false;
        }
      }, (error: Error) => {
        console.warn('error');
        this.isTesting = false;
        this.data.streamConnectionProperties.connectionTest = false;

      })
    }
    public abortTest(event: Event) {
      this.isTesting = false;
    }
  }