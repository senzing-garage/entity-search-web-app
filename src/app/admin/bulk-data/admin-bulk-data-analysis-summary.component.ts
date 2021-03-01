import { Component, OnInit, OnDestroy } from '@angular/core';
import { SzAdminService, SzBulkDataService } from '@senzing/sdk-components-ng';
import { SzBulkDataAnalysis, SzBulkLoadResult } from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminBulkDataService, AdminStreamAnalysisSummary, AdminStreamLoadSummary } from '../../services/admin.bulk-data.service';

/**
 * Provides a textual summary of a analyze file operation.
 *
 * @example
 * <sz-bulk-data-analysis-summary></sz-bulk-data-analysis-summary>
 *
 * @export
 */
@Component({
  selector: 'admin-bulk-data-analysis-summary',
  templateUrl: './admin-bulk-data-analysis-summary.component.html',
  styleUrls: ['./admin-bulk-data-analysis-summary.component.scss']
})
export class AdminBulkDataAnalysisSummaryComponent implements OnInit, OnDestroy {
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
    }
    return _retVal;
  }
  /** result of last analysis operation */
  public get analysis(): SzBulkDataAnalysis {
    return (this.adminBulkDataService.currentAnalysisResult as SzBulkDataAnalysis).analysisByDataSource ? this.adminBulkDataService.currentAnalysisResult as SzBulkDataAnalysis : undefined;
    //return this.adminBulkDataService.currentAnalysisResult;
  }
  /** get the result of streaming analysis */
  public get streamAnalysis(): AdminStreamAnalysisSummary {
    return (this.adminBulkDataService.currentAnalysisResult as AdminStreamAnalysisSummary).recordCount >= 0 ? this.adminBulkDataService.currentAnalysisResult as AdminStreamAnalysisSummary : undefined;
  }
  /** get result of load operation from service */
  public get result(): SzBulkLoadResult {
    return (this.adminBulkDataService.currentLoadResult as SzBulkDataAnalysis).analysisByDataSource ? this.adminBulkDataService.currentLoadResult as SzBulkDataAnalysis : undefined;
  }
  /** get the result of streaming load */
  public get streamResult(): AdminStreamLoadSummary {
    return (this.adminBulkDataService.currentLoadResult as AdminStreamLoadSummary).recordCount >= 0 ? this.adminBulkDataService.currentLoadResult as AdminStreamLoadSummary : undefined;
  }

  constructor(
    private adminService: SzAdminService,
    private adminBulkDataService: AdminBulkDataService) {}

  ngOnInit() {
    this.adminService.onServerInfo.pipe(
      takeUntil( this.unsubscribe$ )
    ).subscribe((info) => {
      //console.log('SzBulkDataAnalysisSummaryComponent.ServerInfo obtained: ', info);
    });
  }
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
