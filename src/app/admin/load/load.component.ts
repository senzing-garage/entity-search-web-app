import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzBulkDataAnalysis, SzBulkLoadResult } from '@senzing/rest-api-client-ng';
import { MatDialog } from '@angular/material/dialog';

import { AdminStreamConnDialogComponent } from '../../common/stream-conn-dialog/stream-conn-dialog.component';
import { AdminBulkDataService, AdminStreamConnProperties, AdminStreamLoadSummary } from '../../services/admin.bulk-data.service';

@Component({
  selector: 'admin-data-loader',
  templateUrl: './load.component.html',
  styleUrls: ['./load.component.scss']
})
export class AdminDataLoaderComponent implements OnInit {
  /** after selecting switch to use stream
   * we set the connection properties of admin streaming
   */
  public set useSocketStream(value: boolean) {
    this.adminBulkDataService.useStreamingForLoad = value;
    if(value) {
      // do we have connection properties
      if(!this.adminBulkDataService.streamConnectionProperties.connected) {
        // open configuration modal
        const dialogRef = this.dialog.open(AdminStreamConnDialogComponent, {
          width: '600px',
          data: this.adminBulkDataService.streamConnectionProperties
        });

        dialogRef.afterClosed().subscribe((result: AdminStreamConnProperties | undefined) => {
          console.log(`Dialog result: `, result);
          if(result){
            this.adminBulkDataService.streamConnectionProperties = (result as AdminStreamConnProperties)
          } else {
            this.adminBulkDataService.useStreamingForLoad = false;
          }
          this.adminBulkDataService.streamConnectionProperties.connected = false;
        });
      } else {
        // just run conn test
      }
    } else {
      this.adminBulkDataService.streamConnectionProperties.connected = false;
    }
  }
  public get useSocketStream() {
    return this.adminBulkDataService.useStreamingForLoad;
  }

  /** result of last analysis operation */
  public get analysis(): SzBulkDataAnalysis {
    return this.adminBulkDataService.currentAnalysis;
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

  constructor(
    private titleService: Title,
    private adminBulkDataService: AdminBulkDataService,
    public dialog: MatDialog
    ) { }

  ngOnInit() {
    // set page title
    this.titleService.setTitle( 'Admin Area - Bulk Import' );

    this.adminBulkDataService.onError.subscribe((err) => {
      if(!this.adminBulkDataService.currentError) { this.adminBulkDataService.currentError = err; }
      console.warn('AdminDataLoaderComponent.onInit SHOW Err MSG: ', err, this.currentError);
      //this.currentError = err;
    });
  }

}
