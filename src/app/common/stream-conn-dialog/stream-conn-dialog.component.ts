import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WebSocketService } from '../../services/websocket.service';
import { AdminBulkDataService } from '../../services/admin.bulk-data.service';
import { SzWebAppConfigService } from '../../services/config.service';

import { AdminStreamConnProperties, AdminStreamAnalysisConfig, AdminStreamLoadConfig, AdminStreamUploadRates } from '../../common/models/AdminStreamConnection';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { getHostnameFromUrl, getPortFromUrl } from '../../common/url-utilities';

@Component({
    selector: 'stream-conn-dialog',
    templateUrl: 'stream-conn-dialog.component.html',
    styleUrls: ['stream-conn-dialog.component.scss'],
    standalone: false
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
    public set streamPath(value: string) {
      this.data.streamConnectionProperties.path = value;
    }
    public get streamPath() {
      return this.data.streamConnectionProperties.path;
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
    public get wsLoadUploadRate() {
      return (this.data && this.data.streamLoadConfig && this.data.streamLoadConfig.uploadRate) ? this.data.streamLoadConfig.uploadRate : -1;
    }
    public set wsLoadUploadRate(value: number) {
        this.data.streamLoadConfig.uploadRate = value;
    }
    public get wsConnectionIsValid(): boolean {
      return (this.data && this.data.streamConnectionProperties && this.data.streamConnectionProperties.connectionTest) ?  this.data.streamConnectionProperties.connectionTest : false;
    }

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
          if(key !== 'unlimited'){
            this._wsLoadUploadRates.push( { 'key': key, 'value': AdminStreamUploadRates[key] } );
          }
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
      private webappConfigService: SzWebAppConfigService,
      @Inject(MAT_DIALOG_DATA) public data: {
        streamConnectionProperties: AdminStreamConnProperties,
        streamAnalysisConfig: AdminStreamAnalysisConfig,
        streamLoadConfig: AdminStreamLoadConfig
      }) {
      //console.info('AdminStreamConnDialogComponent()', this.data, webappConfigService.pocStreamConfig);
      if(!this.data) {
        this.data = {
          streamConnectionProperties: this.adminBulkDataService.streamConnectionProperties,
          streamAnalysisConfig: this.adminBulkDataService.streamAnalysisConfig,
          streamLoadConfig: this.adminBulkDataService.streamLoadConfig,
        }
      } else {
        // make sure each node has an initialized value
        if(!this.data.streamConnectionProperties) {
          this.data.streamConnectionProperties = {
            "path": '/load-queue/bulk-data/records',
            "hostname": 'localhost:8255',
            "connected": false,
            "connectionTest": false,
            "reconnectOnClose": false,
            "reconnectConsecutiveAttemptLimit": 10
          }
        }
        if(!this.data.streamLoadConfig) {
          this.data.streamLoadConfig = {
            autoCreateMissingDataSources: false,
            uploadRate: 10000
          }
        }
      }
      if(this.data && this.data.streamConnectionProperties && this.data.streamConnectionProperties.connectionTest) {
        this.data.streamConnectionProperties.connectionTest = false;
      }
      if(webappConfigService.pocStreamConfig) {
        this.data.streamConnectionProperties.hostname = webappConfigService.pocStreamConfig.proxy ? webappConfigService.pocStreamConfig.proxy.hostname : getHostnameFromUrl( webappConfigService.pocStreamConfig.target );
        this.data.streamConnectionProperties.port     = webappConfigService.pocStreamConfig.proxy ? webappConfigService.pocStreamConfig.proxy.port : getPortFromUrl( webappConfigService.pocStreamConfig.target );

        //console.warn('overriding connection properties with defaults from "/config/pocstream"', webappConfigService.pocStreamConfig, this.data.streamConnectionProperties);
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

    ngAfterViewInit() {}

    /**
     * unsubscribe event streams
     */
    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
      this.adminBulkDataService.clearErrors();
    }
  
    onNoClick(): void {
      this.dialogRef.close();
      this.adminBulkDataService.clearErrors();
    }
 
    public testConnection(event: Event) {
      this.testStatus = "Opening Connection.."
      this.isTesting  = true;
      this.data.streamConnectionProperties.path = "/app";
      
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