import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { SzPrefsService, SzAdminService, SzBulkDataService } from '@senzing/sdk-components-ng';

import {
  SzBulkDataAnalysis,
  SzBulkLoadResult,
  SzDataSource
} from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material';

/**
 * Provides a visual report for a file analysis request.
 *
 * @example
 * <sz-bulk-data-analysis-report></sz-bulk-data-analysis-report>
 *
 * @export
 */
@Component({
  selector: 'admin-bulk-data-analysis-report',
  templateUrl: './admin-bulk-data-analysis-report.component.html',
  styleUrls: ['./admin-bulk-data-analysis-report.component.scss']
})
export class AdminBulkDataAnalysisReportComponent implements OnInit, OnDestroy, AfterViewInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  displayedColumns: string[] = ['dataSource', 'recordCount', 'recordsWithRecordIdCount', 'dataSourceCode'];

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
  /**
   * when the user changes the file dest for a datasource
   * this is updated to reflect src to target
  */
  // public _dataSourceMap: { [key: string]: string };
  /** whether or not a file is being analyzed */
  public get analyzingFile() {
    return this.bulkDataService.isAnalyzingFile;
  }
  /** whether or not a file is being loaded */
  public get loadingFile() {
    return this.bulkDataService.isLoadingFile;
  }
  constructor( public prefs: SzPrefsService,
    private adminService: SzAdminService,
    private bulkDataService: SzBulkDataService) {}

    ngOnInit() {
      this.adminService.onServerInfo.pipe(
        takeUntil( this.unsubscribe$ )
      ).subscribe((info) => {
        //console.log('SzBulkDataAnalysisReportComponent.ServerInfo obtained: ', info);
      });
    }

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }

    ngAfterViewInit() {}
    /** get the current datasources from the service */
    public get dataSources(): string[] {
      if(this.bulkDataService && this.bulkDataService._dataSources) {
        return this.bulkDataService._dataSources;
      }
      return undefined;
    }

    /** when user changes the destination for a datasource */
    public handleDataSourceChange(fromDataSource: string, toDataSource: string) {
      this.bulkDataService.changeDataSourceName(fromDataSource, toDataSource);
    }
}
