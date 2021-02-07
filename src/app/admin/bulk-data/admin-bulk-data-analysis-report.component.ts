import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { SzPrefsService, SzAdminService } from '@senzing/sdk-components-ng';

import {
  SzBulkDataAnalysis,
  SzBulkLoadResult,
  SzEntityTypeRecordAnalysis
} from '@senzing/rest-api-client-ng';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
//import { MatTableDataSource } from '@angular/material/table';
import { AdminBulkDataService } from '../../services/admin.bulk-data.service';

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
    return this.adminBulkDataService.currentLoadResult;
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
    return this.adminBulkDataService.currentError;
  }
  /**
   * when the user changes the file dest for a datasource
   * this is updated to reflect src to target
  */
  // public _dataSourceMap: { [key: string]: string };
  /** whether or not a file is being analyzed */
  public get analyzingFile() {
    return this.adminBulkDataService.isAnalyzingFile;
  }
  /** whether or not a file is being loaded */
  public get loadingFile() {
    return this.adminBulkDataService.isLoadingFile;
  }
  constructor( public prefs: SzPrefsService,
    private adminService: SzAdminService,
    private adminBulkDataService: AdminBulkDataService) {}

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

      this.adminBulkDataService.onDataSourcesChange.pipe(
        takeUntil( this.unsubscribe$ )
      ).subscribe((datasources: string[]) => {
        console.warn('UPDATE DATASOURCES! ', datasources, this.adminBulkDataService._dataSources);
      });
      this.adminBulkDataService.onError.subscribe((err) => {
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
      if(this.adminBulkDataService && this.adminBulkDataService._dataSources) {
        return this.adminBulkDataService._dataSources;
      }
      return undefined;
    }

    /** get the current entity types from the service */
    public get entityTypes(): string[] {
      if(this.adminBulkDataService && this.adminBulkDataService._entityTypes) {
        return this.adminBulkDataService._entityTypes;
      }
      return undefined;
    }

    /** when user changes the destination for a datasource */
    public handleDataSourceChange(fromDataSource: string, toDataSource: string) {
      this.adminBulkDataService.changeDataSourceName(fromDataSource, toDataSource);
    }

    /** when user changes the destination for a datasource */
    public handleEntityTypeChange(fromEntityType: string, toEntityType: string) {
      this.adminBulkDataService.changeEntityTypeName(fromEntityType, toEntityType);
    }
    /** return a default value if value is undefined or null */
    public defaultIfUndefined(value: any, defaultValue: string): string | undefined {
      return (value && value !== undefined && value !== null) ? value : defaultValue;
    }

}
