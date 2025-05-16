import { Component, OnInit, ViewContainerRef, OnDestroy } from '@angular/core';
import { SzPrefsService, SzBulkDataService } from '@senzing/sdk-components-ng';
import { SzBulkDataAnalysis, SzBulkLoadResult } from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { AdminBulkDataService, AdminStreamLoadSummary, AdminStreamAnalysisSummary } from '../../services/admin.bulk-data.service';
import { takeUntil } from 'rxjs/operators';

/**
 * show textual summary of data load operation.
 *
 * @example
 * <sz-bulk-data-load-summary></sz-bulk-data-load-summary>
 *
 * @export
 */
@Component({
    selector: 'admin-bulk-data-load-summary',
    templateUrl: './admin-bulk-data-load-summary.component.html',
    styleUrls: ['./admin-bulk-data-load-summary.component.scss'],
    standalone: false
})
export class AdminBulkDataLoadSummaryComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** get the file reference currently loaded in the the bulk data service */
  public get file(): File {
    if(this.adminBulkDataService) {
      return this.adminBulkDataService.currentFile;
    }
    return undefined;
  }
  /** get the file size for computer notation to display */
  public getFileSize(sizeInBytes: number): string {
    let _retVal = '';
    if(sizeInBytes > 999999999) {
      // gb
      _retVal = (sizeInBytes / 1000000000 ).toFixed(1) + ' GB';
    } else if (sizeInBytes > 999999) {
      // mb
      _retVal = (sizeInBytes / 1000000 ).toFixed(1) + ' MB';
    } else if (sizeInBytes > 999) {
      // mb
      _retVal = (sizeInBytes / 1000 ).toFixed(1) + ' KB';
    } else if(sizeInBytes > 0) {
      _retVal = sizeInBytes + ' Bytes';
    }
    return _retVal;
  }
  /** result of last analysis operation */
  public get analysis(): SzBulkDataAnalysis {
    let asStreamResult = (this.adminBulkDataService.currentAnalysisResult as AdminStreamAnalysisSummary);
    return (asStreamResult && !asStreamResult.isStreamResponse) ? this.adminBulkDataService.currentAnalysisResult as SzBulkDataAnalysis : undefined;
  }
  /** get result of load operation from service */
  public get result(): SzBulkLoadResult {
    let asStreamResult = (this.adminBulkDataService.currentLoadResult as AdminStreamLoadSummary);
    return (asStreamResult && !asStreamResult.isStreamResponse) ? this.adminBulkDataService.currentLoadResult as SzBulkLoadResult : undefined;
  }
  /** get the result of streaming load */
  public get streamResult(): AdminStreamLoadSummary {
    let asStreamResult = (this.adminBulkDataService.currentLoadResult as AdminStreamLoadSummary);
    return (asStreamResult && asStreamResult.isStreamResponse) ? this.adminBulkDataService.currentLoadResult as AdminStreamLoadSummary : undefined;
  }
  public get streamResultSentRecordCount() {
    let streamResult = this.streamResult;
    return streamResult && streamResult.receivedRecordCount && streamResult.failedRecordCount ? streamResult.receivedRecordCount - streamResult.failedRecordCount : (streamResult && streamResult.receivedRecordCount ? streamResult.receivedRecordCount : (streamResult && streamResult.sentRecordCount ? streamResult.sentRecordCount : 0));
    //return streamResult && streamResult.receivedRecordCount ? streamResult.receivedRecordCount : (streamResult && streamResult.sentRecordCount ? streamResult.sentRecordCount : 0);
  }

  constructor( public prefs: SzPrefsService,
    private adminBulkDataService: AdminBulkDataService,
    public viewContainerRef: ViewContainerRef) {}

  ngOnInit() {}
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
