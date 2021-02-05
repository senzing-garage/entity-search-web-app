import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzBulkDataService } from '@senzing/sdk-components-ng';
import { SzBulkDataAnalysis, SzBulkLoadResult } from '@senzing/rest-api-client-ng';
import { WebSocketService } from 'src/app/services/websocket.service';
import { MatDialog } from '@angular/material/dialog';
import { AdminStreamConnDialogComponent, AdminStreamConnProperties } from '../../common/stream-conn-dialog/stream-conn-dialog.component';

@Component({
  selector: 'admin-data-loader',
  templateUrl: './load.component.html',
  styleUrls: ['./load.component.scss']
})
export class AdminDataLoaderComponent implements OnInit {

  private _useSocketStream: boolean = false;
  public get useSocketStream() {
    return this._useSocketStream;
  }
  public set useSocketStream(value: boolean) {
    this._useSocketStream = value;
    if(value) {
      // do we have connection properties
      if(!this.webSocketService.connectionProperties.connected) {
        // open configuration modal
        const dialogRef = this.dialog.open(AdminStreamConnDialogComponent, {
          width: '600px',
          data: this.webSocketService.connectionProperties
        });

        dialogRef.afterClosed().subscribe((result: AdminStreamConnProperties | undefined) => {
          console.log(`Dialog result: `, result);
          if(result){
            this.webSocketService.connectionProperties = (result as AdminStreamConnProperties)
          } else {
            this._useSocketStream = false;
          }
          this.webSocketService.connectionProperties.connected = false;
          this.webSocketService.close();
        });
      } else {
        // just run conn test
      }
    } else {
      this.webSocketService.connectionProperties.connected = false;
    }
  }
  private _canOpenStreamSocket: boolean = false;
  public get canOpenStreamSocket() {
    return this._canOpenStreamSocket;
  }
  public set canOpenStreamSocket(value: boolean) {
    this._canOpenStreamSocket = value;
  }
  /** result of last analysis operation */
  public get analysis(): SzBulkDataAnalysis {
    return this.bulkDataService.currentAnalysis;
  }
  /** get result of load operation from service */
  public get result(): SzBulkLoadResult {
    return this.bulkDataService.currentLoadResult;
  }
  /** whether or not a file is being analysed */
  public get analyzingFile(): boolean {
    return this.bulkDataService.isAnalyzingFile;
  }
  /** whenther or not a file is being loaded */
  public get loadingFile(): boolean {
    return this.bulkDataService.isLoadingFile;
  }
  public get currentError(): Error {
    return this.bulkDataService.currentError;
  }

  constructor(
    private titleService: Title,
    public bulkDataService: SzBulkDataService,
    private webSocketService: WebSocketService,
    public dialog: MatDialog
    ) { }

  ngOnInit() {
    // set page title
    this.titleService.setTitle( 'Admin Area - Bulk Import' );

    this.bulkDataService.onError.subscribe((err) => {
      if(!this.bulkDataService.currentError) { this.bulkDataService.currentError = err; }
      console.warn('AdminDataLoaderComponent.onInit SHOW Err MSG: ', err, this.currentError);
      //this.currentError = err;
    });
  }

}
