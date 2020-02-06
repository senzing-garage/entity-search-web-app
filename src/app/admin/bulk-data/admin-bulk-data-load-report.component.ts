import { Component, OnInit, OnDestroy } from '@angular/core';
import { SzBulkDataService } from '@senzing/sdk-components-ng';
import { SzBulkDataAnalysis, SzBulkLoadResult } from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';

/**
 * show tabular results for an analytics operation.
 *
 * @example
 * <sz-bulk-data-load-report></sz-bulk-data-load-report>
 *
 * @export
 */
@Component({
  selector: 'admin-bulk-data-load-report',
  templateUrl: './admin-bulk-data-load-report.component.html',
  styleUrls: ['./admin-bulk-data-load-report.component.scss']
})
export class AdminBulkDataLoadReportComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  displayedColumns: string[] = ['dataSource', 'recordCount', 'loadedRecordCount', 'failedRecordCount', 'incompleteRecordCount'];
  /** get the file reference currently loaded in the the bulk data service */
  public get file(): File {
    if(this.bulkDataService) {
      return this.bulkDataService.currentFile;
    }
    return undefined;
  }
  /** result of last analysis operation */
  public get analysis(): SzBulkDataAnalysis {
    return this.bulkDataService.currentAnalysis;
  }
  /** get result of load operation from service */
  public get result(): SzBulkLoadResult {
    return this.bulkDataService.currentLoadResult;
  }

  constructor(private bulkDataService: SzBulkDataService) {}

  ngOnInit() {}
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
