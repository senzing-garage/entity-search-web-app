import { Component, OnInit, OnDestroy } from '@angular/core';
import { SzBulkDataService } from '@senzing/sdk-components-ng';
import { SzBulkDataAnalysis, SzBulkLoadResult } from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { AdminBulkDataService, AdminStreamLoadSummary } from '../../services/admin.bulk-data.service';

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
  displayedColumnsForStream: string[] = ['dataSource', 'recordCount', 'sentRecordCount', 'failedRecordCount', 'unsentRecordCount'];
  /** get the file reference currently loaded in the the bulk data service */
  public get file(): File {
    if(this.adminBulkDataService) {
      return this.adminBulkDataService.currentFile;
    }
    return undefined;
  }
  /** result of last analysis operation */
  public get analysis(): SzBulkDataAnalysis {
    return this.adminBulkDataService.currentAnalysis;
  }
  /** get result of load operation from service */
  public get result(): SzBulkLoadResult {
    return (this.adminBulkDataService.currentLoadResult as SzBulkDataAnalysis).analysisByDataSource ? this.adminBulkDataService.currentLoadResult as SzBulkDataAnalysis : undefined;
  }
  /** get the result of streaming load */
  public get streamResult(): AdminStreamLoadSummary {
    // analysisByDataSource
    return (this.adminBulkDataService.currentLoadResult as AdminStreamLoadSummary).recordCount >= 0 ? this.adminBulkDataService.currentLoadResult as AdminStreamLoadSummary : undefined;
  }
  // reformat "streamResult" as an array so we can table-ize it
  public get streamResults() {
    return [this.streamResult];
  }

  constructor(private adminBulkDataService: AdminBulkDataService) {}

  ngOnInit() {}
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
