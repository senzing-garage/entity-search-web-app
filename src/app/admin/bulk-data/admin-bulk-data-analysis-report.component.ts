import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { SzPrefsService, SzAdminService, SzBulkDataService } from '@senzing/sdk-components-ng';

import {
  SzBulkDataAnalysis,
  SzBulkLoadResult,
  SzEntityTypeRecordAnalysis
} from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
//import { MatTableDataSource } from '@angular/material/table';

export interface SzBulkDataComboAnalysis extends SzEntityTypeRecordAnalysis {
  entityType?: string;
}

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
  styleUrls: [ './admin-bulk-data-analysis-report.component.scss']
})
export class AdminBulkDataAnalysisReportComponent implements OnInit, OnDestroy, AfterViewInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  public get displayedColumns(): string[] {
    const retVal = ['dataSource', 'recordCount', 'recordsWithRecordIdCount', 'dataSourceCode'];
    if( !this.isMoreThanOneDataSource && !this.isMoreThanOneEntityType) {
      retVal.push('entityType');
    }
    return retVal;
  }
  public entityTypeColumns: string[] = ['entityType', 'recordCount', 'recordsWithRecordIdCount', 'entityTypeCode'];

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
  public getDataSourceInputName(index: number): string {
    return 'ds-name-' + index;
  }
  public getEntityTypeInputName(index: number): string {
    return 'et-name-' + index;
  }
  public getIsNew(value: boolean): boolean | undefined {
    return (value === true) ? value : false;
  }
  public isNewDataDource(value: string): boolean {
    //return true;
    return value && (value.trim().length > 0) && (this.dataSources.indexOf(value) < 0);
  }
  public isNewEntityType(value: string): boolean {
    //return true;
    return value && (value.trim().length > 0) && (this.entityTypes.indexOf(value) < 0);
  }
  public get currentError(): Error {
    return this.bulkDataService.currentError;
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

    public get isMoreThanOneDataSource() {
      return (this.analysis && this.analysis.analysisByDataSource && this.analysis.analysisByDataSource.length > 1);
    }
    public get isMoreThanOneEntityType() {
      return (this.analysis && this.analysis.analysisByEntityType && this.analysis.analysisByEntityType.length > 1);
    }

    public get comboAnalysis() {
      if(!this.isMoreThanOneDataSource && !this.isMoreThanOneEntityType) {
        const retVal: SzBulkDataComboAnalysis[] = this.analysis.analysisByDataSource;
        retVal[0].entityType = this.analysis.analysisByEntityType[0].entityType;
        return retVal;
      } else {
        return this.analysis.analysisByDataSource;
      }
    }

    ngOnInit() {
      this.adminService.onServerInfo.pipe(
        takeUntil( this.unsubscribe$ )
      ).subscribe((info) => {
        //console.log('SzBulkDataAnalysisReportComponent.ServerInfo obtained: ', info);
      });

      this.bulkDataService.onDataSourcesChange.pipe(
        takeUntil( this.unsubscribe$ )
      ).subscribe((datasources: string[]) => {
        console.warn('UPDATE DATASOURCES! ', datasources, this.bulkDataService._dataSources);
      });
      this.bulkDataService.onError.subscribe((err) => {
        console.warn('AdminBulkDataAnalysisReportComponent.onError SHOW Err MSG: ', err);
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

    /** get the current entity types from the service */
    public get entityTypes(): string[] {
      if(this.bulkDataService && this.bulkDataService._entityTypes) {
        return this.bulkDataService._entityTypes;
      }
      return undefined;
    }

    /** when user changes the destination for a datasource */
    public handleDataSourceChange(fromDataSource: string, toDataSource: string) {
      this.bulkDataService.changeDataSourceName(fromDataSource, toDataSource);
    }

    /** when user changes the destination for a datasource */
    public handleEntityTypeChange(fromEntityType: string, toEntityType: string) {
      this.bulkDataService.changeEntityTypeName(fromEntityType, toEntityType);
    }
    /** return a default value if value is undefined or null */
    public defaultIfUndefined(value: any, defaultValue: string): string | undefined {
      return (value && value !== undefined && value !== null) ? value : defaultValue;
    }

}
