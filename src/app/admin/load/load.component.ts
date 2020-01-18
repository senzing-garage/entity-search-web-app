import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SzBulkDataService } from '@senzing/sdk-components-ng';
import { SzBulkDataAnalysis, SzBulkLoadResult } from '@senzing/rest-api-client-ng';

@Component({
  selector: 'admin-data-loader',
  templateUrl: './load.component.html',
  styleUrls: ['./load.component.scss']
})
export class AdminDataLoaderComponent implements OnInit {
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
    public bulkDataService: SzBulkDataService
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
