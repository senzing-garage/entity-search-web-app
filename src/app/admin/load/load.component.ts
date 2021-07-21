import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzBulkDataAnalysis, SzBulkLoadResult } from '@senzing/rest-api-client-ng';
import { MatDialog } from '@angular/material/dialog';

import { AdminStreamConnDialogComponent } from '../../common/stream-conn-dialog/stream-conn-dialog.component';
import { AdminBulkDataService, AdminStreamAnalysisSummary, AdminStreamLoadSummary } from '../../services/admin.bulk-data.service';
import { AdminStreamAnalysisConfig, AdminStreamConnProperties, AdminStreamLoadConfig } from '@senzing/sdk-components-ng';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AboutInfoService } from '../../services/about.service';
import { AdminBulkDataLoadComponent } from '../bulk-data/admin-bulk-data-load.component';
@Component({
  selector: 'admin-data-loader',
  templateUrl: './load.component.html',
  styleUrls: ['./load.component.scss']
})
export class AdminDataLoaderComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  
  /** after selecting switch to use stream
   * we set the connection properties of admin streaming
   */
  public set useSocketStream(value: boolean) {
    if(value) {
      // run new connection test, so clear out previous value
      this.adminBulkDataService.streamConnectionProperties.connectionTest = false;
      // do we have connection properties
      //if(!this.adminBulkDataService.streamConnectionProperties.connected) {
        // open configuration modal
        const dialogRef = this.dialog.open(AdminStreamConnDialogComponent, {
          width: '600px',
          data: {
            streamConnectionProperties: this.adminBulkDataService.streamConnectionProperties,
            streamAnalysisConfig: this.adminBulkDataService.streamAnalysisConfig,
            streamLoadConfig: this.adminBulkDataService.streamLoadConfig,
          }
        });
        dialogRef.afterClosed().subscribe((result: {
            streamConnectionProperties: AdminStreamConnProperties,
            streamAnalysisConfig: AdminStreamAnalysisConfig,
            streamLoadConfig: AdminStreamLoadConfig
          } | undefined) => {
          console.log(`Dialog result: `, result);
          this.adminBulkDataService.streamBulkPrefSet = true;
          if(result && result.streamAnalysisConfig) {
            this.adminBulkDataService.streamAnalysisConfig = result.streamAnalysisConfig;
          }
          if(result && result.streamLoadConfig) {
            this.adminBulkDataService.streamLoadConfig = result.streamLoadConfig;
          }
          if(result && result.streamConnectionProperties){
            this.adminBulkDataService.streamConnectionProperties = result.streamConnectionProperties;
          } else {
            this.adminBulkDataService.useStreamingForLoad = false;
          }
          this.adminBulkDataService.streamBulkPrefSet = false;
        });
      //}
    }
    this.adminBulkDataService.useStreamingForLoad = value;
  }
  public get useSocketStream() {
    return this.adminBulkDataService.useStreamingForLoad && this.aboutInfoService.isPocServerInstance;
  }
  /** if the server is not an instance of the POC server don't show stream connection controls */
  public get canUseSocketStream(): boolean {
    return this.aboutInfoService.isPocServerInstance;
  }

  /** result of last analysis operation */
  public get analysis(): SzBulkDataAnalysis | AdminStreamAnalysisSummary {
    return this.adminBulkDataService.currentAnalysisResult;
  }
  /** get result of load operation from service */
  public get result(): SzBulkLoadResult | AdminStreamLoadSummary {
    return this.adminBulkDataService.currentLoadResult;
  }
  /** whether or not a file is being analysed */
  public get analyzingFile(): boolean {
    return this.adminBulkDataService.isAnalyzingFile;
  }
  /** whenther or not a file is being loaded */
  public get loadingFile(): boolean {
    return this.adminBulkDataService.isLoadingFile;
  }
  public get currentError(): Error {
    return this.adminBulkDataService.currentError;
  }

  public get streamConnected(): boolean {
    return this.adminBulkDataService.streamConnected;
  }

  public setStreamState(connected: boolean) {
    if(!this.adminBulkDataService.streamConnected && connected) {
      // attempt reconnect manually
      this.adminBulkDataService.reconnectStream();
    } else if(this.adminBulkDataService.streamConnected && !connected) {
      // disconnect stream manually
      this.adminBulkDataService.disconnectStream();
    }
  }

  @ViewChild('adminBulkDataLoadRef')
  private adminBulkDataLoadRef: AdminBulkDataLoadComponent;

  /**
   * on file drop handler
   */
   onFileDropped(files: FileList) {
    console.log('onFileDropped: ', event);
    this.adminBulkDataLoadRef.setFileInputOnDrop(files);
  }

  /** upload a file for analytics */
  public chooseFileInput(event?: Event) {
    this.adminBulkDataLoadRef.chooseFileInput(event);
    /*
    if(this.filePicker && this.filePicker.nativeElement) {
      try {
        this.filePicker.nativeElement.click();
      } catch(e) {
        console.warn('AdminBulkDataLoadComponent.filePicker.nativeElement.click error', e);
      }
    } else {
      console.warn('AdminBulkDataLoadComponent.filePicker.nativeElement missing');
    }
    */
  }

  constructor(
    private titleService: Title,
    public adminBulkDataService: AdminBulkDataService,
    public aboutInfoService: AboutInfoService,
    public dialog: MatDialog
    ) { 
      this.adminBulkDataService.onCurrentFileChange.pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe((file) => {
        console.warn('adminBulkDataService.onCurrentFileChange: ', file);
      });
    }

  ngOnInit() {
    // set page title
    this.titleService.setTitle( 'Admin Area - Bulk Import' );

    this.adminBulkDataService.onError.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((err) => {
      if(!this.adminBulkDataService.currentError) { this.adminBulkDataService.currentError = err; }
      console.warn('AdminDataLoaderComponent.onInit SHOW Err MSG: ', err, this.currentError);
      //this.currentError = err;
    });
  }

  /**
   * unsubscribe event streams
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
